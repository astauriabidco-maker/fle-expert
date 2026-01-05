import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MessagingService', () => {
    let service: MessagingService;
    let prisma: PrismaService;

    const mockPrismaService = {
        message: {
            findMany: jest.fn(),
            create: jest.fn(),
            updateMany: jest.fn(),
            count: jest.fn(),
        },
        user: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagingService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<MessagingService>(MessagingService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendMessage', () => {
        it('should create and return a message', async () => {
            const mockMsg = {
                id: '1',
                content: 'Hello',
                type: 'text',
                createdAt: new Date(),
                senderId: 'user1',
                recipientId: 'user2',
            };
            (mockPrismaService.message.create as jest.Mock).mockResolvedValue(mockMsg);

            const result = await service.sendMessage('user1', 'user2', 'Hello', 'text');

            expect(result).toEqual({
                id: '1',
                content: 'Hello',
                type: 'text',
                createdAt: mockMsg.createdAt,
                isFromMe: true,
                read: false,
            });
            expect(mockPrismaService.message.create).toHaveBeenCalledWith({
                data: {
                    senderId: 'user1',
                    recipientId: 'user2',
                    content: 'Hello',
                    type: 'text',
                },
            });
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count for a user', async () => {
            (mockPrismaService.message.count as jest.Mock).mockResolvedValue(5);

            const result = await service.getUnreadCount('user1');

            expect(result).toEqual({ unreadCount: 5 });
            expect(mockPrismaService.message.count).toHaveBeenCalledWith({
                where: {
                    recipientId: 'user1',
                    read: false,
                },
            });
        });
    });
});
