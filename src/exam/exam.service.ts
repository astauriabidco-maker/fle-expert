import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { SecurityService } from '../common/services/security.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/services/email.service';



import { AIService } from '../ai/ai.service';

@Injectable()
export class ExamService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly creditsService: CreditsService,
        private readonly securityService: SecurityService,
        private readonly notificationsService: NotificationsService,
        private readonly emailService: EmailService,
        private readonly aiService: AIService,
    ) { }



    async startExam(userId: string, organizationId?: string) {
        // Start is now free. Credits are deducted upon completion.
        return this.prisma.examSession.create({
            data: {
                userId,
                organizationId: organizationId || undefined,
                status: 'STARTED',
            }
        });
    }

    async assignExam(userId: string, organizationId?: string) {
        return this.prisma.examSession.create({
            data: {
                userId,
                organizationId: (organizationId || null) as any,
                status: 'ASSIGNED',
            }
        });
    }

    async completeExam(sessionId: string, warningsCount: number = 0) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                user: true,
                organization: true,
                answers: {
                    include: { question: true }
                }
            }
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.status === 'COMPLETED') {
            throw new BadRequestException('Exam already completed');
        }

        const EXAM_COST = 50;

        // 1. Deduct Credits (only if organization exists - schools flow)
        if (session.organizationId) {
            await this.creditsService.consumeCredits(session.organizationId, EXAM_COST);
        }

        // 2. Enhanced Scoring Logic
        const POINTS_MAP: Record<string, number> = {
            'A1': 10,
            'A2': 20,
            'B1': 30,
            'B2': 40,
            'C1': 50,
            'C2': 60
        };

        // Helper to determine level from TCF score
        const getLevelFromScore = (tcfScore: number): string => {
            if (tcfScore >= 600) return 'C2';
            if (tcfScore >= 500) return 'C1';
            if (tcfScore >= 400) return 'B2';
            if (tcfScore >= 300) return 'B1';
            if (tcfScore >= 200) return 'A2';
            return 'A1';
        };

        let rawScore = 0;
        let totalMaxScore = 0;
        let totalCorrect = 0;
        const skillScores: Record<string, { current: number, max: number, correct: number, total: number }> = {};
        const questionResults: { questionId: string, isCorrect: boolean, skill: string, level: string }[] = [];

        for (const ans of session.answers) {
            const qLevel = ans.question.level || 'A1';
            const qPoints = POINTS_MAP[qLevel] || 10;
            const skill = ans.question.topic || 'Général';

            // Initialize skill stats if not exists
            if (!skillScores[skill]) {
                skillScores[skill] = { current: 0, max: 0, correct: 0, total: 0 };
            }

            totalMaxScore += qPoints;
            skillScores[skill].max += qPoints;
            skillScores[skill].total += 1;

            // Track question result
            questionResults.push({
                questionId: ans.questionId,
                isCorrect: ans.isCorrect,
                skill,
                level: qLevel
            });

            if (ans.isCorrect) {
                rawScore += qPoints;
                totalCorrect += 1;
                skillScores[skill].current += qPoints;
                skillScores[skill].correct += 1;
            }
        }

        // Calculate TCF score
        const score = totalMaxScore > 0
            ? Math.round((rawScore / totalMaxScore) * 699)
            : 0;

        // Determine overall level
        const level = getLevelFromScore(score);

        // 3. Build detailed breakdown
        const skillsBreakdown: Record<string, {
            score: number,
            max: number,
            percent: number,
            correct: number,
            total: number,
            tcfScore: number,
            level: string
        }> = {};

        let strongestSkill = { skill: '', percent: 0 };
        let weakestSkill = { skill: '', percent: 100 };

        for (const [skill, data] of Object.entries(skillScores)) {
            const percent = data.max > 0 ? Math.round((data.current / data.max) * 100) : 0;
            const tcfScore = data.max > 0 ? Math.round((data.current / data.max) * 699) : 0;
            const skillLevel = getLevelFromScore(tcfScore);

            skillsBreakdown[skill] = {
                score: data.current,
                max: data.max,
                percent,
                correct: data.correct,
                total: data.total,
                tcfScore,
                level: skillLevel
            };

            // Track strongest/weakest
            if (percent > strongestSkill.percent) {
                strongestSkill = { skill, percent };
            }
            if (percent < weakestSkill.percent) {
                weakestSkill = { skill, percent };
            }
        }

        // Build comprehensive breakdown object
        const breakdown = {
            skills: skillsBreakdown,
            summary: {
                totalCorrect,
                totalQuestions: session.answers.length,
                rawScore,
                maxPossible: totalMaxScore,
                tcfScore: score,
                overallLevel: level,
                accuracyPercent: session.answers.length > 0
                    ? Math.round((totalCorrect / session.answers.length) * 100)
                    : 0
            },
            analysis: {
                strongestSkill: strongestSkill.skill || null,
                strongestPercent: strongestSkill.percent,
                weakestSkill: weakestSkill.skill || null,
                weakestPercent: weakestSkill.percent,
                recommendations: this.generateRecommendations(skillsBreakdown, level)
            },
            questionResults
        };

        // 4. Generate Security Hash
        const scoreHash = this.securityService.generateResultHash(
            session.userId,
            score,
            session.createdAt.toISOString()
        );

        // 5. Update Session with breakdown
        const integrityStatus = warningsCount >= 3 ? 'SUSPICIOUS' : 'VALID';

        await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                score: Math.round(score),
                estimatedLevel: level,
                scoreHash: scoreHash,
                integrityScore: warningsCount,
                integrityStatus: integrityStatus,
                breakdown: JSON.stringify(breakdown),
                completedAt: new Date(),
            }
        });

        // 6. Update User's currentLevel
        const oldLevel = session.user.currentLevel;
        await this.prisma.user.update({
            where: { id: session.userId },
            data: {
                currentLevel: level,
                hasCompletedDiagnostic: true
            }
        });

        // 7. Send notifications for level changes
        if (level !== oldLevel) {
            await this.notificationsService.createNotification(session.userId, {
                title: 'Félicitations ! 🎉',
                content: `Vous avez atteint le niveau ${level}. Continuez vos efforts !`,
                type: 'achievement',
                link: '/dashboard'
            });

            await this.emailService.sendAchievementCongratulation(
                session.user.email,
                session.user.name || 'Candidat',
                level
            );
        }

        return {
            score: Math.round(score),
            level,
            scoreHash,
            downloadUrl: `/certificate/download/${sessionId}`,
            breakdown: {
                skills: skillsBreakdown,
                summary: breakdown.summary,
                analysis: breakdown.analysis
            }
        };
    }

    /**
     * Generate personalized recommendations based on skill performance
     */
    private generateRecommendations(
        skills: Record<string, { percent: number, level: string }>,
        overallLevel: string
    ): string[] {
        const recommendations: string[] = [];

        for (const [skill, data] of Object.entries(skills)) {
            if (data.percent < 50) {
                recommendations.push(`Renforcez votre ${this.getSkillName(skill)} - actuellement à ${data.percent}%`);
            } else if (data.percent < 70) {
                recommendations.push(`Continuez à pratiquer ${this.getSkillName(skill)} pour atteindre le niveau supérieur`);
            }
        }

        if (recommendations.length === 0) {
            recommendations.push(`Excellent travail ! Préparez-vous pour le niveau ${this.getNextLevel(overallLevel)}`);
        }

        return recommendations.slice(0, 3); // Max 3 recommendations
    }

    /**
     * Get human-readable skill name
     */
    private getSkillName(skill: string): string {
        const names: Record<string, string> = {
            'CO': 'Compréhension Orale',
            'CE': 'Compréhension Écrite',
            'EO': 'Expression Orale',
            'EE': 'Expression Écrite',
            'Grammaire': 'Grammaire',
            'Vocabulaire': 'Vocabulaire'
        };
        return names[skill] || skill;
    }

    /**
     * Get next level in progression
     */
    private getNextLevel(current: string): string {
        const progression = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const idx = progression.indexOf(current);
        return idx < progression.length - 1 ? progression[idx + 1] : 'C2';
    }

    async startExistingSession(sessionId: string, userId: string) {
        const session = await this.prisma.examSession.findFirst({
            where: { id: sessionId, userId }
        });

        if (!session) {
            throw new NotFoundException('Session not found or access denied');
        }

        if (session.status === 'ASSIGNED') {
            return this.prisma.examSession.update({
                where: { id: sessionId },
                data: { status: 'STARTED' }
            });
        }

        // If already STARTED, just resume
        if (session.status === 'STARTED') {
            return session;
        }

        throw new BadRequestException('Session cannot be started');
    }

    async getHistory(userId: string) {
        return await this.prisma.examSession.findMany({
            where: {
                userId,
                status: { in: ['COMPLETED', 'ASSIGNED', 'STARTED'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
    }

    async getStats(userId: string) {
        // Fetch User first for XP/Streak
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, streakCurrent: true }
        });

        // In a real app, we'd aggregate from UserAnswer
        // For now, mock specific skill scores based on the last session
        // Fetch last session with full answer details for accurate stats
        const lastSession = await this.prisma.examSession.findFirst({
            where: { userId, status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            include: {
                answers: {
                    include: { question: true }
                }
            }
        });

        const baseScore = lastSession?.score || 0;

        // Calculate skill breakdown from the last session
        const skillStats: Record<string, number> = { CO: 0, CE: 0, EO: 0, EE: 0 };
        const skillCounts: Record<string, number> = { CO: 0, CE: 0, EO: 0, EE: 0 };

        // Default values if no session
        if (!lastSession) {
            return { CO: 0, CE: 0, EO: 0, EE: 0, xp: user?.xp || 0, streak: user?.streakCurrent || 0 };
        }

        const POINTS_MAP: Record<string, number> = { 'A1': 10, 'A2': 20, 'B1': 30, 'B2': 40, 'C1': 50, 'C2': 60 };

        for (const ans of lastSession.answers) {
            const skill = ans.question.topic || 'CO'; // Default to CO if missing
            const qPoints = POINTS_MAP[ans.question.level] || 10;

            // Just sum points for now, can be sophisticated later
            if (skill in skillStats) {
                skillCounts[skill] += qPoints;
                if (ans.isCorrect) {
                    skillStats[skill] += qPoints;
                }
            }
        }

        // Normalize each skill to 699 scale
        const normalize = (current: number, max: number) => max > 0 ? Math.round((current / max) * 699) : 0;

        return {
            CO: normalize(skillStats.CO, skillCounts.CO) || baseScore, // Fallback to baseScore if 0/0 (e.g. no questions for that skill)
            CE: normalize(skillStats.CE, skillCounts.CE) || baseScore,
            EO: normalize(skillStats.EO, skillCounts.EO) || baseScore,
            EE: normalize(skillStats.EE, skillCounts.EE) || baseScore,
            xp: user?.xp || 0,
            streak: user?.streakCurrent || 0
        };
    }

    /**
     * Get full session state for resume/navigation
     */
    async getSessionState(sessionId: string) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                answers: {
                    select: {
                        questionId: true,
                        selectedOption: true,
                    }
                }
            }
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Get all questions that have been served to this session (from answers)
        // For adaptive exams, we don't have a fixed question list upfront.
        // We need to fetch the questions that have been asked so far.
        const answeredQuestionIds = session.answers.map(a => a.questionId);

        const questions = await this.prisma.question.findMany({
            where: { id: { in: answeredQuestionIds } },
            select: {
                id: true,
                questionText: true,
                options: true,
                level: true,
                topic: true,
            }
        });

        // Build answers map
        const answersMap: Record<string, string | null> = {};
        for (const ans of session.answers) {
            answersMap[ans.questionId] = ans.selectedOption;
        }

        // Calculate time remaining
        let timeRemainingSeconds = session.durationMinutes * 60;
        if (session.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
            timeRemainingSeconds = Math.max(0, (session.durationMinutes * 60) - elapsed);
        }

        return {
            sessionId: session.id,
            status: session.status,
            currentQuestionIndex: session.currentQuestionIndex || 0,
            durationMinutes: session.durationMinutes,
            startedAt: session.startedAt,
            timeRemainingSeconds,
            questions: questions.map(q => ({
                id: q.id,
                text: q.questionText,
                options: q.options,
                level: q.level,
                topic: q.topic,
            })),
            answers: answersMap,
        };
    }

    /**
     * Save answer without advancing to next question (for auto-save)
     */
    async saveAnswer(sessionId: string, questionId: string, selectedOption: string) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.status === 'COMPLETED') {
            throw new BadRequestException('Cannot modify completed exam');
        }

        // Check if answer already exists
        const existingAnswer = await this.prisma.userAnswer.findFirst({
            where: { sessionId, questionId }
        });

        // Get question for correctness check
        const question = await this.prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        let isCorrect = question.correctAnswer === selectedOption;
        let score: number | null = null;
        let feedback: string | null = null;
        let aiEvaluation: any = null;

        // AI Evaluation for Oral Questions
        if (question.isRecording && selectedOption) {
            // selectedOption is the audio URL
            // Assuming the audio URL is accessible or we can pass the path if it's local
            // For now, passing the URL/Path directly
            try {
                const transcription = await this.aiService.transcribeAudio(selectedOption);
                const evaluation = await this.aiService.evaluateOralResponse(
                    transcription,
                    question.aiPrompt || "Répondez à la question.",
                    question.level
                );

                score = evaluation.score;
                feedback = evaluation.feedback;
                aiEvaluation = evaluation.details;

                // For Oral, correctness is based on threshold (e.g. 50/100)
                isCorrect = score !== null && score >= 50;
            } catch (error) {
                console.error("AI Evaluation failed:", error);
                // Don't block saving, but maybe flag it?
                feedback = "Erreur lors de l'évaluation l'IA. Sera réévalué plus tard.";
            }
        }

        if (existingAnswer) {
            // Update existing answer
            await this.prisma.userAnswer.update({
                where: { id: existingAnswer.id },
                data: { selectedOption, isCorrect, score, feedback, aiEvaluation }
            });
        } else {
            // Create new answer
            await this.prisma.userAnswer.create({
                data: {
                    sessionId,
                    questionId,
                    selectedOption,
                    isCorrect,
                    score,
                    feedback,
                    aiEvaluation
                }
            });
        }

        return { saved: true };
    }

    async getLatestDiagnostic(userId: string) {
        const session = await this.prisma.examSession.findFirst({
            where: {
                userId,
                type: 'DIAGNOSTIC',
                status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' }
        });

        if (!session) {
            return null;
        }

        return {
            ...session,
            breakdown: session.breakdown ? JSON.parse(session.breakdown) : null
        };
    }
}
