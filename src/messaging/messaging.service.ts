import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// In-memory storage for messages (would normally be in database)
// This is a simplified implementation - in production, add Message model to Prisma
interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    type: string;
    read: boolean;
    createdAt: Date;
}

@Injectable()
export class MessagingService {
    constructor(private prisma: PrismaService) { }

    async getConversations(userId: string) {
        // Find all messages related to this user
        const messages = await (this.prisma as any).message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { recipientId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        // Extract unique partner IDs
        const partnerIds = [...new Set(messages.flatMap((m: any) => [m.senderId, m.recipientId]))]
            .filter(id => id !== userId) as string[];

        // Get partner user details
        const partners = await this.prisma.user.findMany({
            where: { id: { in: partnerIds } },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                currentLevel: true,
            }
        });

        // Add last message and unread count to each conversation
        const conversationData = partners.map(partner => {
            const conversationMessages = messages.filter(
                (m: any) => (m.senderId === userId && m.recipientId === partner.id) ||
                    (m.senderId === partner.id && m.recipientId === userId)
            );

            const lastMessage = conversationMessages[0] as any;
            const unreadCount = conversationMessages.filter(
                (m: any) => m.recipientId === userId && !m.read
            ).length;

            return {
                ...partner,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isFromMe: lastMessage.senderId === userId
                } : null,
                unreadCount
            };
        });

        return conversationData.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            const bTime = (b.lastMessage as any)?.createdAt?.getTime() || 0;
            const aTime = (a.lastMessage as any)?.createdAt?.getTime() || 0;
            return bTime - aTime;
        });
    }

    async getMessages(userId: string, partnerId: string) {
        const messages = await (this.prisma as any).message.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: partnerId },
                    { senderId: partnerId, recipientId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        return messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            type: m.type,
            createdAt: m.createdAt,
            isFromMe: m.senderId === userId,
            read: m.read
        }));
    }

    async sendMessage(senderId: string, recipientId: string, content: string, type: string) {
        const message = await (this.prisma as any).message.create({
            data: {
                senderId,
                recipientId,
                content,
                type: type || 'text'
            }
        });

        return {
            id: message.id,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt,
            isFromMe: true,
            read: false
        };
    }

    async markAsRead(userId: string, partnerId: string) {
        await (this.prisma as any).message.updateMany({
            where: {
                senderId: partnerId,
                recipientId: userId,
                read: false
            },
            data: { read: true }
        });

        return { success: true };
    }

    async getUnreadCount(userId: string) {
        const count = await (this.prisma as any).message.count({
            where: {
                recipientId: userId,
                read: false
            }
        });

        return { unreadCount: count };
    }
}
