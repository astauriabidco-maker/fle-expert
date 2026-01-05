import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, CommonModule, AuthModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
