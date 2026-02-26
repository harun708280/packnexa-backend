import { ProductService } from "./src/app/modules/product/product.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Calling ProductService.getAllProducts()...");
        const result = await ProductService.getAllProducts({ page: "1", limit: "10" });
        console.log("Result meta:", JSON.stringify(result.meta, null, 2));
        console.log("Result data length:", result.data.length);
        if (result.data.length > 0) {
            console.log("First product sample:", JSON.stringify(result.data[0], null, 2));
        } else {
            const rawProducts = await prisma.product.findMany({ take: 5 });
            console.log("Raw products in DB:", JSON.stringify(rawProducts, null, 2));
        }
    } catch (error) {
        console.error("Error in test:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
