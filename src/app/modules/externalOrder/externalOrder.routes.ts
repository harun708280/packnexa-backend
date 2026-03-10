import { UserRole } from "@prisma/client";
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/requireRole.middleware";
import { ExternalOrderController } from "./externalOrder.controller";

const router = express.Router();


router.post("/wordpress/sync", ExternalOrderController.syncWordPressOrder);


router.get("/logs", authMiddleware, requireRole(UserRole.MERCHANT), ExternalOrderController.getExternalLogs);


router.get("/webhook-config", authMiddleware, requireRole(UserRole.MERCHANT), ExternalOrderController.getWebhookConfig);
router.post("/webhook-secret", authMiddleware, requireRole(UserRole.MERCHANT), ExternalOrderController.generateWebhookSecret);


router.patch("/retry/:id", authMiddleware, requireRole(UserRole.MERCHANT, UserRole.ADMIN), ExternalOrderController.retrySync);

export const ExternalOrderRoutes = router;
