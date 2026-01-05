
import { Module } from '@nestjs/common';
import { CivicService } from './civic.service';
import { CivicController } from './civic.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';


@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [CivicController],
    providers: [CivicService],
    exports: [CivicService]
})
export class CivicModule { }
