/**
 * Standard error response interface for API errors
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Validation error details for field-specific errors
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Extended error response for validation errors
 */
export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationError[];
}

/**
 * Database error response for Prisma-related errors
 */
export interface DatabaseErrorResponse extends ErrorResponse {
  code?: string;
  meta?: any;
}
