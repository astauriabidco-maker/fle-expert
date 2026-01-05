import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
    constructor(private aiService: AIService) { }

    @Get('diagnostic')
    async getDiagnostic(@Req() req: any) {
        return this.aiService.getDiagnostic(req.user.id);
    }
}
