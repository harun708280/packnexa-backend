import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ProductService } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProductService.createProduct(user.userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Product created successfully and is processing for approval",
    data: result,
  });
});

const getMyProducts = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProductService.getMyProducts(user.userId, req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your products fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const result = await ProductService.getSingleProduct(user.userId, id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product fetched successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getAllProducts(req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All products fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const result = await ProductService.updateProduct(user.userId, id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  await ProductService.deleteProduct(user.userId, id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product deleted successfully",
    data: null,
  });
});

const approveProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.approveProduct(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product approved successfully",
    data: result,
  });
});

const rejectProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const result = await ProductService.rejectProduct(id, reason);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product rejected successfully",
    data: result,
  });
});

const getAppliedMerchant = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getAppliedMerchant();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Applied merchant list fetched successfully",
    data: result,
  });
});

export const ProductController = {
  createProduct,
  getMyProducts,
  getSingleProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  approveProduct,
  rejectProduct,
  getAppliedMerchant,
};
