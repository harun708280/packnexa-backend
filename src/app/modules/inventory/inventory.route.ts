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
  requestStockAdjustment,
  listStockAdjustments,
  approveStockAdjustment,
  rejectStockAdjustment,
  getProduct,
} from "./inventory.controller";

const router = express.Router();


router.post("/stock-adjustment", authMiddleware, requestStockAdjustment);
router.get("/stock-adjustment", authMiddleware, listStockAdjustments);


router.post("/", authMiddleware, addProduct);
router.patch("/:id", authMiddleware, editProduct)
router.delete("/:id", authMiddleware, deleteProduct);
router.get("/", authMiddleware, listProducts);
router.get("/:id", authMiddleware, getProduct);


router.get("/warehouse/pending", authMiddleware, adminMiddleware, listProducts);
router.post("/warehouse/:id/approve", authMiddleware, adminMiddleware, warehouseApproveProduct);
router.post("/warehouse/:id/reject", authMiddleware, adminMiddleware, warehouseRejectProduct);
router.patch("/warehouse/:id/store", authMiddleware, adminMiddleware, storeProduct);
router.get("/warehouse/logs/:productId", authMiddleware, adminMiddleware, getWarehouseLogs);

router.patch("/stock-adjustment/:id/approve", authMiddleware, adminMiddleware, approveStockAdjustment);
router.patch("/stock-adjustment/:id/reject", authMiddleware, adminMiddleware, rejectStockAdjustment);

export const inventoryRoutes = router;
