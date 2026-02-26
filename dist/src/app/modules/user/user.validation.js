"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const createUserZodSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .trim()
        .min(2, "First name must be at least 2 characters"),
    lastName: zod_1.z.string().trim().min(2, "Last name must be at least 2 characters"),
    email: zod_1.z.string().nonempty("Email is required"),
    password: zod_1.z
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
    contactNumber: zod_1.z
        .string()
        .regex(/^[0-9]{11}$/, "Contact number must be 11 digits"),
});
exports.UserValidation = { createUserZodSchema };
