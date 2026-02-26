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
exports.AdminController = void 0;
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const admin_service_1 = require("./admin.service");
const getAppliedMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield admin_service_1.AdminService.getAppliedMerchant();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Applied merchant list fetched successfully",
        data: result,
    });
}));
const getAppliedMerchantPersonalDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.getAppliedMerchantPersonalDetails(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Applied merchant personal details fetched successfully",
        data: result,
    });
}));
const approveProfilePhoto = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.approveProfilePhoto(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Profile photo approved.",
        data: result,
    });
}));
const approvePhaseOne = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.approvePhaseOne(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Phase one verified.",
        data: result,
    });
}));
const getAppliedMerchantBusinessDetails = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.getAppliedMerchantBusinessDetails(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Applied merchant business details fetched successfully",
        data: result,
    });
}));
const approveBusinessPhoto = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.approveBusinessPhoto(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Business photo approved.",
        data: result,
    });
}));
const approvePhaseTwo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.approvePhaseTwo(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Phase two verified.",
        data: result,
    });
}));
const getAppliedMerchantDocuments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.getAppliedMerchantDocuments(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Applied merchant documents fetched successfully",
        data: result,
    });
}));
const approvePhaseThree = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.approvePhaseThree(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Phase three verified.",
        data: result,
    });
}));
const getAppliedMerchantPayments = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.getAppliedMerchantPayments(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Applied merchant payments fetched successfully",
        data: result,
    });
}));
const approvePhaseFour = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.approvePhaseFour(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Phase four verified.",
        data: result,
    });
}));
const getApprovedMerchant = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_service_1.AdminService.getApprovedMerchant();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Approved merchant list fetched successfully",
        data: result,
    });
}));
const getMerchantProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const result = yield admin_service_1.AdminService.getMerchantProfile(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Merchant profile fetched successfully",
        data: result,
    });
}));
exports.AdminController = {
    getAppliedMerchant,
    getAppliedMerchantPersonalDetails,
    approveProfilePhoto,
    approvePhaseOne,
    getAppliedMerchantBusinessDetails,
    approveBusinessPhoto,
    approvePhaseTwo,
    getAppliedMerchantDocuments,
    approvePhaseThree,
    getAppliedMerchantPayments,
    approvePhaseFour,
    getApprovedMerchant,
    getMerchantProfile,
};
