import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ExternalOrderService } from "./externalOrder.service";

const syncWordPressOrder = catchAsync(async (req: Request, res: Response) => {
    // In a real scenario, we would validate the API Key/Secret here
    // For now, we assume the merchantDetailsId is passed in the headers or body for development
    const merchantDetailsId = req.headers["x-merchant-id"] as string;

    if (!merchantDetailsId) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Merchant ID is required in headers (x-merchant-id)",
        });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Request body is empty or not valid JSON",
        });
    }

    if (!req.body.id) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Order ID (id) is missing in the request body",
            data: req.body // Send back what was received for debugging
        });
    }

    const result = await ExternalOrderService.syncWordPressOrder(merchantDetailsId, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.status === "COMPLETED" ? "Order synced successfully" : "Order logged for manual review",
        data: result,
    });
});

const getExternalLogs = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    // Assuming user is connected to merchantDetails
    const result = await ExternalOrderService.getExternalLogs(user.merchantDetailsId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "External order logs fetched successfully",
        data: result,
    });
});

const retrySync = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await ExternalOrderService.retrySync(user.merchantDetailsId, id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.status === "COMPLETED" ? "Order synced successfully" : "Sync failed again. Please check product details.",
        data: result,
    });
});

export const ExternalOrderController = {
    syncWordPressOrder,
    getExternalLogs,
    retrySync,
};
