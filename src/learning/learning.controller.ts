import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { LearningService } from './learning.service';

@Controller('learning')
export class LearningController {
    constructor(private learningService: LearningService) { }

    @Post('start')
    async startPractice(@Body() body: { userId: string, organizationId: string, topic: string }) {
        return this.learningService.startPracticeSession(body.userId, body.organizationId, body.topic);
    }

    @Post(':sessionId/answer')
    async submitAnswer(
        @Param('sessionId') sessionId: string,
        @Body() body: { questionId: string, selectedOption: string }
    ) {
        return this.learningService.submitPracticeAnswer(sessionId, body.questionId, body.selectedOption);
    }

    @Post(':sessionId/complete')
    async completeSession(@Param('sessionId') sessionId: string) {
        return this.learningService.completePracticeSession(sessionId);
    }
}
