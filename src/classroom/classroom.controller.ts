import { Controller, Get, Post, Body, Patch, Param, BadRequestException, Query } from '@nestjs/common';
import { ClassroomService } from './classroom.service';

@Controller('classrooms')
export class ClassroomController {
    constructor(private readonly classroomService: ClassroomService) { }

    @Post()
    create(@Body() body: any) {
        if (!body.organizationId) throw new BadRequestException("Org ID required");
        return this.classroomService.createClassroom(body.organizationId, body);
    }

    @Get('org/:orgId')
    findAll(@Param('orgId') orgId: string) {
        return this.classroomService.getClassrooms(orgId);
    }

    @Patch(':id/assign/:studentId')
    assignStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
        return this.classroomService.assignStudent(id, studentId);
    }

    @Patch('remove/:studentId')
    removeStudent(@Param('studentId') studentId: string) {
        return this.classroomService.removeStudent(studentId);
    }

    @Get('suggest')
    suggest(@Query('orgId') orgId: string, @Query('level') level: string) {
        return this.classroomService.suggestClassroom(orgId, level);
    }
}
