import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface QuickAddBody {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    objective: string;
    desiredStartDate?: string;
    coachId?: string;
    sendEmail: boolean;
}

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SALES', 'ORG_ADMIN', 'SUPER_ADMIN')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Get('stats')
    async getStats(@Request() req: any) {
        return this.salesService.getStats(req.user.id);
    }

    @Get('candidates')
    async getCandidates(@Request() req: any) {
        return this.salesService.getCandidates(req.user.id);
    }

    @Post('candidates')
    async createCandidate(@Request() req: any, @Body() body: { email: string; name: string; targetLevel: string }) {
        return this.salesService.createCandidate(req.user.id, body);
    }

    @Post('invite')
    async generateDiagnosticLink(@Request() req: any, @Body() body: { candidateId: string }) {
        return this.salesService.generateDiagnosticLink(req.user.id, body.candidateId);
    }

    // ========== QUICK ADD ==========
    @Post('quick-add')
    async quickAddCandidate(@Request() req: any, @Body() body: QuickAddBody) {
        return this.salesService.quickAddCandidate(req.user.id, body);
    }

    @Get('coaches')
    async getCoaches(@Request() req: any) {
        return this.salesService.getCoaches(req.user.organizationId);
    }

    @Patch('candidates/:id/status')
    async updateCandidateStatus(
        @Request() req: any,
        @Param('id') candidateId: string,
        @Body() body: { status: string }
    ) {
        return this.salesService.updateCandidateStatus(req.user.id, candidateId, body.status);
    }

    @Patch('candidates/:id/tags')
    async updateCandidateTags(
        @Request() req: any,
        @Param('id') candidateId: string,
        @Body() body: { tags: string[] }
    ) {
        return this.salesService.updateCandidateTags(req.user.id, candidateId, body.tags);
    }
}
