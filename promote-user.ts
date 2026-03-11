import { prisma } from "./src/app/shared/prisma";
import { UserRole } from "@prisma/client";

async function promoteVerifiedMerchants(email?: string) {
    try {
        if (email) {
            const user = await prisma.user.update({
                where: { email },
                data: { role: UserRole.MERCHANT }
            });
            console.log(`Successfully promoted ${email} to MERCHANT`);

            await prisma.merchantDetails.updateMany({
                where: { userId: user.id },
                data: { isVerified: true, isSubmitted: true }
            });
        } else {
            const verifiedDetails = await prisma.merchantDetails.findMany({
                where: { isVerified: true },
                include: { user: true }
            });

            for (const details of verifiedDetails) {
                if (details.user.role !== UserRole.MERCHANT) {
                    await prisma.user.update({
                        where: { id: details.userId },
                        data: { role: UserRole.MERCHANT }
                    });
                    console.log(`Promoted verified merchant ${details.user.email} to MERCHANT`);
                }
            }
        }
    } catch (error) {
        console.error("Error promoting user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
promoteVerifiedMerchants(email);
