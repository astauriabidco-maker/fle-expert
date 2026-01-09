import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { AvailabilityService } from './availability.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [CoachController],
    providers: [CoachService, AvailabilityService],
    exports: [CoachService, AvailabilityService]
})
export class CoachModule { }
