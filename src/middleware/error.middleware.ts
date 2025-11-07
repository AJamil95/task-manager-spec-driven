import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

/**
 * Error response interface for consistent error formatting
 */
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Async error wrapper for controllers
 * Catches async errors and passes them to error handling middleware
 */
export function asyncErrorWrapper(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Maps Prisma errors to appropriate HTTP status codes and messages
 */
function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
} {
  switch (error.code) {
    case "P2002":
      return {
        statusCode: 409,
        message: "A record with this data already exists",
      };
    case "P2025":
      return {
        statusCode: 404,
        message: "Record not found",
      };
    case "P2003":
      return {
        statusCode: 400,
        message: "Foreign key constraint failed",
      };
    case "P2014":
      return {
        statusCode: 400,
        message: "Invalid data provided",
      };
    default:
      return {
        statusCode: 500,
        message: "Database operation failed",
      };
  }
}

/**
 * Global error handling middleware
 * Formats errors consistently and maps Prisma errors to HTTP status codes
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode = 500;
  let message = "Internal Server Error";
  let errorType = "Internal Server Error";

  // Handle authentication errors
  if (
    error.message.includes("Unauthorized") ||
    error.message.includes("token") ||
    error.message.includes("Authentication")
  ) {
    statusCode = 401;
    message = error.message;
    errorType = "Unauthorized";
  }
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = mapPrismaError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    errorType = "Database Error";
  }
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data format or missing required fields";
    errorType = "Validation Error";
  }
  // Handle Prisma connection errors
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = "Database connection failed";
    errorType = "Database Connection Error";
  }
  // Handle custom application errors
  else if (error.message.includes("not found")) {
    statusCode = 404;
    message = error.message;
    errorType = "Not Found";
  } else if (
    error.message.includes("Invalid") ||
    error.message.includes("required")
  ) {
    statusCode = 400;
    message = error.message;
    errorType = "Validation Error";
  }
  // Handle generic errors
  else if (error instanceof Error) {
    message = error.message;
  }

  // Create consistent error response
  const errorResponse: ErrorResponse = {
    error: errorType,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  // Log error for debugging (in production, use proper logging)
  console.error(`[${errorResponse.timestamp}] ${errorType}:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json(errorResponse);
}
