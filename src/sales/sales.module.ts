import { Module, forwardRef } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
    imports: [PrismaModule, CommonModule, forwardRef(() => OnboardingModule)],
    controllers: [SalesController],
    providers: [SalesService],
})
export class SalesModule { }
