import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTaskDto {
    candidateId?: string;
    type: string; // CALL, EMAIL, QUOTE, FOLLOW_UP
    title: string;
    description?: string;
    dueDate: string; // ISO date string
}

export interface UpdateTaskDto {
    type?: string;
    title?: string;
    description?: string;
    dueDate?: string;
}

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async getTasks(userId: string, filters?: { completed?: boolean; candidateId?: string }) {
        return this.prisma.task.findMany({
            where: {
                userId,
                ...(filters?.completed !== undefined && { completed: filters.completed }),
                ...(filters?.candidateId && { candidateId: filters.candidateId }),
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: [
                { completed: 'asc' },
                { dueDate: 'asc' },
            ]
        });
    }

    async getTasksDueToday(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.prisma.task.findMany({
            where: {
                userId,
                completed: false,
                dueDate: {
                    gte: today,
                    lt: tomorrow,
                }
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });
    }

    async createTask(userId: string, data: CreateTaskDto) {
        return this.prisma.task.create({
            data: {
                userId,
                candidateId: data.candidateId,
                type: data.type,
                title: data.title,
                description: data.description,
                dueDate: new Date(data.dueDate),
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    }

    async updateTask(userId: string, taskId: string, data: UpdateTaskDto) {
        // Verify ownership
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, userId }
        });

        if (!task) {
            throw new NotFoundException("Tâche non trouvée");
        }

        return this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...(data.type && { type: data.type }),
                ...(data.title && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });
    }

    async completeTask(userId: string, taskId: string) {
        // Verify ownership
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, userId }
        });

        if (!task) {
            throw new NotFoundException("Tâche non trouvée");
        }

        return this.prisma.task.update({
            where: { id: taskId },
            data: {
                completed: true,
                completedAt: new Date(),
            }
        });
    }

    async deleteTask(userId: string, taskId: string) {
        // Verify ownership
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, userId }
        });

        if (!task) {
            throw new NotFoundException("Tâche non trouvée");
        }

        await this.prisma.task.delete({
            where: { id: taskId }
        });

        return { success: true };
    }
}
