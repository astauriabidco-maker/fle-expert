import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SALES', 'ORG_ADMIN', 'SUPER_ADMIN') // Sales primarily, but admins might check view
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
}
