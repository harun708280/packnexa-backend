import { z } from "zod";

const createWithdrawRequest = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string(),
  accountDetails: z.string(),
});

const addFund = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
});

export const BillingValidation = {
  createWithdrawRequest,
  addFund,
  upsertBillingRule: z.object({
    id: z.string().optional(),
    category: z.string(),
    quantityThreshold: z.number().int().positive(),
    unitValue: z.number().positive(),
    description: z.string().optional(),
  }),
  updateMerchantBilling: z.object({
    unitRate: z.number().nonnegative().optional(),
    creditLimit: z.number().nonnegative().optional(),
    billingCycle: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
    storageRackCount: z.number().int().nonnegative().optional(),
    storageRackRate: z.number().nonnegative().optional(),
    packingVatPercentage: z.number().min(0).max(100).optional(),
    returnVatPercentage: z.number().min(0).max(100).optional(),
    storageVatPercentage: z.number().min(0).max(100).optional(),
  }),
  updateWithdrawStatus: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
  }),
  createDepositRequest: z.object({
    amount: z.number().positive(),
    paymentMethod: z.string(),
    transactionId: z.string().optional(),
    senderAccount: z.string().optional(),
  }),
  updateDepositStatus: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    adminNote: z.string().optional(),
  }),
};
