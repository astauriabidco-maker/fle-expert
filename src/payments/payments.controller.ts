import { Controller, Post, Body, Headers, BadRequestException, Res, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('create-session')
    @UseGuards(JwtAuthGuard) // Protect this endpoint
    async createSession(@Body() body: { packId: string, orgId: string }) {
        if (!body.packId || !body.orgId) {
            throw new BadRequestException('Missing packId or orgId');
        }
        const session = await this.stripeService.createCheckoutSession(body.orgId, body.packId);
        return { url: session.url };
    }

    @Post('webhook')
    async handleStripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new BadRequestException('Raw body not found');
        }

        let event;
        try {
            event = this.stripeService.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
        } catch (err) {
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            const { organizationId, creditsToUpdate } = session.metadata;

            if (organizationId && creditsToUpdate) {
                // Update balance
                await this.prisma.organization.update({
                    where: { id: organizationId },
                    data: {
                        creditsBalance: { increment: parseInt(creditsToUpdate) }
                    },
                });

                // Record transaction
                await this.prisma.creditTransaction.create({
                    data: {
                        organizationId,
                        amount: parseInt(creditsToUpdate),
                        type: 'RECHARGE' as any,
                    }
                });
                console.log(`Credited ${creditsToUpdate} to ${organizationId}`);
            }
        }

        return { received: true };
    }
}
