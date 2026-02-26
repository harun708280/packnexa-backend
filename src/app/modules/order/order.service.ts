import { OrderStatus, PrismaClient } from "@prisma/client";
import { prisma } from "../../shared/prisma";

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

    const [data, total] = await Promise.all([
        prisma.order.findMany({
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
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.order.count({ where }),
    ]);

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

    const [data, total] = await Promise.all([
        prisma.order.findMany({
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
                        },
                    },
                },
                merchantDetails: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        businessDetails: true,
                        personalDetails: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.order.count({ where }),
    ]);

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
    });

    if (!existingOrder) {
        throw new Error("Order not found");
    }



    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            status: payload.status,
            adminNote: payload.adminNote || existingOrder.adminNote,
        },
    });

    return updatedOrder;
};

const getSingleOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({
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

export const OrderService = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
};
