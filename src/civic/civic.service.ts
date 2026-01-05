
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/services/email.service';


@Injectable()
export class CivicService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService
    ) { }


    async findAllModules() {
        return this.prisma.civicModule.findMany({
            include: {
                lessons: {
                    orderBy: { order: 'asc' }
                },
                questions: true
            },
            orderBy: { order: 'asc' }
        });
    }

    async findModuleById(id: string) {
        const module = await this.prisma.civicModule.findUnique({
            where: { id },
            include: {
                lessons: {
                    orderBy: { order: 'asc' }
                },
                questions: true
            }
        });
        if (!module) throw new NotFoundException('Module not found');
        return module;
    }

    async createModule(data: any) {
        return this.prisma.civicModule.create({
            data: {
                title: data.title,
                topic: data.topic,
                order: data.order || 0
            }
        });
    }

    async updateModule(id: string, data: any) {
        return this.prisma.civicModule.update({
            where: { id },
            data
        });
    }

    async deleteModule(id: string) {
        return this.prisma.civicModule.delete({ where: { id } });
    }

    // --- Lessons ---

    async addLesson(moduleId: string, data: any) {
        return this.prisma.civicLesson.create({
            data: {
                ...data,
                moduleId,
                keyPoints: data.keyPoints ? JSON.stringify(data.keyPoints) : null
            }
        });
    }

    async updateLesson(id: string, data: any) {
        return this.prisma.civicLesson.update({
            where: { id },
            data: {
                ...data,
                keyPoints: data.keyPoints ? JSON.stringify(data.keyPoints) : undefined
            }
        });
    }

    async deleteLesson(id: string) {
        return this.prisma.civicLesson.delete({ where: { id } });
    }

    // --- Questions ---

    async findAllOfficialQuestions() {
        return this.prisma.civicQuestion.findMany({
            where: { isOfficial: true }
        });
    }

    async addQuestion(data: any) {
        return this.prisma.civicQuestion.create({
            data: {
                ...data,
                options: JSON.stringify(data.options)
            }
        });
    }

    async updateQuestion(id: string, data: any) {
        return this.prisma.civicQuestion.update({
            where: { id },
            data: {
                ...data,
                options: data.options ? JSON.stringify(data.options) : undefined
            }
        });
    }

    async deleteQuestion(id: string) {
        return this.prisma.civicQuestion.delete({ where: { id } });
    }

    // --- Progress Tracking ---

    async trackProgress(userId: string, data: { moduleId: string, lessonId?: string, status: string, score?: number }) {
        return this.prisma.userCivicProgress.upsert({
            where: {
                userId_moduleId_lessonId: {
                    userId,
                    moduleId: data.moduleId,
                    lessonId: data.lessonId || ''
                }
            },
            update: {
                status: data.status,
                score: data.score
            },
            create: {
                userId,
                moduleId: data.moduleId,
                lessonId: data.lessonId || '',
                status: data.status,
                score: data.score
            }
        });
    }

    async getUserProgress(userId: string) {
        return this.prisma.userCivicProgress.findMany({
            where: { userId }
        });
    }

    async checkCivicReminders(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                objective: true,
                notifications: {
                    where: { type: 'civic' },
                    take: 1
                }
            } as any
        }) as any;

        if (user?.objective === 'NATURALIZATION') {
            const progress = await this.getUserProgress(userId);
            const totalModules = await this.prisma.civicModule.count();
            const completedModules = new Set(progress.filter(p => !p.lessonId && p.status === 'COMPLETED').map(p => p.moduleId)).size;

            if (completedModules < totalModules && (!user.notifications || user.notifications.length === 0)) {
                await this.notificationsService.createNotification(userId, {
                    title: 'Objectif Naturalisation 🇫🇷',
                    content: "N'oubliez pas de compléter votre parcours citoyen pour préparer votre entretien à la préfecture.",
                    type: 'civic',
                    link: '/dashboard'
                });

                await this.emailService.sendCivicReminder(user.email, user.name || 'Candidat');
            }
        }
    }

}
