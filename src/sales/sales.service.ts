import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { OnboardingService } from '../onboarding/onboarding.service';

@Injectable()
export class SalesService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => OnboardingService))
        private onboardingService: OnboardingService
    ) { }

    async getStats(salesRepId: string) {
        // 1. Get active leads (Assigned candidates that are not simple visitors)
        // For simplicity, any candidate assigned to this sales rep
        const candidates = await this.prisma.user.findMany({
            where: { salesRepId, role: 'CANDIDATE' },
            include: {
                proposals: true,
                examSessions: true,
            }
        });

        const activeLeads = candidates.length;

        // 2. Pending quotes (Proposal status = SENT or DRAFT)
        const pendingQuotes = await this.prisma.trainingProposal.count({
            where: {
                user: { salesRepId },
                status: { in: ['DRAFT', 'SENT'] }
            }
        });

        // 3. Conversion Rate (Candidates with at least one ACCEPTED proposal / Total candidates with Diagnostic)
        const diagnosedCandidates = candidates.filter(c => c.hasCompletedDiagnostic).length;
        const convertedCandidates = candidates.filter(c => c.proposals.some(p => p.status === 'ACCEPTED')).length;

        const conversionRate = diagnosedCandidates > 0
            ? Math.round((convertedCandidates / diagnosedCandidates) * 100)
            : 0;

        // 4. Monthly Revenue (Sum of ACCEPTED proposals this month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyRevenueRaw = await this.prisma.trainingProposal.aggregate({
            where: {
                user: { salesRepId },
                status: 'ACCEPTED',
                updatedAt: { gte: startOfMonth }
            },
            _sum: { totalCost: true }
        });

        return {
            activeLeads,
            pendingQuotes,
            conversionRate: `${conversionRate}%`,
            monthlyRevenue: `${(monthlyRevenueRaw._sum.totalCost || 0).toLocaleString()}€`
        };
    }

    async getCandidates(salesRepId: string) {
        const candidates = await this.prisma.user.findMany({
            where: { salesRepId, role: 'CANDIDATE' },
            include: {
                proposals: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                examSessions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return candidates.map(c => {
            // Determine status
            let status = 'PROSPECT'; // Default
            if (c.proposals.some(p => p.status === 'ACCEPTED')) status = 'INSCRIT';
            else if (c.proposals.length > 0) status = 'DEVIS_EN_COURS';
            else if (c.hasCompletedDiagnostic) status = 'DIAGNOSTIC_FAIT';

            return {
                id: c.id,
                name: c.name,
                email: c.email,
                level: c.currentLevel,
                status,
                lastActivity: c.lastActivityDate,
                hasDiagnostic: c.hasCompletedDiagnostic
            };
        });
    }

    async createCandidate(salesRepId: string, data: { email: string, name: string, targetLevel: string }) {
        // Ensure sales rep exists and gets their org
        const salesRep = await this.prisma.user.findUnique({
            where: { id: salesRepId },
            include: { organization: true }
        });

        if (!salesRep) throw new NotFoundException("Sales Rep not found");

        // Check if user exists
        let user = await this.prisma.user.findUnique({ where: { email: data.email } });

        if (user) {
            // If user exists but has no sales rep, claim them
            if (!user.salesRepId) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { salesRepId, organizationId: salesRep.organizationId }
                });
            }
        } else {
            // Create pending user
            // In a real app we might generate a temp password or just invite status
            // Here we create a placeholder user with a random password they must reset or use via magic link
            user = await this.prisma.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    salesRepId: salesRepId,
                    organizationId: salesRep.organizationId, // Assign to same org
                    role: 'CANDIDATE',
                    password: await import('bcryptjs').then(b => b.hash('ChangeMe123!', 10)), // Temp password logic
                    targetLevel: data.targetLevel
                }
            });
        }

        return user;
    }

    async generateDiagnosticLink(salesRepId: string, candidateId: string) {
        // Verify ownership
        const candidate = await this.prisma.user.findFirst({
            where: { id: candidateId, salesRepId }
        });

        if (!candidate) throw new NotFoundException("Candidat non trouvé ou non assigné.");

        // Generate Onboarding Token
        const token = await this.onboardingService.generateOnboardingToken({
            id: candidate.id,
            email: candidate.email
        });

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const link = `${baseUrl}/onboarding?token=${token}`;

        return { link };
    }
}
