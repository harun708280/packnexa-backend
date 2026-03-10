import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import {
  addProductService,
  editProductService,
  deleteProductService,
  listProductsService,
  approveProductService,
  rejectProductService,
  storeProductService,
  getWarehouseLogsService,
  requestStockAdjustmentService,
  listStockAdjustmentsService,
  approveStockAdjustmentService,
  rejectStockAdjustmentService,
  getProductService,
} from "./inventory.service";


export const addProduct = catchAsync(async (req: Request, res: Response) => {
  const merchantId = (req as any).user.userId;
  const product = await addProductService(merchantId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Product added successfully",
    data: product,
  });
});

export const editProduct = catchAsync(async (req: Request, res: Response) => {
  const merchantId = (req as any).user.userId;
  const product = await editProductService(merchantId, req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  await deleteProductService((req as any).user.userId, req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product deleted successfully",
  });
});

export const listProducts = catchAsync(async (req: Request, res: Response) => {
  const merchantId = (req as any).user.userId;
  const isAdmin = (req as any).user.role === "ADMIN";
  const pending = req.query.pending === "true";

  const products = await listProductsService(merchantId, isAdmin, pending);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Products fetched",
    data: products,
  });
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  const merchantId = (req as any).user.userId;
  const isAdmin = (req as any).user.role === "ADMIN";
  const product = await getProductService(merchantId, isAdmin, req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product details fetched",
    data: product,
  });
});

export const warehouseApproveProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await approveProductService(req.params.id, req.body.location);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product approved and logged",
    data: product,
  });
});

export const warehouseRejectProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await rejectProductService(req.params.id, req.body.reason);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product rejected and logged",
    data: product,
  });
});

export const storeProduct = catchAsync(async (req: Request, res: Response) => {
  const log = await storeProductService(req.params.id, req.body.location);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product stored",
    data: log,
  });
});

export const getWarehouseLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await getWarehouseLogsService(req.params.productId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Warehouse logs fetched",
    data: logs,
  });
});

export const requestStockAdjustment = catchAsync(async (req: Request, res: Response) => {
  const merchantId = (req as any).user.userId;
  const adjustment = await requestStockAdjustmentService(merchantId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Stock adjustment requested successfully",
    data: adjustment,
  });
});

export const listStockAdjustments = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const isAdmin = user.role?.toUpperCase() === "ADMIN";
  const status = req.query.status;
  const logData = `[${new Date().toISOString()}] Admin Check: userId=${user.userId}, role=${user.role}, isAdmin=${isAdmin}, status=${status}\n`;
  require('fs').appendFileSync('debug.log', logData);
  const adjustments = await listStockAdjustmentsService(user.userId, isAdmin, status);
  require('fs').appendFileSync('debug.log', `[${new Date().toISOString()}] Found ${adjustments.length} adjustments\n`);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stock adjustments fetched",
    data: adjustments,
  });
});

export const approveStockAdjustment = catchAsync(async (req: Request, res: Response) => {
  const result = await approveStockAdjustmentService(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stock adjustment approved",
    data: result,
  });
});

export const rejectStockAdjustment = catchAsync(async (req: Request, res: Response) => {
  const adjustment = await rejectStockAdjustmentService(req.params.id, req.body.reason);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stock adjustment rejected",
    data: adjustment,
  });
});
