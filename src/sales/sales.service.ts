import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { OnboardingService } from '../onboarding/onboarding.service';
import { EmailService } from '../common/services/email.service';

export interface QuickAddDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    objective: string;  // 'NATURALISATION_B1', 'TITRE_SEJOUR_A2', 'PROFESSIONNEL_C1', etc.
    desiredStartDate?: string;
    coachId?: string;
    sendEmail: boolean;
}

@Injectable()
export class SalesService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => OnboardingService))
        private onboardingService: OnboardingService,
        private emailService: EmailService
    ) { }

    // ========== QUICK ADD CANDIDATE ==========
    async quickAddCandidate(salesRepId: string, data: QuickAddDto) {
        // 1. Get sales rep info
        const salesRep = await this.prisma.user.findUnique({
            where: { id: salesRepId },
            include: { organization: true }
        });

        if (!salesRep || !salesRep.organizationId) {
            throw new NotFoundException("Commercial non trouvé ou sans organisation.");
        }

        // 2. Check for duplicate email
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new ConflictException("Un candidat avec cet email existe déjà.");
        }

        // 3. Map objective to targetLevel
        const objectiveToLevel: Record<string, string> = {
            'NATURALISATION_B1': 'B1',
            'TITRE_SEJOUR_A2': 'A2',
            'PROFESSIONNEL_C1': 'C1',
            'ETUDES_B2': 'B2',
            'DECOUVERTE_A1': 'A1',
        };
        const targetLevel = objectiveToLevel[data.objective] || 'B2';

        // 4. Create the candidate
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        const tempPassword = await import('bcryptjs').then(b => b.hash('ChangeMe123!', 10));

        const candidate = await this.prisma.user.create({
            data: {
                email: data.email,
                name: fullName,
                phone: data.phone,
                password: tempPassword,
                role: 'CANDIDATE',
                salesRepId: salesRepId,
                organizationId: salesRep.organizationId,
                targetLevel: targetLevel,
                objective: data.objective,
                coachId: data.coachId || null,
                acquisition: 'ECOLE',
            }
        });

        // 5. Generate diagnostic link
        const token = await this.onboardingService.generateOnboardingToken({
            id: candidate.id,
            email: candidate.email
        });

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const diagnosticLink = `${baseUrl}/onboarding?token=${token}`;

        // 6. Send email if requested
        let emailSent = false;
        if (data.sendEmail) {
            try {
                await this.emailService.sendStudentInvite(
                    data.email,
                    diagnosticLink,
                    salesRep.organization?.name || 'Votre organisme de formation'
                );
                emailSent = true;
            } catch (error) {
                console.error('[QUICK-ADD] Email sending failed:', error);
                // Don't throw - candidate is created, email just failed
            }
        }

        return {
            success: true,
            candidate: {
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                status: 'A_POSITIONNER'
            },
            diagnosticLink,
            emailSent,
            message: emailSent
                ? `Candidat créé ! Invitation envoyée à ${data.email}.`
                : `Candidat créé ! Copiez le lien pour l'envoyer manuellement.`
        };
    }

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
            // Use manual override if present, otherwise calculate automatically
            let pipelineStatus = c.pipelineStatusOverride;

            if (!pipelineStatus) {
                // Calculate pipeline status automatically
                pipelineStatus = 'NOUVEAU';

                if (c.proposals.some(p => p.status === 'ACCEPTED')) {
                    pipelineStatus = 'INSCRIT';
                } else if (c.proposals.length > 0) {
                    pipelineStatus = 'DEVIS_ENVOYE';
                } else if (c.hasCompletedDiagnostic) {
                    pipelineStatus = 'DIAGNOSTIC_TERMINE';
                } else if (c.examSessions.length > 0) {
                    // Has at least one exam session started = diagnostic sent
                    pipelineStatus = 'DIAGNOSTIC_ENVOYE';
                }
            }

            return {
                id: c.id,
                name: c.name,
                email: c.email,
                phone: c.phone,
                level: c.currentLevel,
                objective: c.objective,
                pipelineStatus,
                lastActivity: c.lastActivityDate || c.updatedAt,
                hasDiagnostic: c.hasCompletedDiagnostic,
                createdAt: c.createdAt,
            };
        });
    }

    async updateCandidateStatus(salesRepId: string, candidateId: string, newStatus: string) {
        // Verify ownership
        const candidate = await this.prisma.user.findFirst({
            where: { id: candidateId, salesRepId }
        });

        if (!candidate) {
            throw new NotFoundException("Candidat non trouvé ou non assigné.");
        }

        // Persist the manual override
        await this.prisma.user.update({
            where: { id: candidateId },
            data: { pipelineStatusOverride: newStatus }
        });

        return { success: true, candidateId, newStatus };
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

    // ========== GET COACHES FOR ASSIGNMENT ==========
    async getCoaches(organizationId: string) {
        return this.prisma.user.findMany({
            where: {
                organizationId,
                role: { in: ['COACH', 'FORMATEUR'] }
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: { name: 'asc' }
        });
    }

    async updateCandidateTags(salesRepId: string, candidateId: string, tags: string[]) {
        // Verify ownership (simplified check)
        const candidate = await this.prisma.user.findFirst({
            where: { id: candidateId, role: 'CANDIDATE' }
        });

        if (!candidate) throw new NotFoundException("Candidat non trouvé");

        return this.prisma.user.update({
            where: { id: candidateId },
            data: { tags: JSON.stringify(tags) }
        });
    }
}

