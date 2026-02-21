import { z } from "zod";

const createUserZodSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters"),

  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),

  email: z.string().nonempty("Email is required"),

  password: z
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

  contactNumber: z
    .string()
    .regex(/^[0-9]{11}$/, "Contact number must be 11 digits"),
});

export const UserValidation = { createUserZodSchema };
