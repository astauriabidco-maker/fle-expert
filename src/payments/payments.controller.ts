import { Controller, Post, Get, Param, Body, Headers, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import type { Request } from 'express';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
    ) { }

    @Post('create-session')
    @UseGuards(JwtAuthGuard)
    async createSession(@Body() body: { packId: string, orgId: string }) {
        if (!body.packId || !body.orgId) {
            throw new BadRequestException('Missing packId or orgId');
        }
        const session = await this.stripeService.createCheckoutSession(body.orgId, body.packId);
        return { url: session.url };
    }

    @Post('create-b2c-session')
    async createB2CSession() {
        const session = await this.stripeService.createB2CDiagnosticSession();
        return { url: session.url };
    }

    @Get('b2c-verify/:sessionId')
    async verifyB2CSession(@Param('sessionId') sessionId: string) {
        const session = await this.stripeService.getSession(sessionId);

        if (session.payment_status !== 'paid') {
            throw new BadRequestException('Payment not completed');
        }

        const email = session.customer_details?.email;
        if (!email) {
            throw new BadRequestException('No email found in session');
        }

        // The user might already be created by the webhook, let's find or create via authService
        const name = session.customer_details?.name || email.split('@')[0];
        const user = await this.authService.createB2CUser(email, name);

        // Map B2C user to login payload
        return this.authService.login(user);
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
            const metadata = session.metadata;

            if (metadata.type === 'B2C_DIAGNOSTIC') {
                const email = session.customer_details.email;
                const name = session.customer_details.name || email.split('@')[0];
                await this.authService.createB2CUser(email, name);
                console.log(`[B2C] Payment successful for ${email}, user created.`);
            } else if (metadata.organizationId && metadata.creditsToUpdate) {
                await this.prisma.organization.update({
                    where: { id: metadata.organizationId },
                    data: {
                        creditsBalance: { increment: parseInt(metadata.creditsToUpdate) }
                    },
                });

                await this.prisma.creditTransaction.create({
                    data: {
                        organizationId: metadata.organizationId,
                        amount: parseInt(metadata.creditsToUpdate),
                        type: 'RECHARGE' as any,
                    }
                });
                console.log(`Credited ${metadata.creditsToUpdate} to ${metadata.organizationId}`);
            }
        }

        return { received: true };
    }

    @Post('history')
    @UseGuards(JwtAuthGuard)
    async getPaymentHistory(@Body() body: { orgId: string }) {
        if (!body.orgId) {
            throw new BadRequestException('Missing orgId');
        }
        return this.prisma.creditTransaction.findMany({
            where: { organizationId: body.orgId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
