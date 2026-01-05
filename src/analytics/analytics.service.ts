import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getOrgStats(orgId: string) {
        // 1. Distribution of students by level
        const levels = await this.prisma.user.groupBy({
            by: ['currentLevel'] as any,
            where: {
                organizationId: orgId,
                role: 'CANDIDATE'
            },
            _count: true,
        });

        // 2. Average score of finished exam sessions
        const averageScore = await this.prisma.examSession.aggregate({
            where: {
                organizationId: orgId,
                status: 'FINISHED'
            },
            _avg: {
                score: true
            },
        });

        // 3. Total active students
        const activeStudents = await this.prisma.user.count({
            where: {
                organizationId: orgId,
                role: 'CANDIDATE'
            }
        });

        // 4. Total exam sessions
        const totalExams = await this.prisma.examSession.count({
            where: { organizationId: orgId }
        });

        // 5. Recent top performers (Ready for TEF)
        const topPerformers = await this.prisma.examSession.findMany({
            where: {
                organizationId: orgId,
                status: 'FINISHED',
                score: { gt: 500 } // Example threshold for "Ready"
            },
            include: {
                user: true
            },
            orderBy: {
                score: 'desc'
            },
            take: 5
        });

        return {
            distribution: levels.map((l: any) => ({ name: l.currentLevel, value: l._count })),
            avgScore: Math.round(averageScore._avg.score || 0),
            activeStudents,
            totalExams,
            topPerformers: topPerformers.map((ex: any) => ({
                name: ex.user.name || ex.user.email,
                score: ex.score,
                level: ex.estimatedLevel || 'B2'
            })),
            skillsBreakdown: await this.getRealSkillsBreakdown(orgId),
            weeklyPerformance: await this.getWeeklyPerformance(orgId),
            blockingPoints: await this.getBlockingPoints(orgId)
        };
    }

    private async getRealSkillsBreakdown(orgId: string) {
        const answers = await this.prisma.userAnswer.findMany({
            where: {
                session: { organizationId: orgId }
            },
            include: {
                question: { select: { topic: true } }
            }
        });

        const stats: Record<string, { total: number, correct: number }> = {
            'CO': { total: 0, correct: 0 },
            'CE': { total: 0, correct: 0 },
            'EO': { total: 0, correct: 0 },
            'EE': { total: 0, correct: 0 }
        };

        // Map internal topics to TEF skills if needed, or use them directly
        // Assumption: Question topics are 'Grammaire', 'Compréhension Écrite', etc.
        // We'll map them to the 4 main codes used in the UI
        const mapping: Record<string, string> = {
            'Compréhension Orale': 'CO',
            'Compréhension Écrite': 'CE',
            'Expression Orale': 'EO',
            'Expression Écrite': 'EE',
            'Grammaire': 'CE', // Fallback
            'Lexique': 'CE'    // Fallback
        };

        answers.forEach(ans => {
            const skill = mapping[ans.question.topic] || 'CE';
            stats[skill].total++;
            if (ans.isCorrect) stats[skill].correct++;
        });

        return {
            CO: stats.CO.total > 0 ? Math.round((stats.CO.correct / stats.CO.total) * 699) : 350,
            CE: stats.CE.total > 0 ? Math.round((stats.CE.correct / stats.CE.total) * 699) : 380,
            EO: stats.EO.total > 0 ? Math.round((stats.EO.correct / stats.EO.total) * 699) : 320,
            EE: stats.EE.total > 0 ? Math.round((stats.EE.correct / stats.EE.total) * 699) : 410,
        };
    }

    async updateOrgSettings(orgId: string, settings: any) {
        return await this.prisma.organization.update({
            where: { id: orgId },
            data: {
                aiSettings: JSON.stringify(settings)
            }
        });
    }

    async getOrgSettings(orgId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: { aiSettings: true }
        });
        return org?.aiSettings ? JSON.parse(org.aiSettings) : {};
    }

    async getLeaderboard(orgId: string) {
        return await this.prisma.user.findMany({
            where: {
                organizationId: orgId,
                role: 'CANDIDATE'
            },
            orderBy: [
                { xp: 'desc' },
                { streakCurrent: 'desc' }
            ],
            take: 10,
            select: {
                id: true,
                name: true,
                xp: true,
                streakCurrent: true,
                currentLevel: true
            }
        });
    }

    private async getWeeklyPerformance(orgId: string) {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            return d;
        }).reverse();

        const results = await Promise.all(last7Days.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const count = await this.prisma.examSession.count({
                where: {
                    organizationId: orgId,
                    status: 'FINISHED',
                    score: { gte: 400 }, // Success threshold for the chart
                    createdAt: {
                        gte: date,
                        lt: nextDay
                    }
                }
            });

            return {
                day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                count
            };
        }));

        return results;
    }

    private async getBlockingPoints(orgId: string) {
        const errors = await this.prisma.userAnswer.groupBy({
            by: ['questionId'],
            where: {
                isCorrect: false,
                session: { organizationId: orgId }
            },
            _count: true,
            orderBy: {
                _count: { questionId: 'desc' }
            }
        });

        // Map to topics
        const topicErrors: Record<string, number> = {};
        for (const err of errors) {
            const question = await this.prisma.question.findUnique({
                where: { id: err.questionId },
                select: { topic: true }
            });
            if (question) {
                topicErrors[question.topic] = (topicErrors[question.topic] || 0) + err._count;
            }
        }

        return Object.entries(topicErrors)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }

    async getOrgQuestions(orgId: string) {
        return await this.prisma.question.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createQuestion(orgId: string, data: any) {
        return await this.prisma.question.create({
            data: {
                organizationId: orgId,
                level: data.level,
                topic: data.topic,
                content: data.content || '',
                questionText: data.questionText,
                options: typeof data.options === 'string' ? data.options : JSON.stringify(data.options),
                correctAnswer: data.correctAnswer,
                explanation: data.explanation,
            }
        });
    }

    async updateQuestion(id: string, data: any) {
        const updateData: any = { ...data };
        if (data.options && typeof data.options !== 'string') {
            updateData.options = JSON.stringify(data.options);
        }
        return await this.prisma.question.update({
            where: { id },
            data: updateData
        });
    }

    async deleteQuestion(id: string) {
        return await this.prisma.question.delete({
            where: { id }
        });
    }

    async toggleQuestionStatus(id: string, isActive: boolean) {
        return await (this.prisma.question.update as any)({
            where: { id },
            data: { isActive }
        });
    }

    async getStudentsByOrg(orgId: string) {
        const students = await this.prisma.user.findMany({
            where: {
                organizationId: orgId,
                role: 'CANDIDATE'
            },
            select: {
                id: true,
                name: true,
                email: true,
                currentLevel: true,
                createdAt: true,
                examSessions: {
                    where: {
                        status: { in: ['COMPLETED', 'ASSIGNED'] }
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { score: true, estimatedLevel: true, createdAt: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return students.map(s => {
            const sessions = s.examSessions;
            const avgScore = sessions.length > 0
                ? Math.round(sessions.reduce((acc, curr) => acc + (curr.score || 0), 0) / sessions.length)
                : 0;

            return {
                ...s,
                avgScore,
                totalExams: sessions.length,
                lastExamDate: sessions[0]?.createdAt || null,
                lastScore: sessions[0]?.score || null
            };
        });
    }
    async getUserLearningPath(userId: string) {
        // Fetch all answers from the user to calculate mastery per topic
        const answers = await this.prisma.userAnswer.findMany({
            where: { session: { userId } },
            include: { question: true }
        });

        const latestSession = await this.prisma.examSession.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        // Group by topic
        const topicStats: Record<string, { total: number, correct: number }> = {};
        answers.forEach(ans => {
            const topic = ans.question.topic;
            if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
            topicStats[topic].total++;
            if (ans.isCorrect) topicStats[topic].correct++;
        });

        // Define a standard roadmap
        const modules = [
            { id: 'mod_1', title: 'Fondations & Pronoms', topic: 'Grammaire', minScore: 0 },
            { id: 'mod_2', title: 'Maîtriser le Passé Composé', topic: 'Grammaire', minScore: 10 },
            { id: 'mod_3', title: 'Compréhension : Faits Divers', topic: 'Compréhension Écrite', minScore: 20 },
            { id: 'mod_4', title: 'L\'opinion & Argumentation', topic: 'Expression Écrite', minScore: 35 },
            { id: 'mod_5', title: 'Connecteurs Logiques', topic: 'Structure', minScore: 50 },
            { id: 'mod_6', title: 'Nuances Culturelles', topic: 'Compréhension Orale', minScore: 70 },
        ];

        let unlockedCount = 1; // Always the first one
        const roadmap = modules.map((m, index) => {
            const stats = topicStats[m.topic] || { total: 0, correct: 0 };
            const progress = stats.total > 0 ? Math.min(100, Math.round((stats.correct / stats.total) * 100)) : 0;

            let status: 'locked' | 'completed' | 'current' = 'locked';
            if (index < unlockedCount) {
                status = progress >= 80 ? 'completed' : 'current';
                if (status === 'completed') unlockedCount++;
            }

            return { ...m, progress, status };
        });

        // AI Confidence Score calculation
        const avgScore = latestSession?.score || 300;
        const confidence = Math.min(98, Math.round((avgScore / 699) * 100));

        // Calculate total errors
        const totalErrors = answers.filter(a => !a.isCorrect).length;

        // ============ HOURS CALCULATION ============
        // Standard CECRL hours to reach each level (cumulative from A1)
        const LEVEL_HOURS: Record<string, number> = {
            'A1': 0, 'A2': 150, 'B1': 350, 'B2': 600, 'C1': 850, 'C2': 1100
        };

        // Get user info for target level
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { currentLevel: true, targetLevel: true }
        });

        const currentLevel = user?.currentLevel || 'A1';
        const targetLevel = user?.targetLevel || 'B2';

        const currentHours = LEVEL_HOURS[currentLevel] || 0;
        const targetHours = LEVEL_HOURS[targetLevel] || 600;
        const suggestedHours = Math.max(0, targetHours - currentHours);

        // Validated hours: each completed session = ~2.5h (exam + study)
        const completedSessions = await this.prisma.examSession.count({
            where: { userId, status: 'COMPLETED' }
        });
        const validatedHours = Math.round(completedSessions * 2.5);

        return {
            confidence,
            roadmap,
            nextStep: roadmap.find(m => m.status === 'current') || roadmap[0],
            totalErrors,
            // Hours tracking
            suggestedHours,
            validatedHours,
            hoursRemaining: Math.max(0, suggestedHours - validatedHours),
            progressPercent: suggestedHours > 0 ? Math.min(100, Math.round((validatedHours / suggestedHours) * 100)) : 0,
            currentLevel,
            targetLevel,
            badges: [
                { id: 'b1', name: 'Incollable', earned: confidence > 50 },
                { id: 'b2', name: '7 Jours', earned: true },
                { id: 'b3', name: 'Grammaire Master', earned: (topicStats['Grammaire']?.correct || 0) > 5 }
            ]
        };
    }

    async getStudentDetailedProfile(studentId: string, orgId: string) {
        // 1. Get user base info
        const user = await this.prisma.user.findFirst({
            where: { id: studentId, organizationId: orgId },
            include: {
                examSessions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                offlineProofs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                pedagogicalActions: {
                    orderBy: { createdAt: 'desc' },
                    include: { coach: { select: { name: true } } }
                }
            } as any
        });

        if (!user) return null;

        // 2. Get all answers for skill breakdown
        const answers = await this.prisma.userAnswer.findMany({
            where: { session: { userId: studentId } },
            include: { question: { select: { topic: true, level: true } } }
        });

        // 3. Calculate skills breakdown per topic
        const skillStats: Record<string, { total: number, correct: number }> = {};
        answers.forEach(ans => {
            const topic = ans.question.topic;
            if (!skillStats[topic]) skillStats[topic] = { total: 0, correct: 0 };
            skillStats[topic].total++;
            if (ans.isCorrect) skillStats[topic].correct++;
        });

        const skillsBreakdown = Object.entries(skillStats).map(([topic, stats]) => ({
            topic,
            total: stats.total,
            correct: stats.correct,
            percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
        })).sort((a, b) => b.percentage - a.percentage);

        // 4. Calculate progression (compare first and last completed sessions)
        const completedSessions = (user as any).examSessions.filter((s: any) => s.status === 'COMPLETED' && s.score);
        let progression = 0;
        if (completedSessions.length >= 2) {
            const oldest = completedSessions[completedSessions.length - 1];
            const newest = completedSessions[0];
            if (oldest.score && newest.score) {
                progression = Math.round(((newest.score - oldest.score) / oldest.score) * 100);
            }
        }

        // 5. Calculate average score
        const avgScore = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((acc: number, s: any) => acc + (s.score || 0), 0) / completedSessions.length)
            : 0;

        // 6. Calculate study time estimate (based on sessions count * 30 min average)
        const estimatedStudyMinutes = user.examSessions.length * 30;

        // 7. Calculate level gauge (for radar chart)
        const levelGauge = {
            CO: this.calcSkillScore(skillStats['Compréhension Orale']),
            CE: this.calcSkillScore(skillStats['Compréhension Écrite']),
            EO: this.calcSkillScore(skillStats['Expression Orale']),
            EE: this.calcSkillScore(skillStats['Expression Écrite']),
            Grammaire: this.calcSkillScore(skillStats['Grammaire']),
            Vocabulaire: this.calcSkillScore(skillStats['Vocabulaire'])
        };

        // 8. Strengths and weaknesses
        const sortedSkills = skillsBreakdown.filter(s => s.total >= 3);
        const strengths = sortedSkills.slice(0, 2).map(s => s.topic);
        const weaknesses = sortedSkills.slice(-2).map(s => s.topic).reverse();

        // 9. Badges
        const badges = [
            { id: 'streak_7', name: 'Série de 7 jours', icon: '🔥', earned: user.streakCurrent >= 7 },
            { id: 'first_exam', name: 'Premier Examen', icon: '🎯', earned: (user as any).examSessions.length > 0 },
            { id: 'high_scorer', name: 'Score > 500', icon: '⭐', earned: avgScore > 500 },
            { id: 'dedicated', name: '10 Sessions', icon: '📚', earned: (user as any).examSessions.length >= 10 },
            { id: 'perfectionist', name: '100% Précision', icon: '💎', earned: sortedSkills.some(s => s.percentage === 100) }
        ];

        // 10. Learning Path (reuse existing method)
        const learningPath = await this.getUserLearningPath(studentId);

        // 11. Diagnostic Session (first completed session)
        const diagnosticSession = completedSessions[completedSessions.length - 1] || null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            currentLevel: user.currentLevel,
            targetLevel: user.targetLevel,
            objective: (user as any).objective, // Provide objective
            xp: user.xp,
            streakCurrent: user.streakCurrent,
            streakMax: user.streakMax,
            createdAt: user.createdAt,
            lastActivityDate: user.lastActivityDate,

            // Stats
            avgScore,
            lastScore: completedSessions[0]?.score || null,
            progression, // Dynamic!
            totalExams: user.examSessions.length,
            estimatedStudyMinutes,
            totalProofs: user.offlineProofs.length,
            pendingProofs: user.offlineProofs.filter((p: any) => p.status === 'PENDING').length,

            // Skills
            skillsBreakdown,
            levelGauge,
            strengths,
            weaknesses,

            // New Data for Coach
            learningPath,
            diagnosticSession,

            // Badges
            badges,

            // History
            examSessions: (user as any).examSessions,
            recentProofs: (user as any).offlineProofs.slice(0, 5),
            pedagogicalActions: (user as any).pedagogicalActions || []
        };
    }

    private calcSkillScore(stats: { total: number, correct: number } | undefined): number {
        if (!stats || stats.total === 0) return 30; // Default low
        return Math.round((stats.correct / stats.total) * 100);
    }
}

