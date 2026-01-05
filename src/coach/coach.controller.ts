import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CoachService } from './coach.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('coach')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COACH', 'ORG_ADMIN', 'SUPER_ADMIN')
export class CoachController {
    constructor(private readonly coachService: CoachService) { }

    @Get('students')
    async getStudents(@Request() req: any) {
        return this.coachService.getStudents(req.user.id);
    }

    @Get('my-stats')
    async getMyStats(@Request() req: any) {
        return this.coachService.getMyStats(req.user.id);
    }

    @Post('assign')
    async assignStudent(@Request() req: any, @Body() body: { email: string }) {
        return this.coachService.assignStudent(req.user.id, body.email);
    }

    @Get('corrections')
    async getCorrections(@Request() req: any) {
        return this.coachService.getCorrections(req.user.id);
    }

    @Post('corrections/:sessionId')
    async submitCorrection(@Request() req: any, @Param('sessionId') sessionId: string, @Body() body: { humanGrade: number, feedback?: string }) {
        return this.coachService.submitCorrection(req.user.id, sessionId, body);
    }

    @Post('students/:studentId/actions')
    async createPedagogicalAction(
        @Request() req: any,
        @Param('studentId') studentId: string,
        @Body() body: { type: string, content: string }
    ) {
        return this.coachService.createPedagogicalAction(req.user.id, studentId, body.type, body.content);
    }

    // Profile Management
    @Put('profile')
    async updateProfile(
        @Request() req: any,
        @Body() body: {
            phone?: string;
            address?: string;
            postalCode?: string;
            city?: string;
            nda?: string;
            hourlyRate?: number;
            contactPerson?: string;
        }
    ) {
        return this.coachService.updateProfile(req.user.id, body);
    }

    // Document Management
    @Get('documents')
    async getDocuments(@Request() req: any) {
        return this.coachService.getDocuments(req.user.id);
    }

    @Post('documents')
    async uploadDocument(
        @Request() req: any,
        @Body() body: { type: string; filename: string; url: string }
    ) {
        return this.coachService.uploadDocument(req.user.id, body.type, body.filename, body.url);
    }

    @Delete('documents/:id')
    async deleteDocument(@Request() req: any, @Param('id') docId: string) {
        return this.coachService.deleteDocument(req.user.id, docId);
    }

    // ========== PEDAGOGICAL TRACKING ==========

    @Get('students/:studentId/sessions')
    async getStudentSessions(
        @Request() req: any,
        @Param('studentId') studentId: string
    ) {
        return this.coachService.getStudentSessions(req.user.id, studentId);
    }

    @Get('students/:studentId/sessions/:sessionId')
    async getSessionDetail(
        @Request() req: any,
        @Param('studentId') studentId: string,
        @Param('sessionId') sessionId: string
    ) {
        return this.coachService.getSessionDetail(req.user.id, studentId, sessionId);
    }

    @Get('students/:studentId/learning-path')
    async getStudentLearningPath(
        @Request() req: any,
        @Param('studentId') studentId: string
    ) {
        return this.coachService.getStudentLearningPath(req.user.id, studentId);
    }

    @Put('students/:studentId/tags')
    async updateStudentTags(
        @Request() req: any,
        @Param('studentId') studentId: string,
        @Body() body: { tags: string[] }
    ) {
        return this.coachService.updateStudentTags(req.user.id, studentId, body.tags);
    }

    @Get('availability')
    async getAvailability(@Request() req: any) {
        return this.coachService.getAvailability(req.user.id);
    }

    @Post('availability')
    async updateAvailability(@Request() req: any, @Body() body: { slots: any[] }) {
        return this.coachService.updateAvailability(req.user.id, body.slots);
    }

    @Post('signature')
    async saveSignature(@Request() req: any, @Body() body: { signature: string }) {
        return this.coachService.saveSignature(req.user.id, body.signature);
    }

    @Get('invoices')
    async getInvoices(@Request() req: any) {
        return this.coachService.getInvoices(req.user.id);
    }

    @Post('invoices/generate')
    async generateInvoice(@Request() req: any, @Body() body: { month: number, year: number }) {
        return this.coachService.generateMonthlyInvoice(req.user.id, body.month, body.year);
    }
}
