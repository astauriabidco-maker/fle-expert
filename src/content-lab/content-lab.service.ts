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
        count: number = 5,
        sector: string = 'Général'
    ) {
        this.logger.log(`Generating ${count} questions for org ${orgId}, topic: ${topic}, level: ${level}, sector: ${sector}`);

        try {
            // Generate questions using AI
            const generatedQuestions = await this.aiService.generateQuestions(topic, level, count, sector);

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
                            isActive: false // Draft by default for review
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

    async getQuestions(orgId: string | null, filters: { level?: string, topic?: string, search?: string }) {
        const where: any = {};
        if (orgId) where.organizationId = orgId;

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
            orderBy: { createdAt: 'desc' },
            include: { organization: { select: { name: true } } } // Include org name for moderation
        });
    }

    async getQuestion(id: string, orgId: string | null) {
        const where: any = { id };
        if (orgId) where.organizationId = orgId;

        const question = await this.prisma.question.findFirst({
            where
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

    async updateQuestion(id: string, orgId: string | null, data: any) {
        // Verify ownership if orgId is provided
        await this.getQuestion(id, orgId);

        return this.prisma.question.update({
            where: { id },
            data
        });
    }

    async deleteQuestion(id: string, orgId: string | null) {
        // Verify ownership if orgId is provided
        await this.getQuestion(id, orgId);

        return this.prisma.question.delete({
            where: { id }
        });
    }

    // ========== TOPIC MANAGEMENT ==========
    async getTopics() {
        return this.prisma.topic.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }

    async createTopic(name: string) {
        return this.prisma.topic.create({
            data: { name }
        });
    }

    async deleteTopic(id: string) {
        return this.prisma.topic.delete({
            where: { id }
        });
    }

    // ========== SECTOR MANAGEMENT ==========
    async getSectors() {
        return this.prisma.sector.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }

    async createSector(name: string) {
        return this.prisma.sector.create({
            data: { name }
        });
    }

    async deleteSector(id: string) {
        return this.prisma.sector.delete({
            where: { id }
        });
    }
}

