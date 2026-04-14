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

    const merchantVariants = await prisma.productVariant.findMany({
        where: { merchantDetailsId }
    });

    for (const item of items) {
        const rawMatchId = String(item.variation_id || item.product_id || "");
        const matchId = rawMatchId.trim();

        console.log(`[SYNC-DEBUG] Attempting to match item: "${item.name}" (WebID: "${matchId}")`);

        if (!matchId || matchId === "0") {
            console.warn(`[SYNC-DEBUG] Item "${item.name}" has no valid variation_id or product_id. Skipping match.`);
            unmatchedItems.push({ item, reason: "Missing Product ID from WordPress" });
            continue;
        }

        const variant = merchantVariants.find(v =>
            v.merchantWebProductId && v.merchantWebProductId.trim() === matchId
        );

        if (variant) {
            console.log(`[SYNC-DEBUG] Match Found: "${item.name}" -> Packnexa: "${variant.variantName}" (SKU: ${variant.sku}). Stock: ${variant.quantity}, Requested: ${item.quantity}`);
            if (variant.quantity >= item.quantity) {
                matchedItems.push({
                    variant,
                    quantity: item.quantity,
                    price: Number(item.price),
                });
            } else {
                console.warn(`[SYNC-DEBUG] Insufficient stock for "${item.name}". Available: ${variant.quantity}, Requested: ${item.quantity}`);
                unmatchedItems.push({
                    item,
                    reason: `Insufficient stock for "${item.name}". Available: ${variant.quantity}, Requested: ${item.quantity}`
                });
            }
        } else {
            console.warn(`[SYNC-DEBUG] No match found in Packnexa for WebID: "${matchId}" (Item: "${item.name}")`);
            unmatchedItems.push({
                item,
                reason: `Product with ID "${matchId}" ("${item.name}") not found in Packnexa.`
            });
        }
    }


    if (unmatchedItems.length === 0 && matchedItems.length > 0) {
        console.log(`[SYNC-DEBUG] All items matched successfully for order ${payload.id}. Entering transaction.`);

        const resultOrder = await prisma.$transaction(async (tx) => {
            const orderNumber = `PN-WP-${payload.id}`;

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
        const errorDetails = unmatchedItems.map(ui => ui.reason).join(" | ");
        console.warn(`[SYNC-DEBUG] Sync failed for order ${payload.id}. Errors: ${errorDetails}`);

        await prisma.externalOrderLog.update({
            where: { id: externalLog.id },
            data: {
                status: "PARTIAL",
                errorMessage: errorDetails || "Partial match found or insufficient stock."
            },
        });

        return { logId: externalLog.id, status: "PARTIAL_SYNC_REQUIRED", message: errorDetails };
    }
};

const getExternalLogs = async (merchantDetailsId: string) => {
    return await prisma.externalOrderLog.findMany({
        where: {
            merchantDetailsId,
            status: { not: "COMPLETED" }
        },
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
