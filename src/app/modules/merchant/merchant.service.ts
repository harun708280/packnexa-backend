import { prisma } from "../../shared/prisma";

const personalDetails = async (payload: any) => {
  const {
    userId,
    gender,
    dateOfBirth,
    secondaryContactNumber,
    profilePhoto,
    location,
  } = payload;

  let merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    merchantDetails = await prisma.merchantDetails.create({
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

  const existingPersonalDetails = await prisma.personalDetails.findUnique({
    where: { merchantDetailsId: merchantDetails.id },
  });

  const result = existingPersonalDetails
    ? await prisma.personalDetails.update({
      where: { merchantDetailsId: merchantDetails.id },
      data: personalData,
    })
    : await prisma.personalDetails.create({
      data: {
        merchantDetailsId: merchantDetails.id,
        ...personalData,
      },
    });

  return result;
};

const getPersonalDetails = async (userId: string) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }

  const personalDetails = await prisma.personalDetails.findUnique({
    where: { merchantDetailsId: merchantDetails.id },
  });

  if (!personalDetails) {
    return null;
  }

  return personalDetails;
};

const businessDetails = async (payload: any) => {
  const {
    userId,
    businessLogo,
    businessName,
    businessType,
    facebookPageLink,
    websiteLink,
    dailyOrderEstimate,
    storageSpace,
    courierPartner,
    paymentMethods,
    pickupHub,
    bio,
    businessLocation,
  } = payload;

  let merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    merchantDetails = await prisma.merchantDetails.create({ data: { userId } });
  }

  const existing = await prisma.businessDetails.findUnique({
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
    ? prisma.businessDetails.update({
      where: { merchantDetailsId: merchantDetails.id },
      data: businessData,
    })
    : prisma.businessDetails.create({
      data: {
        merchantDetailsId: merchantDetails.id,
        ...businessData,
      },
    });
};

const getBusinessDetails = async (userId: string) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) return null;

  const { isVerifiedPhaseTwo, merchantDetailsId, ...rest } =
    (await prisma.businessDetails.findUnique({
      where: { merchantDetailsId: merchantDetails.id },
    })) || {};

  return rest;
};

const documents = async (payload: any) => {
  const {
    userId,
    nidFront,
    nidBack,
    passport,
    drivingLicense,
    tradeLicense,
    tinCertificate,
    binCertificate,
    bankDocuments,
  } = payload;

  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) throw new Error("Merchant not found");

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

  const existing = await prisma.documents.findUnique({
    where: { merchantDetailsId: merchantDetails.id },
  });

  return existing
    ? prisma.documents.update({
      where: { merchantDetailsId: merchantDetails.id },
      data: docData,
    })
    : prisma.documents.create({
      data: {
        merchantDetailsId: merchantDetails.id,
        ...docData,
      },
    });
};

const getDocuments = async (userId: string) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    return null;
  }

  const documents = await prisma.documents.findUnique({
    where: { merchantDetailsId: merchantDetails.id },
  });

  if (!documents) {
    return null;
  }

  const {
    status,
    reviewReason,
    isVerifiedPhaseThree,
    merchantDetailsId,
    ...rest
  } = documents;

  return rest;
};

const completeOnboarding = async (userId: string) => {
  return prisma.merchantDetails.update({
    where: { userId },
    data: { isSubmitted: true },
  });
};

const payments = async (payload: any) => {
  const { userId, id, ...rest } = payload;

  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) throw new Error("Merchant not found");

  if (id) {
    return prisma.payments.update({
      where: { id },
      data: {
        ...rest,
        status: "PENDING",
      },
    });
  }

  return prisma.payments.create({
    data: {
      merchantDetailsId: merchantDetails.id,
      status: "PENDING",
      ...rest,
    },
  });
};

const getPayments = async (userId: string) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) return [];

  return prisma.payments.findMany({
    where: { merchantDetailsId: merchantDetails.id },
    orderBy: { createdAt: "desc" },
  });
};

const getOnboardingConfig = async () => {
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
};

const getDashboardStats = async (userId: string) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant not found");
  }

  const merchantId = merchantDetails.id;

  // 1. Total Orders
  const totalOrders = await prisma.order.count({
    where: { merchantDetailsId: merchantId },
  });

  // 2. Total Products
  const totalProducts = await prisma.product.count({
    where: { merchantDetailsId: merchantId },
  });

  // 3. Stock Value
  const variants = await prisma.productVariant.findMany({
    where: { merchantDetailsId: merchantId },
    include: { pricing: true },
  });

  const stockValue = variants.reduce((acc, curr) => {
    return acc + curr.quantity * (curr.pricing?.salePrice || 0);
  }, 0);

  // 4. Total Sales
  const totalSalesData = await prisma.order.aggregate({
    where: {
      merchantDetailsId: merchantId,
      status: "DELIVERED",
    },
    _sum: { totalPayable: true },
  });
  const totalSales = totalSalesData._sum.totalPayable || 0;

  // 5. Order Fulfillment Breakdown
  const fulfillment = await prisma.order.groupBy({
    by: ["status"],
    where: { merchantDetailsId: merchantId },
    _count: { id: true },
  });

  // 6. Sales Trend (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const salesTrend = await Promise.all(
    last7Days.map(async (date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailyTotal = await prisma.order.aggregate({
        where: {
          merchantDetailsId: merchantId,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: { totalPayable: true },
      });

      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        value: dailyTotal._sum.totalPayable || 0,
      };
    })
  );

  return {
    totalOrders,
    totalProducts,
    stockValue,
    totalSales,
    fulfillment: fulfillment.map((f) => ({
      status: f.status,
      count: f._count.id,
    })),
    salesTrend,
  };
};

export const MerchantService = {
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
  getDashboardStats,
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
