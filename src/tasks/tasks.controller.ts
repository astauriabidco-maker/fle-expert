import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import type { CreateTaskDto, UpdateTaskDto } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SALES', 'ORG_ADMIN', 'SUPER_ADMIN')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    async getTasks(
        @Request() req: any,
        @Query('completed') completed?: string,
        @Query('candidateId') candidateId?: string
    ) {
        const filters: any = {};
        if (completed !== undefined) filters.completed = completed === 'true';
        if (candidateId) filters.candidateId = candidateId;

        return this.tasksService.getTasks(req.user.id, filters);
    }

    @Get('today')
    async getTasksDueToday(@Request() req: any) {
        return this.tasksService.getTasksDueToday(req.user.id);
    }

    @Post()
    async createTask(@Request() req: any, @Body() body: CreateTaskDto) {
        return this.tasksService.createTask(req.user.id, body);
    }

    @Patch(':id')
    async updateTask(
        @Request() req: any,
        @Param('id') taskId: string,
        @Body() body: UpdateTaskDto
    ) {
        return this.tasksService.updateTask(req.user.id, taskId, body);
    }

    @Patch(':id/complete')
    async completeTask(@Request() req: any, @Param('id') taskId: string) {
        return this.tasksService.completeTask(req.user.id, taskId);
    }

    @Delete(':id')
    async deleteTask(@Request() req: any, @Param('id') taskId: string) {
        return this.tasksService.deleteTask(req.user.id, taskId);
    }
}
