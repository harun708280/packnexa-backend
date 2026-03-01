import { OrderStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { SteadfastService } from "./steadfast.service";

const createOrder = async (userId: string, payload: any) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found. Only merchants can create orders.");
    }

    const { items, ...orderData } = payload;
    console.log("Creating order with payload:", JSON.stringify(payload, null, 2));

    const result = await prisma.$transaction(async (tx) => {

        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");


        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

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


        const trackingNumber = Math.floor(10000000 + Math.random() * 90000000).toString();


        let subtotal = 0;
        for (const item of items) {
            subtotal += item.quantity * item.unitPrice;
        }

        const deliveryCharge = orderData.deliveryCharge || 60;
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
                preBookingDate: orderData.preBookingDate ? new Date(orderData.preBookingDate) : null,
            },
        });


        for (const item of items) {
            const variant = await tx.productVariant.findUnique({
                where: { id: item.variantId },
            });

            if (!variant) {
                throw new Error(`Variant with ID ${item.variantId} not found`);
            }

            if (item.quantity > variant.quantity) {
                throw new Error(`Insufficient stock for variant ${variant.variantName}. Available: ${variant.quantity}, Requested: ${item.quantity}`);
            }

            const finalQuantity = item.quantity;

            await tx.orderItem.create({
                data: {
                    orderId: createdOrder.id,
                    variantId: item.variantId,
                    quantity: finalQuantity,
                    unitPrice: item.unitPrice,
                    totalPrice: finalQuantity * item.unitPrice,
                },
            });

            await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                    quantity: variant.quantity - finalQuantity,
                    soldQuantity: variant.soldQuantity + finalQuantity,
                },
            });


            await tx.inventoryTransaction.create({
                data: {
                    variantId: item.variantId,
                    type: "SALE",
                    quantity: finalQuantity,
                    note: `Sold via Order ${orderNumber} (Requested: ${item.quantity}, Fulfilled: ${finalQuantity})`,
                },
            });
        }

        return createdOrder;
    });

    return result;
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

    const where: any = { merchantDetailsId: merchantDetails.id };
    if (status && status !== "ALL") {
        where.status = status;
    }

    if (searchTerm) {
        where.OR = [
            { orderNumber: { contains: searchTerm, mode: "insensitive" } },
            { trackingNumber: { contains: searchTerm, mode: "insensitive" } },
            { customerName: { contains: searchTerm, mode: "insensitive" } },
            { customerPhone: { contains: searchTerm, mode: "insensitive" } },
        ];
    }

    // 1. Fetch base orders
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

    // 2. Fetch related data in parallel batches
    const items = await prisma.orderItem.findMany({
        where: { orderId: { in: orderIds } },
        include: {
            variant: {
                select: {
                    id: true,
                    variantName: true,
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

    // 3. Assemble the data in-memory
    const data = orders.map(order => ({
        ...order,
        items: items.filter(item => item.orderId === order.id)
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

const getAllOrders = async (query: { page?: string; limit?: string; status?: string; searchTerm?: string } = {}) => {
    const { page = "1", limit = "10", status, searchTerm } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (status && status !== "ALL") {
        where.status = status;
    }

    if (searchTerm) {
        where.OR = [
            { orderNumber: { contains: searchTerm, mode: "insensitive" } },
            { trackingNumber: { contains: searchTerm, mode: "insensitive" } },
            { customerName: { contains: searchTerm, mode: "insensitive" } },
            { customerPhone: { contains: searchTerm, mode: "insensitive" } },
        ];
    }

    // 1. Fetch base orders
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

    // 2. Fetch related data in parallel batches
    const [items, merchantDetails] = await Promise.all([
        prisma.orderItem.findMany({
            where: { orderId: { in: orderIds } },
            include: {
                variant: {
                    select: {
                        id: true,
                        variantName: true,
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

    // 3. Assemble the data in-memory
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

const updateOrderStatus = async (orderId: string, payload: { status: OrderStatus; adminNote?: string }) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!existingOrder) {
        throw new Error("Order not found");
    }

    // Role/Transition Guards
    if (payload.status === OrderStatus.SHIPPED && existingOrder.status !== OrderStatus.PACKED) {
        throw new Error(`Invalid transition. Only PACKED orders can be marked as SHIPPED. Current status: ${existingOrder.status}`);
    }

    // Prevent manual DELIVERED/RETURNED for Steadfast orders
    const isSteadfastOrder = existingOrder.preferredCourier?.toLowerCase().includes("steadfast") ||
        existingOrder.preferredCourier?.toLowerCase().includes("system automatic") ||
        !existingOrder.preferredCourier;

    if (isSteadfastOrder && existingOrder.trackingNumber && ([OrderStatus.DELIVERED, OrderStatus.RETURNED] as OrderStatus[]).includes(payload.status)) {
        throw new Error(`Manual status update to ${payload.status} is restricted for Steadfast orders. Status will sync automatically from the courier.`);
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Handle Inventory Restocking for CANCELLED or RETURNED
        const isCurrentlyActive = !['CANCELLED', 'RETURNED'].includes(existingOrder.status);
        const willBeInactive = ['CANCELLED', 'RETURNED'].includes(payload.status as any);

        if (isCurrentlyActive && willBeInactive) {
            console.log(`[DEBUG] Restocking inventory for order ${existingOrder.orderNumber} as it moves to ${payload.status}`);
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
                        note: `Stock returned from Order ${existingOrder.orderNumber} (Transition: ${existingOrder.status} -> ${payload.status})`,
                    },
                });
            }
        }

        // 2. Handle Inventory Deduction if moving OUT of CANCELLED/RETURNED
        if (!isCurrentlyActive && !willBeInactive) {
            console.log(`[DEBUG] Deducting inventory for order ${existingOrder.orderNumber} as it moves back to active status: ${payload.status}`);
            for (const item of existingOrder.items) {
                const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
                if (!variant || variant.quantity < item.quantity) {
                    throw new Error(`Insufficient stock to re-activate order for item ${item.variantId}`);
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
                        note: `Stock deducted again for Order ${existingOrder.orderNumber} (Re-activated to ${payload.status})`,
                    },
                });
            }
        }

        // 3. Update the Order
        return tx.order.update({
            where: { id: orderId },
            data: {
                status: payload.status,
                adminNote: payload.adminNote || existingOrder.adminNote,
            },
        });
    });

    // 4. Handle External Integrations (Steadfast)
    const isTargetingShipped = payload.status === OrderStatus.SHIPPED;
    const isSteadfastCourier =
        result.preferredCourier?.toLowerCase().includes("steadfast") ||
        result.preferredCourier?.toLowerCase().includes("system automatic") ||
        !result.preferredCourier; // Default to Steadfast if not set

    console.log(`[DEBUG] Steadfast Trigger Check for ${result.orderNumber}: isTargetingShipped=${isTargetingShipped}, isSteadfastCourier=${isSteadfastCourier}, preferredCourier="${result.preferredCourier}"`);

    if (isTargetingShipped && isSteadfastCourier) {
        console.log(`[DEBUG] Triggering Steadfast API for order ${result.orderNumber}`);
        try {
            const steadfastResponse = await SteadfastService.createOrder(result);
            if (steadfastResponse && (steadfastResponse.status === 200 || steadfastResponse.status === 201) && steadfastResponse.consignment) {
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        trackingNumber: steadfastResponse.consignment.tracking_code,
                    },
                });
                console.log(`Order ${result.orderNumber} successfully sent to Steadfast. Tracking: ${steadfastResponse.consignment.tracking_code}`);
            } else {
                console.warn(`Steadfast API returned error for order ${result.orderNumber}:`, steadfastResponse);
            }
        } catch (error) {
            console.error(`Failed to send order ${result.orderNumber} to Steadfast:`, error);
        }
    }

    // 5. Return the final updated order (re-fetch to get trackingNumber and other updates)
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

const getSingleOrder = async (userId: string, orderId: string) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId, merchantDetailsId: merchantDetails.id },
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

        for (const oldItem of existingOrder.items) {
            await tx.productVariant.update({
                where: { id: oldItem.variantId },
                data: {
                    quantity: { increment: oldItem.quantity },
                    soldQuantity: { decrement: oldItem.quantity },
                },
            });
        }


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
                    note: `Sold via edited Order ${existingOrder.orderNumber}`,
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
                isPreBooking: orderData.isPreBooking,
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
    const result = await prisma.order.delete({
        where: { id: orderId }
    });
    return result;
};

const getOrderStats = async (userId: string) => {
    const merchantDetails = await prisma.merchantDetails.findUnique({
        where: { userId },
    });

    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }

    const [sourceStats, statusStats, externalLogCount] = await Promise.all([
        prisma.order.groupBy({
            by: ["orderSource"],
            where: { merchantDetailsId: merchantDetails.id },
            _count: true,
        }),
        prisma.order.groupBy({
            by: ["status"],
            where: { merchantDetailsId: merchantDetails.id },
            _count: true,
        }),
        prisma.externalOrderLog.count({
            where: {
                merchantDetailsId: merchantDetails.id,
                status: { not: "COMPLETED" },
            },
        }),
    ]);

    return {
        sourceStats: sourceStats.reduce((acc: any, curr) => {
            acc[curr.orderSource] = curr._count;
            return acc;
        }, {}),
        statusStats: statusStats.reduce((acc: any, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {}),
        externalLogCount,
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

    const steadfastResult = await SteadfastService.trackOrder(order.orderNumber);

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
            await updateOrderStatus(orderId, { status: newStatus, adminNote: `Auto-synced from Steadfast: ${steadfastResult.delivery_status}` });
        }
    }

    return steadfastResult;
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
};
