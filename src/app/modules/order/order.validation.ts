import { z } from "zod";

const createOrderItemSchema = z.object({
    variantId: z.string().min(1, "Variant ID is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

const createOrderSchema = z.object({
    customerName: z.string().min(1, "Customer name is required"),
    customerPhone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number (11 digits required)"),
    alternativePhone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid Bangladeshi phone number (11 digits required)").optional().nullable(),
    customerEmail: z.string().email().optional().nullable(),
    deliveryAddress: z.string().min(1, "Delivery address is required"),
    district: z.string().min(1, "District is required"),
    area: z.string().min(1, "Area is required"),
    zipCode: z.string().optional().nullable(),
    orderSource: z.enum(["FACEBOOK", "WHATSAPP", "TIKTOK", "INSTAGRAM", "MANUAL"]).optional(),
    paymentMethod: z.string().optional(),
    preferredCourier: z.string().optional(),
    isPreBooking: z.boolean().optional(),
    preBookingDate: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
    deliveryCharge: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    merchantNote: z.string().optional().nullable(),
    items: z.array(createOrderItemSchema).min(1, "Order must have at least one item"),
});

const updateOrderStatusSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"]),
    adminNote: z.string().optional().nullable(),
});

export const OrderValidation = {
    createOrderSchema,
    updateOrderStatusSchema,
};
