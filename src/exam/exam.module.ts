import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CertificateModule } from '../certificate/certificate.module';
import { CreditsModule } from '../credits/credits.module';
import { ExamService } from './exam.service';

import { AdaptiveSequencerService } from './adaptive-sequencer.service';

@Module({
    imports: [PrismaModule, CommonModule, CertificateModule, CreditsModule],
    controllers: [ExamController],
    providers: [ExamService, AdaptiveSequencerService],
    exports: [ExamService, AdaptiveSequencerService],
})
export class ExamModule { }
