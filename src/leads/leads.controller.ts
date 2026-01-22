
import { Controller, Post, Body } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    async create(@Body() createLeadDto: { candidateId: string; organizationId: string; matchingScore?: number }) {
        return this.leadsService.createLead(createLeadDto);
    }
}
