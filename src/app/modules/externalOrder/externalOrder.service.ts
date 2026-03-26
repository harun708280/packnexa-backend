import { PrismaClient } from "@prisma/client";
import AppError from "../../errorHelper/AppError";
import httpStatus from "http-status";

const prisma = new PrismaClient();

const sanitizePhoneNumber = (phone: string): string => {
    const cleaned = (phone || "").replace(/[^0-9]/g, "");
    if (cleaned.length >= 11) {
        return cleaned.slice(-11);
    }
    return cleaned;
};

const mapLocationData = (payload: any) => {
    const district = payload.shipping?.state || payload.billing?.state || "Dhaka";
    const area = payload.shipping?.city || payload.billing?.city || "Default";

    return {
        district: district === "Dhaka" ? "Dhaka City" : district,
        area: area
    };
};

const syncWordPressOrder = async (merchantDetailsId: string, payload: any, existingLogId?: string) => {
    let externalLog;

    if (existingLogId) {
        externalLog = await prisma.externalOrderLog.findUnique({ where: { id: existingLogId } });
    }

    if (!externalLog) {

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


    console.log(`[SYNC-DEBUG] Syncing order ${payload.id} for merchant ${merchantDetailsId}. Items: ${items.length}`);

    for (const item of items) {
        const matchId = String(item.variation_id || item.product_id);
        const variant = await prisma.productVariant.findFirst({
            where: {
                merchantDetailsId,
                merchantWebProductId: matchId,
            },
        });

        if (variant) {
            console.log(`[SYNC-DEBUG] Item ${item.name} matched with variant ${variant.variantName} (SKU: ${variant.sku}). Stock: ${variant.quantity}/${item.quantity}`);
            if (variant.quantity >= item.quantity) {
                matchedItems.push({
                    variant,
                    quantity: item.quantity,
                    price: Number(item.price),
                });
            } else {
                console.warn(`[SYNC-DEBUG] Item ${item.name} has insufficient stock. Required: ${item.quantity}, Available: ${variant.quantity}`);
                unmatchedItems.push(item);
            }
        } else {
            console.warn(`[SYNC-DEBUG] Item ${item.name} (WebID: ${matchId}) could not be matched with any variant for merchant ${merchantDetailsId}`);
            unmatchedItems.push(item);
        }
    }


    if (unmatchedItems.length === 0 && matchedItems.length > 0) {
        console.log(`[SYNC-DEBUG] All items matched. Entering transaction for order ${payload.id}`);

        const resultOrder = await prisma.$transaction(async (tx) => {
            const orderNumber = `WP-${payload.id}`;

            const existingOrder = await tx.order.findUnique({
                where: { orderNumber },
            });

            if (existingOrder) {
                console.log(`[SYNC-DEBUG] Order ${orderNumber} already exists. Skipping creation.`);
                return existingOrder;
            }

            const { district, area } = mapLocationData(payload);
            const customerPhone = sanitizePhoneNumber(payload.billing?.phone || "");


            const trackingNumber = Math.floor(10000000 + Math.random() * 90000000).toString();


            const wpMethod = (payload.payment_method || "").toLowerCase();
            const wpMethodTitle = payload.payment_method_title || "";
            const paymentMethod = wpMethod === "cod" || wpMethod.includes("cash") || wpMethodTitle.toLowerCase().includes("cash") ? "COD" : (wpMethodTitle || "Pre-paid");

            console.log(`[SYNC-DEBUG] Order ${payload.id} Payment Info - Method: ${wpMethod}, Title: ${wpMethodTitle}, Total: ${payload.total}`);
            console.log(`[SYNC-DEBUG] Mapped Payment Method: ${paymentMethod}`);

            const newOrder = await tx.order.create({
                data: {
                    merchantDetailsId,
                    orderNumber,
                    trackingNumber,
                    orderSource: "WORDPRESS",
                    status: "PENDING",
                    customerName: `${payload.billing?.first_name} ${payload.billing?.last_name}`,
                    customerPhone,
                    customerEmail: payload.billing?.email || "",
                    deliveryAddress: `${payload.shipping?.address_1 || payload.billing?.address_1}, ${area}`,
                    district,
                    area,
                    paymentMethod,
                    preferredCourier: "Steadfast",
                    merchantNote: payload.customer_note || null,
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


            console.log(`[SYNC-DEBUG] Order ${orderNumber} created successfully in database (PENDING).`);
            return newOrder;
        });


        await prisma.externalOrderLog.update({
            where: { id: externalLog.id },
            data: { status: "COMPLETED" },
        });

        return { order: resultOrder, status: "COMPLETED" };
    } else {
        console.warn(`[SYNC-DEBUG] Sync failed for order ${payload.id}. Unmatched items: ${unmatchedItems.length}`);

        await prisma.externalOrderLog.update({
            where: { id: externalLog.id },
            data: {
                status: "PARTIAL",
                errorMessage: unmatchedItems.length > 0
                    ? `Missing or insufficient stock for ${unmatchedItems.length} items.`
                    : "Partial match found or insufficient stock."
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
    const log = await prisma.externalOrderLog.findFirst({
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
