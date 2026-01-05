import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../common/services/ai.service';

@Injectable()
export class ContentLabService {
    private readonly logger = new Logger(ContentLabService.name);

    constructor(
        private prisma: PrismaService,
        private aiService: AiService
    ) { }

    async generateAndSaveQuestions(
        orgId: string,
        topic: string,
        level: string,
        count: number = 5
    ) {
        this.logger.log(`Generating ${count} questions for org ${orgId}, topic: ${topic}, level: ${level}`);

        try {
            // Generate questions using AI
            const generatedQuestions = await this.aiService.generateQuestions(topic, level, count);

            // Save each question to the database
            const savedQuestions = await Promise.all(
                generatedQuestions.map(async (q) => {
                    return this.prisma.question.create({
                        data: {
                            organizationId: orgId,
                            level,
                            topic,
                            questionText: q.questionText,
                            content: q.questionText,
                            options: JSON.stringify(q.options),
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            isActive: true
                        }
                    });
                })
            );

            this.logger.log(`Successfully generated and saved ${savedQuestions.length} questions`);

            return {
                success: true,
                message: `${savedQuestions.length} questions générées avec succès`,
                count: savedQuestions.length,
                questions: savedQuestions
            };
        } catch (error) {
            this.logger.error('Failed to generate questions:', error);
            throw error;
        }
    }

    async getQuestions(orgId: string, filters: { level?: string, topic?: string, search?: string }) {
        const where: any = { organizationId: orgId };

        if (filters.level) where.level = filters.level;
        if (filters.topic) where.topic = filters.topic;
        if (filters.search) {
            where.OR = [
                { questionText: { contains: filters.search, mode: 'insensitive' } },
                { content: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        return this.prisma.question.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    async getQuestion(id: string, orgId: string) {
        const question = await this.prisma.question.findFirst({
            where: { id, organizationId: orgId }
        });
        if (!question) throw new NotFoundException('Question non trouvée');
        return question;
    }

    async createQuestion(orgId: string, data: any) {
        return this.prisma.question.create({
            data: {
                ...data,
                organizationId: orgId
            }
        });
    }

    async updateQuestion(id: string, orgId: string, data: any) {
        // Verify ownership
        await this.getQuestion(id, orgId);

        return this.prisma.question.update({
            where: { id },
            data
        });
    }

    async deleteQuestion(id: string, orgId: string) {
        // Verify ownership
        await this.getQuestion(id, orgId);

        return this.prisma.question.delete({
            where: { id }
        });
    }
}

