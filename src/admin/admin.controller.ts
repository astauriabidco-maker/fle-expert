import { Controller, Post, Body, Get, Patch, Param, Query, Delete, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { SecurityService } from '../common/services/security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly prisma: PrismaService,
        private readonly security: SecurityService
    ) { }

    @Get('stats')
    @Roles('SUPER_ADMIN')
    async getStats() {
        return this.adminService.getGlobalStats();
    }

    @Get('organizations')
    @Roles('SUPER_ADMIN')
    async getOrganizations() {
        return this.adminService.getAllOrganizations();
    }

    @Post('organizations')
    @Roles('SUPER_ADMIN')
    async createOrganization(@Body() data: { name: string, slug: string, adminEmail: string, initialCredits: number }) {
        return await this.prisma.$transaction(async (tx: any) => {
            const org = await tx.organization.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    creditsBalance: data.initialCredits,
                }
            });

            const { hash, salt } = this.security.hashWithSalt('password_temp_a_changer');
            const passwordStored = `${salt}:${hash}`;

            const user = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    role: 'ORG_ADMIN',
                    organizationId: org.id,
                    password: passwordStored
                }
            });

            return { org, admin: user };
        });
    }

    @Patch('organizations/:id/status')
    @Roles('SUPER_ADMIN')
    async updateStatus(@Param('id') id: string, @Body() data: { status: string }) {
        return this.adminService.updateOrgStatus(id, data.status);
    }

    @Patch('organizations/:id/credits')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    async addCredits(@Param('id') id: string, @Body() data: { amount: number }, @Req() req: any) {
        // ORG_ADMIN can only add credits to their own organization
        if (req.user.role === 'ORG_ADMIN' && req.user.organizationId !== id) {
            throw new Error('Unauthorized: Cannot modify credits for another organization');
        }
        return this.adminService.addOrgCredits(id, data.amount);
    }

    @Get('users')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    async getUsers(
        @Query('role') role?: string,
        @Query('orgId') orgId?: string,
        @Req() req?: any
    ) {
        // ORG_ADMIN can only see users from their organization
        const effectiveOrgId = req.user.role === 'ORG_ADMIN' ? req.user.organizationId : orgId;
        return this.adminService.getAllUsers(role, effectiveOrgId);
    }

    @Delete('users/:id')
    @Roles('SUPER_ADMIN')
    async deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    @Patch('users/:id')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    async updateUser(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        // ORG_ADMIN can only update users from their organization
        if (req.user.role === 'ORG_ADMIN') {
            const targetUser = await this.prisma.user.findUnique({ where: { id } });
            if (targetUser?.organizationId !== req.user.organizationId) {
                throw new Error('Unauthorized: Cannot modify user from another organization');
            }
        }
        return this.adminService.updateUser(id, data);
    }

    @Delete('organizations/:id')
    @Roles('SUPER_ADMIN')
    async deleteOrganization(@Param('id') id: string) {
        return this.adminService.deleteOrganization(id);
    }

    @Patch('organizations/:id')
    @Roles('SUPER_ADMIN')
    async updateOrganization(@Param('id') id: string, @Body() data: { name?: string, slug?: string }) {
        return this.adminService.updateOrganization(id, data);
    }

    @Post('organizations/:id/reset-password')
    @Roles('SUPER_ADMIN')
    async resetPassword(@Param('id') id: string, @Body() data: { password?: string }) {
        return this.adminService.resetOrgAdminPassword(id, data.password);
    }

    @Get('organizations/:id/transactions')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    async getOrgTransactions(@Param('id') id: string, @Req() req: any) {
        if (req.user.role === 'ORG_ADMIN' && req.user.organizationId !== id) {
            throw new Error('Unauthorized');
        }
        return this.adminService.getOrgTransactions(id);
    }

    @Get('sessions')
    @Roles('SUPER_ADMIN')
    async getSessions() {
        return this.adminService.getGlobalSessions();
    }

    @Get('sessions/:id')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'COACH')
    async getSession(@Param('id') id: string) {
        return this.adminService.getSessionDetails(id);
    }

    @Get('users/:id/profile')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'COACH')
    async getUserProfile(@Param('id') id: string) {
        return this.adminService.getUserFullProfile(id);
    }

    @Get('ai-monitoring')
    @Roles('SUPER_ADMIN')
    async getAiMonitoring() {
        return this.adminService.getAiObservatoryData();
    }

    @Get('audit-logs')
    @Roles('SUPER_ADMIN')
    async getAuditLogs(@Query('page') page: string) {
        return this.adminService.getAuditLogs(parseInt(page) || 1);
    }

    @Get('export-data')
    @Roles('SUPER_ADMIN')
    async exportData() {
        return this.adminService.exportGdprData();
    }
}
