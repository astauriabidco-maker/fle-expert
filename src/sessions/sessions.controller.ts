import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    /**
     * Create a new course session (Coach or Admin)
     */
    @Post()
    @Roles('COACH', 'ADMIN', 'ORG_ADMIN', 'SUPER_ADMIN')
    async createSession(@Request() req: any, @Body() body: {
        title: string;
        description?: string;
        classroomId?: string;
        scheduledDate: string;
        startTime: string;
        endTime: string;
        durationMinutes: number;
        type?: string;
        weeks?: number;
        coachId?: string;
    }) {
        const coachId = req.user.role === 'COACH' ? req.user.id : (body.coachId || req.user.id);
        const createdByRole = req.user.role;
        return this.sessionsService.createSession(coachId, { ...body, createdByRole });
    }

    /**
     * Get sessions (Coach sees their own, Admin sees organization-wide)
     */
    @Get()
    @Roles('COACH', 'ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN')
    async getSessions(
        @Request() req: any,
        @Query('status') status?: string,
        @Query('month') month?: string,
        @Query('year') year?: string,
        @Query('coachId') coachIdQuery?: string
    ) {
        const filters: any = {
            status,
            month: month ? parseInt(month) : undefined,
            year: year ? parseInt(year) : undefined
        };

        if (req.user.role === 'COACH') {
            filters.coachId = req.user.id;
        } else if (['ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            // If SUPER_ADMIN and no orgId, this might return everything or need specific logic.
            // Assuming SUPER_ADMIN in this context operates within an org context 
            // OR if they want to see ALL sessions system-wide (if orgId is undefined in service logic).
            // For now, let's pass organizationId if it exists (e.g. if Super Admin is "logged in" as an org admin conceptually)
            // But usually Super Admin has no org. 
            // If we want Super Admin to see EVERYTHING, we just don't set organizationId filter or set it to undefined.

            // However, CoachSessionsManager usually runs in context of an Org.
            // If Super Admin is viewing the dashboard, they might want to see all sessions?
            // Let's assume for now they want to see "Global" sessions, or we might need to filter by the organization they are "inspecting".
            // Since there's no "inspecting org" param passed here clearly other than potentially in headers, 
            // we will rely on req.user.organizationId if it exists, otherwise it might be empty (returning all sessions).

            if (req.user.organizationId) {
                filters.organizationId = req.user.organizationId;
            }

            if (coachIdQuery) {
                filters.coachId = coachIdQuery;
            }
        }

        return this.sessionsService.getSessions(filters);
    }

    /**
     * Get a single session
     */
    @Get(':id')
    @Roles('COACH', 'ORG_ADMIN', 'SUPER_ADMIN', 'ADMIN')
    async getSession(@Request() req: any, @Param('id') id: string) {
        const coachId = req.user.role === 'COACH' ? req.user.id : undefined;
        return this.sessionsService.getSession(id, coachId);
    }

    /**
     * Open a session for attendance
     */
    @Post(':id/open')
    @Roles('COACH', 'ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN')
    async openSession(@Request() req: any, @Param('id') id: string) {
        const isAdmin = ['ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        return this.sessionsService.openSession(id, req.user.id, isAdmin);
    }

    /**
     * Close a session
     */
    @Post(':id/close')
    @Roles('COACH', 'ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN')
    async closeSession(@Request() req: any, @Param('id') id: string) {
        const isAdmin = ['ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        return this.sessionsService.closeSession(id, req.user.id, isAdmin);
    }

    /**
     * Cancel a session
     */
    @Post(':id/cancel')
    @Roles('COACH', 'ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN')
    async cancelSession(@Request() req: any, @Param('id') id: string) {
        const isAdmin = ['ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        return this.sessionsService.cancelSession(id, req.user.id, isAdmin);
    }

    /**
     * Get attendees for a session
     */
    @Get(':id/attendees')
    @Roles('COACH', 'ORG_ADMIN')
    async getSessionAttendees(@Param('id') id: string) {
        return this.sessionsService.getSessionAttendees(id);
    }

    /**
     * Candidate signs attendance
     */
    @Post(':id/attend')
    @Roles('CANDIDATE')
    async signAttendance(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body?: { signatureData?: string }
    ) {
        return this.sessionsService.signAttendance(id, req.user.id, body?.signatureData);
    }

    /**
     * Get open sessions for a candidate (for attendance)
     */
    @Get('candidate/open')
    @Roles('CANDIDATE')
    async getOpenSessionsForCandidate(@Request() req: any) {
        return this.sessionsService.getOpenSessionsForCandidate(req.user.id);
    }
}
