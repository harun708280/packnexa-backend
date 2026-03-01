import { PrismaClient } from "@prisma/client";
import AppError from "../../errorHelper/AppError";
import httpStatus from "http-status";

const prisma = new PrismaClient();

const syncWordPressOrder = async (merchantDetailsId: string, payload: any, existingLogId?: string) => {
    let externalLog;

    if (existingLogId) {
        externalLog = await prisma.externalOrderLog.findUnique({ where: { id: existingLogId } });
    }

    if (!externalLog) {
        // 1. Log the raw external order if it's new
        externalLog = await prisma.externalOrderLog.create({
            data: {
                merchantDetailsId,
                externalOrderId: String(payload.id),
                rawPayload: payload,
                status: "PENDING",
            },
        });
    }

    const items = payload.line_items || [];
    const matchedItems: any[] = [];
    const unmatchedItems: any[] = [];

    // 2. Try to match each item with a variant using merchantWebProductId
    for (const item of items) {
        const variant = await prisma.productVariant.findFirst({
            where: {
                merchantDetailsId,
                merchantWebProductId: String(item.variation_id || item.product_id),
            },
        });

        if (variant && variant.quantity >= item.quantity) {
            matchedItems.push({
                variant,
                quantity: item.quantity,
                price: Number(item.price),
            });
        } else {
            unmatchedItems.push(item);
        }
    }

    // 3. Logic: If ALL items match and have stock, create the real order
    if (unmatchedItems.length === 0 && matchedItems.length > 0) {
        // Create the official order in Packnexa
        const order = await prisma.$transaction(async (tx) => {
            const orderNumber = `WP-${payload.id}`;

            // Check if this order already exists to prevent P2002 error
            const existingOrder = await tx.order.findUnique({
                where: { orderNumber },
            });

            if (existingOrder) {
                return existingOrder;
            }

            const newOrder = await tx.order.create({
                data: {
                    merchantDetailsId,
                    orderNumber,
                    orderSource: "WORDPRESS",
                    status: "PENDING",
                    customerName: `${payload.billing?.first_name} ${payload.billing?.last_name}`,
                    customerPhone: payload.billing?.phone || "",
                    customerEmail: payload.billing?.email || "",
                    deliveryAddress: `${payload.shipping?.address_1}, ${payload.shipping?.city}`,
                    district: payload.shipping?.state || "Default",
                    area: payload.shipping?.city || "Default",
                    zipCode: payload.billing?.postcode || "",
                    totalPayable: Number(payload.total),
                    items: {
                        create: matchedItems.map((mi) => ({
                            variantId: mi.variant.id,
                            quantity: mi.quantity,
                            unitPrice: mi.price,
                            totalPrice: mi.price * mi.quantity,
                        })),
                    },
                },
            });

            // Update Stock
            for (const mi of matchedItems) {
                await tx.productVariant.update({
                    where: { id: mi.variant.id },
                    data: { quantity: { decrement: mi.quantity } },
                });
            }

            return newOrder;
        });

        // Update log status
        await prisma.externalOrderLog.update({
            where: { id: externalLog.id },
            data: { status: "COMPLETED" },
        });

        return { order, status: "COMPLETED" };
    } else {
        // Some items didn't match or insufficient stock
        await prisma.externalOrderLog.update({
            where: { id: externalLog.id },
            data: {
                status: "PARTIAL",
                errorMessage: unmatchedItems.length > 0
                    ? `Missing or insufficient stock for ${unmatchedItems.length} items.`
                    : "Partial match found."
            },
        });

        return { logId: externalLog.id, status: "PARTIAL_SYNC_REQUIRED" };
    }
};

const getExternalLogs = async (merchantDetailsId: string) => {
    return await prisma.externalOrderLog.findMany({
        where: { merchantDetailsId },
        orderBy: { createdAt: "desc" },
    });
};

const retrySync = async (merchantDetailsId: string, logId: string) => {
    const log = await prisma.externalOrderLog.findUnique({
        where: { id: logId, merchantDetailsId },
    });

    if (!log) {
        throw new AppError(httpStatus.NOT_FOUND, "External order log not found");
    }

    if (log.status === "COMPLETED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Order already synced");
    }

    return await syncWordPressOrder(merchantDetailsId, log.rawPayload, log.id);
};

export const ExternalOrderService = {
    syncWordPressOrder,
    getExternalLogs,
    retrySync,
};
