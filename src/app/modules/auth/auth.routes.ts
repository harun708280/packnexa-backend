import express from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import {
  emailSchema,
  loginSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  changePasswordSchema,
} from "./auth.validation";

export const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
});

router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  AuthController.login
);
router.post(
  "/verify-otp",
  authLimiter,
  validateRequest(verifyOtpSchema),
  AuthController.verifyOtp
);
router.post(
  "/resend-otp",
  authLimiter,
  validateRequest(emailSchema),
  AuthController.resendOtp
);
router.post("/logout", authMiddleware, AuthController.logout);
router.post(
  "/forget-password",
  authLimiter,
  validateRequest(emailSchema),
  AuthController.forgetPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword
);

router.post(
  "/change-password",
  authMiddleware,
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);

router.get("/sessions", authMiddleware, AuthController.getMySessions);
router.delete(
  "/sessions/:sessionId",
  authMiddleware,
  AuthController.logoutFromSession
);
router.post(
  "/logout-other-sessions",
  authMiddleware,
  AuthController.logoutOtherSessions
);

export const authRoutes = router;
