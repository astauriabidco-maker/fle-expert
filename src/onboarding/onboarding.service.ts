import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SecurityService } from '../common/services/security.service';

@Injectable()
export class OnboardingService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private security: SecurityService
    ) { }

    async generateOnboardingToken(user: { id: string, email: string }) {
        const payload = { sub: user.id, email: user.email, type: 'ONBOARDING' };
        return this.jwtService.sign(payload, { expiresIn: '7d' });
    }

    async verifyToken(token: string) {
        // Look for the invitation in DB (Hex token)
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
            include: { organization: true }
        });

        if (!invitation) {
            throw new UnauthorizedException('Ce lien est invalide ou a expiré.');
        }

        if (new Date() > invitation.expiresAt) {
            throw new BadRequestException('Cette invitation a expiré.');
        }

        return {
            valid: true,
            user: {
                email: invitation.email,
                name: invitation.email.split('@')[0] // Use email prefix as display name
            },
            organization: {
                name: invitation.organization?.name,
                logoUrl: invitation.organization?.logoUrl
            }
        };
    }

    async activateAccount(token: string, password: string) {
        // 1. Verify invitation
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
            include: { organization: true }
        });

        if (!invitation || new Date() > invitation.expiresAt) {
            throw new BadRequestException("Invitation invalide ou expirée");
        }

        // 2. Hash password
        const { hash, salt } = this.security.hashWithSalt(password);
        const passwordStored = `${salt}:${hash}`;

        // 3. Create OR Update user
        let finalUser;
        const existingUser = await this.prisma.user.findUnique({ where: { email: invitation.email } });

        if (existingUser) {
            // Update existing user
            finalUser = await this.prisma.user.update({
                where: { id: existingUser.id },
                data: { password: passwordStored, lastActivityDate: new Date() },
                include: { organization: true }
            });
        } else {
            // Create new user
            finalUser = await this.prisma.user.create({
                data: {
                    email: invitation.email,
                    name: 'Candidat', // Placeholder
                    password: passwordStored,
                    role: 'CANDIDATE',
                    organizationId: invitation.organizationId,
                    lastActivityDate: new Date()
                },
                include: { organization: true }
            });
        }

        // 4. Delete invitation
        await this.prisma.invitation.delete({ where: { token } });

        // 5. Generate Login Payload
        const payload = {
            email: finalUser.email,
            sub: finalUser.id,
            role: finalUser.role,
            organizationId: finalUser.organization?.id || null
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: finalUser.id,
                name: finalUser.name,
                email: finalUser.email,
                role: finalUser.role,
            },
            organization: finalUser.organization ? {
                id: finalUser.organization.id,
                name: finalUser.organization.name,
                availableCredits: finalUser.organization.creditsBalance ?? 0,
            } : null
        };
    }
}
