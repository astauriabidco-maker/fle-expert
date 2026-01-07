import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
        .createHmac('sha256', usedSalt)
        .update(data)
        .digest('hex');
    return { hash, salt: usedSalt };
}

async function main() {
    console.log("Checking for Super Admin...");

    // 1. Ensure Org exists
    const orgSlug = 'preptef-admin';
    let org = await prisma.organization.findUnique({ where: { slug: orgSlug } });

    if (!org) {
        console.log("Organization 'PrepTEF Admin' not found. Creating it...");
        org = await prisma.organization.create({
            data: {
                name: 'PrepTEF Admin',
                slug: orgSlug,
                creditsBalance: 999999,
            }
        });
    }

    // 2. Upsert User
    const email = 'admin@preptef.com';
    const password = 'admin123';

    // Generate fresh hash
    const { hash, salt } = hashWithSalt(password);
    const storedPassword = `${salt}:${hash}`;

    console.log(`Resetting password for ${email} to '${password}'...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: storedPassword,
            role: 'SUPER_ADMIN', // Ensure forced role
            organizationId: org.id
        },
        create: {
            email,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            organizationId: org.id,
            password: storedPassword
        }
    });

    console.log("User updated:", user);
    console.log("-----------------------------------------");
    console.log("LOGIN CREDENTIALS:");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
