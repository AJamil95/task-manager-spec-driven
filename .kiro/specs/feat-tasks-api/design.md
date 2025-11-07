# Design Document

## Overview

The Task Management API is designed as a RESTful service using Node.js with TypeScript, following MVC architectural patterns. The system uses Prisma ORM with SQLite for data persistence and implements async/await patterns throughout for optimal performance.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │───▶│   Express API   │───▶│   SQLite DB     │
│                 │    │   (MVC Layer)   │    │   (via Prisma)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Directory Structure

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── models/          # Prisma schema and types
├── routes/          # Route definitions
├── db/              # Database configuration
├── ui/              # Future UI components
└── server.ts        # Application entry point
```

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for HTTP server
- **ORM**: Prisma for database operations
- **Database**: SQLite for data persistence
- **Validation**: Built-in TypeScript types + runtime validation

## Components and Interfaces

### Task Model (Prisma Schema)

```typescript
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(PENDING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}
```

### TypeScript Interfaces

```typescript
// Core Task interface
interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response DTOs
interface CreateTaskRequest {
  title: string;
  description?: string;
}

interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

### Controller Layer

**TaskController** - Handles HTTP requests and responses

- `createTask(req, res)` - POST /tasks
- `getAllTasks(req, res)` - GET /tasks
- `updateTaskStatus(req, res)` - PUT /tasks/:id/status

### Service Layer

**TaskService** - Contains business logic

- `createTask(data: CreateTaskRequest): Promise<Task>`
- `getAllTasks(): Promise<Task[]>`
- `updateTaskStatus(id: string, status: TaskStatus): Promise<Task>`
- `findTaskById(id: string): Promise<Task | null>`

### Repository Pattern

**TaskRepository** - Database operations via Prisma

- Encapsulates all Prisma client interactions
- Provides clean interface for data access
- Handles database connection and error management

## Data Models

### Task Entity Structure

| Field       | Type       | Constraints            | Description                 |
| ----------- | ---------- | ---------------------- | --------------------------- |
| id          | String     | Primary Key, CUID      | Unique identifier           |
| title       | String     | Required, Non-empty    | Task title                  |
| description | String     | Optional               | Task description            |
| status      | TaskStatus | Enum, Default: PENDING | Current status              |
| createdAt   | DateTime   | Auto-generated         | Creation timestamp          |
| updatedAt   | DateTime   | Auto-updated           | Last modification timestamp |

### Status State Machine

```
PENDING ──────▶ IN_PROGRESS ──────▶ COMPLETED
   ▲                 │                   │
   └─────────────────┼───────────────────┘
                     ▼
                 PENDING (rollback)
```

## API Endpoints Design

### POST /tasks

- **Purpose**: Create a new task
- **Request Body**: `CreateTaskRequest`
- **Response**: `201 Created` with `TaskResponse`
- **Validation**: Title required, description optional
- **Error Cases**: `400 Bad Request` for invalid data

### GET /tasks

- **Purpose**: Retrieve all tasks
- **Response**: `200 OK` with `TaskResponse[]`
- **Behavior**: Returns empty array if no tasks exist
- **Error Cases**: `500 Internal Server Error` for database issues

### PUT /tasks/:id/status

- **Purpose**: Update task status
- **Path Parameter**: `id` (string)
- **Request Body**: `UpdateTaskStatusRequest`
- **Response**: `200 OK` with updated `TaskResponse`
- **Validation**: Status must be valid enum value
- **Error Cases**:
  - `400 Bad Request` for invalid status
  - `404 Not Found` for non-existent task

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}
```

### Error Categories

1. **Validation Errors** (400) - Invalid input data
2. **Not Found Errors** (404) - Resource doesn't exist
3. **Database Errors** (500) - Connection or query failures
4. **Server Errors** (500) - Unexpected application errors

### Error Handling Strategy

- Global error middleware for consistent error responses
- Async error wrapper for controller methods
- Prisma error mapping to HTTP status codes
- Structured logging for debugging

## Testing Strategy

### Unit Testing

- **Controllers**: Mock services, test HTTP handling
- **Services**: Mock repositories, test business logic
- **Repositories**: Test database operations with test database

### Integration Testing

- **API Endpoints**: Full request/response cycle testing
- **Database**: Test Prisma operations with SQLite in-memory
- **Error Scenarios**: Test all error conditions and responses

### Test Structure

```
tests/
├── unit/
│   ├── controllers/
│   ├── services/
│   └── repositories/
└── integration/
    └── api/
```
