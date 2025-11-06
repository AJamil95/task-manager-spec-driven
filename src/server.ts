import express from "express";
import { prisma, disconnectDatabase } from "./db/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Basic health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Task Management API is running" });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("HTTP server closed");
  });
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("HTTP server closed");
  });
  await disconnectDatabase();
  process.exit(0);
});

export default app;
