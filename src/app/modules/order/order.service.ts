import { OrderStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { SteadfastService } from "./steadfast-service";
import { FraudService } from "./fraud-service";
import { BillingService } from "../billing/billing.service";

const createOrder = async (userId: string, payload: any) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found. Only merchants can create orders.");
    }

    const { items, ...orderData } = payload;
    console.log("Creating order with payload:", JSON.stringify(payload, null, 2));

    const MAX_RETRIES = 5;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Local date handling for day boundaries and orderNumber
                const localNow = new Date();
                const year = localNow.getFullYear().toString().slice(-2);
                const month = (localNow.getMonth() + 1).toString().padStart(2, '0');
                const day = localNow.getDate().toString().padStart(2, '0');
                const dateStr = `${year}${month}${day}`;

                const startOfDay = new Date(new Date(localNow).setHours(0, 0, 0, 0));
                const endOfDay = new Date(new Date(localNow).setHours(23, 59, 59, 999));

                console.log(`[Attempt ${attempt + 1}] Date Details: localNow=${localNow.toLocaleString()}, dateStr=${dateStr}, start=${startOfDay.toISOString()}, end=${endOfDay.toISOString()}`);

                const lastOrderToday = await tx.order.findFirst({
                    where: {
                        createdAt: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                        orderNumber: {
                            startsWith: `PN-${dateStr}-`,
                        },
                    },
                    orderBy: {
                        orderNumber: "desc",
                    },
                });

                console.log(`[Attempt ${attempt + 1}] Last order found: ${lastOrderToday ? lastOrderToday.orderNumber : 'none'}`);

                let nextSequence = 1;
                if (lastOrderToday && lastOrderToday.orderNumber) {
                    const lastSeqParts = lastOrderToday.orderNumber.split("-");
                    if (lastSeqParts.length === 3) {
                        const lastSeq = parseInt(lastSeqParts[2], 10);
                        if (!isNaN(lastSeq)) {
                            nextSequence = lastSeq + 1;
                        }
                    }
                }

                const sequence = nextSequence.toString().padStart(4, "0");
                const orderNumber = `PN-${dateStr}-${sequence}`;

                console.log(`[Attempt ${attempt + 1}] Final generated: ${orderNumber}`);

                const trackingNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

                let subtotal = 0;
                for (const item of items) {
                    subtotal += item.quantity * item.unitPrice;
                }

                const deliveryCharge = orderData.deliveryCharge ?? 0;
                const discount = orderData.discount || 0;
                const totalPayable = subtotal + deliveryCharge - discount;

                const createdOrder = await tx.order.create({
                    data: {
                        ...orderData,
                        alternativePhone: orderData.alternativePhone || null,
                        orderNumber,
                        trackingNumber,
                        merchantDetailsId: merchantDetails.id,
                        subtotal,
                        deliveryCharge,
                        discount,
                        totalPayable,
                        status: OrderStatus.PENDING,
                        isPreBooking: !!orderData.preBookingDate || orderData.isPreBooking || false,
                        preBookingDate: orderData.preBookingDate ? new Date(orderData.preBookingDate) : null,
                    },
                });

                for (const item of items) {
                    const variant = await tx.productVariant.findUnique({
                        where: { id: item.variantId },
                    });

                    if (!variant) throw new Error(`Variant with ID ${item.variantId} not found`);

                    if (item.quantity > variant.quantity) {
                        throw new Error(`Insufficient stock for variant ${variant.variantName}. Available: ${variant.quantity}, Requested: ${item.quantity}`);
                    }

                    await tx.orderItem.create({
                        data: {
                            orderId: createdOrder.id,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.quantity * item.unitPrice,
                        },
                    });
                }

                return createdOrder;
            }, {
                isolationLevel: 'Serializable',
            });

            return result;
        } catch (error: any) {
            // Prisma error code for unique constraint violation
            if (error.code === 'P2002') {
                attempt++;
                const delay = Math.floor(Math.random() * 200) + 50; // 50-250ms random delay
                console.warn(`[Attempt ${attempt}] Unique constraint violation (likely orderNumber). Retrying in ${delay}ms... Details:`, error.meta);
                
                if (attempt >= MAX_RETRIES) {
                    console.error("Critical: Failed to generate a unique order number after all attempts.");
                    throw new Error("Failed to generate a unique order number after multiple attempts. Please try again.");
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("Order creation transaction failed:", error);
                throw error;
            }
        }
    }
};

const getMyOrders = async (userId: string, query: { page?: string; limit?: string; status?: string; searchTerm?: string } = {}) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }

    const { page = "1", limit = "10", status, searchTerm } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { AND: [{ merchantDetailsId: merchantDetails.id }] };
    if (status && status !== "ALL") {
        if (status === "PREBOOKING") {
            where.AND.push({
                OR: [
                    { isPreBooking: true },
                    { preBookingDate: { not: null } }
                ]
            });
        } else {
            where.AND.push({ status: status });
        }
    }

    if (searchTerm) {
        where.AND.push({
            OR: [
                { orderNumber: { contains: searchTerm, mode: "insensitive" } },
                { trackingNumber: { contains: searchTerm, mode: "insensitive" } },
                { customerName: { contains: searchTerm, mode: "insensitive" } },
                { customerPhone: { contains: searchTerm, mode: "insensitive" } },
            ]
        });
    }


    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.order.count({ where }),
    ]);

    if (orders.length === 0) {
        return { meta: { page: Number(page), limit: Number(limit), total }, data: [] };
    }

    const orderIds = orders.map(o => o.id);


    const items = await prisma.orderItem.findMany({
        where: { orderId: { in: orderIds } },
        include: {
            variant: {
                select: {
                    id: true,
                    variantName: true,
                    weightKg: true,
                    sku: true,
                    product: {
                        select: {
                            productName: true,
                            productImages: {
                                take: 1,
                                select: { imageUrl: true }
                            }
                        }
                    }
                }
            }
        }
    });


    const data = orders.map(order => ({
        ...order,
        items: items.filter(item => item.orderId === order.id),
        merchantDetails: merchantDetails
    }));

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
        },
        data,
    };
};

const getAllOrders = async (query: { page?: string; limit?: string; status?: string; searchTerm?: string; merchantId?: string } = {}) => {
    const { page = "1", limit = "10", status, searchTerm, merchantId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = { AND: [] };

    if (merchantId) {
        where.AND.push({ merchantDetailsId: merchantId });
    }

    if (status && status !== "ALL") {
        if (status === "PREBOOKING") {
            where.AND.push({
                OR: [
                    { isPreBooking: true },
                    { preBookingDate: { not: null } }
                ]
            });
        } else {
            where.AND.push({ status: status });
        }
    }

    if (searchTerm) {
        where.AND.push({
            OR: [
                { orderNumber: { contains: searchTerm, mode: "insensitive" } },
                { trackingNumber: { contains: searchTerm, mode: "insensitive" } },
                { customerName: { contains: searchTerm, mode: "insensitive" } },
                { customerPhone: { contains: searchTerm, mode: "insensitive" } },
            ]
        });
    }


    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.order.count({ where }),
    ]);

    if (orders.length === 0) {
        return { meta: { page: Number(page), limit: Number(limit), total }, data: [] };
    }

    const orderIds = orders.map(o => o.id);
    const merchantDetailsIds = [...new Set(orders.map(o => o.merchantDetailsId))];


    const [items, merchantDetails] = await Promise.all([
        prisma.orderItem.findMany({
            where: { orderId: { in: orderIds } },
            include: {
                variant: {
                    select: {
                        id: true,
                        variantName: true,
                        weightKg: true,
                        sku: true,
                        variantImage: true,
                    }
                }
            }
        }),
        prisma.merchantDetails.findMany({
            where: { id: { in: merchantDetailsIds } },
            select: {
                id: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        contactNumber: true,
                    },
                },
                businessDetails: {
                    select: {
                        businessName: true,
                        businessLogo: true,
                    }
                },
            },
        })
    ]);


    const data = orders.map(order => ({
        ...order,
        items: items.filter(item => item.orderId === order.id),
        merchantDetails: merchantDetails.find(m => m.id === order.merchantDetailsId)
    }));

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
        },
        data,
    };
};

const updateOrderStatus = async (orderId: string, payload: { status: OrderStatus; adminNote?: string }, isAutomated: boolean = false) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!existingOrder) {
        throw new Error("Order not found");
    }


    if (payload.status === OrderStatus.SHIPPED && existingOrder.status !== OrderStatus.PACKED) {
        throw new Error(`Invalid transition. Only PACKED orders can be marked as SHIPPED. Current status: ${existingOrder.status}`);
    }

    if (payload.status === OrderStatus.PACKED && existingOrder.status !== OrderStatus.APPROVED) {
        throw new Error(`Invalid transition. Order "${existingOrder.orderNumber}" must be APPROVED by Merchant before it can be marked as PACKED. Current status: ${existingOrder.status}`);
    }

    // CHECK: Balance + Credit Limit before confirming or packing/dispatching
    const needsFulfillmentCheck = 
        (payload.status === OrderStatus.APPROVED && existingOrder.status !== OrderStatus.APPROVED) || 
        (payload.status === OrderStatus.PACKED && existingOrder.status !== OrderStatus.PACKED);

    if (needsFulfillmentCheck) {
        await BillingService.checkMerchantFulfillmentAbility(existingOrder.merchantDetailsId);
    }

    if (payload.status === OrderStatus.APPROVED) {
        for (const item of existingOrder.items) {
            const variant = await prisma.productVariant.findUnique({
                where: { id: item.variantId },
                select: { quantity: true, variantName: true }
            });

            if (!variant || variant.quantity < item.quantity) {
                throw new Error(`Cannot Confirm Order. Insufficient stock for "${variant?.variantName || 'unknown item'}". Available: ${variant?.quantity || 0}, Requested: ${item.quantity}`);
            }
        }
    }


    if (payload.status === OrderStatus.CANCELLED && existingOrder.status === OrderStatus.SHIPPED) {
        throw new Error(`Order ${existingOrder.orderNumber} is already SHIPPED and cannot be cancelled. Please use RETURNED if the customer rejects it.`);
    }



    if (payload.status === (OrderStatus as any).HOLD) {
        if (!([OrderStatus.PENDING, OrderStatus.APPROVED] as OrderStatus[]).includes(existingOrder.status)) {
            throw new Error(`Order ${existingOrder.orderNumber} cannot be put on HOLD because it is already ${existingOrder.status}`);
        }
    }

    if (existingOrder.status === (OrderStatus as any).HOLD) {
        if (!([OrderStatus.APPROVED, OrderStatus.CANCELLED] as OrderStatus[]).includes(payload.status)) {
            throw new Error(`Order ${existingOrder.orderNumber} is on HOLD. You can only Confirm (Approve) or Cancel it.`);
        }
    }

    const isSteadfastOrder = existingOrder.preferredCourier?.toLowerCase().includes("steadfast") ||
        existingOrder.preferredCourier?.toLowerCase().includes("system automatic") ||
        !existingOrder.preferredCourier;

    if (isSteadfastOrder && existingOrder.trackingNumber && payload.status === OrderStatus.DELIVERED && !isAutomated) {
        throw new Error(`Manual status update to ${payload.status} is restricted for Steadfast orders. Status will sync automatically from the courier.`);
    }

    const result = await prisma.$transaction(async (tx) => {

        const dispatchedStatuses: OrderStatus[] = [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED];
        const wasDispatched = dispatchedStatuses.includes(existingOrder.status);
        const willBeDispatched = dispatchedStatuses.includes(payload.status);
        const willBeInactive = payload.status === OrderStatus.CANCELLED;


        if (!wasDispatched && willBeDispatched) {
            console.log(`[INVENTORY] Deducting stock for order ${existingOrder.orderNumber} as it moves to ${payload.status}`);
            for (const item of existingOrder.items) {
                const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
                if (!variant || variant.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for item "${variant?.variantName || item.variantId}". Available: ${variant?.quantity || 0}, Required: ${item.quantity}`);
                }
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        quantity: { decrement: item.quantity },
                        soldQuantity: { increment: item.quantity },
                    },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        variantId: item.variantId,
                        type: "SALE",
                        quantity: item.quantity,
                        note: `Stock deducted for Order ${existingOrder.orderNumber} (Dispatch: ${existingOrder.status} -> ${payload.status})`,
                    },
                });
            }
        }


        if (wasDispatched && willBeInactive) {
            console.log(`[INVENTORY] Restocking for order ${existingOrder.orderNumber} as it moves to ${payload.status}`);
            for (const item of existingOrder.items) {
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
                        note: `Stock restocked for Order ${existingOrder.orderNumber} (Restock: ${existingOrder.status} -> ${payload.status})`,
                    },
                });
            }
        }


        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: payload.status,
                adminNote: payload.adminNote || existingOrder.adminNote,
            },
        });


        if (payload.status === OrderStatus.RETURNED) {
            const existingReturn = await tx.returnOrder.findUnique({
                where: { orderId }
            });

            if (!existingReturn) {
                console.log(`[DEBUG] Auto-creating ReturnOrder for order ${existingOrder.orderNumber}`);
                await tx.returnOrder.create({
                    data: {
                        orderId,
                        merchantDetailsId: existingOrder.merchantDetailsId,
                        status: "PENDING",
                        reason: payload.adminNote || "Marked as returned by admin",
                        backToStock: false,
                        items: {
                            create: existingOrder.items.map(item => ({
                                variantId: item.variantId,
                                quantity: item.quantity,
                            }))
                        }
                    }
                });
            }
        }

        // Trigger Billing: Packing Charge when status becomes PACKED
        if (payload.status === OrderStatus.PACKED && existingOrder.status !== OrderStatus.PACKED) {
            console.log(`[BILLING] Processing packing charge for order ${existingOrder.orderNumber}`);
            await BillingService.chargePackingFee(orderId, tx);
        }

        return updatedOrder;
    });


    const isTargetingShipped = payload.status === OrderStatus.SHIPPED;
    const isSteadfastCourier =
        result.preferredCourier?.toLowerCase().includes("steadfast") ||
        result.preferredCourier?.toLowerCase().includes("system automatic") ||
        !result.preferredCourier;


    if (isTargetingShipped && isSteadfastCourier) {
        console.log(`[DEBUG] Triggering Steadfast API for order ${result.orderNumber}`);
        try {
            const merchantKeys = await prisma.merchantDetails.findUnique({
                where: { id: result.merchantDetailsId },
                select: { steadfastApiKey: true, steadfastSecretKey: true }
            });

            if (merchantKeys?.steadfastApiKey && merchantKeys?.steadfastSecretKey) {
                const steadfastResponse = await SteadfastService.createOrder(result, {
                    apiKey: merchantKeys.steadfastApiKey,
                    secretKey: merchantKeys.steadfastSecretKey
                });
                if (steadfastResponse && (steadfastResponse.status === 200 || steadfastResponse.status === 201) && steadfastResponse.consignment) {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            trackingNumber: steadfastResponse.consignment.tracking_code,
                            consignmentId: steadfastResponse.consignment.consignment_id.toString(),
                        },
                    });
                    console.log(`Order ${result.orderNumber} successfully sent to Steadfast. Tracking: ${steadfastResponse.consignment.tracking_code}, Consignment ID: ${steadfastResponse.consignment.consignment_id}`);
                } else {
                    console.warn(`Steadfast API returned error for order ${result.orderNumber}:`, steadfastResponse);
                }
            } else {
                console.warn(`[SKIP] Order ${result.orderNumber} not sent to Steadfast: Merchant has no API keys configured.`);
            }
        } catch (error) {
            console.error(`Failed to send order ${result.orderNumber} to Steadfast:`, error);
        }
    }


    return prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                            product: {
                                include: {
                                    productImages: true
                                }
                            }
                        }
                    }
                }
            },
            merchantDetails: {
                include: {
                    user: true,
                    businessDetails: true
                }
            }
        }
    });
};

const getSingleOrder = async (userId: string, role: string, orderId: string) => {
    const isMerchant = role === "MERCHANT";
    const where: any = { id: orderId };

    if (isMerchant) {
        const merchantDetails = await prisma.merchantDetails.findUnique({
            where: { userId },
        });

        if (!merchantDetails) {
            throw new Error("Merchant details not found");
        }
        where.merchantDetailsId = merchantDetails.id;
    }

    const order = await prisma.order.findFirst({
        where,
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                            product: {
                                include: {
                                    productImages: true
                                }
                            }
                        }
                    }
                }
            },
            merchantDetails: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            contactNumber: true,
                        },
                    },
                    businessDetails: true,
                    personalDetails: true,
                },
            },
        }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    return order;
};

const updateOrder = async (userId: string, orderId: string, payload: any) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found.");
    }

    const existingOrder = await prisma.order.findFirst({
        where: { id: orderId, merchantDetailsId: merchantDetails.id },
        include: { items: true },
    });

    if (!existingOrder) {
        throw new Error("Order not found or access denied.");
    }

    if (existingOrder.status !== "PENDING") {
        throw new Error("Only PENDING orders can be edited.");
    }

    const { items, ...orderData } = payload;

    const result = await prisma.$transaction(async (tx) => {

        await tx.orderItem.deleteMany({ where: { orderId } });

        let subtotal = 0;
        for (const item of items) {
            subtotal += item.quantity * item.unitPrice;
        }
        const deliveryCharge = orderData.deliveryCharge ?? existingOrder.deliveryCharge;
        const discount = orderData.discount ?? existingOrder.discount;
        const totalPayable = subtotal + deliveryCharge - discount;

        for (const item of items) {
            const variant = await tx.productVariant.findUnique({
                where: { id: item.variantId },
            });
            if (!variant) throw new Error(`Variant ${item.variantId} not found.`);
            if (variant.quantity < item.quantity) {
                throw new Error(`Insufficient stock for "${variant.variantName}". Available: ${variant.quantity}, Requested: ${item.quantity}`);
            }
            await tx.orderItem.create({
                data: {
                    orderId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                },
            });
        }


        return tx.order.update({
            where: { id: orderId },
            data: {
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                alternativePhone: orderData.alternativePhone || null,
                customerEmail: orderData.customerEmail || null,
                orderSource: orderData.orderSource,
                deliveryAddress: orderData.deliveryAddress,
                district: orderData.district,
                area: orderData.area,
                zipCode: orderData.zipCode || null,
                isPreBooking: orderData.isPreBooking ?? (!!orderData.preBookingDate || existingOrder.isPreBooking),
                preBookingDate: orderData.preBookingDate ? new Date(orderData.preBookingDate) : null,
                paymentMethod: orderData.paymentMethod,
                preferredCourier: orderData.preferredCourier || null,
                merchantNote: orderData.merchantNote || null,
                deliveryCharge,
                discount,
                subtotal,
                totalPayable,
            },
            include: { items: true },
        });
    });

    return result;
};

const deleteOrder = async (orderId: string) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderNumber: true, consignmentId: true, trackingNumber: true }
    });

    if (existingOrder && (existingOrder.consignmentId || (existingOrder.trackingNumber && !existingOrder.trackingNumber.startsWith('PN-')))) {
        throw new Error(`Order ${existingOrder.orderNumber} cannot be deleted because it has already been sent to the courier (Steadfast).`);
    }

    return await prisma.$transaction(async (tx) => {

        await tx.returnOrder.deleteMany({
            where: { orderId: orderId }
        });

        const result = await tx.order.delete({
            where: { id: orderId }
        });
        return result;
    });
};

const bulkUpdateOrderStatus = async (payload: { orderIds: string[]; status: OrderStatus; adminNote?: string }) => {
    const { orderIds, status, adminNote } = payload;

    const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { items: true }
    });

    if (orders.length === 0) {
        throw new Error("No valid orders found for update");
    }

    const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[]
    };

    let validOrders = orders;
    console.log(`[DEBUG] Bulk update ${orderIds.length} orders to ${status}. Pre-filtering...`);

    if (status === OrderStatus.SHIPPED) {
        validOrders = orders.filter(o => o.status === OrderStatus.PACKED);
    } else if (status === OrderStatus.PACKED) {

        validOrders = orders.filter(o => o.status === OrderStatus.APPROVED);
    } else if (status === (OrderStatus as any).HOLD) {

        validOrders = orders.filter(o => ([OrderStatus.PENDING, OrderStatus.APPROVED] as OrderStatus[]).includes(o.status));
    } else if (status === OrderStatus.APPROVED) {

        validOrders = orders.filter(o => ([OrderStatus.PENDING, (OrderStatus as any).HOLD] as OrderStatus[]).includes(o.status));
    } else if (status === OrderStatus.CANCELLED) {

        validOrders = orders.filter(o => !([OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.RETURNED] as OrderStatus[]).includes(o.status));
    } else if (status === OrderStatus.RETURNED) {

        validOrders = orders.filter(o => ([OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.PACKED] as OrderStatus[]).includes(o.status));
    }

    results.skipped = orders.length - validOrders.length;

    // Separate orders by courier
    const steadfastOrders = validOrders.filter(o =>
        (status === OrderStatus.SHIPPED) &&
        (o.preferredCourier?.toLowerCase().includes("steadfast") || !o.preferredCourier || o.preferredCourier.toLowerCase().includes("system automatic"))
    );
    const otherOrders = validOrders.filter(o => !steadfastOrders.includes(o));

    // Handle Steadfast batch if any
    if (steadfastOrders.length > 0) {
        console.log(`[DEBUG] Triggering Steadfast BULK API for ${steadfastOrders.length} orders`);
        // We'll process them one by one for now to keep the same updateOrderStatus logic which has inventory etc.
        // OR we can do a proper bulk call. Let's try bulk call for Steadfast as requested.

        // Group by merchant since each merchant has different API keys
        const merchantGrouped = new Map<string, typeof steadfastOrders>();
        for (const o of steadfastOrders) {
            const mId = o.merchantDetailsId;
            if (!merchantGrouped.has(mId)) merchantGrouped.set(mId, []);
            merchantGrouped.get(mId)!.push(o);
        }

        for (const [merchantId, mOrders] of merchantGrouped.entries()) {
            try {
                const merchantKeys = await prisma.merchantDetails.findUnique({
                    where: { id: merchantId },
                    select: { steadfastApiKey: true, steadfastSecretKey: true }
                });

                if (merchantKeys?.steadfastApiKey && merchantKeys?.steadfastSecretKey) {
                    const bulkResponse = await SteadfastService.bulkCreate(mOrders, {
                        apiKey: merchantKeys.steadfastApiKey,
                        secretKey: merchantKeys.steadfastSecretKey
                    });

                    if (bulkResponse && Array.isArray(bulkResponse)) {
                        for (const order of mOrders) {
                            const res = bulkResponse.find(r => r.invoice === order.orderNumber);
                            if (res && res.status === 'success') {
                                try {
                                    // Update each order using the single status update logic to handle inventory and status
                                    await updateOrderStatus(order.id, { status, adminNote }, false);

                                    // Specifically update the IDs from Steadfast
                                    await prisma.order.update({
                                        where: { id: order.id },
                                        data: {
                                            trackingNumber: res.tracking_code,
                                            consignmentId: res.consignment_id.toString()
                                        }
                                    });
                                    results.success++;
                                } catch (err: any) {
                                    results.failed++;
                                    results.errors.push(`Order ${order.orderNumber}: ${err.message}`);
                                }
                            } else {
                                results.failed++;
                                results.errors.push(`Order ${order.orderNumber}: Steadfast failed - ${res?.status || 'Unknown error'}`);
                            }
                        }
                    } else {
                        // If bulk fails, try individually or fail all
                        results.failed += mOrders.length;
                        results.errors.push(`Bulk request failed for merchant ${merchantId}`);
                    }
                } else {
                    results.failed += mOrders.length;
                    results.errors.push(`Merchant ${merchantId} has no Steadfast keys`);
                }
            } catch (error: any) {
                results.failed += mOrders.length;
                results.errors.push(`Fatal error in bulk dispatch: ${error.message}`);
            }
        }
    }

    // Handle other orders individually
    for (const order of otherOrders) {
        try {
            console.log(`[DEBUG] Bulk processing order ${order.orderNumber} to ${status}`);
            await updateOrderStatus(order.id, { status, adminNote }, false);
            results.success++;
        } catch (error: any) {
            console.error(`[DEBUG] Bulk process failed for ${order.orderNumber}: ${error.message}`);
            results.failed++;
            results.errors.push(`Order ${order.orderNumber}: ${error.message}`);
        }
    }

    return results;
};

const bulkDeleteOrders = async (orderIds: string[]) => {
    return await prisma.$transaction(async (tx) => {

        await tx.returnOrder.deleteMany({
            where: { orderId: { in: orderIds } }
        });


        const result = await tx.order.deleteMany({
            where: { id: { in: orderIds } }
        });
        return result;
    });
};

const getOrderStats = async (user: { userId: string; role: string }, merchantId?: string) => {
    let targetMerchantId = merchantId;

    if (user.role === "MERCHANT") {
        const merchantDetails = await prisma.merchantDetails.findUnique({
            where: { userId: user.userId },
        });
        if (!merchantDetails) throw new Error("Merchant not found");
        targetMerchantId = merchantDetails.id;
    }

    if (!targetMerchantId) {
        throw new Error("Merchant ID is required for statistics");
    }

    const [sourceStatsRaw, statusStatsRaw, externalLogCount, preBookingCount] = await Promise.all([
        prisma.order.groupBy({
            by: ["orderSource"],
            where: { merchantDetailsId: targetMerchantId },
            _count: { id: true },
        }),
        prisma.order.groupBy({
            by: ["status"],
            where: { merchantDetailsId: targetMerchantId },
            _count: { id: true },
        }),
        prisma.externalOrderLog.count({
            where: {
                merchantDetailsId: targetMerchantId,
                status: { not: "COMPLETED" },
            },
        }),
        prisma.order.count({
            where: {
                merchantDetailsId: targetMerchantId,
                OR: [
                    { isPreBooking: true },
                    { preBookingDate: { not: null } }
                ]
            },
        }),
    ]);

    const statusStats: Record<string, number> = {};
    statusStatsRaw.forEach((curr: any) => {
        statusStats[curr.status] = curr._count.id;
    });

    // Manually add PREBOOKING to the status stats for the UI tabs
    statusStats.PREBOOKING = preBookingCount;

    const sourceStats: Record<string, number> = {};
    sourceStatsRaw.forEach((curr: any) => {
        sourceStats[curr.orderSource] = curr._count.id;
    });

    return {
        sourceStats,
        statusStats,
        externalLogCount,
        preBookingCount,
    };
};

const trackSteadfastOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (!order.preferredCourier?.toLowerCase().includes("steadfast")) {
        return { message: "This order is not associated with Steadfast Courier" };
    }

    const merchantKeys = await prisma.merchantDetails.findUnique({
        where: { id: order.merchantDetailsId },
        select: { steadfastApiKey: true, steadfastSecretKey: true }
    });

    const steadfastResult = await SteadfastService.trackOrder(order.orderNumber, {
        apiKey: merchantKeys?.steadfastApiKey,
        secretKey: merchantKeys?.steadfastSecretKey
    });

    if (steadfastResult && steadfastResult.status === 200 && steadfastResult.delivery_status) {
        const sStatus = steadfastResult.delivery_status.toLowerCase();
        let newStatus: OrderStatus | null = null;

        if (sStatus.includes("delivered")) {
            newStatus = OrderStatus.DELIVERED;
        } else if (sStatus.includes("cancelled") || sStatus.includes("return")) {
            newStatus = OrderStatus.RETURNED;
        }

        if (newStatus && newStatus !== order.status) {
            console.log(`[SYNC] Updating order ${order.orderNumber} status from ${order.status} to ${newStatus} based on Steadfast track response.`);
            await updateOrderStatus(orderId, { status: newStatus, adminNote: `Auto-synced from Steadfast: ${steadfastResult.delivery_status}` }, true);
        }
    }

    return steadfastResult;
};


const getMerchantCustomers = async (userId: string, query: { searchTerm?: string; page?: string; limit?: string } = {}) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }

    const { searchTerm, page = "1", limit = "10" } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);


    const where: any = { merchantDetailsId: merchantDetails.id };
    if (searchTerm) {
        where.OR = [
            { customerName: { contains: searchTerm, mode: "insensitive" } },
            { customerEmail: { contains: searchTerm, mode: "insensitive" } },
            { customerPhone: { contains: searchTerm, mode: "insensitive" } },
        ];
    }


    const allOrders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    const customerMap = new Map<string, any>();

    allOrders.forEach(order => {
        const identifier = order.customerEmail || order.customerPhone;
        if (!customerMap.has(identifier)) {
            customerMap.set(identifier, {
                name: order.customerName,
                email: order.customerEmail,
                phone: order.customerPhone,
                city: order.district,
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: order.createdAt
            });
        }

        const current = customerMap.get(identifier);
        current.totalOrders += 1;
        current.totalSpent += order.totalPayable;
    });

    const customers = Array.from(customerMap.values());
    const total = customers.length;
    const paginatedCustomers = customers.slice(skip, skip + take);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
        },
        data: paginatedCustomers,
    };
};

const getCustomerDetails = async (userId: string, identifier: string) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }


    const isEmail = identifier.includes("@");

    const orders = await prisma.order.findMany({
        where: {
            merchantDetailsId: merchantDetails.id,
            OR: [
                { customerEmail: identifier },
                { customerPhone: identifier },
            ],
        },
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                            product: {
                                include: {
                                    productImages: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
        throw new Error("Customer not found");
    }

    const firstOrder = orders[0];
    const totalSpent = orders.reduce((sum, o) => sum + o.totalPayable, 0);

    return {
        info: {
            name: firstOrder.customerName,
            email: firstOrder.customerEmail,
            mobile: firstOrder.customerPhone,
            address: {
                line1: firstOrder.deliveryAddress,
                line2: firstOrder.area,
                city: firstOrder.district,
                zip: firstOrder.zipCode || "",
            }
        },
        orders: orders.map(o => ({
            id: o.id,
            orderId: o.orderNumber,
            orderDate: o.createdAt,
            status: o.status.toLowerCase(),
            totalAmount: o.totalPayable,
            items: o.items
        })),
        stats: {
            totalOrders: orders.length,
            totalSpent,
            avgOrderValue: totalSpent / orders.length,
            lastOrderDate: firstOrder.createdAt
        }
    };
};

const syncAllSteadfastOrders = async () => {
    console.log(`[JOB] Starting Steadfast status sync at ${new Date().toLocaleString()}`);

    try {
        const shippedOrders = await prisma.order.findMany({
            where: {
                status: OrderStatus.SHIPPED,
                OR: [
                    { preferredCourier: { contains: "steadfast", mode: "insensitive" } },
                    { preferredCourier: null },
                    { preferredCourier: "" },
                    { preferredCourier: { contains: "system automatic", mode: "insensitive" } }
                ],
                trackingNumber: { not: null }
            },
            select: { id: true, orderNumber: true }
        });

        console.log(`[JOB] Found ${shippedOrders.length} shipped orders for sync.`);

        for (const order of shippedOrders) {
            try {
                await trackSteadfastOrder(order.id);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`[JOB-ERROR] Failed to sync order ${order.orderNumber}:`, error);
            }
        }

        console.log(`[JOB] Steadfast status sync completed.`);
    } catch (error) {
        console.error(`[JOB-ERROR] Fatal error during Steadfast sync job:`, error);
    }
};

const checkCustomerFraud = async (phone: string) => {
    return await FraudService.checkExternalFraud(phone);
};

export const OrderService = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    getOrderStats,
    trackSteadfastOrder,
    syncAllSteadfastOrders,
    getMerchantCustomers,
    getCustomerDetails,
    bulkUpdateOrderStatus,
    bulkDeleteOrders,
    checkCustomerFraud
};
