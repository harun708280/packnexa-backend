import express, { NextFunction, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/create-user",
  validateRequest(UserValidation.createUserZodSchema),
  (req: Request, res: Response, next: NextFunction) => {
    UserController.createUser(req, res, next);
  }
);

router.get("/me", authMiddleware, UserController.me);

export const userRoutes = router;
