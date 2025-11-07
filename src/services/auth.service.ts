import jwt from "jsonwebtoken";

/**
 * Interface for authentication credentials
 */
export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Interface for authentication response
 */
export interface AuthResponse {
  token: string;
  expiresIn: string;
}

/**
 * Interface for JWT payload
 */
export interface JwtPayload {
  username: string;
  iat: number;
  exp: number;
}

/**
 * AuthService - Handles JWT-based authentication
 * Manages token generation, verification, and credential validation
 */
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly authUsername: string;
  private readonly authPassword: string;

  constructor() {
    // Load configuration from environment variables
    this.jwtSecret = process.env.JWT_SECRET || "";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
    this.authUsername = process.env.AUTH_USERNAME || "";
    this.authPassword = process.env.AUTH_PASSWORD || "";

    // Validate required environment variables
    if (!this.jwtSecret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    if (!this.authUsername || !this.authPassword) {
      throw new Error(
        "AUTH_USERNAME and AUTH_PASSWORD environment variables are required"
      );
    }
  }

  /**
   * Validates credentials and generates JWT token
   * @param credentials - Username and password
   * @returns Promise<AuthResponse> - JWT token and expiration info
   * @throws Error if credentials are invalid
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    // Validate credentials against environment variables
    if (
      credentials.username !== this.authUsername ||
      credentials.password !== this.authPassword
    ) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT token with 24-hour expiration
    const token = jwt.sign({ username: credentials.username }, this.jwtSecret, {
      expiresIn: "24h",
    });

    return {
      token,
      expiresIn: this.jwtExpiresIn,
    };
  }

  /**
   * Verifies JWT token validity
   * @param token - JWT token string
   * @returns Decoded token payload or null if invalid
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      // Token is invalid or expired
      return null;
    }
  }
}
