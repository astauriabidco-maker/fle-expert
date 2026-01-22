import { Controller, Post, Body, UnauthorizedException, UseGuards, Req, Patch, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private prisma: PrismaService
    ) { }

    @Post('login')
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body, body.token);
    }

    @Post('register-partner')
    async registerPartner(@Body() body: any) {
        return this.authService.registerPartner(body);
    }

    @Post('complete-diagnostic')
    @UseGuards(JwtAuthGuard)
    async completeDiagnostic(@Req() req: any) {
        const userId = req.user.id;

        await this.prisma.user.update({
            where: { id: userId },
            data: { hasCompletedDiagnostic: true }
        });

        return { success: true, message: 'Diagnostic completed' };
    }

    @Post('verify-prerequisites')
    @UseGuards(JwtAuthGuard)
    async verifyPrerequisites(@Req() req: any, @Body() body: any) {
        const userId = req.user.id;

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                hasVerifiedPrerequisites: body.verified,
                prerequisitesProofUrl: body.proofUrl || null
            }
        });

        return { success: true, message: 'Prerequisites verified' };
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Req() req: any, @Body() body: any) {
        const userId = req.user.id;

        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.phone) updateData.phone = body.phone;
        if (body.address) updateData.address = body.address;
        if (body.postalCode) updateData.postalCode = body.postalCode;
        if (body.city) updateData.city = body.city;
        if (body.objective) {
            updateData.objective = body.objective;
            // Auto-update target level if not explicitly provided
            if (!body.targetLevel) {
                updateData.targetLevel = (this.authService as any).determineTargetLevel(body.objective);
            }
        }
        if (body.targetLevel) updateData.targetLevel = body.targetLevel;

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { organization: true }
        });

        const { password, ...safeUser } = updatedUser;
        return { success: true, user: safeUser };
    }

    @Patch('set-password')
    @UseGuards(JwtAuthGuard)
    async setPassword(@Req() req: any, @Body() body: any) {
        if (!body.password) throw new BadRequestException('Mot de passe requis');
        await this.authService.setPassword(req.user.id, body.password);
        return { success: true, message: 'Mot de passe mis à jour' };
    }
}
