import { z } from "zod";

const createVariantValidationSchema = z.object({
    variantName: z.string().optional(),
    unit: z.string(),
    weightKg: z.number().optional(),
    purchasePrice: z.number(),
    salePrice: z.number(),
    quantity: z.number().default(0),
    color: z.string().optional().nullable(),
    size: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    supplier: z.string().optional(),
    invoiceId: z.string().optional(),
    warehouseId: z.string(),
});

const createProductValidationSchema = z.object({
    productName: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    merchantWebProductId: z.string().optional(),
    productImages: z.array(z.string()).optional(),
    variants: z.array(createVariantValidationSchema).min(1, "At least one variant is required"),
});

const updateProductValidationSchema = z.object({
    productName: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    merchantWebProductId: z.string().optional(),
    productImages: z.array(z.string()).optional(),
    variants: z.array(createVariantValidationSchema).optional(),
    status: z.enum(["PROCESSING", "APPROVED", "ACTIVE", "INACTIVE", "OUT_OF_STOCK", "MIXED_STOCK"]).optional(),
});

export const ProductValidation = {
    createProductValidationSchema,
    updateProductValidationSchema,
};
