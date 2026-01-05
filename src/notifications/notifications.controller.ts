import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getMyNotifications(@Request() req: any) {
        return this.notificationsService.getUserNotifications(req.user.id);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req: any) {
        return this.notificationsService.getUnreadCount(req.user.id);
    }

    @Patch(':id/read')
    async markRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}
