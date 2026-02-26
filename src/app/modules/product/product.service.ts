import { ProductStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { generateUniqueSKU } from "./product.utils";

const createProduct = async (userId: string, payload: any) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found. Only merchants can create products.");
  }

  console.log('--- CREATE PRODUCT PAYLOAD START ---');
  console.log(JSON.stringify(payload, null, 2));
  console.log('--- CREATE PRODUCT PAYLOAD END ---');

  const { variants, productImages, description, productName, category, merchantWebProductId } = payload;

  const result = await prisma.$transaction(async (tx) => {

    let warehouse = await tx.warehouse.findFirst();
    if (!warehouse) {
      warehouse = await tx.warehouse.create({
        data: { name: "Main Warehouse", location: "Default Location" },
      });
    }


    const createdProduct = await tx.product.create({
      data: {
        productName,
        description,
        category,
        merchantWebProductId,
        merchantDetailsId: merchantDetails.id,
        status: "PROCESSING",
        productImages: productImages && productImages.length > 0 ? {
          create: productImages.map((url: string) => ({ imageUrl: url })),
        } : undefined,
      },
    });


    const baseCount = await tx.productVariant.count();
    let variantIndex = 0;

    for (const variant of variants) {
      const nextNumber = baseCount + variantIndex + 1;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const sku = `NEXA-${nextNumber}${randomSuffix}`;
      variantIndex++;

      const { purchasePrice, salePrice, imageUrl, pricing, location, stockControl, ...rest } = variant;


      const variantPricing = pricing ? { create: pricing } : (purchasePrice !== undefined && salePrice !== undefined) ? {
        create: {
          purchasePrice: Number(purchasePrice),
          salePrice: Number(salePrice)
        }
      } : undefined;

      await tx.productVariant.create({
        data: {
          variantName: variant.variantName,
          unit: variant.unit,
          weightKg: Number(variant.weightKg) || 0,
          quantity: Number(variant.quantity) || 0,
          color: variant.color,
          size: variant.size,
          supplier: variant.supplier,
          invoiceId: variant.invoiceId,
          variantImage: imageUrl || variant.variantImage,
          productId: createdProduct.id,
          sku,
          warehouseId: variant.warehouseId && variant.warehouseId !== "default-warehouse-id" ? variant.warehouseId : warehouse.id,
          pricing: variantPricing,
          location: location ? { create: location } : undefined,
          stockControl: stockControl ? { create: stockControl } : undefined,
        },
      });
    }

    return tx.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        variants: {
          include: {
            pricing: true,
            location: true,
            stockControl: true,
          },
        },
        productImages: true,
      },
    });
  }, {
    timeout: 30000,
  });

  return result;
};

const getMyProducts = async (userId: string, query: { page?: string, limit?: string, status?: string } = {}) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }

  const { page = "1", limit = "10", status } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = { merchantDetailsId: merchantDetails.id };
  if (status) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        variants: {
          select: {
            id: true,
            variantName: true,
            quantity: true,
            soldQuantity: true,
            sku: true,
            variantImage: true,
            pricing: true,
          }
        },
        productImages: {
          take: 1
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.product.count({ where: { merchantDetailsId: merchantDetails.id } })
  ]);


  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data,
  };
};

const getAllProducts = async (query: { page?: string, limit?: string, searchTerm?: string, status?: string } = {}) => {
  const { page = "1", limit = "10", searchTerm, status } = query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (searchTerm) {
    where.OR = [
      { productName: { contains: searchTerm, mode: "insensitive" } },
      { productCode: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const [data, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        variants: {
          include: {
            pricing: true,
            location: true,
            stockControl: true,
          }
        },
        productImages: true,
        merchantDetails: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                contactNumber: true,
              },
            },
            personalDetails: {
              select: {
                profilePhoto: true,
              }
            },
            businessDetails: {
              select: {
                businessName: true,
                businessType: true,
                businessLogo: true,
              }
            }
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { status: ProductStatus.PROCESSING } }),
    prisma.product.count({ where: { status: ProductStatus.APPROVED } }),
    prisma.product.count({ where: { status: ProductStatus.REJECTED } }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pendingCount,
      approvedCount,
      rejectedCount,
    },
    data,
  };
};

const getSingleProduct = async (userId: string, productId: string) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      merchantDetailsId: merchantDetails.id,
    },
    include: {
      variants: {
        include: {
          pricing: true,
          location: true,
          stockControl: true,
        },
      },
      productImages: true,
    },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  return product;
};

const updateProduct = async (userId: string, productId: string, payload: any) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }

  const existingProduct = await prisma.product.findFirst({
    where: {
      id: productId,
      merchantDetailsId: merchantDetails.id,
    },
    include: {
      variants: true,
    },
  });

  if (!existingProduct) {
    throw new Error("Product not found or access denied");
  }

  const { variants, productImages, description, productName, category, merchantWebProductId } = payload;

  console.log('--- UPDATE PRODUCT PAYLOAD START ---');
  console.log('productId:', productId);
  console.log(JSON.stringify(payload, null, 2));
  console.log('--- UPDATE PRODUCT PAYLOAD END ---');

  return prisma.$transaction(async (tx) => {

    await tx.product.update({
      where: { id: productId },
      data: {
        productName,
        description,
        category,
        merchantWebProductId,
        status: ProductStatus.PROCESSING,
        rejectionReason: null,
        productImages: productImages ? {
          deleteMany: {},
          create: productImages.map((url: string) => ({ imageUrl: url })),
        } : undefined,
      },
    });

    if (variants) {
      const incomingVariantIds = variants.filter((v: any) => v.id).map((v: any) => v.id);
      const existingVariantIds = existingProduct.variants.map((v) => v.id);


      const variantsToDelete = existingVariantIds.filter(id => !incomingVariantIds.includes(id));
      console.log('Variants to delete:', variantsToDelete);
      if (variantsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: variantsToDelete } },
        });
      }


      console.log('Reconciling variants, count:', variants.length);
      for (const variant of variants) {
        const { id, pricing, location, stockControl, purchasePrice, salePrice, imageUrl, ...rest } = variant;

        const isExistingVariant = id && existingVariantIds.includes(id);

        if (isExistingVariant) {
          console.log('Updating variant:', id);

          const updatePricing = pricing ? {
            upsert: { create: pricing, update: pricing }
          } : (purchasePrice !== undefined && salePrice !== undefined) ? {
            upsert: {
              create: { purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) },
              update: { purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) },
            }
          } : undefined;

          await tx.productVariant.update({
            where: { id },
            data: {
              variantName: variant.variantName,
              unit: variant.unit,
              weightKg: Number(variant.weightKg) || 0,
              quantity: Number(variant.quantity) || 0,
              color: variant.color,
              size: variant.size,
              supplier: variant.supplier || rest.supplier,
              invoiceId: variant.invoiceId,
              variantImage: imageUrl || variant.variantImage,
              warehouseId: variant.warehouseId && variant.warehouseId !== "default-warehouse-id" ? variant.warehouseId : undefined,
              pricing: updatePricing,
              location: location ? { upsert: { create: location, update: location } } : undefined,
              stockControl: stockControl ? { upsert: { create: stockControl, update: stockControl } } : undefined,
            },
          });
        } else {
          console.log('Creating new variant...');

          const baseCount = await tx.productVariant.count();
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const sku = variant.sku || `NEXA-${baseCount + 1}${randomSuffix}`;

          await tx.productVariant.create({
            data: {
              variantName: variant.variantName,
              unit: variant.unit,
              weightKg: Number(variant.weightKg) || 0,
              quantity: Number(variant.quantity) || 0,
              color: variant.color,
              size: variant.size,
              supplier: variant.supplier || rest.supplier,
              invoiceId: variant.invoiceId,
              variantImage: imageUrl || variant.variantImage,
              productId,
              sku,
              warehouseId: variant.warehouseId && variant.warehouseId !== "default-warehouse-id" ? variant.warehouseId : (await tx.warehouse.findFirst())?.id || "",
              pricing: (purchasePrice !== undefined && salePrice !== undefined) ? {
                create: { purchasePrice: Number(purchasePrice), salePrice: Number(salePrice) }
              } : (pricing ? { create: pricing } : undefined),
              location: location ? { create: location } : undefined,
              stockControl: stockControl ? { create: stockControl } : undefined,
            },
          });
        }
      }
    }

    return tx.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            pricing: true,
            location: true,
            stockControl: true,
          }
        },
        productImages: true,
      }
    });
  }, {
    timeout: 30000,
  });
};

const deleteProduct = async (userId: string, productId: string) => {
  const merchantDetails = await prisma.merchantDetails.findUnique({
    where: { userId },
  });

  if (!merchantDetails) {
    throw new Error("Merchant details not found");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      merchantDetailsId: merchantDetails.id,
    },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }


  return prisma.product.delete({
    where: { id: productId },
  });
};

const approveProduct = async (id: string) => {
  return prisma.product.update({
    where: { id },
    data: {
      status: ProductStatus.APPROVED,
      rejectionReason: null as any
    } as any,
  });
};

const rejectProduct = async (id: string, reason: string) => {
  return prisma.product.update({
    where: { id },
    data: {
      status: ProductStatus.REJECTED,
      rejectionReason: reason as any,
    } as any,
  });
};

const getAppliedMerchant = async () => {
  const merchantDetails = await prisma.merchantDetails.findMany({
    where: {
      isSubmitted: true,
      isVerified: false,
    },
    select: {
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

  return merchantDetails;
};

export const ProductService = {
  createProduct,
  getMyProducts,
  getSingleProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  approveProduct,
  rejectProduct,
  getAppliedMerchant,
};
