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
exports.MerchantController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const prisma_1 = require("../../shared/prisma");
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const merchant_service_1 = require("./merchant.service");
const personalDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const file = req.file;
    const payload = Object.assign(Object.assign({}, req.body), { userId: user.userId, profilePhoto: (file === null || file === void 0 ? void 0 : file.path) ? file.path.split("uploads/").pop() : undefined });
    if (payload.profilePhoto) {
        payload.profilePhoto = `uploads/${payload.profilePhoto}`;
    }
    const result = yield merchant_service_1.MerchantService.personalDetails(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Personal details submitted successfully",
        data: result,
    });
}));
const getPersonalDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield merchant_service_1.MerchantService.getPersonalDetails(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Personal details fetched successfully",
        data: result,
    });
}));
const businessDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const file = req.file;
    const payload = Object.assign(Object.assign({}, req.body), { userId: user.userId, businessLogo: (file === null || file === void 0 ? void 0 : file.path) ? file.path.split("uploads/").pop() : undefined });
    if (payload.businessLogo) {
        payload.businessLogo = `uploads/${payload.businessLogo}`;
    }
    const result = yield merchant_service_1.MerchantService.businessDetails(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Business details submitted successfully",
        data: result,
    });
}));
const getBusinessDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield merchant_service_1.MerchantService.getBusinessDetails(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Business details fetched successfully",
        data: result,
    });
}));
const documents = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const files = req.files;
    const docsPayload = { userId: user.userId };
    if (files) {
        Object.keys(files).forEach((key) => {
            const filePath = files[key][0].path;
            const relativePath = filePath.split("uploads/").pop();
            docsPayload[key] = `uploads/${relativePath}`;
        });
    }
    const result = yield merchant_service_1.MerchantService.documents(docsPayload);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Documents submitted successfully",
        data: result,
    });
}));
const getDocuments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield merchant_service_1.MerchantService.getDocuments(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Documents fetched successfully",
        data: result,
    });
}));
const payments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const payload = Object.assign(Object.assign({}, req.body), { userId: user.userId });
    const result = yield merchant_service_1.MerchantService.payments(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Payment submitted successfully",
        data: result,
    });
}));
const completeOnboarding = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield merchant_service_1.MerchantService.completeOnboarding(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Merchant application submitted successfully",
        data: result,
    });
}));
const getPayments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield merchant_service_1.MerchantService.getPayments(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Payments fetched successfully",
        data: result,
    });
}));
const getOnboardingConfig = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const config = yield merchant_service_1.MerchantService.getOnboardingConfig();
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId: user.userId },
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Onboarding configuration fetched successfully",
        data: Object.assign(Object.assign({}, config), { isSubmitted: (merchantDetails === null || merchantDetails === void 0 ? void 0 : merchantDetails.isSubmitted) || false }),
    });
}));
exports.MerchantController = {
    personalDetails,
    getPersonalDetails,
    businessDetails,
    getBusinessDetails,
    documents,
    getDocuments,
    payments,
    getPayments,
    completeOnboarding,
    getOnboardingConfig,
    // kkkkk
    // applyMerchant,
    // getAllMerchants,
    // approveMerchant,
    // rejectMerchant,
    // getMyMerchantProfile,
    // updateMyMerchantProfile,
};
