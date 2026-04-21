import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { prisma } from "../../shared/prisma";
import sendResponse from "../../shared/sendResponse";
import { MerchantService } from "./merchant.service";
import { fileUploader } from "../../helper/fileUploader";

const personalDetails = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const file = req.file;

  let profilePhoto = undefined;
  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    profilePhoto = uploadResult?.secure_url;
  }

  const payload = {
    ...req.body,
    userId: user.userId,
    profilePhoto,
  };

  const result = await MerchantService.personalDetails(payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Personal details submitted successfully",
    data: result,
  });
});

const getPersonalDetails = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.getPersonalDetails(user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Personal details fetched successfully",
    data: result,
  });
});

const businessDetails = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const file = req.file;

  let businessLogo = undefined;
  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    businessLogo = uploadResult?.secure_url;
  }

  const payload = {
    ...req.body,
    userId: user.userId,
    businessLogo,
  };

  const result = await MerchantService.businessDetails(payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Business details submitted successfully",
    data: result,
  });
});

const getBusinessDetails = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.getBusinessDetails(user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Business details fetched successfully",
    data: result,
  });
});

const documents = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const docsPayload: any = { userId: user.userId };

  if (files) {
    const uploadPromises = Object.keys(files).map(async (key) => {
      const file = files[key][0];
      const uploadResult = await fileUploader.uploadToCloudinary(file);
      docsPayload[key] = uploadResult?.secure_url;
    });
    await Promise.all(uploadPromises);
  }

  const result = await MerchantService.documents(docsPayload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Documents submitted successfully",
    data: result,
  });
});

const getDocuments = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.getDocuments(user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Documents fetched successfully",
    data: result,
  });
});

const payments = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const payload = {
    ...req.body,
    userId: user.userId,
  };

  const result = await MerchantService.payments(payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment submitted successfully",
    data: result,
  });
});

const completeOnboarding = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.completeOnboarding(user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Merchant application submitted successfully",
    data: result,
  });
});


const getPayments = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.getPayments(user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments fetched successfully",
    data: result,
  });
});

const getOnboardingConfig = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const config = await MerchantService.getOnboardingConfig();

  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId: user.userId },
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Onboarding configuration fetched successfully",
    data: {
      ...config,
      isSubmitted: merchantDetails?.isSubmitted || false,
    },
  });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.getDashboardStats(user.userId, req.query as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard statistics fetched successfully",
    data: result,
  });
});

const updateSteadfastConfig = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.updateSteadfastConfig(user.userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Steadfast configuration updated successfully",
    data: result,
  });
});

const getSteadfastConfig = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await MerchantService.getSteadfastConfig(user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Steadfast configuration fetched successfully",
    data: result,
  });
});

export const MerchantController = {
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
  updateSteadfastConfig,
  getSteadfastConfig,
};
