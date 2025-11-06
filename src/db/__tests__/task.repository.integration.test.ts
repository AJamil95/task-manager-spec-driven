import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { TaskRepository } from "../task.repository.js";
import { TaskStatus } from "../../models/index.js";
import type { CreateTaskRequest } from "../../models/index.js";

describe("TaskRepository Integration Tests", () => {
  let prisma: PrismaClient;
  let taskRepository: TaskRepository;

  beforeEach(async () => {
    // Use the existing test database setup
    prisma = new PrismaClient();
    taskRepository = new TaskRepository(prisma);

    // Clean up any existing test data
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.task.deleteMany();
    await prisma.$disconnect();
  });

  describe("create", () => {
    it("should create a task with title and description", async () => {
      // Arrange
      const createTaskRequest: CreateTaskRequest = {
        title: "Integration Test Task",
        description: "This is a test task for integration testing",
      };

      // Act
      const result = await taskRepository.create(createTaskRequest);

      // Assert
      expect(result).toMatchObject({
        title: "Integration Test Task",
        description: "This is a test task for integration testing",
        status: TaskStatus.PENDING,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Verify the task was actually saved to the database
      const savedTask = await prisma.task.findUnique({
        where: { id: result.id },
      });
      expect(savedTask).toBeTruthy();
      expect(savedTask?.title).toBe("Integration Test Task");
    });

    it("should create a task with only title", async () => {
      // Arrange
      const createTaskRequest: CreateTaskRequest = {
        title: "Task without description",
      };

      // Act
      const result = await taskRepository.create(createTaskRequest);

      // Assert
      expect(result).toMatchObject({
        title: "Task without description",
        description: undefined,
        status: TaskStatus.PENDING,
      });
      expect(result.id).toBeDefined();
    });

    it("should handle database connection errors gracefully", async () => {
      // Arrange
      const disconnectedPrisma = new PrismaClient({
        datasources: {
          db: {
            url: "file:./nonexistent/path/database.db",
          },
        },
      });
      const disconnectedRepository = new TaskRepository(disconnectedPrisma);

      const createTaskRequest: CreateTaskRequest = {
        title: "Test Task",
      };

      // Act & Assert
      await expect(
        disconnectedRepository.create(createTaskRequest)
      ).rejects.toThrow(/Database error creating task/);

      await disconnectedPrisma.$disconnect();
    });
  });

  describe("findMany", () => {
    it("should return all tasks ordered by creation date (newest first)", async () => {
      // Arrange - Create multiple tasks with slight delays to ensure different timestamps
      const task1 = await taskRepository.create({
        title: "First Task",
        description: "First task description",
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const task2 = await taskRepository.create({
        title: "Second Task",
        description: "Second task description",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const task3 = await taskRepository.create({
        title: "Third Task",
      });

      // Act
      const result = await taskRepository.findMany();

      // Assert
      expect(result).toHaveLength(3);
      // Should be ordered by creation date (newest first)
      expect(result[0].title).toBe("Third Task");
      expect(result[1].title).toBe("Second Task");
      expect(result[2].title).toBe("First Task");
    });

    it("should return empty array when no tasks exist", async () => {
      // Act
      const result = await taskRepository.findMany();

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle database connection errors gracefully", async () => {
      // Arrange
      const disconnectedPrisma = new PrismaClient({
        datasources: {
          db: {
            url: "file:./nonexistent/path/database.db",
          },
        },
      });
      const disconnectedRepository = new TaskRepository(disconnectedPrisma);

      // Act & Assert
      await expect(disconnectedRepository.findMany()).rejects.toThrow(
        /Database error retrieving tasks/
      );

      await disconnectedPrisma.$disconnect();
    });
  });

  describe("update", () => {
    it("should update task status successfully", async () => {
      // Arrange
      const createdTask = await taskRepository.create({
        title: "Task to Update",
        description: "This task will be updated",
      });

      // Act
      const updatedTask = await taskRepository.update(
        createdTask.id,
        TaskStatus.IN_PROGRESS
      );

      // Assert
      expect(updatedTask).toMatchObject({
        id: createdTask.id,
        title: "Task to Update",
        description: "This task will be updated",
        status: TaskStatus.IN_PROGRESS,
      });
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(
        createdTask.updatedAt.getTime()
      );

      // Verify the update was persisted
      const retrievedTask = await taskRepository.findUnique(createdTask.id);
      expect(retrievedTask?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it("should update task status to completed", async () => {
      // Arrange
      const createdTask = await taskRepository.create({
        title: "Task to Complete",
      });

      // Act
      const updatedTask = await taskRepository.update(
        createdTask.id,
        TaskStatus.COMPLETED
      );

      // Assert
      expect(updatedTask.status).toBe(TaskStatus.COMPLETED);
    });

    it("should handle database connection errors gracefully", async () => {
      // Arrange
      const disconnectedPrisma = new PrismaClient({
        datasources: {
          db: {
            url: "file:./nonexistent/path/database.db",
          },
        },
      });
      const disconnectedRepository = new TaskRepository(disconnectedPrisma);

      // Act & Assert
      await expect(
        disconnectedRepository.update("some-id", TaskStatus.IN_PROGRESS)
      ).rejects.toThrow(/Database error updating task/);

      await disconnectedPrisma.$disconnect();
    });
  });

  describe("findUnique", () => {
    it("should find a task by ID", async () => {
      // Arrange
      const createdTask = await taskRepository.create({
        title: "Findable Task",
        description: "This task can be found",
      });

      // Act
      const foundTask = await taskRepository.findUnique(createdTask.id);

      // Assert
      expect(foundTask).toMatchObject({
        id: createdTask.id,
        title: "Findable Task",
        description: "This task can be found",
        status: TaskStatus.PENDING,
      });
    });

    it("should return null when task does not exist", async () => {
      // Act
      const result = await taskRepository.findUnique("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle database connection errors gracefully", async () => {
      // Arrange
      const disconnectedPrisma = new PrismaClient({
        datasources: {
          db: {
            url: "file:./nonexistent/path/database.db",
          },
        },
      });
      const disconnectedRepository = new TaskRepository(disconnectedPrisma);

      // Act & Assert
      await expect(
        disconnectedRepository.findUnique("some-id")
      ).rejects.toThrow(/Database error finding task/);

      await disconnectedPrisma.$disconnect();
    });
  });

  describe("data conversion", () => {
    it("should properly convert null description to undefined", async () => {
      // Arrange - Create task without description
      const createdTask = await taskRepository.create({
        title: "Task without description",
      });

      // Act
      const foundTask = await taskRepository.findUnique(createdTask.id);

      // Assert
      expect(foundTask?.description).toBeUndefined();
    });

    it("should preserve description when provided", async () => {
      // Arrange
      const createdTask = await taskRepository.create({
        title: "Task with description",
        description: "This has a description",
      });

      // Act
      const foundTask = await taskRepository.findUnique(createdTask.id);

      // Assert
      expect(foundTask?.description).toBe("This has a description");
    });
  });
});
