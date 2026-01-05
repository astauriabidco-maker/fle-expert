
import { Controller, Post, Body } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    async create(@Body() createLeadDto: { email: string; schoolName: string; contactName?: string; phone?: string }) {
        return this.leadsService.createLead(createLeadDto);
    }
}
