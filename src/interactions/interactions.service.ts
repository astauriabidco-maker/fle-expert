import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateInteractionDto {
    candidateId: string;
    type: string; // CALL, EMAIL, MEETING, NOTE
    content?: string;
}

@Injectable()
export class InteractionsService {
    constructor(private prisma: PrismaService) { }

    async getInteractions(candidateId: string) {
        return this.prisma.interaction.findMany({
            where: { candidateId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createInteraction(userId: string, data: CreateInteractionDto) {
        return this.prisma.interaction.create({
            data: {
                userId,
                candidateId: data.candidateId,
                type: data.type,
                content: data.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    }

    async deleteInteraction(userId: string, interactionId: string) {
        // Verify ownership
        const interaction = await this.prisma.interaction.findFirst({
            where: { id: interactionId, userId }
        });

        if (!interaction) {
            throw new Error("Interaction non trouvée");
        }

        await this.prisma.interaction.delete({
            where: { id: interactionId }
        });

        return { success: true };
    }
}
