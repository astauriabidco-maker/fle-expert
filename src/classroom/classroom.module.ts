import { Module } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { ClassroomController } from './classroom.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [ClassroomController],
    providers: [ClassroomService, PrismaService],
    exports: [ClassroomService],
})
export class ClassroomModule { }
