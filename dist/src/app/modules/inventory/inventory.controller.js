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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarehouseLogs = exports.storeProduct = exports.warehouseRejectProduct = exports.warehouseApproveProduct = exports.listProducts = exports.deleteProduct = exports.editProduct = exports.addProduct = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const inventory_service_1 = require("./inventory.service");
exports.addProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantId = req.user.userId;
    const product = yield (0, inventory_service_1.addProductService)(merchantId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: "Product added successfully",
        data: product,
    });
}));
exports.editProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantId = req.user.userId;
    const product = yield (0, inventory_service_1.editProductService)(merchantId, req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Product updated successfully",
        data: product,
    });
}));
exports.deleteProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, inventory_service_1.deleteProductService)(req.user.userId, req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Product deleted successfully",
    });
}));
exports.listProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    const pending = req.query.pending === "true";
    const products = yield (0, inventory_service_1.listProductsService)(merchantId, isAdmin, pending);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Products fetched",
        data: products,
    });
}));
exports.warehouseApproveProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield (0, inventory_service_1.approveProductService)(req.params.id, req.body.location);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Product approved and logged",
        data: product,
    });
}));
exports.warehouseRejectProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield (0, inventory_service_1.rejectProductService)(req.params.id, req.body.reason);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Product rejected and logged",
        data: product,
    });
}));
exports.storeProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const log = yield (0, inventory_service_1.storeProductService)(req.params.id, req.body.location);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Product stored",
        data: log,
    });
}));
exports.getWarehouseLogs = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const logs = yield (0, inventory_service_1.getWarehouseLogsService)(req.params.productId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Warehouse logs fetched",
        data: logs,
    });
}));
