import { Controller, Post, Body, Get, Patch, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ProofsService } from './proofs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('proofs')
@UseGuards(JwtAuthGuard)
export class ProofsController {
    constructor(private readonly proofsService: ProofsService) { }

    @Post()
    @Roles('CANDIDATE')
    async create(@Req() req: any, @Body() body: { organizationId: string, title: string, type: string, description?: string, proofUrl?: string }) {
        return this.proofsService.createProof(req.user.id, body.organizationId, body);
    }

    @Get('org/:orgId')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async getForOrg(@Param('orgId') orgId: string, @Query('status') status?: string) {
        return this.proofsService.findAllByOrg(orgId, status);
    }

    @Get('mine')
    @Roles('CANDIDATE')
    async getMine(@Req() req: any) {
        return this.proofsService.findAllByUser(req.user.id);
    }

    @Patch(':id/validate')
    @Roles('ADMIN', 'COACH', 'ORG_ADMIN')
    async validate(@Param('id') id: string, @Body() body: { status: string, feedback?: string, xpAwarded?: number }) {
        return this.proofsService.validateProof(id, body);
    }
}
