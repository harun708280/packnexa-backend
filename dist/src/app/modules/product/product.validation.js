"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductValidation = void 0;
const zod_1 = require("zod");
const createVariantValidationSchema = zod_1.z.object({
    variantName: zod_1.z.string().optional(),
    unit: zod_1.z.string(),
    weightKg: zod_1.z.number().optional(),
    purchasePrice: zod_1.z.number(),
    salePrice: zod_1.z.number(),
    quantity: zod_1.z.number().default(0),
    color: zod_1.z.string().optional(),
    size: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional().nullable(),
    supplier: zod_1.z.string().optional(),
    invoiceId: zod_1.z.string().optional(),
    warehouseId: zod_1.z.string(),
});
const createProductValidationSchema = zod_1.z.object({
    productName: zod_1.z.string().min(1, "Product name is required"),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, "Category is required"),
    merchantWebProductId: zod_1.z.string().optional(),
    productImages: zod_1.z.array(zod_1.z.string()).optional(),
    variants: zod_1.z.array(createVariantValidationSchema).min(1, "At least one variant is required"),
});
const updateProductValidationSchema = zod_1.z.object({
    productName: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    merchantWebProductId: zod_1.z.string().optional(),
    productImages: zod_1.z.array(zod_1.z.string()).optional(),
    variants: zod_1.z.array(createVariantValidationSchema).optional(),
    status: zod_1.z.enum(["PROCESSING", "APPROVED", "ACTIVE", "INACTIVE", "OUT_OF_STOCK", "MIXED_STOCK"]).optional(),
});
exports.ProductValidation = {
    createProductValidationSchema,
    updateProductValidationSchema,
};
