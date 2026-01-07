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

    async getSystemSettings() {
        const settings = await this.prisma.systemSetting.findMany();
        const defaults = {
            'maintenance_mode': 'false',
            'ai_unit_cost': '0.015'
        };

        const result: any = { ...defaults };
        settings.forEach(s => {
            result[s.key] = s.value;
        });

        // Convert types appropriately for the consumer
        return {
            maintenance_mode: result['maintenance_mode'] === 'true',
            ai_unit_cost: parseFloat(result['ai_unit_cost'])
        };
    }

    async updateSystemSetting(key: string, value: string, type: string = 'string') {
        return await this.prisma.systemSetting.upsert({
            where: { key },
            update: { value: value.toString(), type },
            create: { key, value: value.toString(), type }
        });
    }

    async getAllOrganizations() {
        return await this.prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: { where: { role: 'CANDIDATE' } },
                        questions: true,
                        examSessions: true
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
        if (data.settings) {
            const current = await this.prisma.organization.findUnique({ where: { id }, select: { settings: true } });
            const currentSettings = (current?.settings as any) || {};
            // Merge existing settings with new ones
            data.settings = { ...currentSettings, ...data.settings };
        }

        return await this.prisma.organization.update({
            where: { id },
            data
        });
    }

    async getCoachCalendar(coachId: string) {
        // 1. Fetch Availabilities
        const availabilities = await this.prisma.coachAvailability.findMany({
            where: { coachId }
        });

        // 2. Fetch "Events" (Sessions of students assigned to this coach)
        // We'll estimate "events" from ExamSessions created by students of this coach
        // This is an approximation as we don't have a dedicated "Event/Booking" model yet.
        const sessions = await this.prisma.examSession.findMany({
            where: {
                user: { coachId: coachId }
            },
            include: { user: { select: { name: true, id: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        const events = sessions.map(s => ({
            id: s.id,
            date: s.createdAt, // Use creation date as event date
            startTime: s.createdAt.toISOString().slice(11, 16),
            endTime: new Date(s.createdAt.getTime() + 60 * 60 * 1000).toISOString().slice(11, 16), // Assume 1h duration
            type: s.type === 'EXAM' ? 'exam' : 'session',
            title: s.type === 'EXAM' ? 'Examen' : 'Session',
            studentName: s.user.name,
            studentId: s.user.id
        }));

        return { availabilities, events };
    }

    async getOrgTransactions(orgId: string) {
        return await this.prisma.creditTransaction.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getGlobalTransactions() {
        return await this.prisma.creditTransaction.findMany({
            include: {
                organization: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 200 // Limit for performance
        });
    }

    async getCoachesOversight() {
        // Fetch all coaches and their associated candidate counts and last login
        const coaches = await this.prisma.user.findMany({
            where: { role: 'COACH' },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                lastActivityDate: true,
                organization: { select: { name: true } },
                _count: {
                    select: {
                        students: true // Use 'students' instead of 'candidates'
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        return coaches;
    }

    async getParcoursOversight() {
        // Fetch all candidates and their aggregated performance stats
        const candidates = await this.prisma.user.findMany({
            where: { role: 'CANDIDATE' },
            select: {
                id: true,
                name: true,
                email: true,
                currentLevel: true,
                createdAt: true,
                organization: { select: { name: true, id: true } },
                coach: { select: { name: true } },
                xp: true // Use 'xp' as a proxy for stats for now
            },
            orderBy: { createdAt: 'desc' },
            take: 500 // Limit for safety
        });
        return candidates;
    }

    async getOrgOversight() {
        // Fetch organizations with active student counts and session counts
        return await this.prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: { where: { role: 'CANDIDATE' } },
                        examSessions: true // Use 'examSessions' instead of 'sessions'
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async getPlatformHealth() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch All Orgs to get settings
        const allOrgs = await this.prisma.organization.findMany({
            where: { status: 'ACTIVE' },
            include: {
                _count: {
                    select: {
                        users: { where: { role: 'CANDIDATE', createdAt: { gte: thirtyDaysAgo } } },
                        examSessions: true
                    }
                }
            }
        });

        // Use first org settings as global default or hardcoded fallback
        const globalSettings: any = (allOrgs[0] as any)?.settings || {
            churnDays: 14,
            coachSaturation: 15,
            creditThreshold: 0.1
        };

        const churnDate = new Date();
        churnDate.setDate(churnDate.getDate() - (globalSettings.churnDays || 14));

        const [
            totalCandidates,
            inactiveCandidates,
            totalCoaches,
            aiStats,
            examStats,
            pendingCoachesCount
        ] = await Promise.all([
            this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
            this.prisma.user.count({
                where: {
                    role: 'CANDIDATE',
                    OR: [
                        { lastActivityDate: { lt: churnDate } },
                        { lastActivityDate: null, createdAt: { lt: churnDate } }
                    ]
                }
            }),
            this.prisma.user.count({ where: { role: 'COACH' } }),
            this.prisma.examSession.aggregate({
                where: { status: 'COMPLETED', correlationScore: { not: null } },
                _avg: { correlationScore: true, aiCostUsd: true },
                _sum: { aiTokensUsed: true }
            }),
            this.prisma.examSession.groupBy({
                by: ['status'],
                _count: { _all: true },
                where: { createdAt: { gte: thirtyDaysAgo } }
            }),
            this.prisma.user.count({
                where: { role: 'COACH', hasVerifiedPrerequisites: false }
            })
        ]);

        // Success Rate Calculation
        const completedExams = await this.prisma.examSession.count({
            where: { status: 'COMPLETED', score: { gte: 70 }, createdAt: { gte: thirtyDaysAgo } }
        });
        const totalCompleted = await this.prisma.examSession.count({
            where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } }
        });
        const successRate = totalCompleted > 0 ? (completedExams / totalCompleted) * 100 : 0;

        // Coach Saturation
        const coachLoad = await this.prisma.user.findMany({
            where: { role: 'COACH' },
            select: { _count: { select: { students: true } } }
        });
        const saturatedCoachesCount = coachLoad.filter(c => c._count.students >= (globalSettings.coachSaturation || 15)).length;

        // Top/Bottom OFs (by new signups this month)
        const orgsWithSignups = allOrgs.map(org => {
            const orgSet: any = (org as any).settings || globalSettings;
            const threshold = orgSet.creditThreshold || 0.1;
            return {
                id: org.id,
                name: org.name,
                newSignups: org._count.users,
                credits: org.creditsBalance,
                isCritical: org.creditsBalance <= (org.monthlyQuota * threshold)
            };
        }).sort((a, b) => b.newSignups - a.newSignups);

        return {
            pedagogical: {
                successRate,
                vitesseProgression: "12 jours / niveau", // Global estimate
                activeExams30d: totalCompleted
            },
            churnRisk: {
                total: totalCandidates,
                inactive: inactiveCandidates,
                percentage: totalCandidates > 0 ? (inactiveCandidates / totalCandidates) * 100 : 0
            },
            coachSaturation: {
                totalCoaches,
                saturatedCoaches: saturatedCoachesCount,
                avgLoad: totalCoaches > 0 ? totalCandidates / totalCoaches : 0
            },
            aiQuality: {
                precision: aiStats._avg.correlationScore || 0,
                avgCostPerExam: aiStats._avg.aiCostUsd || 0,
                totalTokens30d: aiStats._sum.aiTokensUsed || 0
            },
            commercial: {
                topOrgs: orgsWithSignups.slice(0, 5),
                bottomOrgs: orgsWithSignups.filter(o => o.newSignups === 0).slice(0, 5),
                pipelineRecrutement: pendingCoachesCount,
                criticalOrgsCount: orgsWithSignups.filter(o => o.isCritical).length
            },
            settings: globalSettings
        };
    }

    async getOrgSettings(orgId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: { settings: true }
        });
        return (org as any)?.settings || {
            churnDays: 14,
            coachSaturation: 15,
            creditThreshold: 0.1
        };
    }

    async updateOrgSettings(orgId: string, settings: any) {
        return await this.prisma.organization.update({
            where: { id: orgId },
            data: { settings }
        });
    }

    async getGlobalInvoices() {
        return await this.prisma.coachInvoice.findMany({
            include: {
                coach: { select: { name: true, email: true } },
                // organization: { select: { name: true } } // Invoice doesn't have direct relation to Organization in schema currently? 
                // Wait, schema says: organizationId String. But no relation defined line 108?
                // Let's check schema again.
                // model CoachInvoice { ... organizationId String ... coach User ... }
                // There is NO relation field to Organization defined in CoachInvoice model in schema.prisma viewed in step 371.
                // I cannot include organization. I must rely on manual fetch or update schema.
                // Updating schema is safer but requires migration.
                // For now, I will just fetch coach.
            },
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
                },
                pedagogicalActions: {
                    orderBy: { createdAt: 'desc' },
                    include: { coach: { select: { name: true } } }
                },
                badges: {
                    include: { badge: true }
                },
                coach: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                offlineProofs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!user) throw new NotFoundException('Utilisateur introuvable');

        const stats = await this.prisma.examSession.aggregate({
            where: { userId, status: 'COMPLETED' },
            _avg: { score: true },
            _count: true
        });

        // Calculer la moyenne par compétence
        const sessions = user.examSessions.filter(s => s.status === 'COMPLETED' && s.breakdown);
        const breakdownStats = sessions.reduce((acc, curr: any) => {
            const bd = typeof curr.breakdown === 'string' ? JSON.parse(curr.breakdown) : curr.breakdown;
            if (bd) {
                acc.CO += bd.CO || 0;
                acc.CE += bd.CE || 0;
                acc.EO += bd.EO || 0;
                acc.EE += bd.EE || 0;
                acc.count++;
            }
            return acc;
        }, { CO: 0, CE: 0, EO: 0, EE: 0, count: 0 });

        const detailedStats = breakdownStats.count > 0 ? {
            CO: Math.round(breakdownStats.CO / breakdownStats.count),
            CE: Math.round(breakdownStats.CE / breakdownStats.count),
            EO: Math.round(breakdownStats.EO / breakdownStats.count),
            EE: Math.round(breakdownStats.EE / breakdownStats.count)
        } : null;

        return {
            ...user,
            stats: {
                averageScore: Math.round(stats._avg.score || 0),
                totalExams: stats._count,
                breakdown: detailedStats
            },
            gamification: {
                xp: user.xp,
                streak: user.streakCurrent,
                streakMax: user.streakMax,
                badges: user.badges,
            },
            prerequisites: {
                verified: user.hasVerifiedPrerequisites,
                proofUrl: user.prerequisitesProofUrl,
            },
            objective: user.objective,
            coach: user.coach,
            portfolio: user.offlineProofs,
            activityLogs: await (this.prisma as any).auditLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
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
