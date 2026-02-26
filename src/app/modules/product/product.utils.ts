import { prisma } from "../../shared/prisma";

export const generateUniqueSKU = async (client?: any): Promise<string> => {
    const prismaInstance = client || prisma;
    const count = await prismaInstance.productVariant.count();
    const nextNumber = count + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sku = `NEXA-${nextNumber}${randomSuffix}`;


    const existing = await prismaInstance.productVariant.findUnique({
        where: { sku },
    });

    if (existing) {
        return generateUniqueSKU(prismaInstance);
    }

    return sku;
};
