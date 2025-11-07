import { PrismaClient } from "@prisma/client";

// Global instance to prevent multiple connections in development
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a single instance of PrismaClient
export const prisma = globalThis.__prisma || new PrismaClient();

// In development, store the instance globally to prevent multiple connections
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// Graceful shutdown handler
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};
