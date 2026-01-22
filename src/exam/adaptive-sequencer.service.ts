import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdaptiveSequencerService {
    private readonly levels = ['A1', 'A2', 'B1', 'B2', 'C1']; // Ordered levels

    constructor(private readonly prisma: PrismaService) { }

    async getNextQuestion(sessionId: string): Promise<{
        question: any | null;
        isFinished: boolean;
        reason?: string;
    }> {
        // 1. Fetch Session and History
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                answers: {
                    include: { question: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        const history = session.answers;
        const questionsAnsweredCount = history.length;

        // 2. Termination Condition: Max Questions (15)
        if (questionsAnsweredCount >= 15) {
            return { question: null, isFinished: true, reason: 'MAX_QUESTIONS_REACHED' };
        }

        // 3. Termination Condition: Stabilization (3 consecutive correct at same level)
        if (questionsAnsweredCount >= 3) {
            const last3 = history.slice(0, 3);
            const allCorrect = last3.every((a) => a.isCorrect);
            // Ensure there are 3 items and they all have the same level
            if (last3.length === 3 && allCorrect) {
                const firstLevel = last3[0].question.level;
                const sameLevel = last3.every((a) => a.question.level === firstLevel);

                if (sameLevel) {
                    return { question: null, isFinished: true, reason: 'LEVEL_STABILIZED' };
                }
            }
        }

        // 4. Determine Next Level
        let nextLevel = 'B1'; // Default for first question
        let lastSkill = '';

        if (questionsAnsweredCount > 0) {
            const lastAnswer = history[0]; // Most recent (due to orderBy desc)
            const currentLevelIndex = this.levels.indexOf(lastAnswer.question.level);
            lastSkill = lastAnswer.question.topic;

            if (lastAnswer.isCorrect) {
                // Level Up
                const nextIndex = Math.min(currentLevelIndex + 1, this.levels.length - 1);
                nextLevel = this.levels[nextIndex];
            } else {
                // Level Down
                const nextIndex = Math.max(currentLevelIndex - 1, 0);
                nextLevel = this.levels[nextIndex];
            }
        }

        // 5. Select Question (Filter & Alternation)
        const answeredIds = history.map((a) => a.questionId);

        // Attempt 1: Different Topic
        let candidates = await this.prisma.question.findMany({
            where: {
                organizationId: session.organizationId || undefined,
                level: nextLevel,
                id: { notIn: answeredIds },
                topic: { not: lastSkill }, // Prefer different topic
            },
            take: 1,
        });

        // Fallback: Same topic if no other options
        if (candidates.length === 0) {
            candidates = await this.prisma.question.findMany({
                where: {
                    organizationId: session.organizationId || undefined,
                    level: nextLevel,
                    id: { notIn: answeredIds },
                },
                take: 1,
            });
        }

        if (candidates.length === 0) {
            // Run out of questions for this level?
            return { question: null, isFinished: true, reason: 'NO_MORE_QUESTIONS' };
        }

        return { question: candidates[0], isFinished: false };
    }

    // Helper to record answer (called by Controller)
    async recordAnswer(sessionId: string, questionId: string, isCorrect: boolean) {
        return this.prisma.userAnswer.create({
            data: {
                sessionId,
                questionId,
                isCorrect,
            }
        });
    }
}
