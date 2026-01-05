import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async createNotification(userId: string, data: { title: string; content: string; type?: string; link?: string }) {
        return this.prisma.notification.create({
            data: {
                userId,
                title: data.title,
                content: data.content,
                type: data.type || 'info',
                link: data.link
            }
        });
    }

    async getUserNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    }

    async markAsRead(notificationId: string) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, read: false }
        });
    }
}
