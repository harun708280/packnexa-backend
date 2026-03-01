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
const steadfast_service_1 = require("./steadfast.service");
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
            data: Object.assign(Object.assign({}, orderData), { alternativePhone: orderData.alternativePhone || null, orderNumber,
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
    // 1. Fetch base orders
    const [orders, total] = yield Promise.all([
        prisma_1.prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.order.count({ where }),
    ]);
    if (orders.length === 0) {
        return { meta: { page: Number(page), limit: Number(limit), total }, data: [] };
    }
    const orderIds = orders.map(o => o.id);
    // 2. Fetch related data in parallel batches
    const items = yield prisma_1.prisma.orderItem.findMany({
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
    const data = orders.map(order => (Object.assign(Object.assign({}, order), { items: items.filter(item => item.orderId === order.id) })));
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
    // 1. Fetch base orders
    const [orders, total] = yield Promise.all([
        prisma_1.prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.order.count({ where }),
    ]);
    if (orders.length === 0) {
        return { meta: { page: Number(page), limit: Number(limit), total }, data: [] };
    }
    const orderIds = orders.map(o => o.id);
    const merchantDetailsIds = [...new Set(orders.map(o => o.merchantDetailsId))];
    // 2. Fetch related data in parallel batches
    const [items, merchantDetails] = yield Promise.all([
        prisma_1.prisma.orderItem.findMany({
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
        prisma_1.prisma.merchantDetails.findMany({
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
    const data = orders.map(order => (Object.assign(Object.assign({}, order), { items: items.filter(item => item.orderId === order.id), merchantDetails: merchantDetails.find(m => m.id === order.merchantDetailsId) })));
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
    var _a, _b, _c, _d;
    const existingOrder = yield prisma_1.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });
    if (!existingOrder) {
        throw new Error("Order not found");
    }
    // Role/Transition Guards
    if (payload.status === client_1.OrderStatus.SHIPPED && existingOrder.status !== client_1.OrderStatus.PACKED) {
        throw new Error(`Invalid transition. Only PACKED orders can be marked as SHIPPED. Current status: ${existingOrder.status}`);
    }
    // Prevent manual DELIVERED/RETURNED for Steadfast orders
    const isSteadfastOrder = ((_a = existingOrder.preferredCourier) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("steadfast")) ||
        ((_b = existingOrder.preferredCourier) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("system automatic")) ||
        !existingOrder.preferredCourier;
    if (isSteadfastOrder && existingOrder.trackingNumber && [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.RETURNED].includes(payload.status)) {
        throw new Error(`Manual status update to ${payload.status} is restricted for Steadfast orders. Status will sync automatically from the courier.`);
    }
    const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Handle Inventory Restocking for CANCELLED or RETURNED
        const isCurrentlyActive = !['CANCELLED', 'RETURNED'].includes(existingOrder.status);
        const willBeInactive = ['CANCELLED', 'RETURNED'].includes(payload.status);
        if (isCurrentlyActive && willBeInactive) {
            console.log(`[DEBUG] Restocking inventory for order ${existingOrder.orderNumber} as it moves to ${payload.status}`);
            for (const item of existingOrder.items) {
                yield tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        quantity: { increment: item.quantity },
                        soldQuantity: { decrement: item.quantity },
                    },
                });
                yield tx.inventoryTransaction.create({
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
                const variant = yield tx.productVariant.findUnique({ where: { id: item.variantId } });
                if (!variant || variant.quantity < item.quantity) {
                    throw new Error(`Insufficient stock to re-activate order for item ${item.variantId}`);
                }
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
    }));
    // 4. Handle External Integrations (Steadfast)
    const isTargetingShipped = payload.status === client_1.OrderStatus.SHIPPED;
    const isSteadfastCourier = ((_c = result.preferredCourier) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes("steadfast")) ||
        ((_d = result.preferredCourier) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes("system automatic")) ||
        !result.preferredCourier; // Default to Steadfast if not set
    console.log(`[DEBUG] Steadfast Trigger Check for ${result.orderNumber}: isTargetingShipped=${isTargetingShipped}, isSteadfastCourier=${isSteadfastCourier}, preferredCourier="${result.preferredCourier}"`);
    if (isTargetingShipped && isSteadfastCourier) {
        console.log(`[DEBUG] Triggering Steadfast API for order ${result.orderNumber}`);
        try {
            const steadfastResponse = yield steadfast_service_1.SteadfastService.createOrder(result);
            if (steadfastResponse && (steadfastResponse.status === 200 || steadfastResponse.status === 201) && steadfastResponse.consignment) {
                yield prisma_1.prisma.order.update({
                    where: { id: orderId },
                    data: {
                        trackingNumber: steadfastResponse.consignment.tracking_code,
                    },
                });
                console.log(`Order ${result.orderNumber} successfully sent to Steadfast. Tracking: ${steadfastResponse.consignment.tracking_code}`);
            }
            else {
                console.warn(`Steadfast API returned error for order ${result.orderNumber}:`, steadfastResponse);
            }
        }
        catch (error) {
            console.error(`Failed to send order ${result.orderNumber} to Steadfast:`, error);
        }
    }
    // 5. Return the final updated order (re-fetch to get trackingNumber and other updates)
    return prisma_1.prisma.order.findUnique({
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
});
const getSingleOrder = (userId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const order = yield prisma_1.prisma.order.findUnique({
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
    }));
    return result;
});
const deleteOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.prisma.order.delete({
        where: { id: orderId }
    });
    return result;
});
const getOrderStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const [sourceStats, statusStats, externalLogCount] = yield Promise.all([
        prisma_1.prisma.order.groupBy({
            by: ["orderSource"],
            where: { merchantDetailsId: merchantDetails.id },
            _count: true,
        }),
        prisma_1.prisma.order.groupBy({
            by: ["status"],
            where: { merchantDetailsId: merchantDetails.id },
            _count: true,
        }),
        prisma_1.prisma.externalOrderLog.count({
            where: {
                merchantDetailsId: merchantDetails.id,
                status: { not: "COMPLETED" },
            },
        }),
    ]);
    return {
        sourceStats: sourceStats.reduce((acc, curr) => {
            acc[curr.orderSource] = curr._count;
            return acc;
        }, {}),
        statusStats: statusStats.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {}),
        externalLogCount,
    };
});
const trackSteadfastOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const order = yield prisma_1.prisma.order.findUnique({
        where: { id: orderId },
    });
    if (!order) {
        throw new Error("Order not found");
    }
    if (!((_a = order.preferredCourier) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("steadfast"))) {
        return { message: "This order is not associated with Steadfast Courier" };
    }
    const steadfastResult = yield steadfast_service_1.SteadfastService.trackOrder(order.orderNumber);
    if (steadfastResult && steadfastResult.status === 200 && steadfastResult.delivery_status) {
        const sStatus = steadfastResult.delivery_status.toLowerCase();
        let newStatus = null;
        if (sStatus.includes("delivered")) {
            newStatus = client_1.OrderStatus.DELIVERED;
        }
        else if (sStatus.includes("cancelled") || sStatus.includes("return")) {
            newStatus = client_1.OrderStatus.RETURNED;
        }
        if (newStatus && newStatus !== order.status) {
            console.log(`[SYNC] Updating order ${order.orderNumber} status from ${order.status} to ${newStatus} based on Steadfast track response.`);
            yield updateOrderStatus(orderId, { status: newStatus, adminNote: `Auto-synced from Steadfast: ${steadfastResult.delivery_status}` });
        }
    }
    return steadfastResult;
});
exports.OrderService = {
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
