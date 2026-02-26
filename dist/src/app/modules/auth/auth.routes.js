"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = exports.router = void 0;
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
exports.router = express_1.default.Router();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many attempts, please try again later",
    },
});
exports.router.post("/login", authLimiter, (0, validateRequest_1.default)(auth_validation_1.loginSchema), auth_controller_1.AuthController.login);
exports.router.post("/verify-otp", authLimiter, (0, validateRequest_1.default)(auth_validation_1.verifyOtpSchema), auth_controller_1.AuthController.verifyOtp);
exports.router.post("/resend-otp", authLimiter, (0, validateRequest_1.default)(auth_validation_1.emailSchema), auth_controller_1.AuthController.resendOtp);
exports.router.post("/logout", auth_middleware_1.authMiddleware, auth_controller_1.AuthController.logout);
exports.router.post("/forget-password", authLimiter, (0, validateRequest_1.default)(auth_validation_1.emailSchema), auth_controller_1.AuthController.forgetPassword);
exports.router.post("/reset-password", authLimiter, (0, validateRequest_1.default)(auth_validation_1.resetPasswordSchema), auth_controller_1.AuthController.resetPassword);
exports.authRoutes = exports.router;
