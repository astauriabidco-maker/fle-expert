import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(private readonly prisma: PrismaService) {
        // Ensure STRIPE_SECRET_KEY is available in .env
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            console.warn('STRIPE_SECRET_KEY is not defined');
        }

        this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
            apiVersion: '2025-01-27.acacia' as any, // Using latest or specific version
            typescript: true,
        });
    }

    async createCheckoutSession(organizationId: string, packId: string) {
        // 1. Define prices
        const packs = {
            'pack-starter': { amount: 10000, credits: 1000 }, // 100.00 €
            'pack-pro': { amount: 45000, credits: 5000 },    // 450.00 €
        };

        const selectedPack = (packs as any)[packId];
        if (!selectedPack) {
            throw new Error('Invalid pack ID');
        }

        // 2. Create Stripe session
        return await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: `Recharge : ${selectedPack.credits} crédits PrepTEF` },
                    unit_amount: selectedPack.amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?status=success`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?status=cancel`,
            metadata: { organizationId, creditsToUpdate: selectedPack.credits.toString() },
        });
    }

    // Initialize webhook event construction
    constructEvent(payload: Buffer, signature: string, secret: string) {
        return this.stripe.webhooks.constructEvent(payload, signature, secret);
    }
}
