import httpStatus from "http-status";
import AppError from "../../errorHelper/AppError";
import { prisma } from "../../shared/prisma";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";

const createReturn = async (identifier: string, payload: any, isMerchantDetailsId = false, isInternal = false) => {
    let actualMerchantDetailsId: string;

    if (isMerchantDetailsId) {
        actualMerchantDetailsId = identifier;
    } else {
        const merchantDetails = await prisma.merchantDetails.findUnique({
            where: { userId: identifier },
        });

        if (!merchantDetails && !isInternal) {
            throw new AppError(httpStatus.NOT_FOUND, "Merchant not found");
        }

        if (!merchantDetails) {
            throw new AppError(httpStatus.NOT_FOUND, "Merchant not found for the given identifier");
        }
        actualMerchantDetailsId = merchantDetails.id;
    }

    const order = await prisma.order.findUnique({
        where: { id: payload.orderId, merchantDetailsId: actualMerchantDetailsId },
        include: { items: true },
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found or unauthorized");
    }

    const existingReturn = await prisma.returnOrder.findUnique({
        where: { orderId: payload.orderId },
    });

    if (existingReturn) {
        throw new AppError(httpStatus.BAD_REQUEST, "Return already requested for this order");
    }

    return await prisma.$transaction(async (tx) => {
        const returnOrder = await tx.returnOrder.create({
            data: {
                orderId: payload.orderId,
                merchantDetailsId: actualMerchantDetailsId,
                reason: payload.reason,
                status: "PENDING",
                items: {
                    create: payload.items.map((item: any) => ({
                        variantId: item.variantId,
                        quantity: item.quantity,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        await tx.order.update({
            where: { id: payload.orderId },
            data: { status: "RETURNED" },
        });

        return returnOrder;
    });
};

const updateReturnStatus = async (returnId: string, payload: any) => {
    const returnOrder = await prisma.returnOrder.findUnique({
        where: { id: returnId },
        include: { items: true },
    });

    if (!returnOrder) {
        throw new AppError(httpStatus.NOT_FOUND, "Return order not found");
    }

    if (returnOrder.status !== "PENDING") {
        throw new AppError(httpStatus.BAD_REQUEST, "Return order is already processed");
    }

    const { status, adminFeedback, images, backToStock } = payload;

    if (status === "REJECTED" && !adminFeedback) {
        throw new AppError(httpStatus.BAD_REQUEST, "Feedback is required for rejection");
    }

    return await prisma.$transaction(async (tx) => {
        const updatedReturn = await tx.returnOrder.update({
            where: { id: returnId },
            data: {
                status,
                adminFeedback,
                backToStock: !!backToStock,
                images: images ? {
                    create: images.map((url: string) => ({ imageUrl: url })),
                } : undefined,
            },
        });


        if (status === "APPROVED" && backToStock) {
            for (const item of returnOrder.items) {
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        quantity: { increment: item.quantity },
                        soldQuantity: { decrement: item.quantity },
                    },
                });

                await tx.inventoryTransaction.create({
                    data: {
                        variantId: item.variantId,
                        type: "RETURN",
                        quantity: item.quantity,
                        note: `Stock returned from processed Return Request for Order ${returnOrder.orderId}`,
                    },
                });
            }
        }

        return updatedReturn;
    });
};

const getMerchantReturns = async (userId: string, options: IOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new AppError(httpStatus.NOT_FOUND, "Merchant not found");
    }

    const result = await prisma.returnOrder.findMany({
        where: { merchantDetailsId: merchantDetails.id },
        include: {
            order: true,
            items: {
                include: {
                    variant: {
                        include: {
                            pricing: true,
                            product: {
                                include: {
                                    productImages: true
                                }
                            }
                        }
                    },
                },
            },
            images: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
    });

    const total = await prisma.returnOrder.count({
        where: { merchantDetailsId: merchantDetails.id },
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
};

const getAllReturns = async (options: IOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

    try {
        const result = await prisma.returnOrder.findMany({
            include: {
                order: true,
                merchantDetails: {
                    include: {
                        user: true,
                        businessDetails: true
                    }
                },
                items: {
                    include: {
                        variant: {
                            include: {
                                pricing: true,
                                product: {
                                    include: {
                                        productImages: true
                                    }
                                }
                            }
                        },
                    },
                },
                images: true,
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        });

        const total = await prisma.returnOrder.count();

        return {
            meta: {
                total,
                page,
                limit,
            },
            data: result,
        };
    } catch (error) {
        console.error("BACKEND ERROR in getAllReturns:", error);
        throw error;
    }
};

export const ReturnService = {
    createReturn,
    updateReturnStatus,
    getMerchantReturns,
    getAllReturns,
};
