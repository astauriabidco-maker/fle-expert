import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Vérifie et déduit des crédits à une organisation
     * @param organizationId ID de l'organisation
     * @param amount Nombre de crédits à déduire (ex: 50 pour un examen blanc)
     */
    async consumeCredits(organizationId: string, amount: number) {
        // 1. Récupérer le solde actuel
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { creditsBalance: true, name: true }
        });

        if (!org) throw new BadRequestException("Organisation introuvable.");

        // 2. Vérifier si le solde est suffisant
        if (org.creditsBalance < amount) {
            throw new BadRequestException(`Crédits insuffisants pour ${org.name}. Solde actuel : ${org.creditsBalance}`);
        }

        // 3. Déduction atomique et création d'un historique de transaction
        return await this.prisma.$transaction(async (tx) => {
            const updatedOrg = await tx.organization.update({
                where: { id: organizationId },
                data: { creditsBalance: { decrement: amount } }
            });

            await tx.creditTransaction.create({
                data: {
                    organizationId: organizationId,
                    amount: -amount, // Valeur négative pour un débit
                    type: 'EXAM_CONSUMPTION',
                }
            });

            return updatedOrg;
        });
    }
}
