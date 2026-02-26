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
exports.AuthController = void 0;
const config_1 = require("../../../config");
const clearCookie_1 = require("../../helper/clearCookie");
const catchAsync_1 = __importDefault(require("../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../shared/sendResponse"));
const auth_service_1 = require("./auth.service");
const login = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (config_1.envVariables.NODE_ENV === "development") {
        const { accessToken, refreshToken, user } = yield auth_service_1.AuthService.login(email, password);
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: config_1.envVariables.JWT_ACCESS_EXPIRES_MAX_AGE,
            path: "/",
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: config_1.envVariables.JWT_REFRESH_EXPIRES_MAX_AGE,
            path: "/",
        });
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: "Login successful",
            data: user,
        });
    }
    const { message, otpExpires } = yield auth_service_1.AuthService.login(email, password);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message,
        data: { otpExpires },
    });
}));
const verifyOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    const { accessToken, refreshToken, user } = yield auth_service_1.AuthService.verifyOtp(email, otp);
    const isProduction = config_1.envVariables.NODE_ENV === "production";
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: config_1.envVariables.JWT_ACCESS_EXPIRES_MAX_AGE,
        path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: config_1.envVariables.JWT_REFRESH_EXPIRES_MAX_AGE,
        path: "/",
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Login successful",
        data: user,
    });
}));
const resendOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const { message, otpExpires } = yield auth_service_1.AuthService.resendOtp(email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message,
        data: { otpExpires },
    });
}));
const logout = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, clearCookie_1.clearAuthCookies)(res);
    (0, sendResponse_1.default)(res, { statusCode: 200, success: true, message: "Logged out" });
}));
const forgetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const { message, otpExpires } = yield auth_service_1.AuthService.forgetPassword(email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message,
        data: { otpExpires },
    });
}));
const resetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp, newPassword } = req.body;
    const response = yield auth_service_1.AuthService.resetPassword(email, otp, newPassword);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: response.message,
    });
}));
exports.AuthController = {
    login,
    verifyOtp,
    resendOtp,
    logout,
    forgetPassword,
    resetPassword,
};
