import { PrismaClient } from "@prisma/client";
import type { Task, CreateTaskRequest } from "../models/index.js";
import { TaskStatus } from "../models/index.js";

/**
 * TaskRepository - Database operations layer using Prisma client
 * Encapsulates all Prisma client interactions for Task entity
 * Provides clean interface for data access with proper error handling
 */
export class TaskRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Helper method to convert Prisma Task to our Task interface
   * Handles null to undefined conversion for optional fields
   */
  private convertPrismaTaskToTask(prismaTask: any): Task {
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
   * Creates a new task in the database
   * @param data - Task creation data
   * @returns Promise<Task> - The created task
   * @throws Error if database operation fails
   */
  async create(data: CreateTaskRequest): Promise<Task> {
    try {
      const task = await this.prisma.task.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          status: TaskStatus.PENDING, // Default status
        },
      });

      return this.convertPrismaTaskToTask(task);
    } catch (error) {
      throw new Error(
        `Database error creating task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Retrieves all tasks from the database
   * @returns Promise<Task[]> - Array of all tasks ordered by creation date (newest first)
   * @throws Error if database operation fails
   */
  async findMany(): Promise<Task[]> {
    try {
      const tasks = await this.prisma.task.findMany({
        orderBy: {
          createdAt: "desc", // Most recent first
        },
      });

      return tasks.map((task) => this.convertPrismaTaskToTask(task));
    } catch (error) {
      throw new Error(
        `Database error retrieving tasks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Updates a task's status in the database
   * @param id - Task ID
   * @param status - New status value
   * @returns Promise<Task> - The updated task
   * @throws Error if database operation fails
   */
  async update(id: string, status: TaskStatus): Promise<Task> {
    try {
      const updatedTask = await this.prisma.task.update({
        where: { id },
        data: { status },
      });

      return this.convertPrismaTaskToTask(updatedTask);
    } catch (error) {
      throw new Error(
        `Database error updating task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Finds a single task by its ID
   * @param id - Task ID
   * @returns Promise<Task | null> - The task if found, null otherwise
   * @throws Error if database operation fails
   */
  async findUnique(id: string): Promise<Task | null> {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id },
      });

      return task ? this.convertPrismaTaskToTask(task) : null;
    } catch (error) {
      throw new Error(
        `Database error finding task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
