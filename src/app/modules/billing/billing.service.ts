import { PrismaClient, TransactionType, TransactionCategory, WithdrawStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";

/**
 * Helper to generate a unique 7-character transaction ID
 */
const generateTransactionId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getGlobalCreditLimit = async () => {
  const rule = await (prisma as any).globalBillingRule.findFirst({
    where: { category: TransactionCategory.CREDIT_LIMIT, isActive: true }
  });
  return rule?.unitValue || 0;
};

const checkMerchantFulfillmentAbility = async (merchantId: string) => {
  const merchant = await (prisma as any).merchantDetails.findUnique({
    where: { id: merchantId },
    select: { walletBalance: true, creditLimit: true }
  });
  if (!merchant) throw new Error("Merchant not found");

  const globalLimit = await getGlobalCreditLimit();
  const effectiveLimit = merchant.creditLimit > 0 ? merchant.creditLimit : globalLimit;

  if ((merchant.walletBalance || 0) + effectiveLimit <= 0) {
    throw new Error(`Insufficient Balance & Credit Limit. Your available limit is ৳${(merchant.walletBalance + effectiveLimit).toFixed(2)}. Please deposit funds to continue.`);
  }
  return true;
};


const createTransaction = async (payload: {
  merchantDetailsId: string;
  amount: number;
  type: any;
  category: any;
  referenceId?: string;
  description?: string;
  allowNegativeBalance?: boolean;
}, tx?: any) => {
  const client = tx || (prisma as any);


  const merchant = await client.merchantDetails.findUnique({
    where: { id: payload.merchantDetailsId },
    select: { walletBalance: true, creditLimit: true }
  });

  if (!merchant) throw new Error("Merchant not found");


  const amountToChange = payload.type === TransactionType.CREDIT ? payload.amount : -payload.amount;
  const newBalance = (merchant.walletBalance || 0) + amountToChange;


  const globalLimit = await getGlobalCreditLimit();
  const effectiveLimit = merchant.creditLimit > 0 ? merchant.creditLimit : globalLimit;

  if (!payload.allowNegativeBalance && payload.type === TransactionType.DEBIT && newBalance < -effectiveLimit) {
    throw new Error(`Insufficient balance and credit limit. Available: ৳${(merchant.walletBalance + effectiveLimit).toFixed(2)}`);
  }


  const systemTxId = payload.category === TransactionCategory.FUND_ADD || payload.category === TransactionCategory.PAYOUT
    ? null
    : generateTransactionId();

  const { allowNegativeBalance, ...transactionData } = payload;

  const transaction = await client.transaction.create({
    data: {
      ...transactionData,
      transactionId: systemTxId,
      balanceAfter: newBalance
    }
  });

  await client.merchantDetails.update({
    where: { id: payload.merchantDetailsId },
    data: { walletBalance: newBalance }
  });

  return transaction;
};

const calculateOrderCharges = async (orderId: string, tx?: any) => {
  const client = tx || (prisma as any);
  const order = await client.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        }
      },
      merchantDetails: true
    }
  });

  if (!order) throw new Error("Order not found");


  const globalRule = await client.globalBillingRule.findFirst({
    where: { isActive: true, category: TransactionCategory.PACKING_CHARGE },
    orderBy: { updatedAt: 'desc' }
  });

  let totalUnits = 0;
  let totalCharge = 0;
  const merchantRate = order.merchantDetails.unitRate || 0;
  const breakdown: any[] = [];

  for (const item of order.items) {

    let unitValue = item.variant.unitValue || 0;
    if (unitValue <= 0) {
      unitValue = globalRule?.quantityThreshold || 1;
    }


    let unitRate = (item.variant.unitRate !== null && item.variant.unitRate !== undefined && item.variant.unitRate > 0)
      ? item.variant.unitRate
      : (merchantRate > 0 ? merchantRate : (globalRule?.unitValue || 0));

    const itemUnits = Math.ceil(item.quantity / unitValue);
    const itemSubtotal = itemUnits * unitRate;

    totalUnits += itemUnits;
    totalCharge += itemSubtotal;

    breakdown.push({
      productName: item.variant.product.productName,
      variantName: item.variant.variantName,
      quantity: item.quantity,
      unitValue: unitValue,
      billedUnits: itemUnits,
      unitRate: unitRate,
      subtotal: itemSubtotal
    });
  }

  return { totalUnits, totalCharge, breakdown };
};

const chargePackingFee = async (orderId: string, tx?: any) => {
  const client = tx || (prisma as any);
  const { totalUnits, totalCharge, breakdown } = await calculateOrderCharges(orderId, client);

  if (totalCharge <= 0) return null;


  const existingTx = await client.transaction.findFirst({
    where: { referenceId: orderId, category: TransactionCategory.PACKING_CHARGE }
  });
  if (existingTx) {
    console.log(`[BILLING] Packing charge already exists for order ${orderId}, skipping.`);
    return existingTx;
  }

  const order = await client.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, merchantDetailsId: true }
  });


  const transaction = await createTransaction({
    merchantDetailsId: order.merchantDetailsId,
    amount: totalCharge,
    type: TransactionType.DEBIT,
    category: TransactionCategory.PACKING_CHARGE,
    referenceId: orderId,
    description: `Packing charge for order ${order.orderNumber} (${totalUnits.toFixed(2)} units)`,
    allowNegativeBalance: true
  }, client);


  await client.invoice.create({
    data: {
      merchantDetailsId: order.merchantDetailsId,
      invoiceNumber: `${order.orderNumber}-${generateTransactionId()}`,
      startDate: new Date(),
      endDate: new Date(),
      packingTotal: totalCharge,
      totalVat: 0,
      totalAmount: totalCharge,
      status: PaymentStatus.APPROVED,
      referenceId: orderId,
      category: TransactionCategory.PACKING_CHARGE,
      metadata: {
        breakdown: breakdown,
        totalUnits: totalUnits
      },
      createdAt: new Date()
    }
  });

  return transaction;
};

const requestWithdraw = async (userId: string, amount: number, paymentMethod: string, accountDetails: string) => {
  const merchant = await (prisma as any).merchantDetails.findUnique({
    where: { userId }
  });

  if (!merchant) throw new Error("Merchant not found");
  if ((merchant.walletBalance || 0) < amount) throw new Error("Insufficient balance for withdrawal");

  return await (prisma as any).withdrawRequest.create({
    data: {
      merchantDetailsId: merchant.id,
      amount,
      paymentMethod,
      accountDetails,
      status: WithdrawStatus.PENDING
    }
  });
};

const chargeReturnFee = async (returnOrderId: string, tx?: any) => {
  const client = tx || (prisma as any);
  const returnOrder = await client.returnOrder.findUnique({
    where: { id: returnOrderId },
    include: {
      merchantDetails: true,
      items: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });

  if (!returnOrder) {
    console.error(`[BILLING] Return order ${returnOrderId} not found for charging fee.`);
    return null;
  }


  const existingTx = await client.transaction.findFirst({
    where: { referenceId: returnOrderId, category: TransactionCategory.RETURN_CHARGE }
  });
  if (existingTx) {
    console.log(`[BILLING] Return charge already exists for return ${returnOrderId}, skipping.`);
    return existingTx;
  }


  const globalRule = await client.globalBillingRule.findFirst({
    where: { isActive: true, category: TransactionCategory.RETURN_CHARGE },
    orderBy: { updatedAt: 'desc' }
  });

  let totalUnits = 0;
  let totalCharge = 0;
  const merchantRate = returnOrder.merchantDetails.unitRate || 0;
  const breakdown: any[] = [];

  for (const item of returnOrder.items) {

    let unitValue = item.variant.unitValue || 0;
    if (unitValue <= 0) {
      unitValue = globalRule?.quantityThreshold || 1;
    }


    let unitRate = (item.variant.unitRate !== null && item.variant.unitRate !== undefined && item.variant.unitRate > 0)
      ? item.variant.unitRate
      : (merchantRate > 0 ? merchantRate : (globalRule?.unitValue || 0));


    const itemUnits = Math.ceil(item.quantity / unitValue);
    const itemSubtotal = itemUnits * unitRate;

    totalUnits += itemUnits;
    totalCharge += itemSubtotal;

    breakdown.push({
      productName: item.variant.product.productName,
      variantName: item.variant.variantName,
      quantity: item.quantity,
      unitValue: unitValue,
      billedUnits: itemUnits,
      unitRate: unitRate,
      subtotal: itemSubtotal
    });
  }

  if (totalCharge <= 0) return null;


  const transaction = await createTransaction({
    merchantDetailsId: returnOrder.merchantDetailsId,
    amount: totalCharge,
    type: TransactionType.DEBIT,
    category: TransactionCategory.RETURN_CHARGE,
    referenceId: returnOrderId,
    description: `Return charge for return ${returnOrder.id.slice(0, 8)} (${totalUnits.toFixed(2)} units)`,
    allowNegativeBalance: true
  }, client);


  await client.invoice.create({
    data: {
      merchantDetailsId: returnOrder.merchantDetailsId,
      invoiceNumber: `RTN-${returnOrder.id.slice(0, 8).toUpperCase()}-${generateTransactionId()}`,
      startDate: new Date(),
      endDate: new Date(),
      returnTotal: totalCharge,
      totalVat: 0,
      totalAmount: totalCharge,
      status: PaymentStatus.APPROVED,
      referenceId: returnOrderId,
      category: TransactionCategory.RETURN_CHARGE,
      metadata: {
        breakdown: breakdown,
        totalUnits: totalUnits
      },
      createdAt: new Date()
    }
  });

  return transaction;
};

const getTransactions = async (userId: string, query: { searchTerm?: string; page?: number; limit?: number } = {}) => {
  const { searchTerm, page = 1, limit = 15 } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const merchant = await (prisma as any).merchantDetails.findUnique({
    where: { userId }
  });
  if (!merchant) return { meta: { page: 1, limit: 15, total: 0 }, data: [] };

  const where: any = { merchantDetailsId: merchant.id };
  if (searchTerm) {
    where.OR = [
      { transactionId: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }

  const transactions = await (prisma as any).transaction.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' }
  });

  const total = await (prisma as any).transaction.count({ where });


  const enriched = await Promise.all(
    transactions.map(async (tx: any) => {
      let paymentTransactionId: string | null = null;
      let paymentMethod: string | null = null;

      if (tx.referenceId) {

        const withdraw = await (prisma as any).withdrawRequest.findUnique({
          where: { id: tx.referenceId },
          select: { transactionId: true, paymentMethod: true }
        }).catch(() => null);

        if (withdraw) {
          paymentTransactionId = withdraw.transactionId;
          paymentMethod = withdraw.paymentMethod;
        } else {

          const deposit = await (prisma as any).depositRequest.findUnique({
            where: { id: tx.referenceId },
            select: { transactionId: true, paymentMethod: true }
          }).catch(() => null);

          if (deposit) {
            paymentTransactionId = deposit.transactionId;
            paymentMethod = deposit.paymentMethod;
          }
        }
      }

      return {
        ...tx,
        paymentTransactionId: paymentTransactionId || tx.transactionId,
        paymentMethod
      };
    })
  );

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data: enriched
  };
};

const getAllTransactions = async (params: { searchTerm?: string; page?: number; limit?: number } = {}) => {
  const { searchTerm, page = 1, limit = 15 } = params;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (searchTerm) {
    where.OR = [
      { transactionId: { contains: searchTerm, mode: 'insensitive' } },
      { merchantDetails: { businessDetails: { businessName: { contains: searchTerm, mode: 'insensitive' } } } },
      { merchantDetails: { user: { email: { contains: searchTerm, mode: 'insensitive' } } } },
      { merchantDetails: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
      { merchantDetails: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } }
    ];
  }

  const transactions = await (prisma as any).transaction.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      merchantDetails: {
        include: {
          businessDetails: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  const total = await (prisma as any).transaction.count({ where });


  const enriched = await Promise.all(
    transactions.map(async (tx: any) => {
      let paymentTransactionId: string | null = null;
      let paymentMethod: string | null = null;

      if (tx.referenceId) {
        const withdraw = await (prisma as any).withdrawRequest.findUnique({
          where: { id: tx.referenceId },
          select: { transactionId: true, paymentMethod: true }
        }).catch(() => null);

        if (withdraw) {
          paymentTransactionId = withdraw.transactionId;
          paymentMethod = withdraw.paymentMethod;
        } else {
          const deposit = await (prisma as any).depositRequest.findUnique({
            where: { id: tx.referenceId },
            select: { transactionId: true, paymentMethod: true }
          }).catch(() => null);

          if (deposit) {
            paymentTransactionId = deposit.transactionId;
            paymentMethod = deposit.paymentMethod;
          }
        }
      }

      return {
        ...tx,
        paymentTransactionId: paymentTransactionId || tx.transactionId,
        paymentMethod
      };
    })
  );

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data: enriched
  };
};

const getInvoices = async (userId: string, query: { status?: string, searchTerm?: string, category?: string, page?: number, limit?: number } = {}) => {
  const { status, searchTerm, category, page = 1, limit = 15 } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const merchant = await (prisma as any).merchantDetails.findUnique({
    where: { userId }
  });
  if (!merchant) return { meta: { page: 1, limit: 15, total: 0 }, data: [] };

  const where: any = { merchantDetailsId: merchant.id };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (category && category !== "ALL") {
    if (category === "MONTHLY") {
      where.category = TransactionCategory.ADJUSTMENT;
    } else {
      where.category = category;
    }
  }

  if (searchTerm) {
    where.OR = [
      { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }

  const invoices = await (prisma as any).invoice.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      merchantDetails: {
        include: {
          businessDetails: true
        }
      }
    }
  });

  const total = await (prisma as any).invoice.count({ where });

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data: invoices
  };
};

const getGlobalInvoices = async (query: { status?: string, searchTerm?: string, category?: string, page?: number, limit?: number } = {}) => {
  const { status, searchTerm, category, page = 1, limit = 15 } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  if (category && category !== "ALL") {
    if (category === "MONTHLY") {
      where.category = TransactionCategory.ADJUSTMENT;
    } else {
      where.category = category;
    }
  }

  if (searchTerm && searchTerm.trim() !== "") {
    where.OR = [
      { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
      { merchantDetails: { businessDetails: { businessName: { contains: searchTerm, mode: 'insensitive' } } } },
      { merchantDetails: { user: { email: { contains: searchTerm, mode: 'insensitive' } } } },
      { merchantDetails: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
      { merchantDetails: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } }
    ];
  }

  const [data, total] = await Promise.all([
    (prisma as any).invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        merchantDetails: {
          include: {
            businessDetails: true,
            user: true
          }
        }
      }
    }),
    (prisma as any).invoice.count({ where })
  ]);

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data
  };
};

const updateInvoiceStatus = async (id: string, status: any) => {
  return await (prisma as any).invoice.update({
    where: { id },
    data: { status }
  });
};

const getWithdrawRequests = async (query: { status?: string, searchTerm?: string, page?: number, limit?: number } = {}) => {
  const { status, searchTerm, page = 1, limit = 15 } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  if (searchTerm) {
    where.OR = [
      { transactionId: { contains: searchTerm, mode: "insensitive" } },
      { accountDetails: { contains: searchTerm, mode: "insensitive" } },
      {
        merchantDetails: {
          user: {
            email: { contains: searchTerm, mode: "insensitive" }
          }
        }
      },
      {
        merchantDetails: {
          businessDetails: {
            businessName: { contains: searchTerm, mode: "insensitive" }
          }
        }
      }
    ];
  }

  const [data, total] = await Promise.all([
    (prisma as any).withdrawRequest.findMany({
      where,
      skip,
      take,
      include: {
        merchantDetails: {
          include: {
            businessDetails: true,
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).withdrawRequest.count({ where })
  ]);

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data
  };
};

const getMyWithdrawRequests = async (userId: string, query: { status?: string, searchTerm?: string, page?: number, limit?: number } = {}) => {
  const { status, searchTerm, page = 1, limit = 15 } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const merchantDetails = await (prisma as any).merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }

  const where: any = { merchantDetailsId: merchantDetails.id };
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (searchTerm) {
    where.OR = [
      { transactionId: { contains: searchTerm, mode: "insensitive" } },
      { accountDetails: { contains: searchTerm, mode: "insensitive" } }
    ];
  }

  const requests = await (prisma as any).withdrawRequest.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  const total = await (prisma as any).withdrawRequest.count({ where });

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data: requests
  };
};

const updateWithdrawStatus = async (id: string, payload: any) => {
  const { status, transactionId, adminNote } = payload;

  return await prisma.$transaction(async (tx: any) => {

    const withdrawRequest = await tx.withdrawRequest.findUnique({
      where: { id },
      include: { merchantDetails: true },
    });

    if (!withdrawRequest) {
      throw new Error("Withdrawal request not found");
    }

    if (status === "APPROVED" && withdrawRequest.status !== "APPROVED") {
      const merchant = withdrawRequest.merchantDetails;

      const updatedMerchant = await tx.merchantDetails.update({
        where: { id: merchant.id },
        data: {
          walletBalance: {
            decrement: withdrawRequest.amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          merchantDetailsId: merchant.id,
          amount: withdrawRequest.amount,
          type: "DEBIT",
          category: "PAYOUT",
          referenceId: withdrawRequest.id,
          description: `Payout / Withdrawal Approved${adminNote ? `: ${adminNote}` : ""}`,
          balanceAfter: updatedMerchant.walletBalance,
        },
      });
    }

    return await tx.withdrawRequest.update({
      where: { id },
      data: {
        status,
        transactionId,
        adminNote,
        processedAt: status === "APPROVED" || status === "REJECTED" ? new Date() : null,
      },
    });
  });
};

const getBillingRules = async () => {
  return await (prisma as any).globalBillingRule.findMany({
    orderBy: { quantityThreshold: 'asc' }
  });
};

const upsertBillingRule = async (payload: any) => {
  const { id, ...data } = payload;
  if (id) {
    return await (prisma as any).globalBillingRule.update({
      where: { id },
      data
    });
  }
  return await (prisma as any).globalBillingRule.create({
    data
  });
};
const updateMerchantBilling = async (id: string, payload: any) => {
  const result = await (prisma as any).merchantDetails.update({
    where: { id },
    data: payload
  });


  if (payload.storageRackCount !== undefined || payload.storageRackRate !== undefined) {
    await (prisma as any).storageBillingLog.create({
      data: {
        merchantDetailsId: id,
        rackCount: result.storageRackCount,
        rackRate: result.storageRackRate
      }
    });
  }

  return result;
};

const createDepositRequest = async (userId: string, payload: any) => {
  const merchantDetails = await (prisma as any).merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }


  let receptionDetails = "";
  if (payload.paymentMethod) {
    const adminPayment = await (prisma as any).adminPaymentMethod.findUnique({
      where: { methodName: payload.paymentMethod }
    });
    if (adminPayment) {
      if (payload.paymentMethod === 'BANK_TRANSFER') {
        receptionDetails = `Bank: ${adminPayment.bankName}\nA/C: ${adminPayment.accountNumber}\nHolder: ${adminPayment.accountHolder}\nBranch: ${adminPayment.branchName}`;
      } else {
        receptionDetails = `${payload.paymentMethod} Number: ${adminPayment.accountNumber}\nType: Personal`;
      }
    }
  }


  if (payload.transactionId) {
    const existing = await (prisma as any).depositRequest.findUnique({
      where: { transactionId: payload.transactionId }
    });
    if (existing) {
      throw new Error("Transaction ID already exists. Please provide a unique ID.");
    }
  }

  return await (prisma as any).depositRequest.create({
    data: {
      merchantDetailsId: merchantDetails.id,
      amount: Number(payload.amount),
      paymentMethod: payload.paymentMethod,
      transactionId: payload.transactionId,
      senderAccount: payload.senderAccount,
      receptionDetails,
      merchantNote: payload.merchantNote,
      status: "PENDING",
    },
  });
};

const getDepositRequests = async (query: { status?: string, searchTerm?: string, page?: number, limit?: number } = {}) => {
  const { status, searchTerm, page = 1, limit = 15 } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  if (searchTerm) {
    where.OR = [
      { transactionId: { contains: searchTerm, mode: "insensitive" } },
      { senderAccount: { contains: searchTerm, mode: "insensitive" } },
      {
        merchantDetails: {
          user: {
            email: { contains: searchTerm, mode: "insensitive" }
          }
        }
      },
      {
        merchantDetails: {
          businessDetails: {
            businessName: { contains: searchTerm, mode: "insensitive" }
          }
        }
      }
    ];
  }

  const [data, total] = await Promise.all([
    (prisma as any).depositRequest.findMany({
      where,
      skip,
      take,
      include: {
        merchantDetails: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                contactNumber: true
              }
            },
            businessDetails: {
              select: {
                businessName: true,
                businessLogo: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    (prisma as any).depositRequest.count({ where })
  ]);

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data
  };
};

const getMyDepositRequests = async (userId: string, query: { status?: string, searchTerm?: string, page?: number, limit?: number } = {}) => {
  const { status, searchTerm, page = 1, limit = 15 } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const merchantDetails = await (prisma as any).merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }

  const where: any = { merchantDetailsId: merchantDetails.id };
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (searchTerm) {
    where.OR = [
      { transactionId: { contains: searchTerm, mode: "insensitive" } },
      { senderAccount: { contains: searchTerm, mode: "insensitive" } }
    ];
  }

  const requests = await (prisma as any).depositRequest.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  const total = await (prisma as any).depositRequest.count({ where });

  return {
    meta: { page: Number(page), limit: Number(limit), total },
    data: requests
  };
};

const updateDepositStatus = async (id: string, payload: { status: string, adminNote?: string }) => {
  const deposit = await (prisma as any).depositRequest.findUnique({
    where: { id },
    include: { merchantDetails: true },
  });

  if (!deposit) {
    throw new Error("Deposit request not found");
  }

  if (deposit.status !== "PENDING") {
    throw new Error(`Cannot update deposit that is already ${deposit.status}`);
  }

  return await (prisma as any).$transaction(async (tx: any) => {
    const updatedDeposit = await tx.depositRequest.update({
      where: { id },
      data: {
        status: payload.status,
        adminNote: payload.adminNote,
        processedAt: new Date(),
      },
    });

    if (payload.status === "APPROVED") {

      const updatedMerchant = await tx.merchantDetails.update({
        where: { id: deposit.merchantDetailsId },
        data: {
          walletBalance: { increment: deposit.amount },
        },
      });


      await tx.transaction.create({
        data: {
          merchantDetailsId: deposit.merchantDetailsId,
          amount: deposit.amount,
          type: TransactionType.CREDIT,
          category: TransactionCategory.FUND_ADD,
          referenceId: deposit.id,
          description: `Deposit via ${deposit.paymentMethod || 'manual'} (TxID: ${deposit.transactionId || 'N/A'})`,
          balanceAfter: updatedMerchant.walletBalance,
        },
      });
    }

    return updatedDeposit;
  });
};

const getAdminPaymentMethods = async (onlyActive: boolean = false) => {
  const where: any = {};
  if (onlyActive) {
    where.isActive = true;
  }
  return await (prisma as any).adminPaymentMethod.findMany({
    where,
    orderBy: { methodName: 'asc' }
  });
};

const upsertAdminPaymentMethod = async (payload: any) => {
  const { methodName, ...data } = payload;
  return await (prisma as any).adminPaymentMethod.upsert({
    where: { methodName },
    update: data,
    create: { methodName, ...data }
  });
};

const getAllActiveMerchants = async () => {
  return await (prisma as any).merchantDetails.findMany({
    where: {
      isVerified: true,
      user: { status: 'ACTIVE' }
    },
    include: { user: true }
  });
};

const calculateMerchantProratedStorage = async (merchant: any, startOfMonth: Date, endOfBillingPeriod: Date) => {
  const globalRule = await (prisma as any).globalBillingRule.findFirst({
    where: { category: TransactionCategory.STORAGE_CHARGE, isActive: true }
  });

  const globalRackRate = globalRule?.unitValue || 100;
  const globalRackCount = 0;
  const currentYear = startOfMonth.getFullYear();
  const currentMonth = startOfMonth.getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const breakdown: any[] = [];


  const logs = await (prisma as any).storageBillingLog.findMany({
    where: {
      merchantDetailsId: merchant.id,
      createdAt: { gte: startOfMonth, lte: endOfBillingPeriod }
    },
    orderBy: { createdAt: 'asc' }
  });


  const initialLog = await (prisma as any).storageBillingLog.findFirst({
    where: {
      merchantDetailsId: merchant.id,
      createdAt: { lt: startOfMonth }
    },
    orderBy: { createdAt: 'desc' }
  });


  let currentCount = initialLog ? initialLog.rackCount : (merchant.storageRackCount || globalRackCount);
  let currentRate = initialLog ? initialLog.rackRate : (merchant.storageRackRate || globalRackRate);
  let lastTime = startOfMonth;
  let totalProratedCost = 0;


  for (const log of logs) {
    const durationMs = log.createdAt.getTime() - lastTime.getTime();
    const days = durationMs / (1000 * 60 * 60 * 24);
    const segmentTotal = (days / totalDaysInMonth) * currentCount * currentRate;

    totalProratedCost += segmentTotal;

    if (days > 0) {
      breakdown.push({
        startDate: lastTime,
        endDate: log.createdAt,
        rackCount: currentCount,
        rackRate: currentRate,
        days: parseFloat(days.toFixed(2)),
        subtotal: Math.round(segmentTotal)
      });
    }


    currentCount = log.rackCount;
    currentRate = log.rackRate;
    lastTime = log.createdAt;
  }


  const finalDurationMs = endOfBillingPeriod.getTime() - lastTime.getTime();
  const finalDays = finalDurationMs / (1000 * 60 * 60 * 24);
  const finalSegmentTotal = (finalDays / totalDaysInMonth) * currentCount * currentRate;
  totalProratedCost += finalSegmentTotal;

  if (finalDays > 0) {
    breakdown.push({
      startDate: lastTime,
      endDate: endOfBillingPeriod,
      rackCount: currentCount,
      rackRate: currentRate,
      days: parseFloat(finalDays.toFixed(2)),
      subtotal: Math.round(finalSegmentTotal)
    });
  }

  return {
    amount: Math.round(totalProratedCost),
    daysUsed: Math.ceil((endOfBillingPeriod.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)),
    currentCount,
    currentRate,
    breakdown
  };
};

const processMonthlyStorageCharges = async () => {
  const merchants = await getAllActiveMerchants();
  const results: any[] = [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  for (const merchant of (merchants as any)) {

    const latestCharge = await (prisma as any).transaction.findFirst({
      where: {
        merchantDetailsId: merchant.id,
        category: TransactionCategory.STORAGE_CHARGE,
        createdAt: { gte: startOfMonth }
      },
      orderBy: { createdAt: 'desc' }
    });

    const billingStart = latestCharge ? latestCharge.createdAt : startOfMonth;

    const { amount, daysUsed, breakdown } = await calculateMerchantProratedStorage(merchant, billingStart, now);

    if (amount <= 0 || daysUsed <= 0) continue;

    await (prisma as any).$transaction(async (tx: any) => {
      const transaction = await createTransaction({
        merchantDetailsId: merchant.id,
        amount: amount,
        type: TransactionType.DEBIT,
        category: TransactionCategory.STORAGE_CHARGE,
        description: `Prorated Monthly Storage Charge (${currentMonthName})`
      }, tx);

      await tx.invoice.create({
        data: {
          merchantDetailsId: merchant.id,
          invoiceNumber: `STR-${merchant.id.slice(0, 4).toUpperCase()}-${generateTransactionId()}`,
          startDate: billingStart,
          endDate: now,
          storageTotal: amount,
          totalAmount: amount,
          status: PaymentStatus.APPROVED,
          category: TransactionCategory.STORAGE_CHARGE,
          metadata: { breakdown }
        }
      });

      results.push({
        merchant: merchant.user.email,
        amount: amount,
        transactionId: transaction.transactionId
      });
    });
  }

  return results;
};

const settleMerchantStorage = async (merchantId: string) => {
  const merchant = await (prisma as any).merchantDetails.findUnique({
    where: { id: merchantId },
    include: { user: true }
  });

  if (!merchant) throw new Error("Merchant not found");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const latestCharge = await (prisma as any).transaction.findFirst({
    where: {
      merchantDetailsId: merchantId,
      category: TransactionCategory.STORAGE_CHARGE,
      createdAt: { gte: startOfMonth }
    },
    orderBy: { createdAt: 'desc' }
  });

  const billingStart = latestCharge ? latestCharge.createdAt : startOfMonth;

  const { amount, daysUsed, breakdown } = await calculateMerchantProratedStorage(merchant, billingStart, now);

  if (amount <= 0) throw new Error("No storage charges calculated for this period.");

  return await (prisma as any).$transaction(async (tx: any) => {
    const transaction = await createTransaction({
      merchantDetailsId: merchantId,
      amount: amount,
      type: TransactionType.DEBIT,
      category: TransactionCategory.STORAGE_CHARGE,
      description: `Manual Storage Settlement (${daysUsed} days used this month)`,
      allowNegativeBalance: true
    }, tx);

    const invoice = await tx.invoice.create({
      data: {
        merchantDetailsId: merchantId,
        invoiceNumber: `STR-SET-${merchantId.slice(0, 4).toUpperCase()}-${generateTransactionId()}`,
        startDate: billingStart,
        endDate: now,
        storageTotal: amount,
        totalAmount: amount,
        status: PaymentStatus.APPROVED,
        category: TransactionCategory.STORAGE_CHARGE,
        metadata: { breakdown }
      }
    });

    return { transaction, invoice };
  });
};

const generateMonthlySummaryInvoice = async (merchantId: string, startDate: Date, endDate: Date) => {
  const merchant = await (prisma as any).merchantDetails.findUnique({
    where: { id: merchantId },
    include: { user: true }
  });

  if (!merchant) throw new Error("Merchant not found");

  const transactions = await (prisma as any).transaction.findMany({
    where: {
      merchantDetailsId: merchantId,
      createdAt: { gte: startDate, lte: endDate }
    }
  });

  const packingTotal = transactions
    .filter((tx: any) => tx.category === "PACKING_CHARGE")
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const storageTotal = transactions
    .filter((tx: any) => tx.category === "STORAGE_CHARGE")
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const returnTotal = transactions
    .filter((tx: any) => tx.category === "RETURN_CHARGE")
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const courierTotal = transactions
    .filter((tx: any) => tx.category === "COURIER_CHARGE")
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const packingVat = (packingTotal * (merchant.packingVatPercentage || 0)) / 100;
  const storageVat = (storageTotal * (merchant.storageVatPercentage || 0)) / 100;
  const returnVat = (returnTotal * (merchant.returnVatPercentage || 0)) / 100;
  const totalVat = packingVat + storageVat + returnVat;

  const orders = await (prisma as any).order.findMany({
    where: {
      merchantDetailsId: merchantId,
      status: "DELIVERED",
      updatedAt: { gte: startDate, lte: endDate }
    },
    select: { totalPayable: true }
  });
  const totalSales = orders.reduce((sum: number, order: any) => sum + order.totalPayable, 0);

  const totalAmount = packingTotal + storageTotal + returnTotal + courierTotal + totalVat;

  const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${merchant.id.slice(0, 4).toUpperCase()}`;

  return await (prisma as any).$transaction(async (tx: any) => {
    const invoice = await tx.invoice.create({
      data: {
        merchantDetailsId: merchantId,
        invoiceNumber,
        startDate,
        endDate,
        packingTotal,
        packingVat,
        storageTotal,
        storageVat,
        returnTotal,
        returnVat,
        courierTotal,
        totalSales,
        totalVat,
        totalAmount,
        status: "APPROVED",
        category: TransactionCategory.ADJUSTMENT
      }
    });

    if (totalVat > 0) {
      await createTransaction({
        merchantDetailsId: merchantId,
        amount: totalVat,
        type: "DEBIT",
        category: "TAX_VAT",
        referenceId: invoice.id,
        description: `VAT/Tax for Invoice ${invoiceNumber}`
      }, tx);
    }

    return invoice;
  });
};

const getInvoiceById = async (id: string) => {
  const invoice = await (prisma as any).invoice.findUnique({
    where: { id },
    include: {
      merchantDetails: {
        include: {
          businessDetails: true,
          user: true,
          personalDetails: true
        }
      }
    }
  });

  if (!invoice) throw new Error("Invoice not found");

  let details: any = null;

  if (invoice.category === TransactionCategory.PACKING_CHARGE && invoice.referenceId) {
    details = await (prisma as any).order.findUnique({
      where: { id: invoice.referenceId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
  } else if (invoice.category === TransactionCategory.RETURN_CHARGE && invoice.referenceId) {
    details = await (prisma as any).returnOrder.findUnique({
      where: { id: invoice.referenceId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
  }

  return { invoice, details };
};

const getAdminFinanceStats = async () => {
  const [
    pendingWithdrawals,
    approvedWithdrawals,
    approvedDeposits,
    incomeInvoices
  ] = await Promise.all([
    (prisma as any).withdrawRequest.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true
    }),
    (prisma as any).withdrawRequest.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true }
    }),
    (prisma as any).depositRequest.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true }
    }),
    (prisma as any).invoice.aggregate({
      where: {
        status: "APPROVED"

      },
      _sum: { totalAmount: true }
    })
  ]);

  const totalDeposits = approvedDeposits._sum.amount || 0;
  const totalIncome = incomeInvoices._sum.totalAmount || 0;
  const totalCredit = totalDeposits + totalIncome;
  const totalDebit = approvedWithdrawals._sum.amount || 0;
  const netBalance = totalCredit - totalDebit;

  const result = {
    pendingWithdrawals: {
      count: pendingWithdrawals._count || 0,
      totalAmount: pendingWithdrawals._sum.amount || 0
    },
    totalDeposits,
    totalIncome,
    totalCredit,
    totalDebit,
    netBalance
  };

  return result;
};

export const BillingService = {
  createTransaction,
  calculateOrderCharges,
  chargePackingFee,
  chargeReturnFee,
  requestWithdraw,
  getTransactions,
  getInvoices,
  getGlobalInvoices,
  updateInvoiceStatus,
  getWithdrawRequests,
  updateWithdrawStatus,
  getBillingRules,
  upsertBillingRule,
  updateMerchantBilling,
  createDepositRequest,
  getDepositRequests,
  getMyDepositRequests,
  updateDepositStatus,
  getMyWithdrawRequests,
  getAllTransactions,
  getAdminPaymentMethods,
  upsertAdminPaymentMethod,
  getGlobalCreditLimit,
  checkMerchantFulfillmentAbility,
  processMonthlyStorageCharges,
  generateMonthlySummaryInvoice,
  getInvoiceById,
  settleMerchantStorage,
  getAdminFinanceStats
};
