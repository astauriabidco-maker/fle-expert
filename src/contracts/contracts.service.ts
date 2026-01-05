import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    async create(createContractDto: CreateContractDto) {
        return this.prisma.contract.create({
            data: {
                startDate: new Date(createContractDto.startDate),
                endDate: createContractDto.endDate ? new Date(createContractDto.endDate) : null,
                hourlyRate: createContractDto.hourlyRate,
                totalHours: createContractDto.totalHours,
                formateurId: createContractDto.formateurId,
                organizationId: createContractDto.organizationId,
                status: 'ACTIVE',
            },
        });
    }

    async findAll(organizationId?: string) {
        const where = organizationId ? { organizationId } : {};
        return this.prisma.contract.findMany({
            where,
            include: {
                formateur: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.contract.findUnique({
            where: { id },
            include: {
                formateur: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async update(id: string, updateContractDto: UpdateContractDto) {
        const data: any = { ...updateContractDto };
        if (updateContractDto.startDate) data.startDate = new Date(updateContractDto.startDate);
        if (updateContractDto.endDate) data.endDate = new Date(updateContractDto.endDate);

        return this.prisma.contract.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.contract.delete({
            where: { id },
        });
    }

    async findByFormateur(userId: string) {
        return this.prisma.contract.findMany({
            where: { formateurId: userId },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
}
