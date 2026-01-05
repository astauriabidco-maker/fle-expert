import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { ExamModule } from '../exam/exam.module';

@Module({
    imports: [ExamModule],
    controllers: [LearningController],
    providers: [LearningService],
})
export class LearningModule { }
