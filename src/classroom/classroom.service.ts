import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassroomService {
    constructor(private prisma: PrismaService) { }

    async createClassroom(organizationId: string, data: any) {
        return this.prisma.classroom.create({
            data: {
                ...data,
                organizationId,
            },
            include: {
                coach: true,
                _count: {
                    select: { students: true }
                }
            }
        });
    }

    async getClassrooms(organizationId: string) {
        return this.prisma.classroom.findMany({
            where: { organizationId },
            include: {
                coach: {
                    select: { id: true, name: true, email: true }
                },
                students: {
                    select: { id: true, name: true, currentLevel: true, email: true }
                },
                _count: {
                    select: { students: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async assignStudent(classroomId: string, studentId: string) {
        const classroom = await this.prisma.classroom.findUnique({
            where: { id: classroomId },
            include: {
                _count: { select: { students: true } }
            }
        });

        if (!classroom) throw new BadRequestException("Salle introuvable");
        if (classroom._count.students >= classroom.capacity) {
            throw new BadRequestException("Salle pleine");
        }

        return this.prisma.user.update({
            where: { id: studentId },
            data: { classroomId }
        });
    }

    async removeStudent(studentId: string) {
        return this.prisma.user.update({
            where: { id: studentId },
            data: { classroomId: null }
        });
    }

    // Auto-suggest logic
    async suggestClassroom(organizationId: string, level: string) {
        const classrooms = await this.prisma.classroom.findMany({
            where: {
                organizationId,
                level: level
            },
            include: {
                _count: { select: { students: true } }
            }
        });

        // Strategy: Return the first available classroom with capacity
        // Sort by most filled first to optimize fill-rate, or least filled to balance?
        // Let's balance: Sort by least filled but > 0, fallback to empty.

        // Simple strategy for now: First with space
        const available = classrooms.find(c => c._count.students < c.capacity);
        return available || null;
    }
}
