import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
    constructor(private prisma: PrismaService) { }

    @Get('badges')
    async getMyBadges(@Req() req: any) {
        return this.prisma.userBadge.findMany({
            where: { userId: req.user.id },
            include: { badge: true },
        });
    }

    @Get('leaderboard')
    async getLeaderboard(@Req() req: any) {
        // Top 10 by XP
        return this.prisma.user.findMany({
            where: { organizationId: req.user.organizationId, role: 'CANDIDATE' },
            select: {
                id: true,
                name: true,
                xp: true,
                streakMax: true,
                currentLevel: true,
            },
            orderBy: { xp: 'desc' },
            take: 10,
        });
    }
}
