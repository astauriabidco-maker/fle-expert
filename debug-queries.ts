import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log("Checking Organizations...");
    try {
        const orgs = await prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: { where: { role: 'CANDIDATE' } },
                        questions: true
                    }
                }
            }
        });
        console.log("Orgs count:", orgs.length);
    } catch (e: any) {
        console.error("Error in getAllOrganizations query:", e.message);
    }

    console.log("\nChecking Stats...");
    try {
        const stats = await Promise.all([
            prisma.user.count({ where: { role: 'CANDIDATE' } }),
            prisma.organization.count(),
            prisma.examSession.count(),
            prisma.creditTransaction.aggregate({
                where: { type: 'PURCHASE' },
                _sum: { amount: true }
            })
        ]);
        console.log("Stats counts:", stats);
    } catch (e: any) {
        console.error("Error in getGlobalStats query:", e.message);
    }
}

debug().finally(() => prisma.$disconnect());
