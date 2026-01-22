
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async createLead(data: { candidateId: string; organizationId: string; matchingScore?: number }) {
        return this.prisma.lead.create({
            data: {
                candidateId: data.candidateId,
                organizationId: data.organizationId,
                matchingScore: data.matchingScore,
                status: 'PENDING',
            },
        });
    }
}
