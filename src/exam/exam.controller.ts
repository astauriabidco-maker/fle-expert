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
    async startExam(@Body() body: { userId: string, organizationId: string }) {
        const session = await this.examService.startExam(body.userId, body.organizationId);
        return {
            message: "Exam started successfully",
            session
        };
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
                topic: question.topic
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
}
