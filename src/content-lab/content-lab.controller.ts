import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ContentLabService } from './content-lab.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('content-lab')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN', 'SUPER_ADMIN', 'COACH')
export class ContentLabController {
    constructor(private readonly contentLabService: ContentLabService) { }

    @Post('generate')
    async generateQuestions(
        @Request() req: any,
        @Body() body: { topic: string; level: string; count: number; orgId?: string }
    ) {
        const orgId = body.orgId || req.user.organizationId;
        return this.contentLabService.generateAndSaveQuestions(
            orgId,
            body.topic,
            body.level,
            body.count || 5
        );
    }

    @Get('questions')
    async getQuestions(
        @Request() req: any,
        @Query('level') level: string,
        @Query('topic') topic: string,
        @Query('search') search: string
    ) {
        return this.contentLabService.getQuestions(req.user.organizationId, { level, topic, search });
    }

    @Get('questions/:id')
    async getQuestion(@Request() req: any, @Param('id') id: string) {
        return this.contentLabService.getQuestion(id, req.user.organizationId);
    }

    @Post('questions')
    async createQuestion(@Request() req: any, @Body() body: any) {
        return this.contentLabService.createQuestion(req.user.organizationId, body);
    }

    @Put('questions/:id')
    async updateQuestion(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        return this.contentLabService.updateQuestion(id, req.user.organizationId, body);
    }

    @Delete('questions/:id')
    async deleteQuestion(@Request() req: any, @Param('id') id: string) {
        return this.contentLabService.deleteQuestion(id, req.user.organizationId);
    }
}

