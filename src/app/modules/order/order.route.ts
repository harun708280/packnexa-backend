import { UserRole } from "@prisma/client";
import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/requireRole.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validation";

export const router = express.Router();


router.post(
    "/create-order",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    validateRequest(OrderValidation.createOrderSchema),
    OrderController.createOrder
);

router.get(
    "/my-orders",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    OrderController.getMyOrders
);

router.get(
    "/all-orders",
    authMiddleware,
    requireRole(UserRole.ADMIN),
    OrderController.getAllOrders
);

router.get(
    "/:id",
    authMiddleware,
    requireRole(UserRole.MERCHANT, UserRole.ADMIN),
    OrderController.getSingleOrder
);

router.patch(
    "/update-status/:id",
    authMiddleware,
    requireRole(UserRole.ADMIN, UserRole.MERCHANT),
    validateRequest(OrderValidation.updateOrderStatusSchema),
    OrderController.updateOrderStatus
);

router.patch(
    "/update-order/:id",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    OrderController.updateOrder
);

router.delete(
    "/delete/:id",
    authMiddleware,
    requireRole(UserRole.ADMIN, UserRole.MERCHANT),
    OrderController.deleteOrder
);
// d
export const orderRoutes = router;
