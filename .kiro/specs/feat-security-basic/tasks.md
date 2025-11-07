# Implementation Plan

- [x] 1. Set up authentication infrastructure

  - Install jsonwebtoken package
  - Create environment variables for JWT secret and auth credentials
  - Set up TypeScript types for JWT payload and auth requests
  - _Requirements: 1.1, 1.5_

- [x] 2. Implement authentication service

  - Create AuthService class with login method
  - Implement JWT token generation with 24-hour expiration
  - Implement token verification method
  - Add credential validation against environment variables
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Create authentication middleware

  - Implement authMiddleware to extract and validate JWT tokens
  - Add Authorization header parsing (Bearer token)
  - Attach decoded user info to request object
  - Return 401 errors for missing or invalid tokens
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Create authentication routes and controller

  - Create auth.routes.ts with POST /auth/login endpoint
  - Implement AuthController with login handler
  - Add request validation for username and password
  - Return JWT token in response body on successful login
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Implement input sanitization utilities

  - Create Sanitizer class with trim method
  - Implement escapeHtml method for HTML special characters
  - Create sanitizeTaskInput method for task data
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Create input validation middleware

  - Define validation rules for title, description, and status
  - Implement validateInput middleware factory
  - Add length validation (title: 200, description: 1000)
  - Add type and format validation
  - Return 400 errors with descriptive messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Update existing task controllers with sanitization

  - Integrate Sanitizer into TaskController.createTask
  - Integrate Sanitizer into TaskController.updateTask
  - Ensure sanitization happens before database operations
  - Maintain existing validation logic
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Apply security middleware to routes

  - Add body size limit (1MB) to express.json middleware
  - Apply authMiddleware to /api/tasks routes
  - Keep /auth/login as public route
  - Ensure middleware order: auth → validation → controller
  - _Requirements: 2.5, 5.1_

- [x] 9. Update server configuration

  - Add authentication routes to Express app
  - Configure middleware stack in correct order
  - Update error handling for auth errors
  - Test integration with existing task routes
  - _Requirements: 1.1, 2.5, 5.1_

- [x] 10. Integrate UI with JWT authentication

  - Add login form to UI for username/password input
  - Implement client-side logic to call /auth/login endpoint
  - Store JWT token in localStorage or sessionStorage
  - Add Authorization header with Bearer token to all API requests
  - Handle 401 responses and redirect to login when token expires
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ]\* 11. Add comprehensive security tests

  - Write unit tests for AuthService (token generation, verification)
  - Write unit tests for Sanitizer (HTML escaping, trimming)
  - Write integration tests for login flow
  - Write integration tests for protected routes with valid/invalid tokens
  - Write tests for XSS prevention with malicious inputs
  - _Requirements: All requirements validation_

- [x] 12. Environment setup

  - Create .env.example with JWT_SECRET and auth credentials

  - _Requirements: 1.5_

- [x] 13. Final integration and testing

  - Test complete authentication flow: login → get token → access protected routes
  - Verify all task endpoints require authentication
  - Test input validation with edge cases (max length, special characters)
  - Test sanitization prevents XSS attacks
  - Test error responses for all security scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_
