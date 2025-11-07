import express from "express";
import { prisma, disconnectDatabase } from "./db/index.js";
import { createTaskRoutes } from "./routes/task.routes.js";
import { errorHandler } from "./middleware/index.js";

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

  // Configure task routes
  app.use("/tasks", createTaskRoutes());

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
      console.log(`Task API available at http://localhost:${PORT}/tasks`);
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
