const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data (order matters for foreign keys)
    await prisma.userAnswer.deleteMany();
    await prisma.examSession.deleteMany();
    await prisma.coachAvailability.deleteMany();
    await prisma.coachInvoice.deleteMany();
    await prisma.pedagogicalAction.deleteMany();
    await prisma.offlineProof.deleteMany();
    await prisma.question.deleteMany();
    await prisma.creditTransaction.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.trainingProposal.deleteMany();
    await prisma.formateurDocument.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    console.log('📦 Cleaned existing data');

    // Create Organization
    const org = await prisma.organization.create({
        data: {
            name: 'Centre FLE Paris',
            slug: 'fle-paris',
            creditsBalance: 50000,
            publicHourlyRate: 45,
            monthlyQuota: 5000,
            logoUrl: 'https://via.placeholder.com/150',
            primaryColor: '#4F46E5',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Organization created:', org.name);

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Super Admin
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@fle.fr',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            organizationId: org.id,
        },
    });
    console.log('✅ Super Admin:', superAdmin.email);

    // Create Org Admin
    const orgAdmin = await prisma.user.create({
        data: {
            email: 'of@fle.fr',
            password: hashedPassword,
            name: 'Responsable Formation',
            role: 'ORG_ADMIN',
            organizationId: org.id,
        },
    });
    console.log('✅ Org Admin:', orgAdmin.email);

    // Create Coach
    const coach = await prisma.user.create({
        data: {
            email: 'coach@fle.fr',
            password: hashedPassword,
            name: 'Marie Dupont',
            role: 'COACH',
            organizationId: org.id,
            nda: 'NDA-2024-001',
            hourlyRate: 45,
            phone: '+33612345678',
            address: '15 Rue de la Paix',
            postalCode: '75001',
            city: 'Paris',
        },
    });
    console.log('✅ Coach:', coach.email);

    // Create Sales
    const sales = await prisma.user.create({
        data: {
            email: 'sales@fle.fr',
            password: hashedPassword,
            name: 'Jean Commercial',
            role: 'SALES',
            organizationId: org.id,
        },
    });
    console.log('✅ Sales:', sales.email);

    // Create 10 Candidates assigned to the coach
    const candidates = [];
    const levels = ['A1', 'A2', 'B1', 'B2'];
    const objectives = ['RESIDENCY_MULTI_YEAR', 'NATURALIZATION', 'PROFESSIONAL', 'CANADA'];

    for (let i = 1; i <= 10; i++) {
        const candidate = await prisma.user.create({
            data: {
                email: `candidat${i}@test.fr`,
                password: hashedPassword,
                name: `Candidat Test ${i}`,
                role: 'CANDIDATE',
                organizationId: org.id,
                currentLevel: levels[i % 4],
                targetLevel: 'B2',
                objective: objectives[i % 4],
                hasCompletedDiagnostic: i % 2 === 0,
                coachId: coach.id,
                salesRepId: sales.id,
                xp: Math.floor(Math.random() * 5000),
                streakCurrent: Math.floor(Math.random() * 30),
                tags: JSON.stringify(i <= 3 ? ['Priorité'] : []),
            },
        });
        candidates.push(candidate);
    }
    console.log('✅ Created 10 candidates');

    // Create Questions
    const topics = ['Compréhension Orale', 'Compréhension Écrite', 'Expression Orale', 'Expression Écrite'];

    for (const level of levels) {
        for (const topic of topics) {
            for (let i = 1; i <= 5; i++) {
                await prisma.question.create({
                    data: {
                        organizationId: org.id,
                        level,
                        topic,
                        content: `Question ${level} ${topic} #${i}`,
                        questionText: `Quelle est la bonne réponse pour ${topic.toLowerCase()} niveau ${level}?`,
                        options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
                        correctAnswer: 'A',
                        explanation: `Explication pour cette question de ${topic} niveau ${level}.`,
                        isActive: true,
                    },
                });
            }
        }
    }
    console.log('✅ Created 80 questions (5 per topic per level)');

    // Create Exam Sessions for candidates
    for (const candidate of candidates.slice(0, 5)) {
        await prisma.examSession.create({
            data: {
                userId: candidate.id,
                organizationId: org.id,
                type: 'EXAM',
                status: 'COMPLETED',
                score: Math.floor(Math.random() * 300) + 400,
                estimatedLevel: candidate.currentLevel,
                breakdown: JSON.stringify({
                    CO: Math.floor(Math.random() * 200),
                    CE: Math.floor(Math.random() * 200),
                    EO: Math.floor(Math.random() * 200),
                    EE: Math.floor(Math.random() * 200),
                }),
                completedAt: new Date(),
            },
        });
    }
    console.log('✅ Created exam sessions for 5 candidates');

    // Create Coach Availability
    for (let day = 1; day <= 5; day++) {
        await prisma.coachAvailability.create({
            data: {
                coachId: coach.id,
                dayOfWeek: day,
                startTime: '09:00',
                endTime: '12:00',
                isRecurring: true,
            },
        });
        await prisma.coachAvailability.create({
            data: {
                coachId: coach.id,
                dayOfWeek: day,
                startTime: '14:00',
                endTime: '18:00',
                isRecurring: true,
            },
        });
    }
    console.log('✅ Created coach availability (Mon-Fri, 9-12 & 14-18)');

    // Create Coach Invoices
    await prisma.coachInvoice.create({
        data: {
            invoiceNumber: 'INV-2025-001',
            coachId: coach.id,
            organizationId: org.id,
            amount: 1350,
            hoursCount: 30,
            status: 'PAID',
        },
    });
    await prisma.coachInvoice.create({
        data: {
            invoiceNumber: 'INV-2025-002',
            coachId: coach.id,
            organizationId: org.id,
            amount: 900,
            hoursCount: 20,
            status: 'DRAFT',
        },
    });
    console.log('✅ Created coach invoices');

    // Create Pedagogical Actions
    for (const candidate of candidates.slice(0, 3)) {
        await prisma.pedagogicalAction.create({
            data: {
                type: 'FEEDBACK',
                content: 'Excellent travail sur la compréhension orale. Continuez à pratiquer avec des podcasts.',
                studentId: candidate.id,
                coachId: coach.id,
            },
        });
    }
    console.log('✅ Created pedagogical actions');

    // Create Credit Transactions
    await prisma.creditTransaction.create({
        data: {
            organizationId: org.id,
            amount: 50000,
            type: 'PURCHASE',
        },
    });
    console.log('✅ Created credit transactions');

    // Create Leads
    for (let i = 1; i <= 5; i++) {
        await prisma.lead.create({
            data: {
                email: `lead${i}@ecole.fr`,
                schoolName: `École de Langue ${i}`,
                contactName: `Directeur ${i}`,
                phone: `+336123456${i}${i}`,
                status: i <= 2 ? 'NEW' : i <= 4 ? 'CONTACTED' : 'CONVERTED',
            },
        });
    }
    console.log('✅ Created 5 leads');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Super Admin: admin@fle.fr / password123');
    console.log('   Org Admin:   of@fle.fr / password123');
    console.log('   Coach:       coach@fle.fr / password123');
    console.log('   Sales:       sales@fle.fr / password123');
    console.log('   Candidates:  candidat1@test.fr ... candidat10@test.fr / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
