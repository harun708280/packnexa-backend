import { UserRole } from "@prisma/client";
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/requireRole.middleware";
import { ExternalOrderController } from "./externalOrder.controller";

const router = express.Router();

// Public endpoint for WordPress Webhook
router.post("/wordpress/sync", ExternalOrderController.syncWordPressOrder);

// Protected endpoint for Merchant to see logs
router.get("/logs", authMiddleware, requireRole(UserRole.MERCHANT), ExternalOrderController.getExternalLogs);

// Protected endpoint to manage webhook config
router.get("/webhook-config", authMiddleware, requireRole(UserRole.MERCHANT), ExternalOrderController.getWebhookConfig);
router.post("/webhook-secret", authMiddleware, requireRole(UserRole.MERCHANT), ExternalOrderController.generateWebhookSecret);

// Protected endpoint to retry sync
router.patch("/retry/:id", authMiddleware, requireRole(UserRole.MERCHANT, UserRole.ADMIN), ExternalOrderController.retrySync);

export const ExternalOrderRoutes = router;
