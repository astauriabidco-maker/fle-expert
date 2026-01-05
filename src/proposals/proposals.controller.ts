import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
    constructor(private readonly proposalsService: ProposalsService) { }

    @Post('generate')
    @Roles('ORG_ADMIN', 'SUPER_ADMIN')
    async generate(@Body() body: { userId: string, targetLevel: string }) {
        return this.proposalsService.generateProposal(body.userId, body.targetLevel);
    }

    @Get('org/:orgId')
    @Roles('ORG_ADMIN', 'SUPER_ADMIN')
    async getByOrg(@Param('orgId') orgId: string) {
        return this.proposalsService.findByOrg(orgId);
    }

    @Get('user/:userId')
    async getByUser(@Param('userId') userId: string) {
        return this.proposalsService.findByUser(userId);
    }

    @Get(':id')
    async getOne(@Param('id') id: string) {
        return this.proposalsService.findOne(id);
    }

    @Get(':id/devis')
    async downloadDevis(@Param('id') id: string, @Res() res: any) {
        const buffer = await this.proposalsService.generateDevisPdf(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=devis-${id.substring(0, 8)}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @Get(':id/plan')
    async downloadPlan(@Param('id') id: string, @Res() res: any) {
        const buffer = await this.proposalsService.generatePlanPdf(id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=plan-formation-${id.substring(0, 8)}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }

    @Delete(':id')
    @Roles('ORG_ADMIN', 'SUPER_ADMIN')
    async delete(@Param('id') id: string) {
        return this.proposalsService.delete(id);
    }
}
