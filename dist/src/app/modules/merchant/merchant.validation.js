"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantPaymentsSchema = exports.merchantDocumentsSchema = exports.merchantBusinessDetailsSchema = exports.merchantPersonalDetailsSchema = void 0;
const zod_1 = require("zod");
exports.merchantPersonalDetailsSchema = zod_1.z.object({
    gender: zod_1.z.enum(["MALE", "FEMALE"]),
    dateOfBirth: zod_1.z.coerce.date(),
    secondaryContactNumber: zod_1.z
        .string()
        .min(11, "Secondary contact number must be valid")
        .optional(),
    profilePhoto: zod_1.z.string().url("Profile photo must be a valid URL").optional(),
    location: zod_1.z.string().optional(),
});
exports.merchantBusinessDetailsSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2, "Business name is required"),
    businessLogo: zod_1.z.string().url("Must be a valid URL").optional(),
    businessType: zod_1.z.string().optional(),
    facebookPageLink: zod_1.z.string().url().optional(),
    websiteLink: zod_1.z.string().url().optional(),
    dailyOrderEstimate: zod_1.z.number().int().positive().optional(),
    storageSpace: zod_1.z.string().optional(),
    courierPartner: zod_1.z.string().optional(),
    paymentMethods: zod_1.z.string().optional(),
    pickupHub: zod_1.z.string().optional(),
    bio: zod_1.z.string().max(500).optional(),
    businessLocation: zod_1.z.string().optional(),
    subscriptionType: zod_1.z.string().optional(),
});
exports.merchantDocumentsSchema = zod_1.z.object({
    nidFront: zod_1.z.string().url().optional(),
    nidBack: zod_1.z.string().url().optional(),
    passport: zod_1.z.string().url().optional(),
    drivingLicense: zod_1.z.string().url().optional(),
    tradeLicense: zod_1.z.string().url().optional(),
    tinCertificate: zod_1.z.string().url().optional(),
    binCertificate: zod_1.z.string().url().optional(),
    bankDocuments: zod_1.z.string().url().optional(),
});
exports.merchantPaymentsSchema = zod_1.z.object({
    usedMethod: zod_1.z.string().min(2, "Payment method is required"),
    paymentNumber: zod_1.z.string().min(11, "Payment number is required"),
    bankDetails: zod_1.z.string().min(2, "Bank details is required"),
});
