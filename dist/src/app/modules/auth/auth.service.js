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
exports.AuthService = exports.generateOTP = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../../../config");
const forgetPasswordEmail_1 = require("../../../emails/forgetPasswordEmail");
const otpEmail_1 = require("../../../emails/otpEmail");
const resendOtpEmail_1 = require("../../../emails/resendOtpEmail");
const AppError_1 = __importDefault(require("../../errorHelper/AppError"));
const jwtHelper_1 = require("../../helper/jwtHelper");
const mailer_1 = require("../../shared/mailer");
const prisma_1 = require("../../shared/prisma");
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
const login = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new AppError_1.default(400, "Invalid email address");
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    if (!isMatch)
        throw new AppError_1.default(400, "Invalid credentials");
    if (config_1.envVariables.NODE_ENV === "development") {
        const accessToken = jwtHelper_1.jwtHelper.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, config_1.envVariables.JWT_ACCESS_SECRET, config_1.envVariables.JWT_ACCESS_EXPIRES);
        const refreshToken = jwtHelper_1.jwtHelper.generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, config_1.envVariables.JWT_REFRESH_SECRET, config_1.envVariables.JWT_REFRESH_EXPIRES);
        return {
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, role: user.role },
        };
    }
    const otp = (0, exports.generateOTP)();
    const hashedOtp = yield bcryptjs_1.default.hash(otp, config_1.envVariables.BCRYPT_SALT_ROUND);
    const otpExpires = new Date(Date.now() + config_1.envVariables.FORGOT_PASSWORD_OTP_EXPIRE_MINUTES * 60 * 1000);
    yield prisma_1.prisma.user.update({
        where: { email },
        data: { otp: hashedOtp, otpExpires },
    });
    yield (0, mailer_1.sendEmail)({
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${otp}`,
        html: (0, otpEmail_1.otpEmail)(otp),
    });
    return { message: "OTP sent to email", otpExpires };
});
const verifyOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.otp || !user.otpExpires) {
        throw new AppError_1.default(400, "Invalid request");
    }
    if (user.otpExpires < new Date()) {
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { otp: null, otpExpires: null, otpAttempts: 0 },
        });
        throw new AppError_1.default(400, "OTP expired");
    }
    const attempts = (_a = user.otpAttempts) !== null && _a !== void 0 ? _a : 0;
    if (attempts >= 2) {
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { otp: null, otpExpires: null, otpAttempts: 0 },
        });
        throw new AppError_1.default(429, "Maximum OTP attempts reached. Please request a new OTP.");
    }
    const isValid = yield bcryptjs_1.default.compare(otp, user.otp);
    if (!isValid) {
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { otpAttempts: attempts + 1 },
        });
        throw new AppError_1.default(401, "Invalid OTP");
    }
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    const accessToken = jwtHelper_1.jwtHelper.generateToken(payload, config_1.envVariables.JWT_ACCESS_SECRET, config_1.envVariables.JWT_ACCESS_EXPIRES);
    const refreshToken = jwtHelper_1.jwtHelper.generateToken(payload, config_1.envVariables.JWT_REFRESH_SECRET, config_1.envVariables.JWT_REFRESH_EXPIRES);
    yield prisma_1.prisma.user.update({
        where: { email },
        data: { otp: null, otpExpires: null, otpAttempts: 0 },
    });
    return {
        accessToken,
        refreshToken,
        user: payload,
    };
});
const resendOtp = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new AppError_1.default(404, "User not found");
    const otp = (0, exports.generateOTP)();
    const hashedOtp = yield bcryptjs_1.default.hash(otp, config_1.envVariables.BCRYPT_SALT_ROUND);
    const otpExpires = new Date(Date.now() + config_1.envVariables.FORGOT_PASSWORD_OTP_EXPIRE_MINUTES * 60 * 1000);
    yield prisma_1.prisma.user.update({
        where: { email },
        data: { otp: hashedOtp, otpExpires },
    });
    yield (0, mailer_1.sendEmail)({
        to: email,
        subject: "Your New OTP Code",
        text: `Your OTP code is: ${otp}`,
        html: (0, resendOtpEmail_1.resendOtpEmail)(otp),
    });
    return { message: "New OTP sent successfully", otpExpires };
});
const forgetPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { message: "OTP has been sent" };
    }
    const otp = (0, exports.generateOTP)();
    const hashedOtp = yield bcryptjs_1.default.hash(otp, config_1.envVariables.BCRYPT_SALT_ROUND);
    const otpExpires = new Date(Date.now() + config_1.envVariables.FORGOT_PASSWORD_OTP_EXPIRE_MINUTES * 60 * 1000);
    yield prisma_1.prisma.user.update({
        where: { email },
        data: { otp: hashedOtp, otpExpires, otpAttempts: 0 },
    });
    yield (0, mailer_1.sendEmail)({
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${otp}`,
        html: (0, forgetPasswordEmail_1.forgetPasswordEmail)(otp),
    });
    return { message: "OTP has been sent", otpExpires };
});
const resetPassword = (email, otp, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.otp || !user.otpExpires)
        throw new AppError_1.default(400, "Invalid request");
    if (user.otpExpires < new Date()) {
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { otp: null, otpExpires: null, otpAttempts: 0 },
        });
        throw new AppError_1.default(400, "OTP expired");
    }
    const attempts = (_a = user.otpAttempts) !== null && _a !== void 0 ? _a : 0;
    if (attempts >= 2) {
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { otp: null, otpExpires: null, otpAttempts: 0 },
        });
        throw new AppError_1.default(429, "Maximum OTP attempts reached. Please request a new OTP.");
    }
    const isValid = yield bcryptjs_1.default.compare(otp, user.otp);
    if (!isValid) {
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { otpAttempts: attempts + 1 },
        });
        throw new AppError_1.default(401, "Invalid OTP");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, config_1.envVariables.BCRYPT_SALT_ROUND);
    yield prisma_1.prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            otp: null,
            otpExpires: null,
            otpAttempts: 0,
        },
    });
    return { message: "Password updated successfully" };
});
exports.AuthService = {
    login,
    verifyOtp,
    resendOtp,
    forgetPassword,
    resetPassword,
};
