import { Module } from '@nestjs/common';
import { ProofsService } from './proofs.service';
import { ProofsController } from './proofs.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [ProofsController],
    providers: [ProofsService],
    exports: [ProofsService]
})
export class ProofsModule { }
