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
exports.ProductService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../shared/prisma");
const createProduct = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found. Only merchants can create products.");
    }
    console.log('--- CREATE PRODUCT PAYLOAD START ---');
    console.log(JSON.stringify(payload, null, 2));
    console.log('--- CREATE PRODUCT PAYLOAD END ---');
    const { variants, productImages, description, productName, category, merchantWebProductId } = payload;
    const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        let warehouse = yield tx.warehouse.findFirst();
        if (!warehouse) {
            warehouse = yield tx.warehouse.create({
                data: { name: "Main Warehouse", location: "Default Location" },
            });
        }
        const createdProduct = yield tx.product.create({
            data: {
                productName,
                description,
                category,
                merchantDetailsId: merchantDetails.id,
                status: "PROCESSING",
                productImages: productImages && productImages.length > 0 ? {
                    create: productImages.map((url) => ({ imageUrl: url })),
                } : undefined,
            },
        });
        const baseCount = yield tx.productVariant.count();
        let variantIndex = 0;
        for (const variant of variants) {
            const nextNumber = baseCount + variantIndex + 1;
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const sku = `NEXA-${nextNumber}${randomSuffix}`;
            variantIndex++;
            const { purchasePrice, salePrice, imageUrl, pricing, location, stockControl } = variant, rest = __rest(variant, ["purchasePrice", "salePrice", "imageUrl", "pricing", "location", "stockControl"]);
            const variantPricing = pricing ? { create: pricing } : (purchasePrice !== undefined && salePrice !== undefined) ? {
                create: {
                    purchasePrice: Number(purchasePrice),
                    salePrice: Number(salePrice)
                }
            } : undefined;
            yield tx.productVariant.create({
                data: {
                    variantName: variant.variantName,
                    unit: variant.unit,
                    weightKg: Number(variant.weightKg) || 0,
                    quantity: Number(variant.quantity) || 0,
                    color: variant.color,
                    size: variant.size,
                    supplier: variant.supplier,
                    invoiceId: variant.invoiceId,
                    variantImage: imageUrl || variant.variantImage,
                    productId: createdProduct.id,
                    merchantDetailsId: merchantDetails.id,
                    merchantWebProductId: variant.merchantWebProductId,
                    sku,
                    warehouseId: variant.warehouseId && variant.warehouseId !== "default-warehouse-id" ? variant.warehouseId : warehouse.id,
                    pricing: variantPricing,
                    location: location ? { create: location } : undefined,
                    stockControl: stockControl ? { create: stockControl } : undefined,
                },
            });
        }
        return tx.product.findUnique({
            where: { id: createdProduct.id },
            include: {
                variants: {
                    include: {
                        pricing: true,
                        location: true,
                        stockControl: true,
                    },
                },
                productImages: true,
            },
        });
    }), {
        timeout: 30000,
    });
    return result;
});
const getMyProducts = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, query = {}) {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const { page = "1", limit = "10", status, searchTerm, category } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = { merchantDetailsId: merchantDetails.id };
    if (status && status !== "ALL") {
        where.status = status;
    }
    if (category && category !== "all") {
        where.category = category;
    }
    if (searchTerm) {
        where.OR = [
            { productName: { contains: searchTerm, mode: "insensitive" } },
            { productCode: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
        ];
    }
    // 1. Fetch products with basic info
    const [data, total] = yield Promise.all([
        prisma_1.prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.product.count({ where })
    ]);
    if (data.length === 0) {
        return { meta: { page: Number(page), limit: Number(limit), total }, data: [] };
    }
    const productIds = data.map(p => p.id);
    // 2. Fetch all related data in batches to avoid N+1
    const [images, variants] = yield Promise.all([
        prisma_1.prisma.productImage.findMany({
            where: { productId: { in: productIds } },
            select: { id: true, productId: true, imageUrl: true, createdAt: true }
        }),
        prisma_1.prisma.productVariant.findMany({
            where: { productId: { in: productIds } },
            include: {
                pricing: true,
                stockControl: true
            }
        })
    ]);
    // 3. Manually join the data
    const result = data.map(product => {
        const productImages = images.filter(img => img.productId === product.id).slice(0, 1);
        const productVariants = variants.filter(v => v.productId === product.id).map(v => {
            const vRest = __rest(v, []);
            return vRest;
        });
        return Object.assign(Object.assign({}, product), { productImages, variants: productVariants });
    });
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
        },
        data: result,
    };
});
const getAllProducts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const { page = "1", limit = "10", searchTerm, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = {};
    if (searchTerm) {
        where.OR = [
            { productName: { contains: searchTerm, mode: "insensitive" } },
            { productCode: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
        ];
    }
    if (status && status !== "ALL") {
        where.status = status;
    }
    const [data, total, pendingCount, approvedCount, rejectedCount] = yield Promise.all([
        prisma_1.prisma.product.findMany({
            where,
            select: {
                id: true,
                productName: true,
                productCode: true,
                category: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                merchantDetailsId: true,
                description: true,
                rejectionReason: true,
                productImages: {
                    select: { imageUrl: true }
                },
                merchantDetails: {
                    select: {
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
                        }
                    },
                },
                variants: {
                    select: {
                        id: true,
                        variantName: true,
                        quantity: true,
                        sku: true,
                        variantImage: true,
                        pricing: {
                            select: {
                                salePrice: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.product.count({ where }),
        prisma_1.prisma.product.count({ where: { status: client_1.ProductStatus.PROCESSING } }),
        prisma_1.prisma.product.count({ where: { status: client_1.ProductStatus.APPROVED } }),
        prisma_1.prisma.product.count({ where: { status: client_1.ProductStatus.REJECTED } }),
    ]);
    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            pendingCount,
            approvedCount,
            rejectedCount,
        },
        data,
    };
});
const getSingleProduct = (userId, productId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const product = yield prisma_1.prisma.product.findFirst({
        where: {
            id: productId,
            merchantDetailsId: merchantDetails.id,
        },
        include: {
            variants: {
                include: {
                    pricing: true,
                    location: true,
                    stockControl: true,
                },
            },
            productImages: true,
        },
    });
    if (!product) {
        throw new Error("Product not found or access denied");
    }
    return product;
});
const updateProduct = (userId, productId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const existingProduct = yield prisma_1.prisma.product.findFirst({
        where: {
            id: productId,
            merchantDetailsId: merchantDetails.id,
        },
        include: {
            variants: true,
        },
    });
    if (!existingProduct) {
        throw new Error("Product not found or access denied");
    }
    const { variants, productImages, description, productName, category, merchantWebProductId } = payload;
    console.log('--- UPDATE PRODUCT PAYLOAD START ---');
    console.log('productId:', productId);
    console.log(JSON.stringify(payload, null, 2));
    console.log('--- UPDATE PRODUCT PAYLOAD END ---');
    return prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        yield tx.product.update({
            where: { id: productId },
            data: {
                productName,
                description,
                category,
                status: client_1.ProductStatus.PROCESSING,
                rejectionReason: null,
                productImages: productImages ? {
                    deleteMany: {},
                    create: productImages.map((url) => ({ imageUrl: url })),
                } : undefined,
            },
        });
        if (variants) {
            const incomingVariantIds = variants.filter((v) => v.id).map((v) => v.id);
            const existingVariantIds = existingProduct.variants.map((v) => v.id);
            const variantsToDelete = existingVariantIds.filter(id => !incomingVariantIds.includes(id));
            console.log('Variants to delete:', variantsToDelete);
            if (variantsToDelete.length > 0) {
                yield tx.productVariant.deleteMany({
                    where: { id: { in: variantsToDelete } },
                });
            }
            console.log('Reconciling variants, count:', variants.length);
            for (const variant of variants) {
                const { id, pricing, location, stockControl, purchasePrice, salePrice, imageUrl } = variant, rest = __rest(variant, ["id", "pricing", "location", "stockControl", "purchasePrice", "salePrice", "imageUrl"]);
                const isExistingVariant = id && existingVariantIds.includes(id);
                if (isExistingVariant) {
                    console.log('Updating variant:', id);
                    const updatePricing = pricing ? {
                        upsert: { create: pricing, update: pricing }
                    } : (purchasePrice !== undefined && salePrice !== undefined) ? {
                        upsert: {
                            create: { purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) },
                            update: { purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) },
                        }
                    } : undefined;
                    yield tx.productVariant.update({
                        where: { id },
                        data: {
                            variantName: variant.variantName,
                            unit: variant.unit,
                            weightKg: Number(variant.weightKg) || 0,
                            quantity: Number(variant.quantity) || 0,
                            color: variant.color,
                            size: variant.size,
                            supplier: variant.supplier || rest.supplier,
                            invoiceId: variant.invoiceId,
                            variantImage: imageUrl || variant.variantImage,
                            merchantDetailsId: merchantDetails.id,
                            merchantWebProductId: variant.merchantWebProductId,
                            warehouseId: variant.warehouseId && variant.warehouseId !== "default-warehouse-id" ? variant.warehouseId : undefined,
                            pricing: updatePricing,
                            location: location ? { upsert: { create: location, update: location } } : undefined,
                            stockControl: stockControl ? { upsert: { create: stockControl, update: stockControl } } : undefined,
                        },
                    });
                }
                else {
                    console.log('Creating new variant...');
                    const baseCount = yield tx.productVariant.count();
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    const sku = variant.sku || `NEXA-${baseCount + 1}${randomSuffix}`;
                    yield tx.productVariant.create({
                        data: {
                            variantName: variant.variantName,
                            unit: variant.unit,
                            weightKg: Number(variant.weightKg) || 0,
                            quantity: Number(variant.quantity) || 0,
                            color: variant.color,
                            size: variant.size,
                            supplier: variant.supplier || rest.supplier,
                            invoiceId: variant.invoiceId,
                            variantImage: imageUrl || variant.variantImage,
                            productId,
                            merchantDetailsId: merchantDetails.id,
                            merchantWebProductId: variant.merchantWebProductId,
                            sku,
                            warehouseId: variant.warehouseId && variant.warehouseId !== "default-warehouse-id" ? variant.warehouseId : ((_a = (yield tx.warehouse.findFirst())) === null || _a === void 0 ? void 0 : _a.id) || "",
                            pricing: (purchasePrice !== undefined && salePrice !== undefined) ? {
                                create: { purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) }
                            } : (pricing ? { create: pricing } : undefined),
                            location: location ? { create: location } : undefined,
                            stockControl: stockControl ? { create: stockControl } : undefined,
                        },
                    });
                }
            }
        }
        return tx.product.findUnique({
            where: { id: productId },
            include: {
                variants: {
                    include: {
                        pricing: true,
                        location: true,
                        stockControl: true,
                    }
                },
                productImages: true,
            }
        });
    }), {
        timeout: 30000,
    });
});
const deleteProduct = (userId, productId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const product = yield prisma_1.prisma.product.findFirst({
        where: {
            id: productId,
            merchantDetailsId: merchantDetails.id,
        },
    });
    if (!product) {
        throw new Error("Product not found or access denied");
    }
    return prisma_1.prisma.product.delete({
        where: { id: productId },
    });
});
const approveProduct = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.product.update({
        where: { id },
        data: {
            status: client_1.ProductStatus.APPROVED,
            rejectionReason: null
        },
    });
});
const rejectProduct = (id, reason) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.product.update({
        where: { id },
        data: {
            status: client_1.ProductStatus.REJECTED,
            rejectionReason: reason,
        },
    });
});
const getAppliedMerchant = () => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findMany({
        where: {
            isSubmitted: true,
            isVerified: false,
        },
        select: {
            user: {
                select: {
                    email: true,
                    contactNumber: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
    return merchantDetails;
});
exports.ProductService = {
    createProduct,
    getMyProducts,
    getSingleProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    approveProduct,
    rejectProduct,
    getAppliedMerchant,
};
