"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../shared/prisma");
const createOrder = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found. Only merchants can create orders.");
    }
    const { items } = payload, orderData = __rest(payload, ["items"]);
    console.log("Creating order with payload:", JSON.stringify(payload, null, 2));
    const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
        const lastOrderToday = yield tx.order.findFirst({
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
        const createdOrder = yield tx.order.create({
            data: Object.assign(Object.assign({}, orderData), { orderNumber,
                trackingNumber, merchantDetailsId: merchantDetails.id, subtotal,
                deliveryCharge,
                discount,
                totalPayable, status: client_1.OrderStatus.PENDING, preBookingDate: orderData.preBookingDate ? new Date(orderData.preBookingDate) : null }),
        });
        for (const item of items) {
            const variant = yield tx.productVariant.findUnique({
                where: { id: item.variantId },
            });
            if (!variant) {
                throw new Error(`Variant with ID ${item.variantId} not found`);
            }
            if (item.quantity > variant.quantity) {
                throw new Error(`Insufficient stock for variant ${variant.variantName}. Available: ${variant.quantity}, Requested: ${item.quantity}`);
            }
            const finalQuantity = item.quantity;
            yield tx.orderItem.create({
                data: {
                    orderId: createdOrder.id,
                    variantId: item.variantId,
                    quantity: finalQuantity,
                    unitPrice: item.unitPrice,
                    totalPrice: finalQuantity * item.unitPrice,
                },
            });
            yield tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                    quantity: variant.quantity - finalQuantity,
                    soldQuantity: variant.soldQuantity + finalQuantity,
                },
            });
            yield tx.inventoryTransaction.create({
                data: {
                    variantId: item.variantId,
                    type: "SALE",
                    quantity: finalQuantity,
                    note: `Sold via Order ${orderNumber} (Requested: ${item.quantity}, Fulfilled: ${finalQuantity})`,
                },
            });
        }
        return createdOrder;
    }));
    return result;
});
const getMyOrders = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, query = {}) {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const { page = "1", limit = "10", status, searchTerm } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = { merchantDetailsId: merchantDetails.id };
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
    const [data, total] = yield Promise.all([
        prisma_1.prisma.order.findMany({
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
        prisma_1.prisma.order.count({ where }),
    ]);
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
        },
        data,
    };
});
const getAllOrders = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const { page = "1", limit = "10", status, searchTerm } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = {};
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
    const [data, total] = yield Promise.all([
        prisma_1.prisma.order.findMany({
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
        prisma_1.prisma.order.count({ where }),
    ]);
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
        },
        data,
    };
});
const updateOrderStatus = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingOrder = yield prisma_1.prisma.order.findUnique({
        where: { id: orderId },
    });
    if (!existingOrder) {
        throw new Error("Order not found");
    }
    const updatedOrder = yield prisma_1.prisma.order.update({
        where: { id: orderId },
        data: {
            status: payload.status,
            adminNote: payload.adminNote || existingOrder.adminNote,
        },
    });
    return updatedOrder;
});
const getSingleOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield prisma_1.prisma.order.findUnique({
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
});
const updateOrder = (userId, orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found.");
    }
    const existingOrder = yield prisma_1.prisma.order.findFirst({
        where: { id: orderId, merchantDetailsId: merchantDetails.id },
        include: { items: true },
    });
    if (!existingOrder) {
        throw new Error("Order not found or access denied.");
    }
    if (existingOrder.status !== "PENDING") {
        throw new Error("Only PENDING orders can be edited.");
    }
    const { items } = payload, orderData = __rest(payload, ["items"]);
    const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        for (const oldItem of existingOrder.items) {
            yield tx.productVariant.update({
                where: { id: oldItem.variantId },
                data: {
                    quantity: { increment: oldItem.quantity },
                    soldQuantity: { decrement: oldItem.quantity },
                },
            });
        }
        yield tx.orderItem.deleteMany({ where: { orderId } });
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.quantity * item.unitPrice;
        }
        const deliveryCharge = (_a = orderData.deliveryCharge) !== null && _a !== void 0 ? _a : existingOrder.deliveryCharge;
        const discount = (_b = orderData.discount) !== null && _b !== void 0 ? _b : existingOrder.discount;
        const totalPayable = subtotal + deliveryCharge - discount;
        for (const item of items) {
            const variant = yield tx.productVariant.findUnique({
                where: { id: item.variantId },
            });
            if (!variant)
                throw new Error(`Variant ${item.variantId} not found.`);
            if (variant.quantity < item.quantity) {
                throw new Error(`Insufficient stock for "${variant.variantName}". Available: ${variant.quantity}, Requested: ${item.quantity}`);
            }
            yield tx.orderItem.create({
                data: {
                    orderId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                },
            });
            yield tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                    quantity: { decrement: item.quantity },
                    soldQuantity: { increment: item.quantity },
                },
            });
            yield tx.inventoryTransaction.create({
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
    }));
    return result;
});
const deleteOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.prisma.order.delete({
        where: { id: orderId }
    });
    return result;
});
exports.OrderService = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
};
