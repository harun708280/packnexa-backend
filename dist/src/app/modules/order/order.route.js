"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = exports.router = void 0;
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const requireRole_middleware_1 = require("../../middlewares/requireRole.middleware");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const order_controller_1 = require("./order.controller");
const order_validation_1 = require("./order.validation");
exports.router = express_1.default.Router();
exports.router.post("/create-order", auth_middleware_1.authMiddleware, (0, requireRole_middleware_1.requireRole)(client_1.UserRole.MERCHANT), (0, validateRequest_1.default)(order_validation_1.OrderValidation.createOrderSchema), order_controller_1.OrderController.createOrder);
exports.router.get("/my-orders", auth_middleware_1.authMiddleware, (0, requireRole_middleware_1.requireRole)(client_1.UserRole.MERCHANT), order_controller_1.OrderController.getMyOrders);
exports.router.get("/all-orders", auth_middleware_1.authMiddleware, (0, requireRole_middleware_1.requireRole)(client_1.UserRole.ADMIN), order_controller_1.OrderController.getAllOrders);
exports.router.get("/:id", auth_middleware_1.authMiddleware, (0, requireRole_middleware_1.requireRole)(client_1.UserRole.MERCHANT, client_1.UserRole.ADMIN), order_controller_1.OrderController.getSingleOrder);
exports.router.patch("/update-status/:id", auth_middleware_1.authMiddleware, (0, requireRole_middleware_1.requireRole)(client_1.UserRole.ADMIN, client_1.UserRole.MERCHANT), (0, validateRequest_1.default)(order_validation_1.OrderValidation.updateOrderStatusSchema), order_controller_1.OrderController.updateOrderStatus);
exports.router.patch("/update-order/:id", auth_middleware_1.authMiddleware, (0, requireRole_middleware_1.requireRole)(client_1.UserRole.MERCHANT), order_controller_1.OrderController.updateOrder);
exports.router.delete("/delete/:id", auth_middleware_1.authMiddleware, (0, requireRole_middleware_1.requireRole)(client_1.UserRole.ADMIN, client_1.UserRole.MERCHANT), order_controller_1.OrderController.deleteOrder);
// d
exports.orderRoutes = exports.router;
