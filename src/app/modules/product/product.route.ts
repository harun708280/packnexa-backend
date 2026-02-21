import { UserRole } from "@prisma/client";
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/requireRole.middleware";
import { ProductController } from "./product.controller";

export const router = express.Router();

router.use(authMiddleware, requireRole(UserRole.MERCHANT));

router.get("/", ProductController.getAppliedMerchant);

export const productRoutes = router;
