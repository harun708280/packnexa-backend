import { z } from "zod";

export const merchantPersonalDetailsSchema = z.object({
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.coerce.date(),
  secondaryContactNumber: z
    .string()
    .min(11, "Secondary contact number must be valid")
    .optional(),
  profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
  location: z.string().optional(),
});

export type MerchantPersonalDetailsInput = z.infer<
  typeof merchantPersonalDetailsSchema
>;

export const merchantBusinessDetailsSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessLogo: z.string().url("Must be a valid URL").optional(),
  businessType: z.string().optional(),
  facebookPageLink: z.string().url().optional(),
  websiteLink: z.string().url().optional(),
  dailyOrderEstimate: z.number().int().positive().optional(),
  storageSpace: z.string().optional(),
  courierPartner: z.string().optional(),
  paymentMethods: z.string().optional(),
  pickupHub: z.string().optional(),
  bio: z.string().max(500).optional(),
  businessLocation: z.string().optional(),
  subscriptionType: z.string().optional(),
});

export type MerchantBusinessDetailsInput = z.infer<
  typeof merchantBusinessDetailsSchema
>;

export const merchantDocumentsSchema = z.object({
  nidFront: z.string().url().optional(),
  nidBack: z.string().url().optional(),
  passport: z.string().url().optional(),
  drivingLicense: z.string().url().optional(),
  tradeLicense: z.string().url().optional(),
  tinCertificate: z.string().url().optional(),
  binCertificate: z.string().url().optional(),
  bankDocuments: z.string().url().optional(),
});

export type MerchantDocumentsInput = z.infer<typeof merchantDocumentsSchema>;

export const merchantPaymentsSchema = z.object({
  usedMethod: z.string().min(2, "Payment method is required"),
  paymentNumber: z.string().min(11, "Payment number is required"),
  bankDetails: z.string().min(2, "Bank details is required"),
  // accountName: z.string().min(2, "Account name is required"),
  // accountNumber: z.string().min(2, "Account number is required"),
  // bankName: z.string().min(2, "Bank name is required"),
  // bankCode: z.string().min(2, "Bank code is required"),
  // accountType: z.string().min(2, "Account type is required"),
});

export type MerchantPaymentsInput = z.infer<typeof merchantPaymentsSchema>;
