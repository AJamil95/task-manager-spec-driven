import { Request } from "express";

/**
 * JWT payload structure
 */
export interface JwtPayload {
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication credentials for login
 */
export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Authentication response containing JWT token
 */
export interface AuthResponse {
  token: string;
  expiresIn: string;
}

/**
 * Extended Express Request with authenticated user info
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}
