import { z } from "zod";

const createReturnSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    reason: z.string().optional(),
    items: z.array(
        z.object({
            variantId: z.string().min(1, "Variant ID is required"),
            quantity: z.number().min(1, "Quantity must be at least 1"),
        })
    ).min(1, "At least one item is required"),
});

const updateReturnStatusSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    adminFeedback: z.string().optional(),
    images: z.array(z.string()).optional(),
    backToStock: z.boolean().optional(),
});

export const ReturnValidation = {
    createReturnSchema,
    updateReturnStatusSchema,
};
