import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    @Post('send')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ORG_ADMIN', 'COACH')
    async sendInvitation(@Body() body: { email: string, orgId: string }) {
        return this.invitationsService.createInvitation(body.email, body.orgId);
    }

    @Get('verify')
    async verifyToken(@Query('token') token: string) {
        const invitation = await this.invitationsService.verifyToken(token);
        return {
            valid: true,
            email: invitation.email,
            organizationName: invitation.organization.name,
        };
    }
}
