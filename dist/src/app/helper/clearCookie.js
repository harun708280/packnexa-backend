"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = void 0;
const config_1 = require("../../config");
const clearAuthCookies = (res) => {
    const isProduction = config_1.envVariables.NODE_ENV === "production";
    ["accessToken", "refreshToken"].forEach((cookie) => res.clearCookie(cookie, {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
    }));
};
exports.clearAuthCookies = clearAuthCookies;
