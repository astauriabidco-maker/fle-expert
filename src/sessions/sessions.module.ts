import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CoachModule } from '../coach/coach.module';

@Module({
    imports: [PrismaModule, CoachModule],
    controllers: [SessionsController],
    providers: [SessionsService],
    exports: [SessionsService],
})
export class SessionsModule { }
