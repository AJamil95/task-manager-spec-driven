import { prisma } from "../db/index.js";
import type { Task, CreateTaskRequest } from "../models/index.js";
import { TaskStatus } from "../models/index.js";

/**
 * Helper function to convert Prisma Task to our Task interface
 * Converts null to undefined for optional fields
 */
function convertPrismaTaskToTask(prismaTask: any): Task {
  return {
    id: prismaTask.id,
    title: prismaTask.title,
    description: prismaTask.description ?? undefined,
    status: prismaTask.status,
    createdAt: prismaTask.createdAt,
    updatedAt: prismaTask.updatedAt,
  };
}

/**
 * TaskService - Business logic layer for task operations
 * Handles validation, business rules, and coordinates with database layer
 */
export class TaskService {
  /**
   * Creates a new task with validation
   * @param data - Task creation data
   * @returns Promise<Task> - The created task
   * @throws Error if validation fails
   */
  async createTask(data: CreateTaskRequest): Promise<Task> {
    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      throw new Error("Title is required and cannot be empty");
    }

    // Trim whitespace from title and description
    const taskData = {
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
    };

    try {
      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description ?? null,
          status: TaskStatus.PENDING, // Default status
        },
      });

      return convertPrismaTaskToTask(task);
    } catch (error) {
      throw new Error(
        `Failed to create task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieves all tasks from the database
   * @returns Promise<Task[]> - Array of all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      const tasks = await prisma.task.findMany({
        orderBy: {
          createdAt: "desc", // Most recent first
        },
      });

      return tasks.map(convertPrismaTaskToTask);
    } catch (error) {
      throw new Error(
        `Failed to retrieve tasks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Updates the status of a specific task
   * @param id - Task ID
   * @param status - New status value
   * @returns Promise<Task> - The updated task
   * @throws Error if task not found or validation fails
   */
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    // Validate status is a valid enum value
    if (!Object.values(TaskStatus).includes(status)) {
      throw new Error(
        `Invalid status: ${status}. Must be one of: ${Object.values(
          TaskStatus
        ).join(", ")}`
      );
    }

    // Check if task exists
    const existingTask = await this.findTaskById(id);
    if (!existingTask) {
      throw new Error(`Task with ID ${id} not found`);
    }

    try {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status },
      });

      return convertPrismaTaskToTask(updatedTask);
    } catch (error) {
      throw new Error(
        `Failed to update task status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Updates task title and description
   * @param id - Task ID
   * @param data - Update data (title, description)
   * @returns Promise<Task> - The updated task
   * @throws Error if task not found or validation fails
   */
  async updateTask(
    id: string,
    data: { title: string; description?: string }
  ): Promise<Task> {
    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      throw new Error("Title is required and cannot be empty");
    }

    // Check if task exists
    const existingTask = await this.findTaskById(id);
    if (!existingTask) {
      throw new Error(`Task with ID ${id} not found`);
    }

    try {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          title: data.title.trim(),
          description: data.description?.trim() ?? null,
        },
      });

      return convertPrismaTaskToTask(updatedTask);
    } catch (error) {
      throw new Error(
        `Failed to update task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Finds a task by its ID
   * @param id - Task ID
   * @returns Promise<Task | null> - The task if found, null otherwise
   */
  async findTaskById(id: string): Promise<Task | null> {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
      });

      return task ? convertPrismaTaskToTask(task) : null;
    } catch (error) {
      throw new Error(
        `Failed to find task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
