import { PaymentStatus, UserRole } from "@prisma/client";
import { prisma } from "../../shared/prisma";

const getAppliedMerchant = async () => {
  const merchantDetails = await prisma.merchantDetails.findMany({
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
};

const getAppliedMerchantPersonalDetails = async (id: string) => {
  console.log("Fetching personal details for merchant ID:", id);
  const merchant = await prisma.merchantDetails.findUnique({
    where: { id },
    include: {
      user: true,
      personalDetails: true,
    },
  });

  if (!merchant || !merchant.user) {
    throw new Error("No merchant or personal details found");
  }

  return {
    ...merchant.user,
    personalDetails: merchant.personalDetails,
  };
};

const approveProfilePhoto = async (id: string) => {
  const personalDetails = await prisma.personalDetails.findUnique({
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

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPersonal = await tx.personalDetails.update({
      where: { merchantDetailsId: id },
      data: {
        isProfilePhotoVerified: true,
      },
    });

    return updatedPersonal;
  });

  return updated;
};

const approvePhaseOne = async (id: string) => {
  const personalDetails = await prisma.personalDetails.findUnique({
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

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPersonal = await tx.personalDetails.update({
      where: { merchantDetailsId: id },
      data: {
        isVerifiedPhaseOne: true,
      },
    });

    return updatedPersonal;
  });

  return updated;
};

const getAppliedMerchantBusinessDetails = async (id: string) => {
  console.log("Fetching business details for merchant ID:", id);
  const merchant = await prisma.merchantDetails.findUnique({
    where: { id },
    include: {
      businessDetails: true,
    },
  });

  if (!merchant) {
    throw new Error("No business details found");
  }

  return merchant;
};

const approveBusinessPhoto = async (id: string) => {
  const businessDetails = await prisma.businessDetails.findUnique({
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

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBusiness = await tx.businessDetails.update({
      where: { merchantDetailsId: id },
      data: {
        isBusinessLogoVerified: true,
      },
    });

    return updatedBusiness;
  });

  return updated;
};

const approvePhaseTwo = async (id: string) => {
  const businessDetails = await prisma.businessDetails.findUnique({
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

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBusiness = await tx.businessDetails.update({
      where: { merchantDetailsId: id },
      data: {
        isVerifiedPhaseTwo: true,
      },
    });

    return updatedBusiness;
  });

  return updated;
};

const getAppliedMerchantDocuments = async (id: string) => {
  console.log("Fetching documents for merchant ID:", id);
  const merchant = await prisma.merchantDetails.findUnique({
    where: { id },
    include: {
      documents: true,
    },
  });

  if (!merchant) {
    throw new Error("No documents found");
  }

  return merchant;
};

const approvePhaseThree = async (id: string) => {
  const documents = await prisma.documents.findUnique({
    where: { merchantDetailsId: id },
  });

  if (!documents) {
    throw new Error("Documents not found");
  }

  if (documents.isVerifiedPhaseThree) {
    throw new Error("Phase three already verified");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedDocuments = await tx.documents.update({
      where: { merchantDetailsId: id },
      data: {
        isVerifiedPhaseThree: true,
      },
    });

    return updatedDocuments;
  });

  return updated;
};

const getAppliedMerchantPayments = async (id: string) => {
  console.log("Fetching payments for merchant ID:", id);
  const merchant = await prisma.merchantDetails.findUnique({
    where: { id },
    include: {
      payments: true,
    },
  });

  if (!merchant) {
    throw new Error("No data found");
  }

  return merchant;
};

const approvePhaseFour = async (id: string) => {
  const merchant = await prisma.merchantDetails.findUnique({
    where: { id },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  const payments = await prisma.payments.findFirst({
    where: { merchantDetailsId: id },
  });

  if (!payments) {
    throw new Error("Payment record not found");
  }

  if (payments.isVerifiedPhaseFour) {
    throw new Error("Phase four already verified");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayments = await tx.payments.update({
      where: { id: payments.id },
      data: {
        isVerifiedPhaseFour: true,
        status: PaymentStatus.APPROVED,
      },
    });

    await tx.merchantDetails.update({
      where: { id },
      data: {
        isVerified: true,
      },
    });

    await tx.user.update({
      where: { id: merchant.userId },
      data: {
        role: UserRole.MERCHANT,
      },
    });

    return updatedPayments;
  });

  return updated;
};

const getApprovedMerchant = async () => {
  const merchantDetails = await prisma.merchantDetails.findMany({
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
};

const getMerchantProfile = async (id: string) => {
  const merchant = await prisma.merchantDetails.findUnique({
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
};

export const AdminService = {
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
