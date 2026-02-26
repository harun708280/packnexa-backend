"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.emailSchema = exports.verifyOtpSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z
    .object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
})
    .strict();
exports.verifyOtpSchema = zod_1.z
    .object({
    email: zod_1.z.email(),
    otp: zod_1.z
        .string()
        .length(6, "OTP must be 6 digits")
        .regex(/^\d+$/, "OTP must be numeric"),
})
    .strict();
exports.emailSchema = zod_1.z
    .object({
    email: zod_1.z.email(),
})
    .strict();
exports.resetPasswordSchema = zod_1.z
    .object({
    email: zod_1.z.email(),
    otp: zod_1.z
        .string()
        .length(6, "OTP must be 6 digits")
        .regex(/^\d+$/, "OTP must be numeric"),
    newPassword: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .refine((val) => /[A-Z]/.test(val), {
        message: "Password must contain at least one uppercase letter",
    })
        .refine((val) => /[a-z]/.test(val), {
        message: "Password must contain at least one lowercase letter",
    })
        .refine((val) => /\d/.test(val), {
        message: "Password must contain at least one number",
    })
        .refine((val) => /[@$!%*?&#^()[\]{}_\-]/.test(val), {
        message: "Password must contain at least one special character",
    }),
})
    .strict();
