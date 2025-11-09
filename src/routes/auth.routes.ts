import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { asyncErrorWrapper } from "../middleware/index.js";

/**
 * Authentication routes configuration
 * Defines route handlers connecting to AuthController methods
 */
export function createAuthRoutes(): Router {
  const router = Router();
  const authController = new AuthController();

  // POST /auth/login - User login endpoint
  router.post(
    "/login",
    asyncErrorWrapper(async (req, res) => {
      await authController.login(req, res);
    })
  );

  // POST /auth/logout - User logout endpoint
  router.post(
    "/logout",
    asyncErrorWrapper(async (req, res) => {
      await authController.logout(req, res);
    })
  );

  return router;
}
