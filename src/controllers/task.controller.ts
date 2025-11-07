import type { Request, Response } from "express";
import { TaskService } from "../services/task.service.js";
import {
  TaskStatus,
  type CreateTaskRequest,
  type UpdateTaskStatusRequest,
  type TaskResponse,
} from "../models/index.js";
import { Sanitizer } from "../utils/sanitize.js";

/**
 * TaskController - HTTP request handlers for task operations
 * Handles request validation, delegates to service layer, and formats responses
 */
export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Creates a new task
   * POST /tasks
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { title, description } = req.body as CreateTaskRequest;

      if (!title || typeof title !== "string") {
        res.status(400).json({
          error: "Validation Error",
          message: "Title is required and must be a string",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (description !== undefined && typeof description !== "string") {
        res.status(400).json({
          error: "Validation Error",
          message: "Description must be a string if provided",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Sanitize input before creating task
      const sanitizedData = Sanitizer.sanitizeTaskInput({
        title,
        ...(description && { description }),
      });

      // Create task via service
      const createTaskData: CreateTaskRequest = {
        title: sanitizedData.title,
        ...(sanitizedData.description && {
          description: sanitizedData.description,
        }),
      };
      const task = await this.taskService.createTask(createTaskData);

      // Format response
      const taskResponse: TaskResponse = {
        id: task.id,
        title: task.title,
        ...(task.description && { description: task.description }),
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };

      res.status(201).json(taskResponse);
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Retrieves all tasks
   * GET /tasks
   */
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await this.taskService.getAllTasks();

      // Format response
      const tasksResponse: TaskResponse[] = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        ...(task.description && { description: task.description }),
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }));

      res.status(200).json(tasksResponse);
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Updates task status
   * PUT /tasks/:id/status
   */
  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateTaskStatusRequest;

      // Validate task ID
      if (!id || typeof id !== "string") {
        res.status(400).json({
          error: "Validation Error",
          message: "Task ID is required and must be a string",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate status
      if (!status || !Object.values(TaskStatus).includes(status)) {
        res.status(400).json({
          error: "Validation Error",
          message: `Status is required and must be one of: ${Object.values(
            TaskStatus
          ).join(", ")}`,
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update task status via service
      const updatedTask = await this.taskService.updateTaskStatus(id, status);

      // Format response
      const taskResponse: TaskResponse = {
        id: updatedTask.id,
        title: updatedTask.title,
        ...(updatedTask.description && {
          description: updatedTask.description,
        }),
        status: updatedTask.status,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
      };

      res.status(200).json(taskResponse);
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({
          error: "Not Found",
          message: error.message,
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (error instanceof Error && error.message.includes("Invalid status")) {
        res.status(400).json({
          error: "Validation Error",
          message: error.message,
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Updates task title and description
   * PUT /tasks/:id
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      // Validate task ID
      if (!id || typeof id !== "string") {
        res.status(400).json({
          error: "Validation Error",
          message: "Task ID is required and must be a string",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate title
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        res.status(400).json({
          error: "Validation Error",
          message: "Title is required and must be a non-empty string",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate description (optional)
      if (description !== undefined && typeof description !== "string") {
        res.status(400).json({
          error: "Validation Error",
          message: "Description must be a string if provided",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Sanitize input before updating task
      const sanitizedData = Sanitizer.sanitizeTaskInput({
        title,
        ...(description !== undefined && { description }),
      });

      // Update task via service
      const updateData = {
        title: sanitizedData.title,
        ...(sanitizedData.description !== undefined && {
          description: sanitizedData.description,
        }),
      };

      const updatedTask = await this.taskService.updateTask(id, updateData);

      // Format response
      const taskResponse: TaskResponse = {
        id: updatedTask.id,
        title: updatedTask.title,
        ...(updatedTask.description && {
          description: updatedTask.description,
        }),
        status: updatedTask.status,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
      };

      res.status(200).json(taskResponse);
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({
          error: "Not Found",
          message: error.message,
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

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
