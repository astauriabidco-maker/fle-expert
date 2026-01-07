
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@preptef.com' },
        include: { organization: true }
    });
    console.log('User Org:', user?.organization);
    console.log('User Org ID:', user?.organizationId);
}
main().catch(console.error).finally(() => prisma.$disconnect());
