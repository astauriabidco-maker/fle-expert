import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Credit Logic Verification ---');

    // 1. Setup Data
    const org = await prisma.organization.create({
        data: {
            name: 'Test Corp ' + Date.now(),
            slug: 'test-corp-' + Date.now(),
            creditsBalance: 100, // Initial Balance
        }
    });
    console.log(`1. Created Org: ${org.name} (Balance: ${org.creditsBalance})`);

    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            password: 'hashedpassword',
            name: 'Test Candidate',
            organizationId: org.id,
        }
    });
    console.log(`2. Created User: ${user.email}`);

    // 2. Start Exam (Should NOT deduct credits)
    try {
        // Simulate Service Logic locally since we can't easily import the NestJS service here without full context, 
        // but we can simulate the DB operations or use fetch to call the running API.
        // Let's use fetch to call the running API for realism.
        const startRes = await fetch('http://localhost:3000/exam/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, organizationId: org.id })
        });
        const startData = await startRes.json();
        console.log('3. Started Exam (API):', startData.message);

        const orgAfterStart = await prisma.organization.findUnique({ where: { id: org.id } });
        console.log(`4. Org Balance After Start: ${orgAfterStart?.creditsBalance} (Expected: 100)`);

        if (orgAfterStart?.creditsBalance !== 100) {
            console.error('FAILED: Credits deducted at start!');
        } else {
            console.log('PASSED: No deduction at start.');
        }

        // 3. Complete Exam (Should deduct 50 credits)
        const sessionId = startData.session.id;
        const completeRes = await fetch(`http://localhost:3000/exam/${sessionId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: [] })
        });
        const completeData = await completeRes.json();
        console.log('5. Completed Exam (API):', completeData.message);

        const orgAfterComplete = await prisma.organization.findUnique({ where: { id: org.id } });
        console.log(`6. Org Balance After Complete: ${orgAfterComplete?.creditsBalance} (Expected: 50)`);

        if (orgAfterComplete?.creditsBalance !== 50) {
            console.error('FAILED: Credits NOT deducted correctly at completion!');
        } else {
            console.log('PASSED: Success! 50 Credits deducted.');
        }

    } catch (error) {
        console.error('Error during test:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
