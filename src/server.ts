import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { prisma, disconnectDatabase } from "./db/index.js";
import { createTaskRoutes } from "./routes/task.routes.js";
import { errorHandler } from "./middleware/index.js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Initialize database connection
 * Test the connection and log status
 */
async function initializeDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
}

/**
 * Configure Express application with middleware
 */
function configureApp(): void {
  // JSON body parsing middleware
  app.use(express.json());

  // Basic health check route
  app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Task Management API is running" });
  });

  // Configure API routes - support both /api/tasks and /tasks for backward compatibility
  app.use("/api/tasks", createTaskRoutes());
  app.use("/tasks", createTaskRoutes());

  // Serve static files from dist directory with proper caching headers
  const distPath = path.join(__dirname, "../dist");
  app.use(
    express.static(distPath, {
      // Cache static assets for 1 year (except HTML files)
      setHeaders: (res, filePath) => {
        if (path.extname(filePath) === ".html") {
          // Don't cache HTML files to ensure fresh content
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          // Cache other assets (CSS, JS, images) for 1 year
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );

  // SPA fallback route - serve index.html for all non-API routes
  app.use((req, res, next) => {
    // Only serve SPA for non-API routes and non-task routes
    if (
      !req.path.startsWith("/api/") &&
      !req.path.startsWith("/tasks") &&
      !req.path.startsWith("/health")
    ) {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error serving index.html:", err);
          res.status(500).json({
            error: "Internal Server Error",
            message: "Unable to serve application",
          });
        }
      });
    } else {
      // Pass to next middleware (error handler)
      next();
    }
  });

  // Global error handling middleware (must be last)
  app.use(errorHandler);
}

/**
 * Start the server with proper initialization
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Configure Express app
    configureApp();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      console.log(`Task API available at http://localhost:${PORT}/api/tasks`);
      console.log(`Frontend UI available at http://localhost:${PORT}/`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        console.log("HTTP server closed");

        try {
          await disconnectDatabase();
          console.log("Database connection closed");
          process.exit(0);
        } catch (error) {
          console.error("Error during database disconnect:", error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error("Unhandled error during server startup:", error);
  process.exit(1);
});

export default app;
