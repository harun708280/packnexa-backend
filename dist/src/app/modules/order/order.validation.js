"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderValidation = void 0;
const zod_1 = require("zod");
const createOrderItemSchema = zod_1.z.object({
    variantId: zod_1.z.string().min(1, "Variant ID is required"),
    quantity: zod_1.z.number().min(1, "Quantity must be at least 1"),
    unitPrice: zod_1.z.number().min(0, "Unit price must be non-negative"),
});
const createOrderSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1, "Customer name is required"),
    customerPhone: zod_1.z.string().min(1, "Customer phone is required"),
    customerEmail: zod_1.z.string().email().optional().nullable(),
    deliveryAddress: zod_1.z.string().min(1, "Delivery address is required"),
    district: zod_1.z.string().min(1, "District is required"),
    area: zod_1.z.string().min(1, "Area is required"),
    zipCode: zod_1.z.string().optional().nullable(),
    orderSource: zod_1.z.enum(["FACEBOOK", "WHATSAPP", "TIKTOK", "INSTAGRAM", "MANUAL"]).optional(),
    paymentMethod: zod_1.z.string().optional(),
    preferredCourier: zod_1.z.string().optional(),
    isPreBooking: zod_1.z.boolean().optional(),
    preBookingDate: zod_1.z.string().datetime().optional().nullable().or(zod_1.z.string().optional().nullable()),
    deliveryCharge: zod_1.z.number().min(0).optional(),
    discount: zod_1.z.number().min(0).optional(),
    merchantNote: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(createOrderItemSchema).min(1, "Order must have at least one item"),
});
const updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "APPROVED", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"]),
    adminNote: zod_1.z.string().optional().nullable(),
});
exports.OrderValidation = {
    createOrderSchema,
    updateOrderStatusSchema,
};
