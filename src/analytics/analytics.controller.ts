import { Controller, Get, Param, Patch, Body, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('org/:id')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async getOrgStats(@Param('id') orgId: string) {
        return this.analyticsService.getOrgStats(orgId);
    }

    @Get('org/:id/settings')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async getOrgSettings(@Param('id') orgId: string) {
        return this.analyticsService.getOrgSettings(orgId);
    }

    @Patch('org/:id/settings')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async updateOrgSettings(@Param('id') orgId: string, @Body() data: any) {
        return this.analyticsService.updateOrgSettings(orgId, data);
    }

    @Get('leaderboard/:orgId')
    @Roles('ADMIN', 'COACH', 'CANDIDATE')
    async getLeaderboard(@Param('orgId') orgId: string) {
        return this.analyticsService.getLeaderboard(orgId);
    }

    @Get('students/:orgId')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async getStudents(@Param('orgId') orgId: string) {
        return this.analyticsService.getStudentsByOrg(orgId);
    }

    @Get('questions/:orgId')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async getQuestions(@Param('orgId') orgId: string) {
        return this.analyticsService.getOrgQuestions(orgId);
    }

    @Patch('questions/:id/status')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async toggleQuestionStatus(@Param('id') id: string, @Body() data: { isActive: boolean }) {
        return this.analyticsService.toggleQuestionStatus(id, data.isActive);
    }

    @Post('questions')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async createQuestion(@Body() data: { orgId: string, [key: string]: any }) {
        return this.analyticsService.createQuestion(data.orgId, data);
    }

    @Put('questions/:id')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async updateQuestion(@Param('id') id: string, @Body() data: any) {
        return this.analyticsService.updateQuestion(id, data);
    }

    @Delete('questions/:id')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async deleteQuestion(@Param('id') id: string) {
        return this.analyticsService.deleteQuestion(id);
    }
    @Get('user/path/:userId')
    async getUserPath(@Param('userId') userId: string) {
        return this.analyticsService.getUserLearningPath(userId);
    }

    @Get('student/:studentId/org/:orgId')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async getStudentProfile(
        @Param('studentId') studentId: string,
        @Param('orgId') orgId: string
    ) {
        return this.analyticsService.getStudentDetailedProfile(studentId, orgId);
    }

    @Get('qualiopi/:orgId')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async getQualiopiAudit(@Param('orgId') orgId: string) {
        return this.analyticsService.getQualiopiAudit(orgId);
    }

    @Post('test-ai-connection')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async testAIConnection(@Body() data: { provider: 'openai' | 'gemini', apiKey: string }) {
        const { provider, apiKey } = data;

        if (!apiKey || apiKey.trim() === '') {
            return { success: false, error: 'Clé API non fournie' };
        }

        try {
            if (provider === 'openai') {
                // Test OpenAI connection with a minimal API call
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const models = await response.json();
                    const hasGPT4 = models.data?.some((m: any) => m.id.includes('gpt-4'));
                    const hasWhisper = models.data?.some((m: any) => m.id.includes('whisper'));
                    return {
                        success: true,
                        provider: 'OpenAI',
                        capabilities: {
                            generation: true,
                            transcription: hasWhisper,
                            gpt4Available: hasGPT4
                        },
                        message: 'Connexion réussie à OpenAI'
                    };
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    return {
                        success: false,
                        error: errorData.error?.message || 'Clé API invalide ou expirée'
                    };
                }
            } else if (provider === 'gemini') {
                // Test Gemini connection with a minimal API call
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
                );

                if (response.ok) {
                    const models = await response.json();
                    const hasProModel = models.models?.some((m: any) => m.name.includes('gemini-pro'));
                    return {
                        success: true,
                        provider: 'Google Gemini',
                        capabilities: {
                            generation: true,
                            transcription: false, // Gemini doesn't do transcription
                            proModelAvailable: hasProModel
                        },
                        message: 'Connexion réussie à Google Gemini'
                    };
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    return {
                        success: false,
                        error: errorData.error?.message || 'Clé API invalide ou expirée'
                    };
                }
            } else {
                return { success: false, error: 'Fournisseur non supporté' };
            }
        } catch (error: any) {
            console.error('[AnalyticsController] AI connection test failed:', error);
            return {
                success: false,
                error: error.message || 'Erreur de connexion au service IA'
            };
        }
    }
}

