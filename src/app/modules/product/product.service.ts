import { prisma } from "../../shared/prisma";

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

  if (!merchantDetails) {
    throw new Error("No applied merchant found");
  }

  return merchantDetails;
};

export const ProductService = {
  getAppliedMerchant,
};
