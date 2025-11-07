import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../server.js";
import { TaskStatus } from "../models/index.js";

/**
 * End-to-End Integration Tests
 *
 * This test suite validates that all components work together properly:
 * - Controller → Service → Repository → Database
 * - Error handling across all layers
 * - Database persistence
 * - Complete request/response cycles
 *
 * Requirements covered: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */
describe("End-to-End Integration Tests", () => {
  let testPrisma: PrismaClient;

  beforeAll(async () => {
    // Create a separate Prisma client for test verification
    testPrisma = new PrismaClient();

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
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

  describe("Complete Task Lifecycle", () => {
    it("should handle complete task lifecycle: create → list → update → verify persistence", async () => {
      // Step 1: Create a task (Requirement 1.1, 1.2, 1.3, 1.4, 1.5)
      const createResponse = await request(app)
        .post("/tasks")
        .send({
          title: "E2E Test Task",
          description: "End-to-end integration test task",
        })
        .expect(201);

      expect(createResponse.body).toMatchObject({
        title: "E2E Test Task",
        description: "End-to-end integration test task",
        status: TaskStatus.PENDING,
      });
      expect(createResponse.body.id).toBeDefined();
      expect(createResponse.body.createdAt).toBeDefined();
      expect(createResponse.body.updatedAt).toBeDefined();

      const taskId = createResponse.body.id;

      // Verify task was persisted in database
      const createdTask = await testPrisma.task.findUnique({
        where: { id: taskId },
      });
      expect(createdTask).toBeTruthy();
      expect(createdTask?.title).toBe("E2E Test Task");
      expect(createdTask?.description).toBe("End-to-end integration test task");
      expect(createdTask?.status).toBe(TaskStatus.PENDING);

      // Step 2: List all tasks (Requirement 2.1, 2.2, 2.3, 2.4)
      const listResponse = await request(app).get("/tasks").expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]).toMatchObject({
        id: taskId,
        title: "E2E Test Task",
        description: "End-to-end integration test task",
        status: TaskStatus.PENDING,
      });

      // Step 3: Update task status to IN_PROGRESS (Requirement 3.1, 3.2, 3.3, 3.4, 3.5)
      const updateResponse1 = await request(app)
        .put(`/tasks/${taskId}/status`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      expect(updateResponse1.body).toMatchObject({
        id: taskId,
        title: "E2E Test Task",
        description: "End-to-end integration test task",
        status: TaskStatus.IN_PROGRESS,
      });

      // Verify update was persisted
      const updatedTask1 = await testPrisma.task.findUnique({
        where: { id: taskId },
      });
      expect(updatedTask1?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(new Date(updatedTask1!.updatedAt).getTime()).toBeGreaterThan(
        new Date(createdTask!.updatedAt).getTime()
      );

      // Step 4: Update task status to COMPLETED
      const updateResponse2 = await request(app)
        .put(`/tasks/${taskId}/status`)
        .send({ status: TaskStatus.COMPLETED })
        .expect(200);

      expect(updateResponse2.body).toMatchObject({
        id: taskId,
        status: TaskStatus.COMPLETED,
      });

      // Verify final update was persisted
      const updatedTask2 = await testPrisma.task.findUnique({
        where: { id: taskId },
      });
      expect(updatedTask2?.status).toBe(TaskStatus.COMPLETED);
      expect(new Date(updatedTask2!.updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedTask1!.updatedAt).getTime()
      );

      // Step 5: Verify final state in list
      const finalListResponse = await request(app).get("/tasks").expect(200);

      expect(finalListResponse.body).toHaveLength(1);
      expect(finalListResponse.body[0]).toMatchObject({
        id: taskId,
        status: TaskStatus.COMPLETED,
      });
    });

    it("should handle multiple tasks with proper ordering", async () => {
      // Create multiple tasks with delays to ensure different timestamps
      const task1Response = await request(app)
        .post("/tasks")
        .send({ title: "First Task", description: "First task description" })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const task2Response = await request(app)
        .post("/tasks")
        .send({ title: "Second Task", description: "Second task description" })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const task3Response = await request(app)
        .post("/tasks")
        .send({ title: "Third Task" })
        .expect(201);

      // Verify all tasks are persisted
      const dbTasks = await testPrisma.task.findMany({
        orderBy: { createdAt: "desc" },
      });
      expect(dbTasks).toHaveLength(3);

      // Get all tasks via API
      const listResponse = await request(app).get("/tasks").expect(200);

      expect(listResponse.body).toHaveLength(3);

      // Verify ordering (newest first)
      expect(listResponse.body[0].title).toBe("Third Task");
      expect(listResponse.body[1].title).toBe("Second Task");
      expect(listResponse.body[2].title).toBe("First Task");

      // Update middle task status
      await request(app)
        .put(`/tasks/${task2Response.body.id}/status`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      // Verify update persisted
      const updatedTask = await testPrisma.task.findUnique({
        where: { id: task2Response.body.id },
      });
      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe("Error Handling Across All Layers", () => {
    it("should handle validation errors consistently", async () => {
      // Test missing title
      const response1 = await request(app)
        .post("/tasks")
        .send({ description: "Task without title" })
        .expect(400);

      expect(response1.body).toMatchObject({
        error: "Validation Error",
        message: "Title is required and must be a string",
        statusCode: 400,
      });
      expect(response1.body.timestamp).toBeDefined();

      // Verify no task was created in database
      const taskCount = await testPrisma.task.count();
      expect(taskCount).toBe(0);

      // Test invalid status update
      const createResponse = await request(app)
        .post("/tasks")
        .send({ title: "Valid Task" })
        .expect(201);

      const response2 = await request(app)
        .put(`/tasks/${createResponse.body.id}/status`)
        .send({ status: "INVALID_STATUS" })
        .expect(400);

      expect(response2.body).toMatchObject({
        error: "Validation Error",
        statusCode: 400,
      });

      // Verify task status was not changed
      const unchangedTask = await testPrisma.task.findUnique({
        where: { id: createResponse.body.id },
      });
      expect(unchangedTask?.status).toBe(TaskStatus.PENDING);
    });

    it("should handle not found errors properly", async () => {
      const response = await request(app)
        .put("/tasks/non-existent-id/status")
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(404);

      expect(response.body).toMatchObject({
        error: "Not Found",
        message: "Task with ID non-existent-id not found",
        statusCode: 404,
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it("should handle malformed requests gracefully", async () => {
      // Test malformed JSON
      const response = await request(app)
        .post("/tasks")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(500);

      expect(response.status).toBe(500);

      // Test invalid data types
      const response2 = await request(app)
        .post("/tasks")
        .send({ title: 123, description: 456 })
        .expect(400);

      expect(response2.body).toMatchObject({
        error: "Validation Error",
        statusCode: 400,
      });
    });
  });

  describe("Data Persistence and Consistency", () => {
    it("should maintain data consistency across operations", async () => {
      // Create task
      const createResponse = await request(app)
        .post("/tasks")
        .send({
          title: "Consistency Test Task",
          description: "Testing data consistency",
        })
        .expect(201);

      const taskId = createResponse.body.id;
      const originalCreatedAt = createResponse.body.createdAt;

      // Verify immediate persistence
      const dbTask1 = await testPrisma.task.findUnique({
        where: { id: taskId },
      });
      expect(dbTask1).toBeTruthy();
      expect(dbTask1?.title).toBe("Consistency Test Task");
      expect(dbTask1?.description).toBe("Testing data consistency");

      // Update status
      const updateResponse = await request(app)
        .put(`/tasks/${taskId}/status`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      // Verify createdAt unchanged, updatedAt changed
      expect(updateResponse.body.createdAt).toBe(originalCreatedAt);
      expect(updateResponse.body.updatedAt).not.toBe(originalCreatedAt);

      // Verify persistence of update
      const dbTask2 = await testPrisma.task.findUnique({
        where: { id: taskId },
      });
      expect(dbTask2?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(dbTask2?.title).toBe("Consistency Test Task"); // Title unchanged
      expect(dbTask2?.description).toBe("Testing data consistency"); // Description unchanged

      // Verify through API list
      const listResponse = await request(app).get("/tasks").expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]).toMatchObject({
        id: taskId,
        title: "Consistency Test Task",
        description: "Testing data consistency",
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it("should handle optional description field correctly", async () => {
      // Create task without description
      const response1 = await request(app)
        .post("/tasks")
        .send({ title: "Task without description" })
        .expect(201);

      expect(response1.body.description).toBeUndefined();

      // Verify in database (null in DB, undefined in response)
      const dbTask1 = await testPrisma.task.findUnique({
        where: { id: response1.body.id },
      });
      expect(dbTask1?.description).toBeNull();

      // Create task with description
      const response2 = await request(app)
        .post("/tasks")
        .send({
          title: "Task with description",
          description: "This has a description",
        })
        .expect(201);

      expect(response2.body.description).toBe("This has a description");

      // Verify in database
      const dbTask2 = await testPrisma.task.findUnique({
        where: { id: response2.body.id },
      });
      expect(dbTask2?.description).toBe("This has a description");

      // Verify both in list
      const listResponse = await request(app).get("/tasks").expect(200);

      expect(listResponse.body).toHaveLength(2);

      // Find tasks in response
      const taskWithDesc = listResponse.body.find((t: any) => t.description);
      const taskWithoutDesc = listResponse.body.find(
        (t: any) => !t.description
      );

      expect(taskWithDesc.description).toBe("This has a description");
      expect(taskWithoutDesc.description).toBeUndefined();
    });
  });

  describe("System Health and Availability", () => {
    it("should confirm system is operational", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toMatchObject({
        status: "OK",
        message: "Task Management API is running",
      });
    });

    it("should handle non-existent endpoints properly", async () => {
      const response = await request(app)
        .get("/non-existent-endpoint")
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe("Component Integration Verification", () => {
    it("should verify Controller → Service → Repository → Database flow", async () => {
      // This test specifically validates the complete flow through all layers

      // 1. HTTP Request → Controller
      const createResponse = await request(app)
        .post("/tasks")
        .send({ title: "Integration Flow Test" })
        .expect(201);

      // 2. Verify Controller processed request and returned proper response
      expect(createResponse.body).toMatchObject({
        title: "Integration Flow Test",
        status: TaskStatus.PENDING,
      });
      expect(createResponse.body.id).toBeDefined();

      // 3. Verify Service layer processed business logic (default status)
      expect(createResponse.body.status).toBe(TaskStatus.PENDING);

      // 4. Verify Repository layer persisted to database
      const dbTask = await testPrisma.task.findUnique({
        where: { id: createResponse.body.id },
      });
      expect(dbTask).toBeTruthy();
      expect(dbTask?.title).toBe("Integration Flow Test");
      expect(dbTask?.status).toBe(TaskStatus.PENDING);

      // 5. Verify complete round-trip through all layers
      const getResponse = await request(app).get("/tasks").expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0]).toMatchObject({
        id: createResponse.body.id,
        title: "Integration Flow Test",
        status: TaskStatus.PENDING,
      });

      // 6. Verify update flow through all layers
      const updateResponse = await request(app)
        .put(`/tasks/${createResponse.body.id}/status`)
        .send({ status: TaskStatus.COMPLETED })
        .expect(200);

      expect(updateResponse.body.status).toBe(TaskStatus.COMPLETED);

      // 7. Verify update persisted through all layers
      const finalDbTask = await testPrisma.task.findUnique({
        where: { id: createResponse.body.id },
      });
      expect(finalDbTask?.status).toBe(TaskStatus.COMPLETED);
    });
  });
});
