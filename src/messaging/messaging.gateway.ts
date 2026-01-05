import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers = new Map<string, string>(); // userId -> socketId

    constructor(private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        const token = client.handshake.auth.token?.split(' ')[1];
        if (!token) {
            client.disconnect();
            return;
        }

        try {
            const payload = this.jwtService.verify(token);
            this.connectedUsers.set(payload.userId, client.id);
            console.log(`User connected: ${payload.userId}`);
        } catch (e) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        for (const [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === client.id) {
                this.connectedUsers.delete(userId);
                console.log(`User disconnected: ${userId}`);
                break;
            }
        }
    }

    sendToUser(userId: string, event: string, payload: any) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit(event, payload);
        }
    }

    @SubscribeMessage('typing')
    handleTyping(@MessageBody() data: { recipientId: string, isTyping: boolean }, @ConnectedSocket() client: Socket) {
        const senderId = [...this.connectedUsers.entries()].find(([_, sid]) => sid === client.id)?.[0];
        if (senderId) {
            this.sendToUser(data.recipientId, 'user_typing', { senderId, isTyping: data.isTyping });
        }
    }
}
