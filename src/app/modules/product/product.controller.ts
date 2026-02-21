import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ProductService } from "./product.service";

const getAppliedMerchant = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProductService.getAppliedMerchant();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Applied merchant list fetched successfully",
    data: result,
  });
});

export const ProductController = {
  getAppliedMerchant,
};
