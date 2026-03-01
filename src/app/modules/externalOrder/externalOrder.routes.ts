import express from "express";
import { ExternalOrderController } from "./externalOrder.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

// Public endpoint for WordPress Webhook
router.post("/wordpress/sync", ExternalOrderController.syncWordPressOrder);

// Protected endpoint for Merchant to see logs
router.get("/logs", auth("MERCHANT"), ExternalOrderController.getExternalLogs);

// Protected endpoint to retry sync
router.patch("/retry/:id", auth("MERCHANT"), ExternalOrderController.retrySync);

export const ExternalOrderRoutes = router;
