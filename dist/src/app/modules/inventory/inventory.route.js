"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const admin_middleware_1 = require("../../middlewares/admin.middleware");
const inventory_controller_1 = require("./inventory.controller");
const router = express_1.default.Router();
// Merchant routes
router.post("/", auth_middleware_1.authMiddleware, inventory_controller_1.addProduct);
router.patch("/:id", auth_middleware_1.authMiddleware, inventory_controller_1.editProduct);
router.delete("/:id", auth_middleware_1.authMiddleware, inventory_controller_1.deleteProduct);
router.get("/", auth_middleware_1.authMiddleware, inventory_controller_1.listProducts);
// Warehouse/Admin routes
router.get("/warehouse/pending", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, inventory_controller_1.listProducts);
router.post("/warehouse/:id/approve", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, inventory_controller_1.warehouseApproveProduct);
router.post("/warehouse/:id/reject", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, inventory_controller_1.warehouseRejectProduct);
router.patch("/warehouse/:id/store", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, inventory_controller_1.storeProduct);
router.get("/warehouse/logs/:productId", auth_middleware_1.authMiddleware, admin_middleware_1.adminMiddleware, inventory_controller_1.getWarehouseLogs);
exports.inventoryRoutes = router;
