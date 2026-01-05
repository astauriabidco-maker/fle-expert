import { Module } from '@nestjs/common';
import { ContentLabController } from './content-lab.controller';
import { ContentLabService } from './content-lab.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [ContentLabController],
    providers: [ContentLabService],
    exports: [ContentLabService],
})
export class ContentLabModule { }

