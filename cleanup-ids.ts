import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const variants = await prisma.productVariant.findMany({
    where: {
      merchantWebProductId: { not: null }
    }
  });

  console.log(`Checking ${variants.length} variants...`);

  let updateCount = 0;
  for (const variant of variants) {
    if (variant.merchantWebProductId && variant.merchantWebProductId !== variant.merchantWebProductId.trim()) {
      const trimmedId = variant.merchantWebProductId.trim();
      console.log(`Trimming: "${variant.merchantWebProductId}" -> "${trimmedId}" (Variant: ${variant.variantName})`);
      
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { merchantWebProductId: trimmedId }
      });
      updateCount++;
    }
  }

  console.log(`Cleanup complete. Updated ${updateCount} variants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
