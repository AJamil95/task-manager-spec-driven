import { Router } from "express";
import { TaskController } from "../controllers/task.controller.js";
import { asyncErrorWrapper } from "../middleware/index.js";

/**
 * Task routes configuration
 * Defines route handlers connecting to TaskController methods
 */
export function createTaskRoutes(): Router {
  const router = Router();
  const taskController = new TaskController();

  // POST /tasks - Create a new task
  router.post(
    "/",
    asyncErrorWrapper(async (req, res) => {
      await taskController.createTask(req, res);
    })
  );

  // GET /tasks - Retrieve all tasks
  router.get(
    "/",
    asyncErrorWrapper(async (req, res) => {
      await taskController.getAllTasks(req, res);
    })
  );

  // PUT /tasks/:id - Update task (title, description) - COMMENTED OUT
  // router.put(
  //   "/:id",
  //   asyncErrorWrapper(async (req, res) => {
  //     // Route parameter validation for task ID
  //     const { id } = req.params;
  //     if (!id || typeof id !== "string" || id.trim().length === 0) {
  //       res.status(400).json({
  //         error: "Validation Error",
  //         message:
  //           "Task ID parameter is required and must be a non-empty string",
  //         statusCode: 400,
  //         timestamp: new Date().toISOString(),
  //       });
  //       return;
  //     }

  //     await taskController.updateTask(req, res);
  //   })
  // );

  // PUT /tasks/:id/status - Update task status
  router.put(
    "/:id/status",
    asyncErrorWrapper(async (req, res) => {
      // Route parameter validation for task ID
      const { id } = req.params;
      if (!id || typeof id !== "string" || id.trim().length === 0) {
        res.status(400).json({
          error: "Validation Error",
          message:
            "Task ID parameter is required and must be a non-empty string",
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await taskController.updateTaskStatus(req, res);
    })
  );

  return router;
}
