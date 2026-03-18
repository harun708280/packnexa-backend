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
    "/stats",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    OrderController.getOrderStats
);

router.get(
    "/all-orders",
    authMiddleware,
    requireRole(UserRole.ADMIN),
    OrderController.getAllOrders
);

router.get(
    "/customers",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    OrderController.getMerchantCustomers
);

router.get(
    "/customers/:identifier",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    OrderController.getCustomerDetails
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
    "/bulk-update-status",
    authMiddleware,
    requireRole(UserRole.ADMIN, UserRole.MERCHANT),
    OrderController.bulkUpdateOrderStatus
);

router.patch(
    "/update-order/:id",
    authMiddleware,
    requireRole(UserRole.MERCHANT),
    OrderController.updateOrder
);

router.get(
    "/track/:id",
    authMiddleware,
    OrderController.trackOrder
);


router.delete(
    "/delete/:id",
    authMiddleware,
    requireRole(UserRole.ADMIN, UserRole.MERCHANT),
    OrderController.deleteOrder
);

router.post(
    "/bulk-delete",
    authMiddleware,
    requireRole(UserRole.ADMIN, UserRole.MERCHANT),
    OrderController.bulkDeleteOrders
);

router.get(
    "/fraud-check/:phone",
    authMiddleware,
    requireRole(UserRole.MERCHANT, UserRole.ADMIN),
    OrderController.checkCustomerFraud
);

export const orderRoutes = router;
