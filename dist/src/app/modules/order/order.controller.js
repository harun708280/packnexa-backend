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
exports.OrderController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const order_service_1 = require("./order.service");
const createOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderService.createOrder(user.userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: "Order created successfully",
        data: result,
    });
}));
const getMyOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderService.getMyOrders(user.userId, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Your orders fetched successfully",
        meta: result.meta,
        data: result.data,
    });
}));
const getAllOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderService.getAllOrders(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "All orders fetched successfully",
        meta: result.meta,
        data: result.data,
    });
}));
const updateOrderStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_service_1.OrderService.updateOrderStatus(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Order status updated successfully",
        data: result,
    });
}));
const deleteOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_service_1.OrderService.deleteOrder(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Order deleted successfully",
        data: result,
    });
}));
const updateOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { id } = req.params;
    const result = yield order_service_1.OrderService.updateOrder(user.userId, id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Order updated successfully",
        data: result,
    });
}));
const getSingleOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { id } = req.params;
    const result = yield order_service_1.OrderService.getSingleOrder(user.userId, id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Order fetched successfully",
        data: result,
    });
}));
const getOrderStats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderService.getOrderStats(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Order statistics fetched successfully",
        data: result,
    });
}));
const trackOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield order_service_1.OrderService.trackSteadfastOrder(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Tracking information fetched successfully",
        data: result,
    });
}));
exports.OrderController = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    getOrderStats,
    trackOrder,
};
