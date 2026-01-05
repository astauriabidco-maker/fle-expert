import { Controller, Post, Body, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
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
        if (!body.token) {
            throw new UnauthorizedException('Token requis pour l\'inscription');
        }
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
}
