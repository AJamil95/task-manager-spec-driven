import { describe, it, expect, beforeEach, afterAll, beforeAll } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../server.js";
import { TaskStatus } from "../models/index.js";

describe("Task API Integration Tests", () => {
  let testPrisma: PrismaClient;

  beforeAll(async () => {
    // Create a separate Prisma client for test verification
    testPrisma = new PrismaClient();
  });

  beforeEach(async () => {
    // Clean up any existing test data before each test
    await testPrisma.task.deleteMany();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await testPrisma.task.deleteMany();
    await testPrisma.$disconnect();
  });

  describe("POST /tasks", () => {
    it("should create a task with title and description", async () => {
      // Arrange
      const taskData = {
        title: "Integration Test Task",
        description: "This is a test task for integration testing",
      };

      // Act
      const response = await request(app)
        .post("/tasks")
        .send(taskData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        title: "Integration Test Task",
        description: "This is a test task for integration testing",
        status: TaskStatus.PENDING,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      // Verify the task was actually saved to the database
      const savedTask = await testPrisma.task.findUnique({
        where: { id: response.body.id },
      });
      expect(savedTask).toBeTruthy();
      expect(savedTask?.title).toBe("Integration Test Task");
      expect(savedTask?.description).toBe(
        "This is a test task for integration testing"
      );
      expect(savedTask?.status).toBe(TaskStatus.PENDING);
    });

    it("should create a task with only title", async () => {
      // Arrange
      const taskData = {
        title: "Task without description",
      };

      // Act
      const response = await request(app)
        .post("/tasks")
        .send(taskData)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        title: "Task without description",
        status: TaskStatus.PENDING,
      });
      expect(response.body.description).toBeUndefined();
      expect(response.body.id).toBeDefined();

      // Verify database persistence
      const savedTask = await testPrisma.task.findUnique({
        where: { id: response.body.id },
      });
      expect(savedTask?.title).toBe("Task without description");
      expect(savedTask?.description).toBeNull();
    });

    it("should return 400 when title is missing", async () => {
      // Arrange
      const taskData = {
        description: "Task without title",
      };

      // Act
      const response = await request(app)
        .post("/tasks")
        .send(taskData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: "Validation Error",
        message: "Title is required and must be a string",
        statusCode: 400,
      });
      expect(response.body.timestamp).toBeDefined();

      // Verify no task was created in database
      const taskCount = await testPrisma.task.count();
      expect(taskCount).toBe(0);
    });

    it("should return 400 when title is not a string", async () => {
      // Arrange
      const taskData = {
        title: 123,
        description: "Invalid title type",
      };

      // Act
      const response = await request(app)
        .post("/tasks")
        .send(taskData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: "Validation Error",
        message: "Title is required and must be a string",
        statusCode: 400,
      });
    });

    it("should return 400 when description is not a string", async () => {
      // Arrange
      const taskData = {
        title: "Valid title",
        description: 123,
      };

      // Act
      const response = await request(app)
        .post("/tasks")
        .send(taskData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: "Validation Error",
        message: "Description must be a string if provided",
        statusCode: 400,
      });
    });
  });

  describe("GET /tasks", () => {
    it("should return all tasks ordered by creation date (newest first)", async () => {
      // Arrange - Create multiple tasks
      const task1 = await testPrisma.task.create({
        data: {
          title: "First Task",
          description: "First task description",
          status: TaskStatus.PENDING,
        },
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const task2 = await testPrisma.task.create({
        data: {
          title: "Second Task",
          description: "Second task description",
          status: TaskStatus.IN_PROGRESS,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const task3 = await testPrisma.task.create({
        data: {
          title: "Third Task",
          status: TaskStatus.COMPLETED,
        },
      });

      // Act
      const response = await request(app).get("/tasks").expect(200);

      // Assert
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({
        id: task3.id,
        title: "Third Task",
        status: TaskStatus.COMPLETED,
      });
      expect(response.body[0].description).toBeUndefined();

      expect(response.body[1]).toMatchObject({
        id: task2.id,
        title: "Second Task",
        description: "Second task description",
        status: TaskStatus.IN_PROGRESS,
      });

      expect(response.body[2]).toMatchObject({
        id: task1.id,
        title: "First Task",
        description: "First task description",
        status: TaskStatus.PENDING,
      });

      // Verify all responses have required fields
      response.body.forEach((task: any) => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.status).toBeDefined();
        expect(task.createdAt).toBeDefined();
        expect(task.updatedAt).toBeDefined();
      });
    });

    it("should return empty array when no tasks exist", async () => {
      // Act
      const response = await request(app).get("/tasks").expect(200);

      // Assert
      expect(response.body).toEqual([]);
    });
  });

  describe("PUT /tasks/:id/status", () => {
    it("should update task status to IN_PROGRESS", async () => {
      // Arrange
      const createdTask = await testPrisma.task.create({
        data: {
          title: "Task to Update",
          description: "This task will be updated",
          status: TaskStatus.PENDING,
        },
      });

      const updateData = {
        status: TaskStatus.IN_PROGRESS,
      };

      // Act
      const response = await request(app)
        .put(`/tasks/${createdTask.id}/status`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: createdTask.id,
        title: "Task to Update",
        description: "This task will be updated",
        status: TaskStatus.IN_PROGRESS,
      });
      expect(response.body.updatedAt).toBeDefined();

      // Verify the update was persisted in database
      const updatedTask = await testPrisma.task.findUnique({
        where: { id: createdTask.id },
      });
      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(new Date(updatedTask!.updatedAt).getTime()).toBeGreaterThan(
        new Date(createdTask.updatedAt).getTime()
      );
    });

    it("should update task status to COMPLETED", async () => {
      // Arrange
      const createdTask = await testPrisma.task.create({
        data: {
          title: "Task to Complete",
          status: TaskStatus.IN_PROGRESS,
        },
      });

      const updateData = {
        status: TaskStatus.COMPLETED,
      };

      // Act
      const response = await request(app)
        .put(`/tasks/${createdTask.id}/status`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        id: createdTask.id,
        title: "Task to Complete",
        status: TaskStatus.COMPLETED,
      });
      expect(response.body.description).toBeUndefined();

      // Verify database persistence
      const updatedTask = await testPrisma.task.findUnique({
        where: { id: createdTask.id },
      });
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
    });

    it("should return 404 when task does not exist", async () => {
      // Arrange
      const nonExistentId = "non-existent-id";
      const updateData = {
        status: TaskStatus.IN_PROGRESS,
      };

      // Act
      const response = await request(app)
        .put(`/tasks/${nonExistentId}/status`)
        .send(updateData)
        .expect(404);

      // Assert
      expect(response.body).toMatchObject({
        error: "Not Found",
        message: `Task with ID ${nonExistentId} not found`,
        statusCode: 404,
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it("should return 400 when status is invalid", async () => {
      // Arrange
      const createdTask = await testPrisma.task.create({
        data: {
          title: "Task with invalid status update",
          status: TaskStatus.PENDING,
        },
      });

      const updateData = {
        status: "INVALID_STATUS",
      };

      // Act
      const response = await request(app)
        .put(`/tasks/${createdTask.id}/status`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: "Validation Error",
        message: `Status is required and must be one of: ${Object.values(
          TaskStatus
        ).join(", ")}`,
        statusCode: 400,
      });

      // Verify task status was not changed in database
      const unchangedTask = await testPrisma.task.findUnique({
        where: { id: createdTask.id },
      });
      expect(unchangedTask?.status).toBe(TaskStatus.PENDING);
    });

    it("should return 400 when status is missing", async () => {
      // Arrange
      const createdTask = await testPrisma.task.create({
        data: {
          title: "Task with missing status",
          status: TaskStatus.PENDING,
        },
      });

      const updateData = {};

      // Act
      const response = await request(app)
        .put(`/tasks/${createdTask.id}/status`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: "Validation Error",
        message: `Status is required and must be one of: ${Object.values(
          TaskStatus
        ).join(", ")}`,
        statusCode: 400,
      });
    });

    it("should return 400 when task ID is empty", async () => {
      // Arrange
      const updateData = {
        status: TaskStatus.IN_PROGRESS,
      };

      // Act
      const response = await request(app)
        .put("/tasks/ /status")
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: "Validation Error",
        message: "Task ID parameter is required and must be a non-empty string",
        statusCode: 400,
      });
    });
  });

  describe("Health check endpoint", () => {
    it("should return health status", async () => {
      // Act
      const response = await request(app).get("/health").expect(200);

      // Assert
      expect(response.body).toMatchObject({
        status: "OK",
        message: "Task Management API is running",
      });
    });
  });

  describe("Error handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      // Act
      const response = await request(app)
        .get("/non-existent-endpoint")
        .expect(404);

      // Assert - Express default 404 handling
      expect(response.status).toBe(404);
    });

    it("should handle malformed JSON in request body", async () => {
      // Act
      const response = await request(app)
        .post("/tasks")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(500);

      // Assert - Express JSON parsing error results in 500
      expect(response.status).toBe(500);
    });
  });
});
