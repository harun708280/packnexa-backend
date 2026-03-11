import { prisma } from "../../shared/prisma";

export const addProductService = async (userId: string, data: any) => {
  try {
    const merchant = await prisma.merchantDetails.findUnique({
      where: { userId },
    });
    if (!merchant) throw new Error("Merchant profile not found");


    const product = await prisma.product.create({
      data: {
        merchantDetailsId: merchant.id,
        productName: data.name,
        category: data.category || "General",
        description: data.description || "",
        status: "PROCESSING",
      },
    });

    return product;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to add product");
  }
};

export const editProductService = async (
  merchantDetailsId: string,
  productId: string,
  data: any
) => {
  try {
    const updated = await prisma.product.updateMany({
      where: { id: productId, merchantDetailsId, status: "PROCESSING" },
      data,
    });

    if (updated.count === 0)
      throw new Error("No pending product found or not authorized");

    return updated;
  } catch (error) {
    throw new Error("Failed to update product");
  }
};

export const deleteProductService = async (
  merchantDetailsId: string,
  productId: string
) => {
  try {
    const deleted = await prisma.product.deleteMany({
      where: { id: productId, merchantDetailsId, status: "PROCESSING" },
    });

    if (deleted.count === 0)
      throw new Error("No pending product found to delete");
    return deleted;
  } catch (error) {
    throw new Error("Failed to delete product");
  }
};

export const listProductsService = async (
  userId: string | null,
  isAdmin: boolean,
  pending?: boolean
) => {
  try {
    const where: any = {};
    if (!isAdmin && userId) {
      const merchant = await prisma.merchantDetails.findUnique({
        where: { userId },
      });
      if (!merchant) return [];
      where.merchantDetailsId = merchant.id;
    }
    if (pending) where.status = "PROCESSING";

    const products = await prisma.product.findMany({
      where,
      include: {
        productImages: true,
        variants: {
          include: {
            pricing: true,
            stockAdjustments: {
              take: 5,
              orderBy: { createdAt: "desc" }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return products;
  } catch (error) {
    throw new Error("Failed to fetch products");
  }
};

export const getProductService = async (
  userId: string | null,
  isAdmin: boolean,
  productId: string
) => {
  try {
    const where: any = { id: productId };
    if (!isAdmin && userId) {
      const merchant = await prisma.merchantDetails.findUnique({
        where: { userId },
      });
      if (!merchant) throw new Error("Merchant profile not found");
      where.merchantDetailsId = merchant.id;
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        productImages: true,
        variants: {
          include: {
            pricing: true,
            stockAdjustments: {
              orderBy: { createdAt: "desc" }
            },
            stockControl: true,
            location: true,
            batch: true
          }
        },
        merchantDetails: {
          include: {
            businessDetails: true
          }
        }
      }
    });

    if (!product) throw new Error("Product not found");
    return product;
  } catch (error) {
    throw new Error("Failed to fetch product details");
  }
};

export const approveProductService = async (
  productId: string,
  location: string
) => {
  try {
    if (!location) throw new Error("Location is required to approve product");

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: { status: "APPROVED" },
      });

      if (!product) throw new Error("Product not found");

      await tx.warehouseLog.create({
        data: {
          productId,
          action: "APPROVED",
          quantity: 0,
          location,
        },
      });

      return product;
    });
  } catch (error) {
    throw new Error("Failed to approve product");
  }
};

export const rejectProductService = async (
  productId: string,
  reason: string
) => {
  try {
    if (!reason) reason = "Rejected by admin";

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        status: "REJECTED",
        rejectionReason: reason
      },
    });

    if (!product) throw new Error("Product not found");

    await prisma.warehouseLog.create({
      data: {
        productId,
        action: "REJECTED",
        quantity: 0,
        location: reason,
      },
    });

    return product;
  } catch (error) {
    throw new Error("Failed to reject product");
  }
};

export const storeProductService = async (
  productId: string,
  location: string
) => {
  try {
    if (!location) throw new Error("Location is required to store product");

    const log = await prisma.warehouseLog.create({
      data: {
        productId,
        action: "STORED",
        quantity: 0,
        location,
      },
    });

    return log;
  } catch (error) {
    throw new Error("Failed to store product");
  }
};

export const getWarehouseLogsService = async (productId: string) => {
  try {
    const logs = await prisma.warehouseLog.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });

    if (!logs || logs.length === 0)
      throw new Error("No logs found for this product");
    return logs;
  } catch (error) {
    throw new Error("Failed to fetch warehouse logs");
  }
};

export const requestStockAdjustmentService = async (userId: string, data: any) => {
  try {
    const merchant = await prisma.merchantDetails.findUnique({
      where: { userId },
    });
    if (!merchant) throw new Error("Merchant profile not found");

    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
    });
    if (!variant) throw new Error("Variant not found");

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        variantId: data.variantId,
        merchantDetailsId: merchant.id,
        previousQuantity: variant.quantity,
        adjustmentQuantity: Number(data.adjustmentQuantity),
        note: data.note || "",
      },
    });

    return adjustment;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to request stock adjustment");
  }
};

export const listStockAdjustmentsService = async (
  userId: string | null,
  isAdmin: boolean,
  status?: any
) => {
  console.log('[Service] listStockAdjustmentsService input:', { userId, isAdmin, status });
  try {
    const where: any = {};
    if (!isAdmin && userId) {
      const merchant = await prisma.merchantDetails.findUnique({
        where: { userId },
      });
      if (!merchant) return [];
      where.merchantDetailsId = merchant.id;
    }
    if (status) where.status = status;

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      include: {
        variant: {
          include: {
            product: true
          }
        },
        merchantDetails: {
          include: {
            businessDetails: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(`[Service] Found ${adjustments.length} adjustments for where:`, JSON.stringify(where));
    return adjustments;
  } catch (error) {
    console.error("[Service] Error in listStockAdjustmentsService:", error);
    throw new Error("Failed to fetch stock adjustments");
  }
};

export const approveStockAdjustmentService = async (adjustmentId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.findUnique({
        where: { id: adjustmentId },
      });

      if (!adjustment) throw new Error("Adjustment request not found");
      if (adjustment.status !== "PENDING") throw new Error("Request is already processed");

      const variant = await tx.productVariant.findUnique({
        where: { id: adjustment.variantId },
      });

      if (!variant) throw new Error("Variant not found");


      const updatedVariant = await tx.productVariant.update({
        where: { id: adjustment.variantId },
        data: {
          quantity: {
            increment: adjustment.adjustmentQuantity
          }
        }
      });

      await tx.inventoryTransaction.create({
        data: {
          variantId: adjustment.variantId,
          type: "ADJUSTMENT",
          quantity: adjustment.adjustmentQuantity,
          note: `Approved Adjustment: ${adjustment.note || ""}`,
        }
      });


      const updatedAdjustment = await tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: { status: "APPROVED" },
      });

      return { updatedAdjustment, updatedVariant };
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to approve stock adjustment");
  }
};

export const rejectStockAdjustmentService = async (adjustmentId: string, reason: string) => {
  try {
    const adjustment = await prisma.stockAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: "REJECTED",
        rejectionReason: reason
      },
    });

    return adjustment;
  } catch (error) {
    throw new Error("Failed to reject stock adjustment");
  }
};
