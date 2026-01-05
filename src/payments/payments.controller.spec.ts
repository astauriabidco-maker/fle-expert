import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PaymentsController', () => {
    let controller: PaymentsController;
    let stripeService: StripeService;

    const mockStripeService = {
        createCheckoutSession: jest.fn(),
        constructEvent: jest.fn(),
    };

    const mockPrismaService = {
        creditTransaction: {
            findMany: jest.fn(),
            create: jest.fn(),
        },
        organization: {
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentsController],
            providers: [
                { provide: StripeService, useValue: mockStripeService },
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<PaymentsController>(PaymentsController);
        stripeService = module.get<StripeService>(StripeService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getPaymentHistory', () => {
        it('should return transaction history for an organization', async () => {
            const mockHistory = [
                { id: '1', amount: 1000, type: 'RECHARGE', createdAt: new Date() },
            ];
            (mockPrismaService.creditTransaction.findMany as jest.Mock).mockResolvedValue(mockHistory);

            const result = await controller.getPaymentHistory({ orgId: 'org1' });

            expect(result).toEqual(mockHistory);
            expect(mockPrismaService.creditTransaction.findMany).toHaveBeenCalledWith({
                where: { organizationId: 'org1' },
                orderBy: { createdAt: 'desc' },
            });
        });
    });
});
