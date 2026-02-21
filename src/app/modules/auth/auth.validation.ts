import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z
  .object({
    email: z.email(),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
  })
  .strict();

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const emailSchema = z
  .object({
    email: z.email(),
  })
  .strict();

export type EmailInput = z.infer<typeof emailSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.email(),

    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),

    newPassword: z
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

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
