import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { adminMiddleware } from "../../middlewares/admin.middleware";
import {
  addProduct,
  editProduct,
  deleteProduct,
  listProducts,
  warehouseApproveProduct,
  warehouseRejectProduct,
  storeProduct,
  getWarehouseLogs,
} from "./inventory.controller";

const router = express.Router();

// Merchant routes
router.post("/", authMiddleware, addProduct);
router.patch("/:id", authMiddleware, editProduct);
router.delete("/:id", authMiddleware, deleteProduct);
router.get("/", authMiddleware, listProducts);

// Warehouse/Admin routes
router.get("/warehouse/pending", authMiddleware, adminMiddleware, listProducts);
router.post("/warehouse/:id/approve", authMiddleware, adminMiddleware, warehouseApproveProduct);
router.post("/warehouse/:id/reject", authMiddleware, adminMiddleware, warehouseRejectProduct);
router.patch("/warehouse/:id/store", authMiddleware, adminMiddleware, storeProduct);
router.get("/warehouse/logs/:productId", authMiddleware, adminMiddleware, getWarehouseLogs);
export const inventoryRoutes = router;
