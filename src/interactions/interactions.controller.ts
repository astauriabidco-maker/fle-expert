import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import type { CreateInteractionDto } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SALES', 'ORG_ADMIN', 'SUPER_ADMIN')
export class InteractionsController {
    constructor(private readonly interactionsService: InteractionsService) { }

    @Get(':candidateId')
    async getInteractions(@Param('candidateId') candidateId: string) {
        return this.interactionsService.getInteractions(candidateId);
    }

    @Post()
    async createInteraction(@Request() req: any, @Body() body: CreateInteractionDto) {
        return this.interactionsService.createInteraction(req.user.id, body);
    }

    @Delete(':id')
    async deleteInteraction(@Request() req: any, @Param('id') interactionId: string) {
        return this.interactionsService.deleteInteraction(req.user.id, interactionId);
    }
}
