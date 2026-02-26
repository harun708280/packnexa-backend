import { prisma } from "./src/app/shared/prisma";

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true
            }
        });
        console.log("Current Users in DB:");
        console.table(users);
    } catch (error) {
        console.error("Error fetching users:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
