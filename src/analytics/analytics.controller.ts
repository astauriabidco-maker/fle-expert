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
}

