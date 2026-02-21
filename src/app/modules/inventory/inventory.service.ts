import { prisma } from "../../shared/prisma";

export const addProductService = async (userId: string, data: any) => {
  try {
    const merchant = await prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!merchant) throw new Error("Merchant profile not found");
    if (!data.name || !data.sku || !data.price || !data.quantity) {
      throw new Error("Missing required product fields");
    }
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) throw new Error("SKU already exists");

    const product = await prisma.product.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        sku: data.sku,
        description: data.description || "",
        price: data.price,
        quantity: data.quantity,
      },
    });

    return product;
  } catch (error) {
    throw new Error("Failed to add product");
  }
};

export const editProductService = async (
  merchantId: string,
  productId: string,
  data: any
) => {
  try {
    const updated = await prisma.product.updateMany({
      where: { id: productId, merchantId, status: "PENDING" },
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
  merchantId: string,
  productId: string
) => {
  try {
    const deleted = await prisma.product.deleteMany({
      where: { id: productId, merchantId, status: "PENDING" },
    });

    if (deleted.count === 0)
      throw new Error("No pending product found to delete");
    return deleted;
  } catch (error) {
    throw new Error("Failed to delete product");
  }
};

export const listProductsService = async (
  merchantId: string | null,
  isAdmin: boolean,
  pending?: boolean
) => {
  try {
    const where: any = {};
    if (!isAdmin && merchantId) where.merchantId = merchantId;
    if (pending) where.status = "PENDING";

    const products = await prisma.product.findMany({ where });
    return products;
  } catch (error) {
    throw new Error("Failed to fetch products");
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
          quantity: product.quantity,
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
      data: { status: "REJECTED" },
    });

    if (!product) throw new Error("Product not found");

    await prisma.warehouseLog.create({
      data: {
        productId,
        action: "REJECTED",
        quantity: product.quantity,
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
