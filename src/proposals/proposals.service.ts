import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { renderToBuffer } from '@react-pdf/renderer';
import * as React from 'react';
import DevisTemplate from './templates/DevisTemplate';
import TrainingPlanTemplate from './templates/TrainingPlanTemplate';

@Injectable()
export class ProposalsService {
    constructor(private prisma: PrismaService) { }

    private readonly HOURS_PER_LEVEL: Record<string, number> = {
        'A1': 0,
        'A2': 120,
        'B1': 180,
        'B2': 250,
        'C1': 300,
        'C2': 350
    };

    private readonly LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    calculateRequiredHours(fromLevel: string, toLevel: string): number {
        const fromIdx = this.LEVELS.indexOf(fromLevel || 'A1');
        const toIdx = this.LEVELS.indexOf(toLevel || 'B2');

        if (fromIdx >= toIdx) return 20; // Minimum refresher course

        let total = 0;
        for (let i = fromIdx + 1; i <= toIdx; i++) {
            total += this.HOURS_PER_LEVEL[this.LEVELS[i]];
        }
        return total;
    }

    async generateProposal(userId: string, targetLevel: string) {
        const user = await (this.prisma as any).user.findUnique({
            where: { id: userId },
            include: { organization: true, examSessions: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 1 } }
        });

        if (!user) throw new NotFoundException('User not found');

        const currentLevel = user.examSessions[0]?.estimatedLevel || user.currentLevel || 'A1';
        const hours = this.calculateRequiredHours(currentLevel, targetLevel);
        const hourlyRate = (user.organization as any).publicHourlyRate || 45.0; // Default rate
        const totalCost = hours * hourlyRate;

        const roadmap = [
            `Module Intensif : Passage de ${currentLevel} à ${targetLevel}`,
            `Préparation spécifique aux épreuves du TEF/TCF`,
            `Entraînement assisté par IA (FLE Expert)`,
            `Validation des acquis et examen blanc final`
        ];

        return (this.prisma as any).trainingProposal.create({
            data: {
                userId,
                organizationId: user.organizationId,
                baseLevel: currentLevel,
                targetLevel: targetLevel,
                estimatedHours: hours,
                hourlyRate: hourlyRate,
                totalCost: totalCost,
                planModules: JSON.stringify(roadmap),
                status: 'DRAFT'
            }
        });
    }

    async findByUser(userId: string) {
        return (this.prisma as any).trainingProposal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByOrg(orgId: string) {
        return (this.prisma as any).trainingProposal.findMany({
            where: { organizationId: orgId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return (this.prisma as any).trainingProposal.findUnique({
            where: { id },
            include: { user: true, organization: true }
        });
    }

    async delete(id: string) {
        return (this.prisma as any).trainingProposal.delete({ where: { id } });
    }

    async generateDevisPdf(id: string): Promise<Buffer> {
        const proposal = await (this.prisma as any).trainingProposal.findUnique({
            where: { id },
            include: { user: true, organization: true }
        });

        if (!proposal) throw new NotFoundException('Proposal not found');

        const element = React.createElement(DevisTemplate as any, {
            organization: proposal.organization,
            user: proposal.user,
            proposal
        });

        return await renderToBuffer(element as any);
    }

    async generatePlanPdf(id: string): Promise<Buffer> {
        const proposal = await (this.prisma as any).trainingProposal.findUnique({
            where: { id },
            include: { user: true, organization: true }
        });

        if (!proposal) throw new NotFoundException('Proposal not found');

        const element = React.createElement(TrainingPlanTemplate as any, {
            organization: proposal.organization,
            user: proposal.user,
            proposal
        });

        return await renderToBuffer(element as any);
    }
}
