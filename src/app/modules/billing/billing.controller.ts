import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { BillingService } from "./billing.service";
import { TransactionType, TransactionCategory } from "@prisma/client";
import { prisma } from "../../shared/prisma";

const requestWithdraw = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const merchant = await BillingService.requestWithdraw(
    user.userId,
    req.body.amount,
    req.body.paymentMethod,
    req.body.accountDetails
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Withdraw request submitted successfully",
    data: merchant,
  });
});

const addFundMock = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const merchant = await prisma.merchantDetails.findUnique({
    where: { userId: user.userId }
  });

  if (!merchant) {
    throw new Error("Merchant details not found");
  }

  const transaction = await BillingService.createTransaction({
    merchantDetailsId: merchant.id,
    amount: req.body.amount,
    type: TransactionType.CREDIT,
    category: TransactionCategory.FUND_ADD,
    description: req.body.description || "Fund added manually"
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fund added successfully",
    data: transaction,
  });
});

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await BillingService.getTransactions(user.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transactions fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await BillingService.getInvoices(user.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoices fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllInvoices = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.getGlobalInvoices(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All invoices fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateInvoiceStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const invoice = await BillingService.updateInvoiceStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice status updated successfully",
    data: invoice,
  });
});

const getInvoiceById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BillingService.getInvoiceById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice fetched successfully",
    data: result,
  });
});

const getWithdrawRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.getWithdrawRequests(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Withdraw requests fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyWithdrawRequests = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await BillingService.getMyWithdrawRequests(user.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your withdraw requests fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateWithdrawStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const request = await BillingService.updateWithdrawStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Withdraw status updated successfully",
    data: request,
  });
});

const getBillingRules = catchAsync(async (req: Request, res: Response) => {
  const rules = await BillingService.getBillingRules();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Billing rules fetched successfully",
    data: rules,
  });
});

const upsertBillingRule = catchAsync(async (req: Request, res: Response) => {
  const rule = await BillingService.upsertBillingRule(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Billing rule saved successfully",
    data: rule,
  });
});

const updateMerchantBilling = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const merchant = await BillingService.updateMerchantBilling(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant billing updated successfully",
    data: merchant,
  });
});

const createDepositRequest = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const deposit = await BillingService.createDepositRequest(user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Deposit request submitted successfully",
    data: deposit,
  });
});

const getAllDepositRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.getDepositRequests(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Deposit requests fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyDepositRequests = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await BillingService.getMyDepositRequests(user.userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your deposit requests fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateDepositStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deposit = await BillingService.updateDepositStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Deposit ${req.body.status.toLowerCase()} successfully`,
    data: deposit,
  });
});

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.getAllTransactions(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transactions fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAdminPaymentMethods = catchAsync(async (req: Request, res: Response) => {
  const onlyActive = req.query.onlyActive === "true";
  const result = await BillingService.getAdminPaymentMethods(onlyActive);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin payment methods fetched successfully",
    data: result,
  });
});

const upsertAdminPaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.upsertAdminPaymentMethod(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment method updated successfully",
    data: result,
  });
});

const processMonthlyStorageCharges = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.processMonthlyStorageCharges();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Monthly storage charges processed successfully",
    data: result,
  });
});

const settleMerchantStorage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BillingService.settleMerchantStorage(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Merchant storage settled successfully",
    data: result,
  });
});

const getAdminFinanceStats = catchAsync(async (req: Request, res: Response) => {
  const result = await BillingService.getAdminFinanceStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin finance stats fetched successfully",
    data: result,
  });
});

export const BillingController = {
  requestWithdraw,
  addFundMock,
  getMyTransactions,
  getMyInvoices,
  getAllInvoices,
  updateInvoiceStatus,
  getWithdrawRequests,
  updateWithdrawStatus,
  getBillingRules,
  upsertBillingRule,
  updateMerchantBilling,
  createDepositRequest,
  getAllDepositRequests,
  getMyDepositRequests,
  updateDepositStatus,
  getMyWithdrawRequests,
  getAllTransactions,
  getAdminPaymentMethods,
  upsertAdminPaymentMethod,
  processMonthlyStorageCharges,
  getInvoiceById,
  settleMerchantStorage,
  getAdminFinanceStats,
};

