import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, forwardRef(() => AuthModule)],
    controllers: [PaymentsController],
    providers: [StripeService],
})
export class PaymentsModule { }
