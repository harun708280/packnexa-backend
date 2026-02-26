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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarehouseLogsService = exports.storeProductService = exports.rejectProductService = exports.approveProductService = exports.listProductsService = exports.deleteProductService = exports.editProductService = exports.addProductService = void 0;
const prisma_1 = require("../../shared/prisma");
const addProductService = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const merchant = yield prisma_1.prisma.merchantDetails.findUnique({
            where: { userId },
        });
        if (!merchant)
            throw new Error("Merchant profile not found");
        const product = yield prisma_1.prisma.product.create({
            data: {
                merchantDetailsId: merchant.id,
                productName: data.name,
                category: data.category || "General",
                description: data.description || "",
                status: "PROCESSING",
            },
        });
        return product;
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to add product");
    }
});
exports.addProductService = addProductService;
const editProductService = (merchantDetailsId, productId, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield prisma_1.prisma.product.updateMany({
            where: { id: productId, merchantDetailsId, status: "PROCESSING" },
            data,
        });
        if (updated.count === 0)
            throw new Error("No pending product found or not authorized");
        return updated;
    }
    catch (error) {
        throw new Error("Failed to update product");
    }
});
exports.editProductService = editProductService;
const deleteProductService = (merchantDetailsId, productId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield prisma_1.prisma.product.deleteMany({
            where: { id: productId, merchantDetailsId, status: "PROCESSING" },
        });
        if (deleted.count === 0)
            throw new Error("No pending product found to delete");
        return deleted;
    }
    catch (error) {
        throw new Error("Failed to delete product");
    }
});
exports.deleteProductService = deleteProductService;
const listProductsService = (merchantDetailsId, isAdmin, pending) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const where = {};
        if (!isAdmin && merchantDetailsId)
            where.merchantDetailsId = merchantDetailsId;
        if (pending)
            where.status = "PROCESSING";
        const products = yield prisma_1.prisma.product.findMany({
            where,
            include: {
                variants: {
                    include: {
                        pricing: true
                    }
                }
            }
        });
        return products;
    }
    catch (error) {
        throw new Error("Failed to fetch products");
    }
});
exports.listProductsService = listProductsService;
const approveProductService = (productId, location) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!location)
            throw new Error("Location is required to approve product");
        return yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const product = yield tx.product.update({
                where: { id: productId },
                data: { status: "APPROVED" },
            });
            if (!product)
                throw new Error("Product not found");
            yield tx.warehouseLog.create({
                data: {
                    productId,
                    action: "APPROVED",
                    quantity: 0,
                    location,
                },
            });
            return product;
        }));
    }
    catch (error) {
        throw new Error("Failed to approve product");
    }
});
exports.approveProductService = approveProductService;
const rejectProductService = (productId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!reason)
            reason = "Rejected by admin";
        const product = yield prisma_1.prisma.product.update({
            where: { id: productId },
            data: {
                status: "REJECTED",
                rejectionReason: reason
            },
        });
        if (!product)
            throw new Error("Product not found");
        yield prisma_1.prisma.warehouseLog.create({
            data: {
                productId,
                action: "REJECTED",
                quantity: 0,
                location: reason,
            },
        });
        return product;
    }
    catch (error) {
        throw new Error("Failed to reject product");
    }
});
exports.rejectProductService = rejectProductService;
const storeProductService = (productId, location) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!location)
            throw new Error("Location is required to store product");
        const log = yield prisma_1.prisma.warehouseLog.create({
            data: {
                productId,
                action: "STORED",
                quantity: 0,
                location,
            },
        });
        return log;
    }
    catch (error) {
        throw new Error("Failed to store product");
    }
});
exports.storeProductService = storeProductService;
const getWarehouseLogsService = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield prisma_1.prisma.warehouseLog.findMany({
            where: { productId },
            orderBy: { createdAt: "asc" },
        });
        if (!logs || logs.length === 0)
            throw new Error("No logs found for this product");
        return logs;
    }
    catch (error) {
        throw new Error("Failed to fetch warehouse logs");
    }
});
exports.getWarehouseLogsService = getWarehouseLogsService;
