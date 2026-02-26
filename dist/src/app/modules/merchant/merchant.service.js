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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantService = void 0;
const prisma_1 = require("../../shared/prisma");
const personalDetails = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, gender, dateOfBirth, secondaryContactNumber, profilePhoto, location, } = payload;
    let merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        merchantDetails = yield prisma_1.prisma.merchantDetails.create({
            data: { userId },
        });
    }
    const personalData = {
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        secondaryContactNumber,
        profilePhoto,
        location,
    };
    const existingPersonalDetails = yield prisma_1.prisma.personalDetails.findUnique({
        where: { merchantDetailsId: merchantDetails.id },
    });
    const result = existingPersonalDetails
        ? yield prisma_1.prisma.personalDetails.update({
            where: { merchantDetailsId: merchantDetails.id },
            data: personalData,
        })
        : yield prisma_1.prisma.personalDetails.create({
            data: Object.assign({ merchantDetailsId: merchantDetails.id }, personalData),
        });
    return result;
});
const getPersonalDetails = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        throw new Error("Merchant details not found");
    }
    const personalDetails = yield prisma_1.prisma.personalDetails.findUnique({
        where: { merchantDetailsId: merchantDetails.id },
    });
    if (!personalDetails) {
        return null;
    }
    return personalDetails;
});
const businessDetails = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, businessLogo, businessName, businessType, facebookPageLink, websiteLink, dailyOrderEstimate, storageSpace, courierPartner, paymentMethods, pickupHub, bio, businessLocation, } = payload;
    let merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        merchantDetails = yield prisma_1.prisma.merchantDetails.create({ data: { userId } });
    }
    const existing = yield prisma_1.prisma.businessDetails.findUnique({
        where: { merchantDetailsId: merchantDetails.id },
    });
    const businessData = {
        businessName,
        businessLogo,
        businessType,
        facebookPageLink,
        websiteLink,
        dailyOrderEstimate: dailyOrderEstimate ? Number(dailyOrderEstimate) : null,
        storageSpace,
        courierPartner,
        paymentMethods,
        pickupHub,
        bio,
        businessLocation,
    };
    return existing
        ? prisma_1.prisma.businessDetails.update({
            where: { merchantDetailsId: merchantDetails.id },
            data: businessData,
        })
        : prisma_1.prisma.businessDetails.create({
            data: Object.assign({ merchantDetailsId: merchantDetails.id }, businessData),
        });
});
const getBusinessDetails = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails)
        return null;
    const _a = (yield prisma_1.prisma.businessDetails.findUnique({
        where: { merchantDetailsId: merchantDetails.id },
    })) || {}, { isVerifiedPhaseTwo, merchantDetailsId } = _a, rest = __rest(_a, ["isVerifiedPhaseTwo", "merchantDetailsId"]);
    return rest;
});
const documents = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, nidFront, nidBack, passport, drivingLicense, tradeLicense, tinCertificate, binCertificate, bankDocuments, } = payload;
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails)
        throw new Error("Merchant not found");
    const docData = {
        nidFront,
        nidBack,
        passport,
        drivingLicense,
        tradeLicense,
        tinCertificate,
        binCertificate,
        bankDocuments,
    };
    const existing = yield prisma_1.prisma.documents.findUnique({
        where: { merchantDetailsId: merchantDetails.id },
    });
    return existing
        ? prisma_1.prisma.documents.update({
            where: { merchantDetailsId: merchantDetails.id },
            data: docData,
        })
        : prisma_1.prisma.documents.create({
            data: Object.assign({ merchantDetailsId: merchantDetails.id }, docData),
        });
});
const getDocuments = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails) {
        return null;
    }
    const documents = yield prisma_1.prisma.documents.findUnique({
        where: { merchantDetailsId: merchantDetails.id },
    });
    if (!documents) {
        return null;
    }
    const { status, reviewReason, isVerifiedPhaseThree, merchantDetailsId } = documents, rest = __rest(documents, ["status", "reviewReason", "isVerifiedPhaseThree", "merchantDetailsId"]);
    return rest;
});
const completeOnboarding = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.prisma.merchantDetails.update({
        where: { userId },
        data: { isSubmitted: true },
    });
});
const payments = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, id } = payload, rest = __rest(payload, ["userId", "id"]);
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails)
        throw new Error("Merchant not found");
    if (id) {
        return prisma_1.prisma.payments.update({
            where: { id },
            data: Object.assign(Object.assign({}, rest), { status: "PENDING" }),
        });
    }
    return prisma_1.prisma.payments.create({
        data: Object.assign({ merchantDetailsId: merchantDetails.id, status: "PENDING" }, rest),
    });
});
const getPayments = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { userId },
    });
    if (!merchantDetails)
        return [];
    return prisma_1.prisma.payments.findMany({
        where: { merchantDetailsId: merchantDetails.id },
        orderBy: { createdAt: "desc" },
    });
});
const getOnboardingConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    return {
        steps: [
            {
                id: "personal",
                title: "Personal Details",
                fields: [
                    {
                        name: "gender",
                        label: "Gender",
                        type: "select",
                        options: ["MALE", "FEMALE"],
                        required: true,
                    },
                    {
                        name: "dateOfBirth",
                        label: "Date of Birth",
                        type: "date",
                        required: true,
                    },
                    {
                        name: "secondaryContactNumber",
                        label: "Secondary Contact Number",
                        type: "text",
                        required: false,
                    },
                    {
                        name: "location",
                        label: "Location",
                        type: "text",
                        required: true,
                    },
                    {
                        name: "profilePhoto",
                        label: "Profile Photo",
                        type: "file",
                        required: true,
                    },
                ],
            },
            {
                id: "business",
                title: "Business Details",
                fields: [
                    {
                        name: "businessName",
                        label: "Business Name",
                        type: "text",
                        required: true,
                    },
                    {
                        name: "businessLogo",
                        label: "Business Logo",
                        type: "file",
                        required: false,
                    },
                    {
                        name: "businessType",
                        label: "Business Type",
                        type: "select",
                        options: [
                            "E_COMMERCE",
                            "RETAILER",
                            "DISTRIBUTOR",
                            "IMPORTER",
                            "EXPORTER",
                            "MANUFACTURER",
                        ],
                        required: true,
                    },
                    {
                        name: "facebookPageLink",
                        label: "Facebook Page Link",
                        type: "url",
                        required: false,
                    },
                    {
                        name: "websiteLink",
                        label: "Website Link",
                        type: "url",
                        required: false,
                    },
                    {
                        name: "dailyOrderEstimate",
                        label: "Daily Order Estimate",
                        type: "number",
                        required: false,
                    },
                    {
                        name: "storageSpace",
                        label: "Storage Space",
                        type: "text",
                        required: false,
                    },
                    {
                        name: "courierPartner",
                        label: "Courier Partner",
                        type: "text",
                        required: false,
                    },
                    {
                        name: "paymentMethods",
                        label: "Payment Methods",
                        type: "text",
                        required: false,
                    },
                    {
                        name: "pickupHub",
                        label: "Pickup Hub",
                        type: "text",
                        required: false,
                    },
                    {
                        name: "bio",
                        label: "Bio",
                        type: "textarea",
                        required: false,
                    },
                    {
                        name: "businessLocation",
                        label: "Business Location",
                        type: "text",
                        required: true,
                    },
                ],
            },
            {
                id: "documents",
                title: "Documents",
                fields: [
                    {
                        name: "nidFront",
                        label: "NID Front",
                        type: "file",
                        required: true,
                    },
                    {
                        name: "nidBack",
                        label: "NID Back",
                        type: "file",
                        required: true,
                    },
                    {
                        name: "passport",
                        label: "Passport",
                        type: "file",
                        required: false,
                    },
                    {
                        name: "drivingLicense",
                        label: "Driving License",
                        type: "file",
                        required: false,
                    },
                    {
                        name: "tradeLicense",
                        label: "Trade License",
                        type: "file",
                        required: false,
                    },
                    {
                        name: "tinCertificate",
                        label: "TIN Certificate",
                        type: "file",
                        required: false,
                    },
                    {
                        name: "binCertificate",
                        label: "BIN Certificate",
                        type: "file",
                        required: false,
                    },
                    {
                        name: "bankDocuments",
                        label: "Bank Documents",
                        type: "file",
                        required: false,
                    },
                ],
            },
            {
                id: "payments",
                title: "Payment & Final Submission",
                fields: [
                    {
                        name: "usedMethod",
                        label: "Payment Method",
                        type: "text",
                        required: true,
                    },
                    {
                        name: "paymentNumber",
                        label: "Payment Number",
                        type: "text",
                        required: true,
                    },
                    {
                        name: "bankDetails",
                        label: "Bank Details",
                        type: "textarea",
                        required: true,
                    },
                ],
            },
        ],
    };
});
exports.MerchantService = {
    personalDetails,
    getPersonalDetails,
    businessDetails,
    getBusinessDetails,
    documents,
    getDocuments,
    payments,
    getPayments,
    completeOnboarding,
    getOnboardingConfig,
};
// export const MerchantService1 = {
//   applyMerchant: async (userId: string, data: any) => {
//     const exists = await prisma.merchantProfile.findUnique({
//       where: { userId },
//     });
//     if (exists) throw new Error("Already applied");
//     const merchant = await prisma.merchantProfile.create({
//       data: {
//         userId,
//         businessName: data.businessName,
//         businessType: data.businessType,
//         tradeLicense: data.tradeLicense,
//         pickupAddress: data.pickupAddress,
//         warehouseLocation: data.warehouseLocation,
//         documents: { create: data.documents || [] },
//       },
//       include: { documents: true },
//     });
//     await sendEmail(
//       "admin@packnexa.com",
//       "New Merchant Application",
//       "New merchant applied",
//       `<p>Merchant applied by user ${userId}</p>`,
//     );
//     return merchant;
//   },
//   getAllMerchants: async (filters: any, options: any) => {
//     const { searchTerm, status } = filters;
//     const { skip, limit, sortBy, sortOrder } =
//       paginationHelper.calculatePagination(options);
//     const andConditions: any[] = [];
//     if (searchTerm) {
//       andConditions.push({
//         OR: [
//           { businessName: { contains: searchTerm, mode: "insensitive" } },
//           { businessType: { contains: searchTerm, mode: "insensitive" } },
//         ],
//       });
//     }
//     if (status) andConditions.push({ status });
//     const where = andConditions.length ? { AND: andConditions } : {};
//     const data = await prisma.merchantProfile.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy: { [sortBy]: sortOrder },
//       include: {
//         user: { select: { email: true, firstName: true } },
//         account: true,
//       },
//     });
//     const total = await prisma.merchantProfile.count({ where });
//     return { meta: { total, limit }, data };
//   },
//   approveMerchant: async (merchantId: string, payload: any) => {
//     const merchant = await prisma.merchantProfile.update({
//       where: { id: merchantId },
//       data: {
//         status: "ACTIVE",
//         merchantFeedback: payload.merchantFeedback,
//         adminNote: payload.adminNote,
//       },
//     });
//     await prisma.user.update({
//       where: { id: merchant.userId },
//       data: { role: "MERCHANT" },
//     });
//     const account = await prisma.merchantAccount.create({
//       data: {
//         merchantId,
//         bankAccount: payload.accountData.bankAccount,
//         settlementCycle: payload.accountData.settlementCycle,
//         serviceChargePlan: payload.accountData.serviceChargePlan,
//         apiAccess: payload.accountData.apiAccess ?? false,
//       },
//     });
//     const user = await prisma.user.findUnique({
//       where: { id: merchant.userId },
//     });
//     if (user) {
//       await sendEmail(
//         user.email,
//         "Merchant Approved",
//         "Approved",
//         `<p>Hello ${user.firstName}, your merchant account is active.</p>`,
//       );
//     }
//     return { merchant, account };
//   },
//   rejectMerchant: async (merchantId: string, payload: any) => {
//     const merchant = await prisma.merchantProfile.update({
//       where: { id: merchantId },
//       data: {
//         status: "REJECTED",
//         merchantFeedback: payload.merchantFeedback,
//         adminNote: payload.adminNote,
//       },
//     });
//     const user = await prisma.user.findUnique({
//       where: { id: merchant.userId },
//     });
//     if (user) {
//       await sendEmail(
//         user.email,
//         "Merchant Rejected",
//         "Rejected",
//         `<p>${payload.merchantFeedback || "Application rejected"}</p>`,
//       );
//     }
//     return merchant;
//   },
//   getMyProfile: async (userId: string) => {
//     return prisma.merchantProfile.findUnique({
//       where: { userId },
//       include: {
//         user: true,
//         documents: true,
//         account: true,
//       },
//     });
//   },
//   updateMyProfile: async (userId: string, data: any) => {
//     return prisma.merchantProfile.update({
//       where: { userId },
//       data,
//     });
//   },
// };
