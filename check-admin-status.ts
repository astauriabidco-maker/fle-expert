
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for admin user...");
    const user = await prisma.user.findUnique({
        where: { email: 'admin@preptef.com' }
    });

    if (user) {
        console.log("User found:", user.email);
        console.log("Role:", user.role);
        console.log("ID:", user.id);
        console.log("Password Hash (first 10 chars):", user.password?.substring(0, 10));
    } else {
        console.log("User admin@preptef.com NOT FOUND.");
        // List all users to see what exists
        const users = await prisma.user.findMany({ select: { email: true, role: true } });
        console.log("Existing users:", users);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
