import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const getAppliedMerchant = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await AdminService.getAppliedMerchant();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Applied merchant list fetched successfully",
    data: result,
  });
});

const getAppliedMerchantPersonalDetails = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const id = req.params.id;
    const result = await AdminService.getAppliedMerchantPersonalDetails(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Applied merchant personal details fetched successfully",
      data: result,
    });
  },
);

const approveProfilePhoto = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await AdminService.approveProfilePhoto(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile photo approved.",
    data: result,
  });
});

const approvePhaseOne = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.approvePhaseOne(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Phase one verified.",
    data: result,
  });
});

const getAppliedMerchantBusinessDetails = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const id = req.params.id;
    const result = await AdminService.getAppliedMerchantBusinessDetails(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Applied merchant business details fetched successfully",
      data: result,
    });
  },
);

const approveBusinessPhoto = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.approveBusinessPhoto(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Business photo approved.",
    data: result,
  });
});

const approvePhaseTwo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.approvePhaseTwo(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Phase two verified.",
    data: result,
  });
});

const getAppliedMerchantDocuments = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const id = req.params.id;
    const result = await AdminService.getAppliedMerchantDocuments(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Applied merchant documents fetched successfully",
      data: result,
    });
  },
);

const approvePhaseThree = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.approvePhaseThree(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Phase three verified.",
    data: result,
  });
});

const getAppliedMerchantPayments = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const id = req.params.id;
    const result = await AdminService.getAppliedMerchantPayments(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Applied merchant payments fetched successfully",
      data: result,
    });
  },
);

const approvePhaseFour = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.approvePhaseFour(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Phase four verified.",
    data: result,
  });
});

const getApprovedMerchant = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getApprovedMerchant();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Approved merchant list fetched successfully",
    data: result,
  });
});

const getMerchantProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.getMerchantProfile(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Merchant profile fetched successfully",
    data: result,
  });
});

export const AdminController = {
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
