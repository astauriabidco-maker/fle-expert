import { Module } from '@nestjs/common';
import { CertificateController } from './certificate.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificateService } from './certificate.service';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [CertificateController],
    providers: [CertificateService],
    exports: [CertificateService],
})
export class CertificateModule { }
