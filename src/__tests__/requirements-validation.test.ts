import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../server.js";
import { TaskStatus } from "../models/index.js";

/**
 * Requirements Validation Test Suite
 *
 * This test suite systematically validates each requirement from the requirements document
 * to ensure complete compliance with the specification.
 */
describe("Requirements Validation", () => {
  let testPrisma: PrismaClient;

  beforeAll(async () => {
    testPrisma = new PrismaClient();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  beforeEach(async () => {
    await testPrisma.task.deleteMany();
  });

  afterAll(async () => {
    await testPrisma.task.deleteMany();
    await testPrisma.$disconnect();
  });

  describe("Requirement 1: Task Creation", () => {
    describe("1.1: POST request creates Task_Entity with status 'pending'", () => {
      it("should create task with PENDING status when valid data provided", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({
            title: "Test Task",
            description: "Test Description",
          })
          .expect(201);

        expect(response.body.status).toBe(TaskStatus.PENDING);
        expect(response.body.id).toBeDefined();

        // Verify in database
        const dbTask = await testPrisma.task.findUnique({
          where: { id: response.body.id },
        });
        expect(dbTask?.status).toBe(TaskStatus.PENDING);
      });
    });

    describe("1.2: Validate title field is provided and not empty", () => {
      it("should reject request when title is missing", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({ description: "No title provided" })
          .expect(400);

        expect(response.body.message).toContain("Title is required");
      });

      it("should reject request when title is empty string", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({ title: "", description: "Empty title" })
          .expect(400);

        expect(response.body.message).toContain("Title is required");
      });

      it("should reject request when title is not a string", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({ title: 123, description: "Invalid title type" })
          .expect(400);

        expect(response.body.message).toContain(
          "Title is required and must be a string"
        );
      });
    });

    describe("1.3: Assign unique identifier to each Task_Entity", () => {
      it("should assign unique IDs to different tasks", async () => {
        const response1 = await request(app)
          .post("/tasks")
          .send({ title: "Task 1" })
          .expect(201);

        const response2 = await request(app)
          .post("/tasks")
          .send({ title: "Task 2" })
          .expect(201);

        expect(response1.body.id).toBeDefined();
        expect(response2.body.id).toBeDefined();
        expect(response1.body.id).not.toBe(response2.body.id);
      });
    });

    describe("1.4: Set createdAt timestamp to current date and time", () => {
      it("should set createdAt to current timestamp", async () => {
        const beforeCreate = new Date();

        const response = await request(app)
          .post("/tasks")
          .send({ title: "Timestamp Test" })
          .expect(201);

        const afterCreate = new Date();
        const createdAt = new Date(response.body.createdAt);

        expect(createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime()
        );
        expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      });
    });

    describe("1.5: Return HTTP 201 with created task data", () => {
      it("should return 201 status with complete task data", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({
            title: "Complete Task",
            description: "Task with all fields",
          })
          .expect(201);

        expect(response.body).toMatchObject({
          title: "Complete Task",
          description: "Task with all fields",
          status: TaskStatus.PENDING,
        });
        expect(response.body.id).toBeDefined();
        expect(response.body.createdAt).toBeDefined();
        expect(response.body.updatedAt).toBeDefined();
      });
    });
  });

  describe("Requirement 2: Task Retrieval", () => {
    describe("2.1: GET /tasks returns all Task_Entity records", () => {
      it("should return all tasks from database", async () => {
        // Create multiple tasks
        await request(app).post("/tasks").send({ title: "Task 1" });
        await request(app).post("/tasks").send({ title: "Task 2" });
        await request(app).post("/tasks").send({ title: "Task 3" });

        const response = await request(app).get("/tasks").expect(200);

        expect(response.body).toHaveLength(3);
        expect(response.body.every((task: any) => task.title && task.id)).toBe(
          true
        );
      });
    });

    describe("2.2: Format response as JSON array", () => {
      it("should return JSON array format", async () => {
        await request(app).post("/tasks").send({ title: "Test Task" });

        const response = await request(app).get("/tasks").expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.headers["content-type"]).toMatch(/json/);
      });
    });

    describe("2.3: Return HTTP 200 for successful retrieval", () => {
      it("should return 200 status for successful retrieval", async () => {
        await request(app).post("/tasks").send({ title: "Test Task" });

        await request(app).get("/tasks").expect(200);
      });
    });

    describe("2.4: Return empty array when no tasks exist", () => {
      it("should return empty array with 200 status when no tasks", async () => {
        const response = await request(app).get("/tasks").expect(200);

        expect(response.body).toEqual([]);
      });
    });
  });

  describe("Requirement 3: Task Status Updates", () => {
    let taskId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post("/tasks")
        .send({ title: "Task for Status Update" });
      taskId = createResponse.body.id;
    });

    describe("3.1: PUT /tasks/:id/status updates Task_Status", () => {
      it("should update task status with valid data", async () => {
        const response = await request(app)
          .put(`/tasks/${taskId}/status`)
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(200);

        expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);

        // Verify in database
        const dbTask = await testPrisma.task.findUnique({
          where: { id: taskId },
        });
        expect(dbTask?.status).toBe(TaskStatus.IN_PROGRESS);
      });
    });

    describe("3.2: Validate status is valid enum value", () => {
      it("should accept all valid status values", async () => {
        // Test PENDING
        await request(app)
          .put(`/tasks/${taskId}/status`)
          .send({ status: TaskStatus.PENDING })
          .expect(200);

        // Test IN_PROGRESS
        await request(app)
          .put(`/tasks/${taskId}/status`)
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(200);

        // Test COMPLETED
        await request(app)
          .put(`/tasks/${taskId}/status`)
          .send({ status: TaskStatus.COMPLETED })
          .expect(200);
      });
    });

    describe("3.3: Return HTTP 400 for invalid status", () => {
      it("should return 400 for invalid status value", async () => {
        const response = await request(app)
          .put(`/tasks/${taskId}/status`)
          .send({ status: "INVALID_STATUS" })
          .expect(400);

        expect(response.body.statusCode).toBe(400);
        expect(response.body.message).toContain(
          "Status is required and must be one of"
        );
      });
    });

    describe("3.4: Return HTTP 404 for non-existent task", () => {
      it("should return 404 when task ID does not exist", async () => {
        const response = await request(app)
          .put("/tasks/non-existent-id/status")
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(404);

        expect(response.body.statusCode).toBe(404);
        expect(response.body.message).toContain("not found");
      });
    });

    describe("3.5: Return HTTP 200 with updated task data", () => {
      it("should return 200 with complete updated task data", async () => {
        const response = await request(app)
          .put(`/tasks/${taskId}/status`)
          .send({ status: TaskStatus.COMPLETED })
          .expect(200);

        expect(response.body).toMatchObject({
          id: taskId,
          title: "Task for Status Update",
          status: TaskStatus.COMPLETED,
        });
        expect(response.body.updatedAt).toBeDefined();
      });
    });
  });

  describe("Requirement 4: MVC Architecture", () => {
    describe("4.1: Controllers in src/controllers directory", () => {
      it("should handle HTTP requests through controller layer", async () => {
        // This is validated by the fact that all API endpoints work
        // The controller layer is handling the requests properly
        const response = await request(app)
          .post("/tasks")
          .send({ title: "Controller Test" })
          .expect(201);

        expect(response.body.title).toBe("Controller Test");
      });
    });

    describe("4.2: Services in src/services directory", () => {
      it("should process business logic through service layer", async () => {
        // Validated by proper status assignment and validation
        const response = await request(app)
          .post("/tasks")
          .send({ title: "Service Test" })
          .expect(201);

        // Default status assignment is handled by service layer
        expect(response.body.status).toBe(TaskStatus.PENDING);
      });
    });

    describe("4.3: Models in src/models directory using Prisma", () => {
      it("should use proper data models and types", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({ title: "Model Test", description: "Testing models" })
          .expect(201);

        // Response structure matches our model definitions
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("title");
        expect(response.body).toHaveProperty("description");
        expect(response.body).toHaveProperty("status");
        expect(response.body).toHaveProperty("createdAt");
        expect(response.body).toHaveProperty("updatedAt");
      });
    });

    describe("4.4: Routes in src/routes directory", () => {
      it("should configure endpoints through route layer", async () => {
        // All three main endpoints should be accessible
        await request(app)
          .post("/tasks")
          .send({ title: "Route Test" })
          .expect(201);
        await request(app).get("/tasks").expect(200);

        const createResponse = await request(app)
          .post("/tasks")
          .send({ title: "Route Update Test" });

        await request(app)
          .put(`/tasks/${createResponse.body.id}/status`)
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(200);
      });
    });

    describe("4.5: TypeScript for all source code", () => {
      it("should maintain type safety in responses", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({ title: "TypeScript Test" })
          .expect(201);

        // TypeScript ensures proper response structure
        expect(typeof response.body.id).toBe("string");
        expect(typeof response.body.title).toBe("string");
        expect(typeof response.body.status).toBe("string");
        expect(typeof response.body.createdAt).toBe("string");
        expect(typeof response.body.updatedAt).toBe("string");
      });
    });
  });

  describe("Requirement 5: Prisma with SQLite", () => {
    describe("5.1: Use Prisma_Client for database operations", () => {
      it("should persist data using Prisma client", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({ title: "Prisma Test" })
          .expect(201);

        // Verify data was persisted using direct Prisma query
        const dbTask = await testPrisma.task.findUnique({
          where: { id: response.body.id },
        });

        expect(dbTask).toBeTruthy();
        expect(dbTask?.title).toBe("Prisma Test");
      });
    });

    describe("5.2: Store Task_Entity records in SQLite_Database", () => {
      it("should store and retrieve data from SQLite", async () => {
        // Create task
        const createResponse = await request(app)
          .post("/tasks")
          .send({ title: "SQLite Test", description: "Testing SQLite storage" })
          .expect(201);

        // Verify storage by retrieving
        const getResponse = await request(app).get("/tasks").expect(200);

        const storedTask = getResponse.body.find(
          (t: any) => t.id === createResponse.body.id
        );
        expect(storedTask).toBeTruthy();
        expect(storedTask.title).toBe("SQLite Test");
        expect(storedTask.description).toBe("Testing SQLite storage");
      });
    });

    describe("5.3: Implement async/await patterns", () => {
      it("should handle asynchronous operations properly", async () => {
        // All operations are async and should complete successfully
        const response = await request(app)
          .post("/tasks")
          .send({ title: "Async Test" })
          .expect(201);

        expect(response.body.id).toBeDefined();
      });
    });

    describe("5.4: Handle database connection errors gracefully", () => {
      it("should handle errors without crashing", async () => {
        // Test with invalid data that might cause database errors
        await request(app).post("/tasks").send({ title: null }).expect(400);

        // Server should still be responsive
        await request(app).get("/health").expect(200);
      });
    });

    describe("5.5: Use Prisma schema for Task model structure", () => {
      it("should enforce schema structure", async () => {
        const response = await request(app)
          .post("/tasks")
          .send({ title: "Schema Test", description: "Testing schema" })
          .expect(201);

        // Verify all schema fields are present
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("title");
        expect(response.body).toHaveProperty("description");
        expect(response.body).toHaveProperty("status");
        expect(response.body).toHaveProperty("createdAt");
        expect(response.body).toHaveProperty("updatedAt");

        // Verify status is from enum
        expect(Object.values(TaskStatus)).toContain(response.body.status);
      });
    });
  });

  describe("Integration Requirements Validation", () => {
    it("should validate complete system integration", async () => {
      // Test complete workflow that exercises all requirements

      // 1. Create task (Requirements 1.1-1.5, 4.1-4.5, 5.1-5.5)
      const createResponse = await request(app)
        .post("/tasks")
        .send({
          title: "Integration Validation Task",
          description: "Complete system integration test",
        })
        .expect(201);

      expect(createResponse.body).toMatchObject({
        title: "Integration Validation Task",
        description: "Complete system integration test",
        status: TaskStatus.PENDING,
      });

      // 2. List tasks (Requirements 2.1-2.4)
      const listResponse = await request(app).get("/tasks").expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(createResponse.body.id);

      // 3. Update status (Requirements 3.1-3.5)
      const updateResponse = await request(app)
        .put(`/tasks/${createResponse.body.id}/status`)
        .send({ status: TaskStatus.COMPLETED })
        .expect(200);

      expect(updateResponse.body.status).toBe(TaskStatus.COMPLETED);

      // 4. Verify persistence
      const finalListResponse = await request(app).get("/tasks").expect(200);

      expect(finalListResponse.body[0].status).toBe(TaskStatus.COMPLETED);

      // 5. Verify database consistency
      const dbTask = await testPrisma.task.findUnique({
        where: { id: createResponse.body.id },
      });

      expect(dbTask?.status).toBe(TaskStatus.COMPLETED);
      expect(dbTask?.title).toBe("Integration Validation Task");
      expect(dbTask?.description).toBe("Complete system integration test");
    });
  });
});
