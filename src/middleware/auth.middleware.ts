import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/auth.types.js";
import { AuthService } from "../services/auth.service.js";

/**
 * Authentication middleware to validate JWT tokens on protected routes
 * Extracts token from Authorization header (Bearer <token>)
 * Attaches decoded user info to request object
 * Returns 401 errors for missing or invalid tokens
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header is present
    if (!authHeader) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Parse Bearer token format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token format. Expected: Bearer <token>",
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = parts[1];

    // Ensure token exists
    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Token is missing",
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify token using AuthService
    const authService = new AuthService();
    const decoded = authService.verifyToken(token);

    // Check if token is valid
    if (!decoded) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach decoded user info to request object
    req.user = decoded;

    // Proceed to next middleware
    next();
  } catch (error) {
    // Handle unexpected errors
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  }
}
