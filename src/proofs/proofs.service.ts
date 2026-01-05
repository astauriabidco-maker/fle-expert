import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProofsService {
    constructor(private prisma: PrismaService) { }

    async createProof(userId: string, organizationId: string, data: { title: string, type: string, description?: string, proofUrl?: string }) {
        return await this.prisma.offlineProof.create({
            data: {
                userId,
                organizationId,
                ...data,
                status: 'PENDING'
            }
        });
    }

    async findAllByOrg(organizationId: string, status?: string) {
        const where: any = { organizationId };
        if (status) where.status = status;

        return await this.prisma.offlineProof.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true, currentLevel: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findAllByUser(userId: string) {
        return await this.prisma.offlineProof.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async validateProof(proofId: string, data: { status: string, feedback?: string, xpAwarded?: number }) {
        const proof = await this.prisma.offlineProof.findUnique({ where: { id: proofId } });
        if (!proof) throw new NotFoundException("Preuve introuvable");

        const updated = await this.prisma.offlineProof.update({
            where: { id: proofId },
            data: {
                status: data.status,
                feedback: data.feedback,
                xpAwarded: data.xpAwarded || 0
            }
        });

        // If validated and XP > 0, award XP to user
        if (data.status === 'VALIDATED' && (data.xpAwarded || 0) > 0) {
            await this.prisma.user.update({
                where: { id: proof.userId },
                data: {
                    xp: { increment: data.xpAwarded }
                }
            });
        }

        return updated;
    }
}
