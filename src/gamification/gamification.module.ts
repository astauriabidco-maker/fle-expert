import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GamificationController],
})
export class GamificationModule { }
