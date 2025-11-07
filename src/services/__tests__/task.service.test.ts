import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskService } from "../task.service.js";
import { TaskStatus } from "../../models/index.js";
import type { CreateTaskRequest } from "../../models/index.js";

// Mock the prisma client
vi.mock("../../db/index.js", () => ({
  prisma: {
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Import the mocked prisma after mocking
import { prisma } from "../../db/index.js";

describe("TaskService", () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a task with valid data", async () => {
      // Arrange
      const createTaskRequest: CreateTaskRequest = {
        title: "Test Task",
        description: "Test Description",
      };

      const mockPrismaTask = {
        id: "test-id",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };

      (prisma.task.create as any).mockResolvedValue(mockPrismaTask);

      // Act
      const result = await taskService.createTask(createTaskRequest);

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Test Task",
          description: "Test Description",
          status: TaskStatus.PENDING,
        },
      });

      expect(result).toEqual({
        id: "test-id",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      });
    });

    it("should create a task without description", async () => {
      // Arrange
      const createTaskRequest: CreateTaskRequest = {
        title: "Test Task",
      };

      const mockPrismaTask = {
        id: "test-id",
        title: "Test Task",
        description: null,
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };

      (prisma.task.create as any).mockResolvedValue(mockPrismaTask);

      // Act
      const result = await taskService.createTask(createTaskRequest);

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Test Task",
          description: null,
          status: TaskStatus.PENDING,
        },
      });

      expect(result).toEqual({
        id: "test-id",
        title: "Test Task",
        description: undefined,
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      });
    });

    it("should throw error when title is empty", async () => {
      // Arrange
      const createTaskRequest: CreateTaskRequest = {
        title: "",
      };

      // Act & Assert
      await expect(taskService.createTask(createTaskRequest)).rejects.toThrow(
        "Title is required and cannot be empty"
      );

      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it("should throw error when title is only whitespace", async () => {
      // Arrange
      const createTaskRequest: CreateTaskRequest = {
        title: "   ",
      };

      // Act & Assert
      await expect(taskService.createTask(createTaskRequest)).rejects.toThrow(
        "Title is required and cannot be empty"
      );

      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it("should trim whitespace from title and description", async () => {
      // Arrange
      const createTaskRequest: CreateTaskRequest = {
        title: "  Test Task  ",
        description: "  Test Description  ",
      };

      const mockPrismaTask = {
        id: "test-id",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };

      (prisma.task.create as any).mockResolvedValue(mockPrismaTask);

      // Act
      await taskService.createTask(createTaskRequest);

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Test Task",
          description: "Test Description",
          status: TaskStatus.PENDING,
        },
      });
    });
  });

  describe("getAllTasks", () => {
    it("should return all tasks", async () => {
      // Arrange
      const mockPrismaTasks = [
        {
          id: "task-1",
          title: "Task 1",
          description: "Description 1",
          status: TaskStatus.PENDING,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
        },
        {
          id: "task-2",
          title: "Task 2",
          description: null,
          status: TaskStatus.IN_PROGRESS,
          createdAt: new Date("2023-01-02"),
          updatedAt: new Date("2023-01-02"),
        },
      ];

      (prisma.task.findMany as any).mockResolvedValue(mockPrismaTasks);

      // Act
      const result = await taskService.getAllTasks();

      // Assert
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: "desc",
        },
      });

      expect(result).toEqual([
        {
          id: "task-1",
          title: "Task 1",
          description: "Description 1",
          status: TaskStatus.PENDING,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
        },
        {
          id: "task-2",
          title: "Task 2",
          description: undefined,
          status: TaskStatus.IN_PROGRESS,
          createdAt: new Date("2023-01-02"),
          updatedAt: new Date("2023-01-02"),
        },
      ]);
    });

    it("should return empty array when no tasks exist", async () => {
      // Arrange
      (prisma.task.findMany as any).mockResolvedValue([]);

      // Act
      const result = await taskService.getAllTasks();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("updateTaskStatus", () => {
    it("should update task status with valid data", async () => {
      // Arrange
      const taskId = "test-id";
      const newStatus = TaskStatus.IN_PROGRESS;

      const mockExistingTask = {
        id: taskId,
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };

      const mockUpdatedTask = {
        ...mockExistingTask,
        status: newStatus,
        updatedAt: new Date("2023-01-02"),
      };

      (prisma.task.findUnique as any).mockResolvedValue(mockExistingTask);
      (prisma.task.update as any).mockResolvedValue(mockUpdatedTask);

      // Act
      const result = await taskService.updateTaskStatus(taskId, newStatus);

      // Assert
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { status: newStatus },
      });

      expect(result).toEqual({
        id: taskId,
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.IN_PROGRESS,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      });
    });

    it("should throw error when task does not exist", async () => {
      // Arrange
      const taskId = "non-existent-id";
      const newStatus = TaskStatus.IN_PROGRESS;

      (prisma.task.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(
        taskService.updateTaskStatus(taskId, newStatus)
      ).rejects.toThrow(`Task with ID ${taskId} not found`);

      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it("should throw error with invalid status", async () => {
      // Arrange
      const taskId = "test-id";
      const invalidStatus = "INVALID_STATUS" as TaskStatus;

      // Act & Assert
      await expect(
        taskService.updateTaskStatus(taskId, invalidStatus)
      ).rejects.toThrow(
        "Invalid status: INVALID_STATUS. Must be one of: PENDING, IN_PROGRESS, COMPLETED"
      );

      expect(prisma.task.findUnique).not.toHaveBeenCalled();
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });
});
