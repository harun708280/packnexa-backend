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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../shared/prisma");
const getAppliedMerchant = () => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findMany({
        where: {
            isSubmitted: true,
            isVerified: false,
        },
        select: {
            id: true,
            isVerified: true,
            updatedAt: true,
            personalDetails: {
                select: {
                    gender: true,
                    profilePhoto: true,
                    isVerifiedPhaseOne: true,
                },
            },
            businessDetails: {
                select: {
                    businessName: true,
                    businessType: true,
                    isVerifiedPhaseTwo: true,
                },
            },
            documents: {
                select: {
                    isVerifiedPhaseThree: true,
                },
            },
            payments: {
                select: {
                    isVerifiedPhaseFour: true,
                },
            },
            user: {
                select: {
                    email: true,
                    contactNumber: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });
    if (!merchantDetails) {
        throw new Error("No applied merchant found");
    }
    return merchantDetails;
});
const getAppliedMerchantPersonalDetails = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Fetching personal details for merchant ID:", id);
    const merchant = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { id },
        include: {
            user: true,
            personalDetails: true,
        },
    });
    if (!merchant || !merchant.user) {
        throw new Error("No merchant or personal details found");
    }
    return Object.assign(Object.assign({}, merchant.user), { personalDetails: merchant.personalDetails });
});
const approveProfilePhoto = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const personalDetails = yield prisma_1.prisma.personalDetails.findUnique({
        where: { merchantDetailsId: id },
    });
    console.log(personalDetails);
    if (!personalDetails) {
        throw new Error("Personal details not found");
    }
    if (!personalDetails.profilePhoto) {
        throw new Error("Profile photo not uploaded");
    }
    if (personalDetails.isProfilePhotoVerified) {
        throw new Error("Profile photo already verified");
    }
    const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedPersonal = yield tx.personalDetails.update({
            where: { merchantDetailsId: id },
            data: {
                isProfilePhotoVerified: true,
            },
        });
        return updatedPersonal;
    }));
    return updated;
});
const approvePhaseOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const personalDetails = yield prisma_1.prisma.personalDetails.findUnique({
        where: { merchantDetailsId: id },
    });
    if (!personalDetails) {
        throw new Error("Personal details not found");
    }
    if (!personalDetails.profilePhoto) {
        throw new Error("Profile photo not uploaded");
    }
    if (personalDetails.isVerifiedPhaseOne) {
        throw new Error("Phase one already verified");
    }
    const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedPersonal = yield tx.personalDetails.update({
            where: { merchantDetailsId: id },
            data: {
                isVerifiedPhaseOne: true,
            },
        });
        return updatedPersonal;
    }));
    return updated;
});
const getAppliedMerchantBusinessDetails = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Fetching business details for merchant ID:", id);
    const merchant = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { id },
        include: {
            businessDetails: true,
        },
    });
    if (!merchant) {
        throw new Error("No business details found");
    }
    return merchant;
});
const approveBusinessPhoto = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const businessDetails = yield prisma_1.prisma.businessDetails.findUnique({
        where: { merchantDetailsId: id },
    });
    console.log(businessDetails);
    if (!businessDetails) {
        throw new Error("Business details not found");
    }
    if (!businessDetails.businessLogo) {
        throw new Error("Business logo not uploaded");
    }
    if (businessDetails.isBusinessLogoVerified) {
        throw new Error("Business logo already verified");
    }
    const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedBusiness = yield tx.businessDetails.update({
            where: { merchantDetailsId: id },
            data: {
                isBusinessLogoVerified: true,
            },
        });
        return updatedBusiness;
    }));
    return updated;
});
const approvePhaseTwo = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const businessDetails = yield prisma_1.prisma.businessDetails.findUnique({
        where: { merchantDetailsId: id },
    });
    if (!businessDetails) {
        throw new Error("Business details not found");
    }
    if (!businessDetails.businessLogo) {
        throw new Error("Business Logo not uploaded");
    }
    if (businessDetails.isVerifiedPhaseTwo) {
        throw new Error("Phase two already verified");
    }
    const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedBusiness = yield tx.businessDetails.update({
            where: { merchantDetailsId: id },
            data: {
                isVerifiedPhaseTwo: true,
            },
        });
        return updatedBusiness;
    }));
    return updated;
});
const getAppliedMerchantDocuments = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Fetching documents for merchant ID:", id);
    const merchant = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { id },
        include: {
            documents: true,
        },
    });
    if (!merchant) {
        throw new Error("No documents found");
    }
    return merchant;
});
const approvePhaseThree = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const documents = yield prisma_1.prisma.documents.findUnique({
        where: { merchantDetailsId: id },
    });
    if (!documents) {
        throw new Error("Documents not found");
    }
    if (documents.isVerifiedPhaseThree) {
        throw new Error("Phase three already verified");
    }
    const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedDocuments = yield tx.documents.update({
            where: { merchantDetailsId: id },
            data: {
                isVerifiedPhaseThree: true,
            },
        });
        return updatedDocuments;
    }));
    return updated;
});
const getAppliedMerchantPayments = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Fetching payments for merchant ID:", id);
    const merchant = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { id },
        include: {
            payments: true,
        },
    });
    if (!merchant) {
        throw new Error("No data found");
    }
    return merchant;
});
const approvePhaseFour = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { id },
    });
    if (!merchant) {
        throw new Error("Merchant not found");
    }
    const payments = yield prisma_1.prisma.payments.findFirst({
        where: { merchantDetailsId: id },
    });
    if (!payments) {
        throw new Error("Payment record not found");
    }
    if (payments.isVerifiedPhaseFour) {
        throw new Error("Phase four already verified");
    }
    const updated = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const updatedPayments = yield tx.payments.update({
            where: { id: payments.id },
            data: {
                isVerifiedPhaseFour: true,
                status: client_1.PaymentStatus.APPROVED,
            },
        });
        yield tx.merchantDetails.update({
            where: { id },
            data: {
                isVerified: true,
            },
        });
        yield tx.user.update({
            where: { id: merchant.userId },
            data: {
                role: client_1.UserRole.MERCHANT,
            },
        });
        return updatedPayments;
    }));
    return updated;
});
const getApprovedMerchant = () => __awaiter(void 0, void 0, void 0, function* () {
    const merchantDetails = yield prisma_1.prisma.merchantDetails.findMany({
        where: {
            isSubmitted: true,
            isVerified: true,
        },
        select: {
            id: true,
            updatedAt: true,
            user: {
                select: {
                    email: true,
                    contactNumber: true,
                    firstName: true,
                    lastName: true,
                },
            },
            businessDetails: {
                select: {
                    businessName: true,
                    businessType: true,
                },
            },
            personalDetails: {
                select: {
                    profilePhoto: true,
                    gender: true,
                },
            },
        },
    });
    if (!merchantDetails) {
        throw new Error("No applied merchant found");
    }
    return merchantDetails;
});
const getMerchantProfile = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const merchant = yield prisma_1.prisma.merchantDetails.findUnique({
        where: { id },
        include: {
            user: true,
            personalDetails: true,
            businessDetails: true,
            documents: true,
            payments: true,
        },
    });
    if (!merchant) {
        throw new Error("Merchant not found");
    }
    return merchant;
});
exports.AdminService = {
    getAppliedMerchant,
    getAppliedMerchantPersonalDetails,
    approveProfilePhoto,
    approvePhaseOne,
    getAppliedMerchantBusinessDetails,
    approveBusinessPhoto,
    approvePhaseTwo,
    getAppliedMerchantDocuments,
    approvePhaseThree,
    getAppliedMerchantPayments,
    approvePhaseFour,
    getApprovedMerchant,
    getMerchantProfile,
};
