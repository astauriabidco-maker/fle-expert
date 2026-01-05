
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async createLead(data: { email: string; schoolName: string; contactName?: string; phone?: string }) {
        return this.prisma.lead.create({
            data: {
                ...data,
                status: 'NEW',
            },
        });
    }
}
