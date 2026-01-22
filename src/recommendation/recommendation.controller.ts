
import { Controller, Get, Post, Body, UseGuards, Param, Request } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recommendations')
export class RecommendationController {
    constructor(private readonly recommendationService: RecommendationService) { }

    @UseGuards(JwtAuthGuard)
    @Get('/me')
    async getMyRecommendations(@Request() req: any) {
        // For dev/debug, pass ID in query or use a fixed ID if req.user is missing
        // In real app, req.user.userId comes from JWT
        // Fallback for testing:
        const userId = req.user?.id || req.query?.userId;
        return this.recommendationService.getRecommendations(userId);
    }

    // Explicit route for testing with explicit ID
    @Get('/user/:userId')
    async getUserRecommendations(@Param('userId') userId: string) {
        return this.recommendationService.getRecommendations(userId);
    }

    @Post('/connect')
    async connectLead(@Body() body: { candidateId: string; organizationId: string }) {
        return this.recommendationService.connectLead(body.candidateId, body.organizationId);
    }
}
