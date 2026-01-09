import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoachService {
    constructor(private prisma: PrismaService) { }

    async getStudents(coachId: string) {
        const students = await this.prisma.user.findMany({
            where: { coachId, role: 'CANDIDATE' },
            include: {
                examSessions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            },
            orderBy: { lastActivityDate: 'desc' }
        });

        // Enrich with stats
        return Promise.all(students.map(async (s) => {
            const sessions = s.examSessions || [];
            const lastSession = sessions[0];

            // Calculate average score
            const avgScore = sessions.length > 0
                ? Math.round(sessions.reduce((acc, curr) => acc + (curr.score || 0), 0) / sessions.length)
                : 0;

            // Calculate real skill breakdown
            const skillStats: Record<string, number> = { CO: 0, CE: 0, EO: 0, EE: 0 };
            const skillCounts: Record<string, number> = { CO: 0, CE: 0, EO: 0, EE: 0 };
            const POINTS_MAP: Record<string, number> = { 'A1': 10, 'A2': 20, 'B1': 30, 'B2': 40, 'C1': 50, 'C2': 60 };

            // We need to fetch answers for the last session to calculate stats
            // Since we can't easily include deep relations in the initial findMany efficiently for all students,
            // we will fetch the detailed last session for each student here.
            // Note: In a high-traffic app, this N+1 query should be optimized.
            let lastSessionWithAnswers = null;
            if (lastSession) {
                lastSessionWithAnswers = await this.prisma.examSession.findUnique({
                    where: { id: lastSession.id },
                    include: { answers: { include: { question: true } } }
                });
            }

            if (lastSessionWithAnswers) {
                for (const ans of lastSessionWithAnswers.answers) {
                    const skill = ans.question.topic || 'CO';
                    const qPoints = POINTS_MAP[ans.question.level] || 10;

                    if (skill in skillStats) {
                        skillCounts[skill] += qPoints;
                        if (ans.isCorrect) {
                            skillStats[skill] += qPoints;
                        }
                    }
                }
            }

            const normalize = (current: number, max: number) => max > 0 ? Math.round((current / max) * 100) : 0; // Stats as % for this view logic

            const skillsBreakdown = {
                CO: normalize(skillStats.CO, skillCounts.CO),
                CE: normalize(skillStats.CE, skillCounts.CE),
                EO: normalize(skillStats.EO, skillCounts.EO),
                EE: normalize(skillStats.EE, skillCounts.EE),
            };

            return {
                id: s.id,
                name: s.name,
                email: s.email,
                currentLevel: s.currentLevel,
                targetLevel: s.targetLevel,
                createdAt: s.createdAt,
                lastActivity: s.lastActivityDate,
                examSessions: sessions,
                stats: {
                    averageScore: avgScore,
                    totalExams: sessions.length
                },
                skillsBreakdown,
                tags: s.tags ? JSON.parse(s.tags) : []
            };
        }));
    }

    async assignStudent(coachId: string, studentEmail: string) {
        const coach = await this.prisma.user.findUnique({ where: { id: coachId } });
        if (!coach) throw new NotFoundException("Coach non trouvé");

        const student = await this.prisma.user.findUnique({ where: { email: studentEmail } });
        if (!student) throw new NotFoundException("Étudiant non trouvé");

        if (student.organizationId !== coach.organizationId) {
            throw new ForbiddenException("Cet étudiant appartient à une autre organisation");
        }

        return this.prisma.user.update({
            where: { id: student.id },
            data: { coachId }
        });
    }

    async getCorrections(coachId: string) {
        // Find exam sessions for students of this coach that need review
        // For MVP, let's say "PENDING" sessions or sessions with large AI-Human delta
        return this.prisma.examSession.findMany({
            where: {
                user: { coachId },
                // status: 'COMPLETED' // For now show all completed to allow review
            },
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    }

    async submitCorrection(coachId: string, sessionId: string, data: { humanGrade: number, feedback?: string }) {
        // Verify ownership
        const session = await this.prisma.examSession.findFirst({
            where: { id: sessionId, user: { coachId } }
        });

        if (!session) throw new NotFoundException("Session non trouvée ou non accessible");

        return this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                humanGrade: data.humanGrade,
                // Recalculate correlation?
                correlationScore: session.score ? Math.abs(session.score - data.humanGrade) : null,
                // We could also store feedback in a JSON field or relation
            }
        });
    }

    async createPedagogicalAction(coachId: string, studentId: string, type: string, content: string) {
        // Verify that student is assigned to this coach
        const student = await this.prisma.user.findFirst({
            where: { id: studentId, coachId }
        });

        if (!student) throw new NotFoundException("Étudiant non trouvé ou non assigné à ce coach");

        return (this.prisma as any).pedagogicalAction.create({
            data: {
                coachId,
                studentId,
                type,
                content
            }
        });
    }

    async getMyStats(coachId: string) {
        // 1. Get coach profile
        const coach = await this.prisma.user.findUnique({
            where: { id: coachId },
            include: { organization: true }
        });

        if (!coach) throw new NotFoundException("Coach non trouvé");

        // 2. Count students
        const studentsCount = await this.prisma.user.count({
            where: { coachId, role: 'CANDIDATE' }
        });

        // 3. Count corrections this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const correctionsThisMonth = await this.prisma.examSession.count({
            where: {
                user: { coachId },
                humanGrade: { not: null },
                updatedAt: { gte: startOfMonth }
            }
        });

        // 4. Count pedagogical actions (feedbacks & assignments)
        const feedbacksSent = await (this.prisma as any).pedagogicalAction.count({
            where: { coachId, type: 'FEEDBACK' }
        }).catch(() => 0);

        const assignmentsMade = await (this.prisma as any).pedagogicalAction.count({
            where: { coachId, type: 'ASSIGNMENT' }
        }).catch(() => 0);

        // 5. Get recent activity (last 5 actions)
        const recentActivity = await (this.prisma as any).pedagogicalAction.findMany({
            where: { coachId },
            include: { student: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        }).catch(() => []);

        return {
            profile: {
                id: coach.id,
                name: coach.name,
                email: coach.email,
                organization: coach.organization?.name || 'N/A',
                role: coach.role,
                createdAt: coach.createdAt
            },
            stats: {
                studentsCount,
                correctionsThisMonth,
                feedbacksSent,
                assignmentsMade,
                totalActions: feedbacksSent + assignmentsMade
            },
            recentActivity: recentActivity.map((a: any) => ({
                id: a.id,
                type: a.type,
                content: a.content,
                studentName: a.student?.name || 'Inconnu',
                createdAt: a.createdAt
            }))
        };
    }

    async updateProfile(coachId: string, data: {
        phone?: string;
        address?: string;
        postalCode?: string;
        city?: string;
        nda?: string;
        hourlyRate?: number;
        contactPerson?: string;
    }) {
        return this.prisma.user.update({
            where: { id: coachId },
            data: {
                phone: data.phone,
                address: data.address,
                postalCode: data.postalCode,
                city: data.city,
                nda: data.nda,
                hourlyRate: data.hourlyRate,
                contactPerson: data.contactPerson
            },
            select: {
                id: true, name: true, email: true,
                phone: true, address: true, postalCode: true, city: true,
                nda: true, hourlyRate: true, contactPerson: true
            }
        });
    }

    async getDocuments(coachId: string) {
        return (this.prisma as any).formateurDocument.findMany({
            where: { userId: coachId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async uploadDocument(coachId: string, type: string, filename: string, url: string) {
        // Delete existing document of same type before creating new one
        await (this.prisma as any).formateurDocument.deleteMany({
            where: { userId: coachId, type }
        });

        return (this.prisma as any).formateurDocument.create({
            data: {
                userId: coachId,
                type,
                filename,
                url
            }
        });
    }

    async deleteDocument(coachId: string, docId: string) {
        const doc = await (this.prisma as any).formateurDocument.findFirst({
            where: { id: docId, userId: coachId }
        });

        if (!doc) throw new NotFoundException("Document non trouve");

        return (this.prisma as any).formateurDocument.delete({
            where: { id: docId }
        });
    }

    // ========== PEDAGOGICAL TRACKING ==========

    async getStudentSessions(coachId: string, studentId: string) {
        // Verify student belongs to this coach
        const student = await this.prisma.user.findFirst({
            where: { id: studentId, coachId }
        });
        if (!student) throw new NotFoundException("Etudiant non trouve ou non assigne");

        const sessions = await (this.prisma.examSession as any).findMany({
            where: { userId: studentId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                status: true,
                score: true,
                humanGrade: true,
                feedback: true,
                createdAt: true,
                completedAt: true,
                currentQuestionIndex: true
            }
        });

        return sessions.map((s: any) => ({
            ...s,
            duration: s.completedAt && s.createdAt
                ? Math.round((new Date(s.completedAt).getTime() - new Date(s.createdAt).getTime()) / 60000)
                : null
        }));
    }

    async getSessionDetail(coachId: string, studentId: string, sessionId: string) {
        // Verify student belongs to this coach
        const student = await this.prisma.user.findFirst({
            where: { id: studentId, coachId }
        });
        if (!student) throw new NotFoundException("Etudiant non trouve");

        const session: any = await this.prisma.examSession.findFirst({
            where: { id: sessionId, userId: studentId },
            include: {
                answers: {
                    include: { question: true }
                }
            }
        });

        if (!session) throw new NotFoundException("Session non trouvee");

        const questionsWithAnswers = session.answers?.map((ans: any) => {
            const q = ans.question;
            return {
                id: q.id,
                text: q.questionText,
                type: q.topic,
                skill: q.topic,
                options: q.options ? JSON.parse(q.options) : [],
                correctAnswer: q.correctAnswer,
                userAnswer: ans.selectedOption,
                isCorrect: ans.isCorrect
            };
        }) || [];

        return {
            id: session.id,
            type: session.type,
            status: session.status,
            score: session.score,
            humanGrade: session.humanGrade,
            feedback: session.feedback,
            createdAt: session.createdAt,
            completedAt: session.completedAt,
            questions: questionsWithAnswers,
            totalQuestions: questionsWithAnswers.length,
            correctAnswers: questionsWithAnswers.filter((q: any) => q.isCorrect).length
        };
    }

    async getStudentLearningPath(coachId: string, studentId: string) {
        // Verify student belongs to this coach
        const student = await this.prisma.user.findFirst({
            where: { id: studentId, coachId },
            include: { examSessions: true }
        });
        if (!student) throw new NotFoundException("Etudiant non trouve");

        // CECRL hours mapping
        const LEVEL_HOURS: Record<string, number> = {
            'A1': 0, 'A2': 150, 'B1': 350, 'B2': 600, 'C1': 850, 'C2': 1100
        };

        const currentLevel = student.currentLevel || 'A1';
        const targetLevel = student.targetLevel || 'B2';

        const currentHours = LEVEL_HOURS[currentLevel] || 0;
        const targetHours = LEVEL_HOURS[targetLevel] || 600;
        const suggestedHours = Math.max(0, targetHours - currentHours);

        // Calculate validated hours (each completed session = ~2.5h)
        const completedSessions = student.examSessions?.filter((s: any) => s.status === 'COMPLETED').length || 0;
        const validatedHours = Math.round(completedSessions * 2.5);

        // Build roadmap
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentIdx = levels.indexOf(currentLevel);
        const targetIdx = levels.indexOf(targetLevel);

        const roadmap = levels.slice(currentIdx, targetIdx + 1).map((level, idx) => ({
            level,
            status: idx === 0 ? 'completed' : (idx === 1 ? 'current' : 'locked'),
            hours: LEVEL_HOURS[level] - (LEVEL_HOURS[levels[currentIdx]] || 0)
        }));

        // Recent actions
        const recentActions = await (this.prisma as any).pedagogicalAction.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { coach: { select: { name: true } } }
        }).catch(() => []);

        return {
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                currentLevel,
                targetLevel
            },
            progress: {
                suggestedHours,
                validatedHours,
                hoursRemaining: Math.max(0, suggestedHours - validatedHours),
                progressPercent: suggestedHours > 0
                    ? Math.min(100, Math.round((validatedHours / suggestedHours) * 100))
                    : 0,
                totalExams: student.examSessions?.length || 0,
                completedExams: completedSessions
            },
            roadmap,
            recentActions: recentActions.map((a: any) => ({
                id: a.id,
                type: a.type,
                content: a.content,
                coachName: a.coach?.name || 'Coach',
                createdAt: a.createdAt
            }))
        };
    }

    async updateStudentTags(coachId: string, studentId: string, tags: string[]) {
        // Verify that student is assigned to this coach
        const student = await this.prisma.user.findFirst({
            where: { id: studentId, coachId }
        });

        if (!student) throw new NotFoundException("Étudiant non trouvé ou non assigné à ce coach");

        return this.prisma.user.update({
            where: { id: studentId },
            data: { tags: JSON.stringify(tags) }
        });
    }

    async getAvailability(coachId: string) {
        return (this.prisma as any).coachAvailability.findMany({
            where: { coachId },
            orderBy: [
                { isRecurring: 'desc' },
                { dayOfWeek: 'asc' },
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        });
    }

    async updateAvailability(coachId: string, slots: { dayOfWeek: number, startTime: string, endTime: string, isRecurring?: boolean, date?: string }[]) {
        // For dynamic calendar, we can't just delete all. 
        // Better: delete recurring ones if updating recurring, or delete specific date ones for that date.
        // For simplicity in this iteration, we keep the "replace all" logic but include the new fields.

        await (this.prisma as any).coachAvailability.deleteMany({ where: { coachId } });
        return (this.prisma as any).coachAvailability.createMany({
            data: slots.map((s: any) => ({
                coachId,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                isRecurring: s.isRecurring !== undefined ? s.isRecurring : true,
                date: s.date ? new Date(s.date) : null
            }))
        });
    }

    async saveSignature(coachId: string, signature: string) {
        return this.prisma.user.update({
            where: { id: coachId },
            data: { signature } as any
        });
    }

    async getInvoices(coachId: string) {
        return (this.prisma as any).coachInvoice.findMany({
            where: { coachId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async generateMonthlyInvoice(coachId: string, month: number, year: number) {
        const coach = await this.prisma.user.findUnique({ where: { id: coachId } });
        if (!coach || !coach.hourlyRate) throw new NotFoundException("Coach ou taux horaire non trouvé");

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Calculate hours based on COMPLETED course sessions
        const sessions = await this.prisma.courseSession.findMany({
            where: {
                coachId,
                status: 'COMPLETED',
                type: { in: ['COURSE', 'MOCK_EXAM'] },
                closedAt: { gte: startDate, lte: endDate }
            },
            select: { durationMinutes: true }
        });

        const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        const hoursCount = Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimals

        const amount = hoursCount * coach.hourlyRate;
        const invoiceNumber = `INV-${year}${month.toString().padStart(2, '0')}-${coach.id.slice(0, 4).toUpperCase()}`;

        return (this.prisma as any).coachInvoice.upsert({
            where: { invoiceNumber },
            update: { amount, hoursCount },
            create: {
                invoiceNumber,
                coachId,
                organizationId: coach.organizationId || '',
                amount,
                hoursCount,
                status: 'DRAFT'
            }
        });
    }
}

