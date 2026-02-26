/* eslint-disable no-console */
declare const process: any;
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.product.count();
    console.log(`Total products in database: ${count}`);

    if (count > 0) {
        const samples = await prisma.product.findMany({
            take: 5,
            select: {
                id: true,
                productName: true,
                status: true,
            }
        });
        console.log("Sample products:", JSON.stringify(samples, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
