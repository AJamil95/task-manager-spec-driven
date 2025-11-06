import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { TaskController } from "../task.controller.js";
import { TaskService } from "../../services/task.service.js";
import { TaskStatus } from "../../models/index.js";
import type { Task } from "../../models/index.js";

// Mock the TaskService
vi.mock("../../services/task.service.js", () => ({
  TaskService: class MockTaskService {
    createTask = vi.fn();
    getAllTasks = vi.fn();
    updateTaskStatus = vi.fn();
  },
}));

describe("TaskController", () => {
  let taskController: TaskController;
  let mockTaskService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    taskController = new TaskController();
    mockTaskService = (taskController as any).taskService;
    vi.clearAllMocks();

    // Setup mock response object
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Setup mock request object
    mockRequest = {
      body: {},
      params: {},
    };
  });

  describe("createTask", () => {
    it("should create a task with valid data and return 201", async () => {
      // Arrange
      const mockTask: Task = {
        id: "test-id",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.body = {
        title: "Test Task",
        description: "Test Description",
      };

      mockTaskService.createTask.mockResolvedValue(mockTask);

      // Act
      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: "Test Task",
        description: "Test Description",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: "test-id",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      });
    });

    it("should create a task without description and return 201", async () => {
      // Arrange
      const mockTask: Task = {
        id: "test-id",
        title: "Test Task",
        status: TaskStatus.PENDING,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.body = {
        title: "Test Task",
      };

      mockTaskService.createTask.mockResolvedValue(mockTask);

      // Act
      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: "Test Task",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: "test-id",
        title: "Test Task",
        status: TaskStatus.PENDING,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      });
    });

    it("should return 400 when title is missing", async () => {
      // Arrange
      mockRequest.body = {
        description: "Test Description",
      };

      // Act
      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Validation Error",
        message: "Title is required and must be a string",
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when title is not a string", async () => {
      // Arrange
      mockRequest.body = {
        title: 123,
        description: "Test Description",
      };

      // Act
      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Validation Error",
        message: "Title is required and must be a string",
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when description is not a string", async () => {
      // Arrange
      mockRequest.body = {
        title: "Test Task",
        description: 123,
      };

      // Act
      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Validation Error",
        message: "Description must be a string if provided",
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });

    it("should return 500 when service throws an error", async () => {
      // Arrange
      mockRequest.body = {
        title: "Test Task",
        description: "Test Description",
      };

      mockTaskService.createTask.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      await taskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: "Database connection failed",
        statusCode: 500,
        timestamp: expect.any(String),
      });
    });
  });

  describe("getAllTasks", () => {
    it("should return all tasks with 200 status", async () => {
      // Arrange
      const mockTasks: Task[] = [
        {
          id: "task-1",
          title: "Task 1",
          description: "Description 1",
          status: TaskStatus.PENDING,
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
          updatedAt: new Date("2023-01-01T00:00:00.000Z"),
        },
        {
          id: "task-2",
          title: "Task 2",
          status: TaskStatus.IN_PROGRESS,
          createdAt: new Date("2023-01-02T00:00:00.000Z"),
          updatedAt: new Date("2023-01-02T00:00:00.000Z"),
        },
      ];

      mockTaskService.getAllTasks.mockResolvedValue(mockTasks);

      // Act
      await taskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.getAllTasks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          id: "task-1",
          title: "Task 1",
          description: "Description 1",
          status: TaskStatus.PENDING,
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "task-2",
          title: "Task 2",
          status: TaskStatus.IN_PROGRESS,
          createdAt: "2023-01-02T00:00:00.000Z",
          updatedAt: "2023-01-02T00:00:00.000Z",
        },
      ]);
    });

    it("should return empty array when no tasks exist", async () => {
      // Arrange
      mockTaskService.getAllTasks.mockResolvedValue([]);

      // Act
      await taskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.getAllTasks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 when service throws an error", async () => {
      // Arrange
      mockTaskService.getAllTasks.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      await taskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: "Database connection failed",
        statusCode: 500,
        timestamp: expect.any(String),
      });
    });
  });

  describe("updateTaskStatus", () => {
    it("should update task status and return 200", async () => {
      // Arrange
      const mockUpdatedTask: Task = {
        id: "test-id",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.IN_PROGRESS,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T01:00:00.000Z"),
      };

      mockRequest.params = { id: "test-id" };
      mockRequest.body = { status: TaskStatus.IN_PROGRESS };

      mockTaskService.updateTaskStatus.mockResolvedValue(mockUpdatedTask);

      // Act
      await taskController.updateTaskStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
        "test-id",
        TaskStatus.IN_PROGRESS
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: "test-id",
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.IN_PROGRESS,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T01:00:00.000Z",
      });
    });

    it("should return 400 when task ID is missing", async () => {
      // Arrange
      mockRequest.params = {};
      mockRequest.body = { status: TaskStatus.IN_PROGRESS };

      // Act
      await taskController.updateTaskStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.updateTaskStatus).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Validation Error",
        message: "Task ID is required and must be a string",
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when status is invalid", async () => {
      // Arrange
      mockRequest.params = { id: "test-id" };
      mockRequest.body = { status: "INVALID_STATUS" };

      // Act
      await taskController.updateTaskStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockTaskService.updateTaskStatus).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Validation Error",
        message: `Status is required and must be one of: ${Object.values(
          TaskStatus
        ).join(", ")}`,
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });

    it("should return 404 when task is not found", async () => {
      // Arrange
      mockRequest.params = { id: "non-existent-id" };
      mockRequest.body = { status: TaskStatus.IN_PROGRESS };

      mockTaskService.updateTaskStatus.mockRejectedValue(
        new Error("Task with ID non-existent-id not found")
      );

      // Act
      await taskController.updateTaskStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Not Found",
        message: "Task with ID non-existent-id not found",
        statusCode: 404,
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when service throws invalid status error", async () => {
      // Arrange
      mockRequest.params = { id: "test-id" };
      mockRequest.body = { status: TaskStatus.IN_PROGRESS };

      mockTaskService.updateTaskStatus.mockRejectedValue(
        new Error("Invalid status: INVALID_STATUS")
      );

      // Act
      await taskController.updateTaskStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Validation Error",
        message: "Invalid status: INVALID_STATUS",
        statusCode: 400,
        timestamp: expect.any(String),
      });
    });

    it("should return 500 when service throws unexpected error", async () => {
      // Arrange
      mockRequest.params = { id: "test-id" };
      mockRequest.body = { status: TaskStatus.IN_PROGRESS };

      mockTaskService.updateTaskStatus.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      await taskController.updateTaskStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Internal Server Error",
        message: "Database connection failed",
        statusCode: 500,
        timestamp: expect.any(String),
      });
    });
  });
});
