import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearningService {
    constructor(private prisma: PrismaService) { }

    async startPracticeSession(userId: string, organizationId: string, topic: string) {
        // 1. Fetch random questions for the topic
        // In a real app, use $queryRaw for random, or skip logic. For MVP, take first 5.
        const questions = await this.prisma.question.findMany({
            where: { topic: { contains: topic }, isActive: true },
            take: 5
        });

        if (questions.length === 0) {
            throw new NotFoundException(`No questions found for topic ${topic}`);
        }

        // 2. Create Practice Session
        const session = await this.prisma.examSession.create({
            data: {
                userId,
                organizationId,
                type: 'PRACTICE',
                status: 'STARTED',
                score: 0
            }
        });

        // 3. We don't pre-create UserAnswers for practice? Or do we?
        // Let's return session and questions.
        // Format questions for client (hide correctAnswer)
        const clientQuestions = questions.map((q: any) => ({
            id: q.id,
            text: q.questionText,
            options: q.options,
            level: q.level,
            topic: q.topic
        }));

        return { session, questions: clientQuestions };
    }

    async submitPracticeAnswer(sessionId: string, questionId: string, selectedOption: string) {
        const question = await this.prisma.question.findUnique({ where: { id: questionId } });
        if (!question) throw new NotFoundException('Question not found');

        const isCorrect = question.correctAnswer === selectedOption;

        // Save answer for analytics
        await this.prisma.userAnswer.create({
            data: {
                sessionId,
                questionId,
                isCorrect,
                selectedOption
            }
        });

        // Return feedback immediately
        return {
            isCorrect,
            explanation: question.explanation,
            correctAnswer: question.correctAnswer
        };
    }

    async completePracticeSession(sessionId: string) {
        // 1. Calculate score & XP
        const session = await this.prisma.examSession.findUnique({ where: { id: sessionId } });
        const answers = await this.prisma.userAnswer.findMany({
            where: { sessionId }
        });
        const correctCount = answers.filter((a: any) => a.isCorrect).length;
        const total = answers.length;
        const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

        // XP Calculation: 10 per correct answer + 50 bonus if > 80% score
        const xpEarned = (correctCount * 10) + (score >= 80 ? 50 : 0);

        // 2. Streak Logic
        const user = await this.prisma.user.findUnique({ where: { id: session?.userId } });
        let newStreak = user?.streakCurrent || 0;
        const lastActivity = user?.lastActivityDate ? new Date(user.lastActivityDate) : null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let streakUpdated = false;
        if (!lastActivity || lastActivity < yesterday) {
            // Missed a day (or first time) -> Reset to 1 (if not already done today)
            // But if lastActivity < yesterday means we missed yesterday. So streak is broken. 
            // Wait, if lastActivity was 2 days ago, streak breaks.
            newStreak = 1;
            streakUpdated = true;
        } else if (lastActivity.getTime() >= yesterday.getTime() && lastActivity.getTime() < today.getTime()) {
            // Last activity was yesterday -> Increment
            newStreak++;
            streakUpdated = true;
        } else if (lastActivity.getTime() >= today.getTime()) {
            // Already active today -> Keep same
            streakUpdated = false;
        }

        // Update User
        await this.prisma.user.update({
            where: { id: session?.userId },
            data: {
                xp: { increment: xpEarned },
                streakCurrent: streakUpdated ? newStreak : undefined,
                streakMax: (streakUpdated && newStreak > (user?.streakMax || 0)) ? newStreak : undefined,
                lastActivityDate: now
            }
        });

        return await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                score: score
            }
        });
    }
}
