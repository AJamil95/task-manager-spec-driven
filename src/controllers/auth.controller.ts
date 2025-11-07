import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import type { AuthCredentials } from "../types/auth.types.js";

/**
 * AuthController - HTTP request handlers for authentication operations
 * Handles login requests, validates credentials, and returns JWT tokens
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Handles user login
   * POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { username, password } = req.body as AuthCredentials;

      if (!username || typeof username !== "string") {
        res.status(400).json({
          error: "Validation Error",
          message: "Username is required and must be a string",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!password || typeof password !== "string") {
        res.status(400).json({
          error: "Validation Error",
          message: "Password is required and must be a string",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Attempt login via service
      const authResponse = await this.authService.login({
        username,
        password,
      });

      // Return JWT token with 200 status
      res.status(200).json(authResponse);
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error && error.message === "Invalid credentials") {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid username or password",
          statusCode: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Handle unexpected errors
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
