import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ReturnService } from "./return.service";
import pick from "../../helper/pick";

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
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder", "searchTerm"]);
    const result = await ReturnService.getMerchantReturns(user.userId, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Merchant returns fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getAllReturns = catchAsync(async (req: Request, res: Response) => {
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder", "searchTerm"]);
    const result = await ReturnService.getAllReturns(options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All returns fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

export const ReturnController = {
    createReturn,
    updateReturnStatus,
    getMerchantReturns,
    getAllReturns,
};
