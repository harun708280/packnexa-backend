import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const merchantId = "5bfd6efc-1732-4496-a5b0-0983f412ac1c";
  const variants = await prisma.productVariant.findMany({
    where: { merchantDetailsId: merchantId },
    select: {
      id: true,
      variantName: true,
      merchantWebProductId: true,
    }
  });

  console.log("Merchant Variants:");
  console.log(JSON.stringify(variants, null, 2));

  const allWithId = await prisma.productVariant.findMany({
    where: { merchantWebProductId: { in: ["4616", "4620", "4251"] } },
    select: {
      merchantDetailsId: true,
      merchantWebProductId: true,
    }
  });
  console.log("\nAll variants with these IDs across ALL merchants:");
  console.log(JSON.stringify(allWithId, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
