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
        @Body() body: { topic: string; level: string; count: number; orgId?: string; sector?: string }
    ) {
        const orgId = body.orgId || req.user.organizationId;
        return this.contentLabService.generateAndSaveQuestions(
            orgId,
            body.topic,
            body.level,
            body.count || 5,
            body.sector
        );
    }

    @Get('questions')
    async getQuestions(
        @Request() req: any,
        @Query('level') level: string,
        @Query('topic') topic: string,
        @Query('search') search: string
    ) {
        const orgId = req.user.role === 'SUPER_ADMIN' ? null : req.user.organizationId;
        return this.contentLabService.getQuestions(orgId, { level, topic, search });
    }

    @Get('questions/:id')
    async getQuestion(@Request() req: any, @Param('id') id: string) {
        const orgId = req.user.role === 'SUPER_ADMIN' ? null : req.user.organizationId;
        return this.contentLabService.getQuestion(id, orgId);
    }

    @Post('questions')
    async createQuestion(@Request() req: any, @Body() body: any) {
        return this.contentLabService.createQuestion(req.user.organizationId, body);
    }

    @Put('questions/:id')
    async updateQuestion(@Request() req: any, @Param('id') id: string, @Body() body: any) {
        const orgId = req.user.role === 'SUPER_ADMIN' ? null : req.user.organizationId;
        return this.contentLabService.updateQuestion(id, orgId, body);
    }

    @Delete('questions/:id')
    async deleteQuestion(@Request() req: any, @Param('id') id: string) {
        const orgId = req.user.role === 'SUPER_ADMIN' ? null : req.user.organizationId;
        return this.contentLabService.deleteQuestion(id, orgId);
    }

    // ========== TOPIC MANAGEMENT ==========
    @Get('topics')
    async getTopics() {
        return this.contentLabService.getTopics();
    }

    @Post('topics')
    @Roles('SUPER_ADMIN')
    async createTopic(@Body() body: { name: string }) {
        return this.contentLabService.createTopic(body.name);
    }

    @Delete('topics/:id')
    @Roles('SUPER_ADMIN')
    async deleteTopic(@Param('id') id: string) {
        return this.contentLabService.deleteTopic(id);
    }

    // ========== SECTOR MANAGEMENT ==========
    @Get('sectors')
    async getSectors() {
        return this.contentLabService.getSectors();
    }

    @Post('sectors')
    @Roles('SUPER_ADMIN')
    async createSector(@Body() body: { name: string }) {
        return this.contentLabService.createSector(body.name);
    }

    @Delete('sectors/:id')
    @Roles('SUPER_ADMIN')
    async deleteSector(@Param('id') id: string) {
        return this.contentLabService.deleteSector(id);
    }
}

