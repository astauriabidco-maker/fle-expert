import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    @Get('verify/:token')
    async verifyToken(@Param('token') token: string) {
        return this.onboardingService.verifyToken(token);
    }

    @Post('activate')
    async activateAccount(@Body() body: { token: string, password: string }) {
        return this.onboardingService.activateAccount(body.token, body.password);
    }
}
