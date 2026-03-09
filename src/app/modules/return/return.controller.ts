import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ReturnService } from "./return.service";

const createReturn = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await ReturnService.createReturn(user.userId, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Return requested successfully",
        data: result,
    });
});

const updateReturnStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ReturnService.updateReturnStatus(id, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Return status updated successfully",
        data: result,
    });
});

const getMerchantReturns = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await ReturnService.getMerchantReturns(user.userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Merchant returns fetched successfully",
        data: result,
    });
});

const getAllReturns = catchAsync(async (req: Request, res: Response) => {
    const result = await ReturnService.getAllReturns();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All returns fetched successfully",
        data: result,
    });
});

export const ReturnController = {
    createReturn,
    updateReturnStatus,
    getMerchantReturns,
    getAllReturns,
};
