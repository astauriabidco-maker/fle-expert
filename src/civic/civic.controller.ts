
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CivicService } from './civic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('civic')
export class CivicController {
    constructor(private civicService: CivicService) { }

    @Get('modules')
    @UseGuards(JwtAuthGuard)
    async getModules() {
        return this.civicService.findAllModules();
    }

    @Get('modules/:id')
    @UseGuards(JwtAuthGuard)
    async getModule(@Param('id') id: string) {
        return this.civicService.findModuleById(id);
    }

    @Post('modules')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async createModule(@Body() data: any) {
        return this.civicService.createModule(data);
    }

    @Put('modules/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async updateModule(@Param('id') id: string, @Body() data: any) {
        return this.civicService.updateModule(id, data);
    }

    @Delete('modules/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN')
    async deleteModule(@Param('id') id: string) {
        return this.civicService.deleteModule(id);
    }

    // --- Lessons ---

    @Post('modules/:moduleId/lessons')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async addLesson(@Param('moduleId') moduleId: string, @Body() data: any) {
        return this.civicService.addLesson(moduleId, data);
    }

    @Put('lessons/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async updateLesson(@Param('id') id: string, @Body() data: any) {
        return this.civicService.updateLesson(id, data);
    }

    @Delete('lessons/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async deleteLesson(@Param('id') id: string) {
        return this.civicService.deleteLesson(id);
    }

    // --- Questions ---

    @Get('simulator/questions')
    @UseGuards(JwtAuthGuard)
    async getSimulatorQuestions() {
        return this.civicService.findAllOfficialQuestions();
    }

    @Post('questions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async addQuestion(@Body() data: any) {
        return this.civicService.addQuestion(data);
    }

    @Put('questions/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async updateQuestion(@Param('id') id: string, @Body() data: any) {
        return this.civicService.updateQuestion(id, data);
    }

    @Delete('questions/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN', 'COACH')
    async deleteQuestion(@Param('id') id: string) {
        return this.civicService.deleteQuestion(id);
    }

    // --- Progress ---

    @Post('progress')
    @UseGuards(JwtAuthGuard)
    async trackProgress(@Request() req: any, @Body() data: any) {
        return this.civicService.trackProgress(req.user.id, data);
    }

    @Get('progress')
    @UseGuards(JwtAuthGuard)
    async getProgress(@Request() req: any) {
        await this.civicService.checkCivicReminders(req.user.id);
        return this.civicService.getUserProgress(req.user.id);
    }
}
