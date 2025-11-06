/**
 * TaskStatus enum matching Prisma schema
 */
export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

/**
 * Core Task interface representing the Task entity
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request DTO for creating a new task
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
}

/**
 * Request DTO for updating task status
 */
export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

/**
 * Response DTO for task data returned by API
 */
export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
