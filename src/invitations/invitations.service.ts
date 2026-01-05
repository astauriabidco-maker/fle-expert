import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class InvitationsService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService
    ) { }

    async createInvitation(email: string, organizationId: string) {
        // 0. Fetch Organization Name for personalization
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true }
        });

        if (!organization) {
            throw new NotFoundException("Organisation non trouvée");
        }

        // 1. Generate a secure unique token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

        // 2. Save invitation to database
        const invitation = await this.prisma.invitation.create({
            data: {
                email,
                token,
                organizationId,
                expiresAt,
            },
        });

        // 3. Generate the invitation link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${frontendUrl}/activate?token=${token}`;

        // 4. Send the professional email
        await this.emailService.sendStudentInvite(email, inviteLink, organization.name);

        console.log(`[INVITATION] Link generated and email sent to ${email}: ${inviteLink}`);

        return {
            success: true,
            message: "Invitation envoyée avec succès par email",
            inviteLink
        };
    }

    async verifyToken(token: string) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
            include: { organization: true },
        });

        if (!invitation) {
            throw new NotFoundException("Invitation non trouvée ou invalide");
        }

        if (new Date() > invitation.expiresAt) {
            throw new BadRequestException("Cette invitation a expiré");
        }

        return invitation;
    }

    async deleteInvitation(token: string) {
        await this.prisma.invitation.delete({
            where: { token },
        });
    }
}
