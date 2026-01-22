import { Controller, Post, Get, Param, Body, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamService } from './exam.service';
import { AdaptiveSequencerService } from './adaptive-sequencer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exam')
@UseGuards(JwtAuthGuard)
export class ExamController {
    constructor(
        private readonly examService: ExamService,
        private readonly sequencer: AdaptiveSequencerService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('start')
    async startExam(@Body() body: { userId: string, organizationId?: string, type?: string }) {
        try {
            console.log('DEBUG: Received start request', body);

            if (!body.userId) {
                throw new Error('Missing userId in request body');
            }

            // 1. Create Session
            const session = await this.examService.startExam(body.userId, body.organizationId);
            console.log('DEBUG: Session created', session.id);

            // 2. Update metadata (simplified)
            try {
                await this.prisma.examSession.update({
                    where: { id: session.id },
                    data: {
                        startedAt: new Date(),
                        type: body.type || 'EXAM',
                        durationMinutes: body.type === 'DIAGNOSTIC' ? 15 : 60,
                    }
                });
            } catch (updateErr) {
                console.error('DEBUG: Failed to update metadata, ignoring', updateErr);
            }

            return {
                message: "Exam started successfully",
                session
            };
        } catch (error: any) {
            console.error("DEBUG: EXAM CONTROLLER ERROR", JSON.stringify(error, null, 2));

            // Handle Prisma foreign key errors specifically for organizationId
            if (error.code === 'P2003' && error.meta?.field_name?.includes('organizationId')) {
                throw new BadRequestException({
                    message: "Identifiant d'organisation invalide ou inexistant.",
                    details: "L'ID d'organisation fourni n'existe pas dans la base de données.",
                    code: 'INVALID_ORGANIZATION'
                });
            }

            throw new BadRequestException({
                message: "Impossible de démarrer l'examen",
                details: error.message || 'Unknown error',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
    }

    @Post('assign')
    async assignExam(@Body() body: { userId: string, organizationId: string }) {
        const session = await this.examService.assignExam(body.userId, body.organizationId);
        return {
            message: "Exam assigned successfully",
            session
        };
    }

    @Post(':sessionId/answer')
    async submitAnswer(
        @Param('sessionId') sessionId: string,
        @Body() body: { questionId: string, selectedOption: string }
    ) {
        // 1. Validate Answer
        const question = await this.prisma.question.findUnique({
            where: { id: body.questionId }
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        const isCorrect = question.correctAnswer === body.selectedOption;

        // 2. Record Answer
        await this.sequencer.recordAnswer(sessionId, body.questionId, isCorrect);

        // 3. Get Next Question
        return this.getNextQuestion(sessionId);
    }

    @Post(':sessionId/start')
    async startExistingSession(@Param('sessionId') sessionId: string, @Body() body: { userId: string }) {
        const session = await this.examService.startExistingSession(sessionId, body.userId);
        return {
            message: "Exam started successfully",
            session
        };
    }

    @Get(':sessionId/next')
    async getNextQuestion(@Param('sessionId') sessionId: string) {
        const nextStep = await this.sequencer.getNextQuestion(sessionId);

        if (nextStep.isFinished) {
            return {
                finished: true,
                reason: nextStep.reason,
            };
        }

        const { question } = nextStep;
        if (!question) {
            throw new NotFoundException('No question found despite not finished');
        }

        // Return question without correct answer
        return {
            finished: false,
            question: {
                id: question.id,
                text: question.questionText,
                options: question.options,
                level: question.level,
                topic: question.topic,
                audioUrl: question.audioUrl,
                isRecording: question.isRecording,
                maxListens: question.maxListens
            }
        };
    }

    @Post(':sessionId/complete')
    async completeExam(
        @Param('sessionId') sessionId: string,
        @Body() body: { answers?: any[], warningsCount?: number }
    ) {
        // Refactored to use stored answers if Adaptive flow is used
        // But keeping compat with previous body-based if needed.
        // For adaptive, we should just trigger completion logic.
        const result = await this.examService.completeExam(sessionId, body.warningsCount || 0);

        return {
            message: 'Exam completed successfully',
            result
        };
    }

    @Get('history/:userId')
    async getHistory(@Param('userId') userId: string) {
        return this.examService.getHistory(userId);
    }

    @Get('stats/:userId')
    async getStats(@Param('userId') userId: string) {
        return this.examService.getStats(userId);
    }

    @Get('latest-diagnostic/:userId')
    async getLatestDiagnostic(@Param('userId') userId: string) {
        const session = await this.examService.getLatestDiagnostic(userId);
        if (!session) {
            throw new NotFoundException('No completed diagnostic found for this user');
        }
        return session;
    }

    /**
     * Get full session state for resume and navigation
     */
    @Get(':sessionId/state')
    async getSessionState(@Param('sessionId') sessionId: string) {
        return this.examService.getSessionState(sessionId);
    }

    /**
     * Save answer without advancing (for auto-save and navigation)
     */
    @Post(':sessionId/save-answer')
    async saveAnswer(
        @Param('sessionId') sessionId: string,
        @Body() body: { questionId: string, selectedOption: string }
    ) {
        return this.examService.saveAnswer(sessionId, body.questionId, body.selectedOption);
    }

    /**
     * Log a security violation during the exam
     */
    @Post(':sessionId/violation')
    async logViolation(
        @Param('sessionId') sessionId: string,
        @Body() body: { type: string, details?: string, timestamp?: string }
    ) {
        // Update session integrity score
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Increment integrity score (warnings count)
        const newIntegrityScore = (session.integrityScore || 0) + 1;

        // Build violation log
        const existingDebugData = session.aiDebugData as any || {};
        const violations = existingDebugData.violations || [];
        violations.push({
            type: body.type,
            details: body.details,
            timestamp: body.timestamp || new Date().toISOString()
        });

        await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                integrityScore: newIntegrityScore,
                integrityStatus: newIntegrityScore >= 3 ? 'SUSPICIOUS' : 'VALID',
                aiDebugData: { ...existingDebugData, violations }
            }
        });

        // Check if should auto-terminate
        if (newIntegrityScore >= 5) {
            return { logged: true, shouldTerminate: true, message: 'Maximum violations reached' };
        }

        return { logged: true, warningsCount: newIntegrityScore };
    }

    /**
     * Terminate exam for cheating
     */
    @Post(':sessionId/terminate-cheating')
    async terminateForCheating(
        @Param('sessionId') sessionId: string,
        @Body() body: { violations?: any[] }
    ) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.status === 'COMPLETED') {
            throw new BadRequestException('Session already completed');
        }

        // Mark as terminated for cheating
        await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                status: 'CHEATING_DETECTED',
                integrityStatus: 'FAILED',
                completedAt: new Date(),
                aiDebugData: {
                    ...(session.aiDebugData as any || {}),
                    terminatedForCheating: true,
                    terminationTimestamp: new Date().toISOString(),
                    violations: body.violations
                }
            }
        });

        return { terminated: true, reason: 'CHEATING_DETECTED' };
    }
}
