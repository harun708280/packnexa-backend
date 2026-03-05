import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ExternalOrderService } from "./externalOrder.service";
import { prisma } from "../../shared/prisma";
import httpStatus from "http-status";
import AppError from "../../errorHelper/AppError";

const syncWordPressOrder = catchAsync(async (req: Request, res: Response) => {
    // In a real scenario, we would validate the API Key/Secret here
    // For now, we assume the merchantDetailsId is passed in the headers or body for development
    const merchantDetailsId = req.headers["x-merchant-id"] as string;
    const providedSecret = req.headers["x-webhook-secret"] as string;

    if (!merchantDetailsId) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: "Merchant ID is required in headers (x-merchant-id)",
        });
    }

    // Validate Webhook Secret
    const merchant = await prisma.merchantDetails.findUnique({
        where: { id: merchantDetailsId },
        select: { id: true, webhookSecret: true }
    });

    if (!merchant) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Merchant not found",
        });
    }

    if (merchant.webhookSecret && merchant.webhookSecret !== providedSecret) {
        return sendResponse(res, {
            statusCode: 401,
            success: false,
            message: "Invalid Webhook Secret Key",
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

    // Fetch merchantDetailsId using userId since it's not in the token
    const merchant = await prisma.merchantDetails.findUnique({
        where: { userId: user.userId }
    });

    if (!merchant) {
        throw new AppError(httpStatus.NOT_FOUND, "Merchant details not found for this user");
    }

    const result = await ExternalOrderService.getExternalLogs(merchant.id);

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

    const merchant = await prisma.merchantDetails.findUnique({
        where: { userId: user.userId }
    });

    if (!merchant) {
        throw new AppError(httpStatus.NOT_FOUND, "Merchant details not found for this user");
    }

    const result = await ExternalOrderService.retrySync(merchant.id, id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.status === "COMPLETED" ? "Order synced successfully" : "Sync failed again. Please check product details.",
        data: result,
    });
});

const getWebhookConfig = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    const merchant = await prisma.merchantDetails.findUnique({
        where: { userId: user.userId },
        select: { id: true, webhookSecret: true }
    });

    if (!merchant) {
        throw new AppError(httpStatus.NOT_FOUND, "Merchant details not found");
    }

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Webhook configuration fetched successfully",
        data: {
            merchantId: merchant.id,
            webhookSecret: merchant.webhookSecret,
            webhookUrl: `https://packnexa-backend-2.onrender.com/api/v1/external-order/wordpress/sync`
        },
    });
});

const generateWebhookSecret = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Generate a random secret
    const newSecret = `pk_ws_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

    const merchant = await prisma.merchantDetails.update({
        where: { userId: user.userId },
        data: { webhookSecret: newSecret },
        select: { id: true, webhookSecret: true }
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Webhook secret generated successfully",
        data: {
            merchantId: merchant.id,
            webhookSecret: merchant.webhookSecret
        },
    });
});

export const ExternalOrderController = {
    syncWordPressOrder,
    getExternalLogs,
    retrySync,
    getWebhookConfig,
    generateWebhookSecret
};
