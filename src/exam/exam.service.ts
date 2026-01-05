import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { SecurityService } from '../common/services/security.service';

@Injectable()
export class ExamService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly creditsService: CreditsService,
        private readonly securityService: SecurityService,
    ) { }

    async startExam(userId: string, organizationId: string) {
        // Start is now free. Credits are deducted upon completion.
        return this.prisma.examSession.create({
            data: {
                userId,
                organizationId,
                status: 'STARTED',
            }
        });
    }

    async assignExam(userId: string, organizationId: string) {
        return this.prisma.examSession.create({
            data: {
                userId,
                organizationId,
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

        // 1. Deduct Credits
        await this.creditsService.consumeCredits(session.organizationId, EXAM_COST);

        // 2. Real Scoring Logic
        // Calculate partial points based on question difficulty
        const POINTS_MAP: Record<string, number> = {
            'A1': 10,
            'A2': 20,
            'B1': 30,
            'B2': 40,
            'C1': 50,
            'C2': 60
        };

        let rawScore = 0;
        let answeredCount = 0;

        for (const ans of session.answers) {
            if (ans.isCorrect) {
                const qLevel = ans.question.level || 'A1';
                rawScore += (POINTS_MAP[qLevel] || 10);
            }
            answeredCount++;
        }

        // Normalize score to 0-999 scale for TCF style
        // Max theoretical points for 15 questions (assuming avg B2) ~ 600 raw
        // We'll apply a simple multiplier for now + base offset
        // Base 100 points for participating.
        const score = 100 + Math.min(899, rawScore * 1.5);

        // Determine Level based on standard TCF grid
        let level = 'A1';
        if (score >= 200) level = 'A2';
        if (score >= 300) level = 'B1';
        if (score >= 400) level = 'B2';
        if (score >= 500) level = 'C1';
        if (score >= 600) level = 'C2';

        // 3. Generate Security Hash
        const scoreHash = this.securityService.generateResultHash(
            session.userId,
            score,
            session.createdAt.toISOString()
        );

        // 4. Update Session
        const integrityStatus = warningsCount >= 3 ? 'SUSPICIOUS' : 'VALID';

        const updatedSession = await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                score: Math.round(score),
                estimatedLevel: level,
                scoreHash: scoreHash,
                integrityScore: warningsCount,
                integrityStatus: integrityStatus,
            }
        });

        // 5. Update User's currentLevel and mark diagnostic as complete (if applicable)
        await this.prisma.user.update({
            where: { id: session.userId },
            data: {
                currentLevel: level,
                hasCompletedDiagnostic: true  // Mark diagnostic as complete for any exam type
            }
        });

        return {
            score: Math.round(score),
            level,
            scoreHash,
            downloadUrl: `/certificate/download/${sessionId}`
        };
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
        const lastSession = await this.prisma.examSession.findFirst({
            where: { userId, status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' }
        });

        const baseScore = lastSession?.score || 0;

        return {
            CO: Math.min(699, baseScore + 50),
            CE: Math.min(699, baseScore + 20),
            EO: Math.min(699, baseScore - 30),
            EE: Math.min(699, baseScore + 0),
            xp: user?.xp || 0,
            streak: user?.streakCurrent || 0
        };
    }
}
