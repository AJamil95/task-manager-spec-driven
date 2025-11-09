/**
 * Authentication Service
 * Handles JWT token management and authentication state
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: string;
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getToken(): string | null;
  isAuthenticated(): boolean;
  setToken(token: string): void;
  validateToken(): Promise<boolean>;
}

/**
 * AuthService manages JWT token storage and authentication state
 * Uses localStorage for token persistence across sessions
 */
export class AuthService implements IAuthService {
  private readonly TOKEN_KEY = "jwt_token";
  private readonly baseUrl = "/api";

  /**
   * Authenticate user with username and password
   * Stores JWT token on successful login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Invalid credentials",
      }));
      throw new Error(error.message || "Authentication failed");
    }

    const authResponse: AuthResponse = await response.json();
    this.setToken(authResponse.token);
    return authResponse;
  }

  /**
   * Clear authentication token and logout user
   * For JWT-based auth, logout is client-side only
   */
  async logout(): Promise<void> {
    // Clear the token from localStorage
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Store JWT token in localStorage
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Validate token by making a test request to the API
   * Returns true if token is valid, false otherwise
   */
  async validateToken(): Promise<boolean> {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    try {
      // Make a simple request to verify token validity
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // If we get 401, token is invalid
      if (response.status === 401) {
        localStorage.removeItem(this.TOKEN_KEY);
        return false;
      }

      // Token is valid if we get any 2xx response
      return response.ok;
    } catch (error) {
      // Network error or other issue - assume token might be valid
      // but we can't verify right now
      console.error("Error validating token:", error);
      return true; // Give benefit of doubt for network errors
    }
  }
}
