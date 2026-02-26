"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../../config");
const jwtHelper_1 = require("../helper/jwtHelper");
const authMiddleware = (req, res, next) => {
    let token = req.cookies.accessToken;
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.envVariables.JWT_ACCESS_SECRET);
            req.user = decoded;
            return next();
        }
        catch (_a) { }
    }
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.envVariables.JWT_REFRESH_SECRET);
        const payload = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        const newAccessToken = jwtHelper_1.jwtHelper.generateToken(payload, config_1.envVariables.JWT_ACCESS_SECRET, config_1.envVariables.JWT_ACCESS_EXPIRES);
        const isProduction = config_1.envVariables.NODE_ENV === "production";
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: config_1.envVariables.JWT_ACCESS_EXPIRES_MAX_AGE,
            path: "/",
        });
        req.user = payload;
        return next();
    }
    catch (_b) {
        return res.status(401).json({ success: false, message: "Login again" });
    }
};
exports.authMiddleware = authMiddleware;
