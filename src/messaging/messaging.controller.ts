import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
    constructor(
        private readonly messagingService: MessagingService,
        private readonly messagingGateway: MessagingGateway
    ) { }

    @Get('conversations')
    async getConversations(@Req() req: any) {
        return this.messagingService.getConversations(req.user.id);
    }

    @Get('conversations/:recipientId')
    async getMessages(
        @Req() req: any,
        @Param('recipientId') recipientId: string
    ) {
        return this.messagingService.getMessages(req.user.id, recipientId);
    }

    @Post('send')
    async sendMessage(
        @Req() req: any,
        @Body() body: { recipientId: string; content: string; type?: string }
    ) {
        const message = await this.messagingService.sendMessage(
            req.user.id,
            body.recipientId,
            body.content,
            body.type || 'text'
        );

        // Emit real-time event
        this.messagingGateway.sendToUser(body.recipientId, 'new_message', {
            ...message,
            isFromMe: false // For the recipient
        });

        return message;
    }

    @Post('mark-read/:conversationId')
    async markAsRead(
        @Req() req: any,
        @Param('conversationId') conversationId: string
    ) {
        return this.messagingService.markAsRead(req.user.id, conversationId);
    }

    @Get('unread-count')
    async getUnreadCount(@Req() req: any) {
        return this.messagingService.getUnreadCount(req.user.id);
    }
}
