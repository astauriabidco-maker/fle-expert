import { Module, forwardRef } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SalesModule } from '../sales/sales.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        CommonModule,
        forwardRef(() => SalesModule)
    ],
    controllers: [OnboardingController],
    providers: [OnboardingService],
    exports: [OnboardingService],
})
export class OnboardingModule { }
