# Design Document

## Overview

The security implementation adds JWT-based authentication and input validation/sanitization to the existing Task Management API. The design follows a minimalist approach, implementing only essential security features without over-engineering. The solution integrates seamlessly with the existing MVC architecture and maintains the SOLID principles already established in the codebase.

## Architecture

### High-Level Security Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Client    │───▶│ Rate Limiter │───▶│ Auth Check  │───▶│ Validation & │
│             │    │              │    │ (JWT)       │    │ Sanitization │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                              │                    │
                                              ▼                    ▼
                                       ┌─────────────┐    ┌──────────────┐
                                       │ Auth Service│    │  Controller  │
                                       │ (Login)     │    │              │
                                       └─────────────┘    └──────────────┘
```

### Directory Structure

```
src/
├── middleware/
│   ├── auth.middleware.ts      # JWT validation middleware
│   ├── validation.middleware.ts # Input validation middleware
│   └── rateLimit.middleware.ts # Rate limiting middleware
├── services/
│   └── auth.service.ts         # Authentication logic
├── utils/
│   └── sanitize.ts             # Input sanitization utilities
└── routes/
    └── auth.routes.ts          # Authentication routes
```

## Components and Interfaces

### Authentication Service

```typescript
interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  expiresIn: string;
}

class AuthService {
  /**
   * Validates credentials and generates JWT token
   * @param credentials - Username and password
   * @returns JWT token and expiration info
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse>;

  /**
   * Verifies JWT token validity
   * @param token - JWT token string
   * @returns Decoded token payload or null
   */
  verifyToken(token: string): any | null;
}
```

### JWT Middleware

```typescript
interface AuthRequest extends Request {
  user?: {
    username: string;
    iat: number;
    exp: number;
  };
}

/**
 * Middleware to validate JWT tokens on protected routes
 * Extracts token from Authorization header (Bearer <token>)
 * Attaches decoded user info to request object
 */
function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void;
```

### Input Validation Middleware

```typescript
interface ValidationRules {
  title?: {
    type: "string";
    maxLength: number;
    required: boolean;
  };
  description?: {
    type: "string";
    maxLength: number;
    required: boolean;
  };
  status?: {
    type: "enum";
    values: string[];
    required: boolean;
  };
}

/**
 * Validates request body against defined rules
 * Returns 400 error if validation fails
 */
function validateInput(rules: ValidationRules): RequestHandler;
```

### Sanitization Utilities

```typescript
class Sanitizer {
  /**
   * Removes leading/trailing whitespace
   */
  static trim(input: string): string;

  /**
   * Escapes HTML special characters
   * Converts: < > & " ' to HTML entities
   */
  static escapeHtml(input: string): string;

  /**
   * Sanitizes task input data
   * Applies trim and HTML escaping
   */
  static sanitizeTaskInput(data: { title: string; description?: string }): {
    title: string;
    description?: string;
  };
}
```

## Authentication Design

### JWT Token Structure

```json
{
  "username": "admin",
  "iat": 1699564800,
  "exp": 1699651200
}
```

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Auth Credentials (Simple placeholder)
AUTH_USERNAME=admin
AUTH_PASSWORD=admin123
```

### Login Flow

1. Client sends POST /auth/login with username and password
2. AuthService validates credentials against environment variables
3. If valid, generate JWT token with 24-hour expiration
4. Return token to client
5. Client includes token in Authorization header for subsequent requests

### Protected Route Flow

1. Client sends request with Authorization: Bearer <token>
2. authMiddleware extracts and validates token
3. If valid, attach user info to request and proceed
4. If invalid/missing, return 401 Unauthorized

## Input Validation Design

### Validation Rules

```typescript
const VALIDATION_RULES = {
  title: {
    type: "string",
    maxLength: 200,
    required: true,
    pattern: /^[^<>]*$/, // No angle brackets
  },
  description: {
    type: "string",
    maxLength: 1000,
    required: false,
    pattern: /^[^<>]*$/, // No angle brackets
  },
  status: {
    type: "enum",
    values: ["PENDING", "IN_PROGRESS", "COMPLETED"],
    required: true,
  },
  taskId: {
    type: "string",
    pattern: /^[a-z0-9]{25}$/, // CUID format
    required: true,
  },
};
```

### Validation Error Response

```json
{
  "error": "Validation Error",
  "message": "Title exceeds maximum length of 200 characters",
  "statusCode": 400,
  "timestamp": "2024-11-07T10:30:00.000Z"
}
```

## Sanitization Design

### HTML Escape Mapping

```typescript
const HTML_ESCAPE_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#x27;",
};
```

### Sanitization Process

1. **Trim**: Remove leading/trailing whitespace
2. **Escape HTML**: Convert special characters to entities
3. **Validate**: Ensure sanitized data still meets validation rules
4. **Store**: Save sanitized data to database

### Example Transformation

```typescript
// Input
{
  title: "  <script>alert('xss')</script>Task Title  ",
  description: "Description with <b>HTML</b> & special chars"
}

// After Sanitization
{
  title: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;Task Title",
  description: "Description with &lt;b&gt;HTML&lt;/b&gt; &amp; special chars"
}
```

## Integration with Existing Code

### Middleware Stack Order

```typescript
// server.ts middleware order
app.use(express.json({ limit: "1mb" })); // Body size limit
app.use("/api/tasks", authMiddleware, createTaskRoutes()); // Auth + Routes
```

### Updated Route Protection

```typescript
// auth.routes.ts - Public route
router.post("/login", validateInput(loginRules), authController.login);

// task.routes.ts - Protected routes (no changes needed)
// authMiddleware applied at router level in server.ts
router.post("/", validateInput(createTaskRules), taskController.createTask);
router.get("/", taskController.getAllTasks);
router.put(
  "/:id/status",
  validateInput(statusRules),
  taskController.updateTaskStatus
);
```

## Error Handling

### Authentication Errors

```typescript
// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401,
  "timestamp": "2024-11-07T10:30:00.000Z"
}

// 401 Missing Token
{
  "error": "Unauthorized",
  "message": "No token provided",
  "statusCode": 401,
  "timestamp": "2024-11-07T10:30:00.000Z"
}
```

### Validation Errors

```typescript
// 400 Bad Request
{
  "error": "Validation Error",
  "message": "Title exceeds maximum length of 200 characters",
  "statusCode": 400,
  "timestamp": "2024-11-07T10:30:00.000Z"
}
```

## Security Best Practices Applied

1. **JWT Secret**: Stored in environment variables, never in code
2. **Password Storage**: Placeholder implementation (env vars for MVP)
3. **Token Expiration**: 24-hour expiration to limit exposure
4. **Input Validation**: Whitelist approach (define what's allowed)
5. **HTML Escaping**: Prevent XSS attacks
6. **Body Size Limit**: Prevent payload attacks (1MB max)
7. **Prisma ORM**: Automatic SQL injection prevention

## Testing Strategy

### Unit Tests

- AuthService: Test token generation and verification
- Sanitizer: Test HTML escaping and trimming
- Validation middleware: Test validation rules

### Integration Tests

- Login flow: Test successful and failed authentication
- Protected routes: Test with valid/invalid/missing tokens
- Input validation: Test with valid and malicious inputs

### Security Tests

- XSS prevention: Test script injection attempts
- Token expiration: Test expired token rejection
- SQL injection: Verify Prisma protection (already covered)
