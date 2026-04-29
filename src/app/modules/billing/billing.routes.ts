import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserRole } from "@prisma/client";
import { BillingController } from "./billing.controller";
import { BillingValidation } from "./billing.validation";

const router = express.Router();

router.get(
  "/my-transactions",
  auth(UserRole.MERCHANT),
  BillingController.getMyTransactions
);

router.post(
  "/withdraw",
  auth(UserRole.MERCHANT),
  validateRequest(BillingValidation.createWithdrawRequest),
  BillingController.requestWithdraw
);

router.get(
  "/my-withdrawals",
  auth(UserRole.MERCHANT),
  BillingController.getMyWithdrawRequests
);

router.post(
  "/add-fund",
  auth(UserRole.MERCHANT),
  validateRequest(BillingValidation.addFund),
  BillingController.addFundMock
);

router.get(
  "/my-invoices",
  auth(UserRole.MERCHANT),
  BillingController.getMyInvoices
);

router.post(
  "/deposit-request",
  auth(UserRole.MERCHANT),
  validateRequest(BillingValidation.createDepositRequest),
  BillingController.createDepositRequest
);

router.get(
  "/my-deposit-requests",
  auth(UserRole.MERCHANT),
  BillingController.getMyDepositRequests
);

// Admin routes
router.get(
  "/withdraw-requests",
  auth(UserRole.ADMIN),
  BillingController.getWithdrawRequests
);

router.patch(
  "/withdraw/:id",
  auth(UserRole.ADMIN),
  validateRequest(BillingValidation.updateWithdrawStatus),
  BillingController.updateWithdrawStatus
);

router.get(
  "/rules",
  auth(UserRole.ADMIN),
  BillingController.getBillingRules
);

router.post(
  "/rules",
  auth(UserRole.ADMIN),
  validateRequest(BillingValidation.upsertBillingRule),
  BillingController.upsertBillingRule
);

router.patch(
  "/merchant/:id",
  auth(UserRole.ADMIN),
  validateRequest(BillingValidation.updateMerchantBilling),
  BillingController.updateMerchantBilling
);

router.get(
  "/all-invoices",
  auth(UserRole.ADMIN),
  BillingController.getAllInvoices
);

router.patch(
  "/invoice/:id/status",
  auth(UserRole.ADMIN),
  BillingController.updateInvoiceStatus
);

router.get(
  "/invoice/:id",
  auth(UserRole.ADMIN, UserRole.MERCHANT),
  BillingController.getInvoiceById
);

router.get(
  "/deposit-requests",
  auth(UserRole.ADMIN),
  BillingController.getAllDepositRequests
);

router.patch(
  "/deposit/:id",
  auth(UserRole.ADMIN),
  validateRequest(BillingValidation.updateDepositStatus),
  BillingController.updateDepositStatus
);

router.get(
  "/all-transactions",
  auth(UserRole.ADMIN),
  BillingController.getAllTransactions
);

router.get(
  "/admin-payments",
  auth(UserRole.ADMIN, UserRole.MERCHANT),
  BillingController.getAdminPaymentMethods
);

router.post(
  "/admin-payments",
  auth(UserRole.ADMIN),
  BillingController.upsertAdminPaymentMethod
);

router.post(
  "/process-monthly-storage",
  auth(UserRole.ADMIN),
  BillingController.processMonthlyStorageCharges
);

router.post(
  "/settle-storage/:id",
  auth(UserRole.ADMIN),
  BillingController.settleMerchantStorage
);

router.get(
  "/admin-finance-stats",
  auth(UserRole.ADMIN),
  BillingController.getAdminFinanceStats
);

export const BillingRoutes = router;
