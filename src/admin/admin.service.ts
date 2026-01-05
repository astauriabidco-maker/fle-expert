import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../common/services/security.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private security: SecurityService,
        private jwtService: JwtService
    ) { }

    async getGlobalStats() {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalUsers, totalOrgs, totalExams, revenueAggregate, monthlyExams, aiTokensAggregate, totalAiSessions] = await Promise.all([
            this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
            this.prisma.organization.count(),
            this.prisma.examSession.count(),
            this.prisma.creditTransaction.aggregate({
                where: { type: 'PURCHASE' },
                _sum: { amount: true }
            }),
            this.prisma.examSession.count({
                where: { createdAt: { gte: firstDayOfMonth } }
            }),
            this.prisma.examSession.aggregate({
                _sum: { aiTokensUsed: true, aiCostUsd: true }
            }),
            this.prisma.examSession.count({
                where: { status: 'COMPLETED' }
            })
        ]);

        const sums = aiTokensAggregate._sum;

        return {
            totalUsers,
            totalOrgs,
            totalExams,
            totalRevenue: (revenueAggregate._sum.amount || 0) * 0.1, // Mock conversion rate
            monthlyExams,
            aiTokensUsed: sums?.aiTokensUsed || 0,
            totalAiCost: (sums as any)?.aiCostUsd || 0,
            completionRate: totalExams > 0 ? (totalAiSessions / totalExams) * 100 : 0
        };
    }

    async getAiObservatoryData() {
        // Average correlation between AI and Human grades
        const correlationStats = await this.prisma.examSession.aggregate({
            where: {
                status: 'COMPLETED',
                humanGrade: { not: null }
            },
            _avg: {
                correlationScore: true
            },
            _count: true
        });

        const recentSessions = await this.prisma.examSession.findMany({
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                score: true,
                humanGrade: true,
                correlationScore: true,
                createdAt: true,
                organization: { select: { name: true } }
            }
        });

        return {
            avgCorrelation: correlationStats._avg?.correlationScore || 0,
            evaluatedSessions: correlationStats._count,
            recentLogs: recentSessions
        };
    }

    async getAuditLogs(page = 1, limit = 50) {
        return await (this.prisma as any).auditLog.findMany({
            include: {
                user: { select: { name: true, email: true } },
                organization: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });
    }

    async logAction(data: { action: string, type: string, id: string, payload?: any, userId?: string, orgId?: string }) {
        return await (this.prisma as any).auditLog.create({
            data: {
                action: data.action,
                entityType: data.type,
                entityId: data.id,
                payload: data.payload ? JSON.stringify(data.payload) : null,
                userId: data.userId,
                organizationId: data.orgId
            }
        });
    }

    async exportGdprData() {
        const [orgs, users] = await Promise.all([
            this.prisma.organization.findMany(),
            this.prisma.user.findMany({
                select: { id: true, email: true, name: true, role: true, createdAt: true, organizationId: true }
            })
        ]);
        return { orgs, users, exportedAt: new Date().toISOString() };
    }

    async getAllOrganizations() {
        return await this.prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: { where: { role: 'CANDIDATE' } },
                        questions: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateOrgStatus(id: string, status: string) {
        return await this.prisma.organization.update({
            where: { id },
            data: { status }
        });
    }

    async addOrgCredits(id: string, amount: number) {
        return await this.prisma.$transaction([
            this.prisma.organization.update({
                where: { id },
                data: { creditsBalance: { increment: amount } }
            }),
            this.prisma.creditTransaction.create({
                data: {
                    organizationId: id,
                    amount,
                    type: 'ADMIN_INJECTION'
                }
            })
        ]);
    }

    async getAllUsers(role?: string, orgId?: string) {
        const where: any = {};
        if (role) where.role = role;
        if (orgId) where.organizationId = orgId;

        return await this.prisma.user.findMany({
            where,
            include: {
                organization: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateUser(id: string, data: any) {
        return await this.prisma.user.update({
            where: { id },
            data
        });
    }

    async deleteUser(id: string) {
        return await this.prisma.$transaction(async (tx: any) => {
            // 1. Delete all answers by this user (linked via Session)
            // Need to find sessions first
            const sessions = await tx.examSession.findMany({
                where: { userId: id },
                select: { id: true }
            });
            const sessionIds = sessions.map((s: any) => s.id);

            await tx.userAnswer.deleteMany({
                where: { sessionId: { in: sessionIds } }
            });

            // 2. Delete sessions
            await tx.examSession.deleteMany({
                where: { userId: id }
            });

            // 3. Delete User
            return await tx.user.delete({
                where: { id }
            });
        });
    }

    async deleteOrganization(id: string) {
        return await this.prisma.$transaction(async (tx: any) => {
            // 1. Delete Invitations
            await tx.invitation.deleteMany({ where: { organizationId: id } });

            // 2. Delete Credit Transactions
            await tx.creditTransaction.deleteMany({ where: { organizationId: id } });

            // 3. Delete Questions (and their answers ? No, Questions are linked to Org, answers linked to Question)
            // Need to delete answers to questions owned by this Org first?
            // Actually, UserAnswers refer to Question. If we delete Question, SQLite might complain if no cascade.
            // Let's find questions first.
            const questions = await tx.question.findMany({ where: { organizationId: id }, select: { id: true } });
            const questionIds = questions.map((q: any) => q.id);
            await tx.userAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
            await tx.question.deleteMany({ where: { organizationId: id } });


            // 4. Delete Users and their data
            const users = await tx.user.findMany({ where: { organizationId: id }, select: { id: true } });
            const userIds = users.map((u: any) => u.id);

            // 4a. Delete Sessions of these users
            const sessions = await tx.examSession.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
            const sessionIds = sessions.map((s: any) => s.id);

            // 4b. Delete Answers of these sessions (redundant check but safe)
            await tx.userAnswer.deleteMany({ where: { sessionId: { in: sessionIds } } });

            await tx.examSession.deleteMany({ where: { userId: { in: userIds } } });

            // 4c. Delete Users
            await tx.user.deleteMany({ where: { organizationId: id } });

            // 5. Delete Organization
            return await tx.organization.delete({ where: { id } });
        });
    }

    async updateOrganization(id: string, data: any) {
        return await this.prisma.organization.update({
            where: { id },
            data
        });
    }

    async getOrgTransactions(orgId: string) {
        return await this.prisma.creditTransaction.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async resetOrgAdminPassword(orgId: string, newPassword?: string) {
        // Find the admin user for this org (Role COACH, linked to org)
        // Assumption: There is only one main admin/coach created with the org.
        // Or we reset ALL coaches? Or we find the one that was created initially?
        // Let's reset ALL users with role COACH for this org for simplicity, or find the first one.
        // Better: Find the user with role COACH for this org.

        const adminUser = await this.prisma.user.findFirst({
            where: { organizationId: orgId, role: 'COACH' }
        });

        if (!adminUser) {
            throw new Error("Aucun administrateur trouvé pour cet organisme.");
        }

        const actualPassword = newPassword || 'password_temp_a_changer';
        const { hash, salt } = this.security.hashWithSalt(actualPassword);
        const passwordStored = `${salt}:${hash}`;

        await this.prisma.user.update({
            where: { id: adminUser.id },
            data: { password: passwordStored }
        });

        return { success: true, email: adminUser.email }; // Don't return password
    }

    async getGlobalSessions() {
        return await this.prisma.examSession.findMany({
            include: {
                user: { select: { name: true, email: true } },
                organization: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    async getUserFullProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true,
                examSessions: {
                    orderBy: { createdAt: 'desc' },
                }
            }
        });

        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const stats = await this.prisma.examSession.aggregate({
            where: { userId, status: 'COMPLETED' },
            _avg: { score: true },
            _count: true
        });

        return {
            ...user,
            stats: {
                averageScore: Math.round(stats._avg.score || 0),
                totalExams: stats._count
            }
        };
    }

    async getSessionDetails(sessionId: string) {
        return await this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                user: { select: { name: true, email: true } },
                organization: { select: { name: true } },
                answers: {
                    include: { question: true }
                }
            }
        });
    }

    async impersonateUser(adminId: string, targetUserId: string) {
        // 1. Verify that the requestor is a Super Admin
        const requestor = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (!requestor || requestor.role !== 'SUPER_ADMIN') {
            throw new Error("Unauthorized: Only Super Admins can impersonate.");
        }

        // 2. Fetch Target User
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: { organization: true }
        });

        if (!targetUser) throw new Error("Target user not found.");

        // 3. Generate Token
        const payload = {
            email: targetUser.email,
            sub: targetUser.id,
            role: targetUser.role,
            organizationId: targetUser.organization?.id || null,
            isImpersonated: true
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

        // 4. Return login payload
        return {
            access_token: accessToken,
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                role: targetUser.role,
                hasCompletedDiagnostic: targetUser.hasCompletedDiagnostic,
                isImpersonated: true,
            },
            organization: targetUser.organization ? {
                id: targetUser.organization.id,
                name: targetUser.organization.name,
                logoUrl: targetUser.organization.logoUrl
            } : null
        };
    }
}
