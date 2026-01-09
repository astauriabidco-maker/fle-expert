import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from '../coach/availability.service';

@Injectable()
export class SessionsService {
    constructor(
        private prisma: PrismaService,
        private availabilityService: AvailabilityService
    ) { }

    /**
     * Create a new course session (supports recurrence)
     */
    async createSession(coachId: string, data: {
        title: string;
        description?: string;
        classroomId?: string;
        scheduledDate: string;
        startTime: string;
        endTime: string;
        durationMinutes: number;
        type?: string;
        type?: string;
        weeks?: number; // For recurrence
        createdByRole?: string; // To bypass check if Admin
    }) {
        const coach = await this.prisma.user.findUnique({
            where: { id: coachId },
            select: { organizationId: true }
        });

        if (!coach?.organizationId) {
            throw new ForbiddenException('Coach must belong to an organization');
        }

        const type = data.type || 'COURSE';
        const sessionsToCreate = [];
        const weeks = data.weeks && data.weeks > 1 ? data.weeks : 1;
        const recurrenceId = weeks > 1 ? Math.random().toString(36).substring(2, 11) : null;

        const baseDate = new Date(data.scheduledDate);

        for (let i = 0; i < weeks; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + (i * 7));

            // RESTRICTIVE CHECK:
            // If the creator is a COACH, they must have availability.
            // Admins can override this.
            if (data.createdByRole === 'COACH') {
                const isAvailable = await this.availabilityService.isSlotAvailable(
                    coachId,
                    date,
                    data.startTime,
                    data.endTime
                );

                if (!isAvailable) {
                    throw new ForbiddenException(
                        `Creation refused for ${date.toISOString().split('T')[0]}: No availability slot found for ${data.startTime}-${data.endTime}. Please contact an administrator to update your planning.`
                    );
                }
            }

            sessionsToCreate.push({
                coachId,
                organizationId: coach.organizationId,
                title: data.title,
                description: data.description,
                classroomId: data.classroomId,
                scheduledDate: date,
                startTime: data.startTime,
                endTime: data.endTime,
                durationMinutes: data.durationMinutes,
                status: 'SCHEDULED',
                type,
                recurrenceId
            });
        }

        if (sessionsToCreate.length === 1) {
            return this.prisma.courseSession.create({
                data: sessionsToCreate[0]
            });
        }

        return this.prisma.courseSession.createMany({
            data: sessionsToCreate
        });
    }

    /**
     * Get sessions with filters (for coach or organization)
     */
    async getSessions(filters: {
        coachId?: string;
        organizationId?: string;
        status?: string;
        month?: number;
        year?: number
    }) {
        const where: any = {};

        if (filters.coachId) {
            where.coachId = filters.coachId;
        }

        if (filters.organizationId) {
            where.organizationId = filters.organizationId;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.month && filters.year) {
            const startDate = new Date(filters.year, filters.month - 1, 1);
            const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
            where.scheduledDate = { gte: startDate, lte: endDate };
        }

        return this.prisma.courseSession.findMany({
            where,
            include: {
                classroom: { select: { id: true, name: true, level: true } },
                coach: { select: { id: true, name: true, email: true } },
                attendances: {
                    include: { candidate: { select: { id: true, name: true, email: true } } }
                }
            },
            orderBy: { scheduledDate: 'desc' }
        });
    }

}

    /**
     * Check for conflicts before batch creation (Smart Planning)
     */
    async checkConflicts(data: {
    coachId: string;
    startDate: Date;
    endDate: Date;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    classroomId?: string;
}) {
    const conflicts: { date: Date, reason: string }[] = [];
    let totalSessionsAttempted = 0;

    const dateIterator = new Date(data.startDate);
    const end = new Date(data.endDate);

    // Normalize time
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (dateIterator <= end) {
        const dayIndex = dateIterator.getDay();
        if (data.daysOfWeek.includes(dayIndex)) {
            totalSessionsAttempted++;
            const checkDate = new Date(dateIterator);
            checkDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(checkDate);
            nextDate.setDate(nextDate.getDate() + 1);

            // Check DATABASE for overlaps on this specific day
            const existing = await this.prisma.courseSession.findMany({
                where: {
                    scheduledDate: { gte: checkDate, lt: nextDate },
                    status: { not: 'CANCELLED' },
                    OR: [
                        { coachId: data.coachId }, // Coach is busy
                        data.classroomId ? { classroomId: data.classroomId } : {} // Room is busy
                    ]
                },
                select: {
                    id: true, startTime: true, endTime: true, coachId: true, classroomId: true, title: true
                }
            });

            // Filter time overlaps
            const overlapping = existing.find(s => {
                const [sStartH, sStartM] = s.startTime.split(':').map(Number);
                const [sEndH, sEndM] = s.endTime.split(':').map(Number);
                const sStartMin = sStartH * 60 + sStartM;
                const sEndMin = sEndH * 60 + sEndM;

                return (startMinutes < sEndMin && endMinutes > sStartMin);
            });

            if (overlapping) {
                let reason = '';
                if (overlapping.coachId === data.coachId) reason = `Coach déjà occupé (${overlapping.title})`;
                else if (overlapping.classroomId === data.classroomId) reason = `Salle occupée (${overlapping.title})`;

                conflicts.push({ date: new Date(checkDate), reason });
            }
        }
        dateIterator.setDate(dateIterator.getDate() + 1);
    }

    return {
        total: totalSessionsAttempted,
        conflicts
    };
}

    /**
     * Get sessions for a coach (Legacy helper)
     */
    async getCoachSessions(coachId: string, filters ?: { status?: string; month?: number; year?: number }) {
    return this.getSessions({ coachId, ...filters });
}

    /**
     * Get a single session with attendees
     */
    async getSession(sessionId: string, coachId ?: string) {
    const where: any = { id: sessionId };
    if (coachId) {
        where.coachId = coachId;
    }

    const session = await this.prisma.courseSession.findFirst({
        where,
        include: {
            classroom: { select: { id: true, name: true, level: true } },
            coach: { select: { id: true, name: true, email: true } },
            attendances: {
                include: { candidate: { select: { id: true, name: true, email: true } } }
            }
        }
    });

    if (!session) {
        throw new NotFoundException('Session not found');
    }

    return session;
}

    /**
     * Open a session for attendance
     */
    async openSession(sessionId: string, coachId: string, isAdmin = false) {
    const where: any = { id: sessionId };
    if (!isAdmin) {
        where.coachId = coachId;
    }

    const session = await this.prisma.courseSession.findFirst({
        where
    });

    if (!session) {
        throw new NotFoundException('Session not found or access denied');
    }

    if (session.status !== 'SCHEDULED') {
        throw new BadRequestException(`Cannot open a session with status: ${session.status}`);
    }

    return this.prisma.courseSession.update({
        where: { id: sessionId },
        data: {
            status: 'OPEN',
            openedAt: new Date()
        }
    });
}

    /**
     * Close a session
     */
    async closeSession(sessionId: string, coachId: string, isAdmin = false) {
    const where: any = { id: sessionId };
    if (!isAdmin) {
        where.coachId = coachId;
    }

    const session = await this.prisma.courseSession.findFirst({
        where
    });

    if (!session) {
        throw new NotFoundException('Session not found or access denied');
    }

    if (session.status !== 'OPEN') {
        throw new BadRequestException(`Cannot close a session with status: ${session.status}`);
    }

    return this.prisma.courseSession.update({
        where: { id: sessionId },
        data: {
            status: 'COMPLETED',
            closedAt: new Date()
        }
    });
}

    /**
     * Cancel a session
     */
    async cancelSession(sessionId: string, coachId: string, isAdmin = false) {
    const where: any = { id: sessionId };
    if (!isAdmin) {
        where.coachId = coachId;
    }

    const session = await this.prisma.courseSession.findFirst({
        where
    });

    if (!session) {
        throw new NotFoundException('Session not found or access denied');
    }

    if (session.status === 'COMPLETED') {
        throw new BadRequestException('Cannot cancel a completed session');
    }

    return this.prisma.courseSession.update({
        where: { id: sessionId },
        data: { status: 'CANCELLED' }
    });
}

    /**
     * Candidate signs attendance
     */
    async signAttendance(sessionId: string, candidateId: string, signatureData ?: string) {
    const session = await this.prisma.courseSession.findUnique({
        where: { id: sessionId }
    });

    if (!session) {
        throw new NotFoundException('Session not found');
    }

    if (session.status !== 'OPEN') {
        throw new BadRequestException('Session is not open for attendance');
    }

    // Check if already signed
    const existing = await this.prisma.attendance.findUnique({
        where: { sessionId_candidateId: { sessionId, candidateId } }
    });

    if (existing) {
        throw new BadRequestException('Already signed for this session');
    }

    return this.prisma.attendance.create({
        data: {
            sessionId,
            candidateId,
            signatureData: signatureData || 'PRESENT'
        }
    });
}

    /**
     * Get attendees for a session
     */
    async getSessionAttendees(sessionId: string) {
    return this.prisma.attendance.findMany({
        where: { sessionId },
        include: {
            candidate: { select: { id: true, name: true, email: true } }
        },
        orderBy: { signedAt: 'asc' }
    });
}

    /**
     * Get open sessions for a candidate's organization (for attendance)
     */
    async getOpenSessionsForCandidate(candidateId: string) {
    const candidate = await this.prisma.user.findUnique({
        where: { id: candidateId },
        select: { organizationId: true, classroomId: true }
    });

    if (!candidate?.organizationId) {
        return [];
    }

    const where: any = {
        organizationId: candidate.organizationId,
        status: 'OPEN'
    };

    // Optionally filter by classroom if candidate is assigned to one
    if (candidate.classroomId) {
        where.classroomId = candidate.classroomId;
    }

    return this.prisma.courseSession.findMany({
        where,
        include: {
            coach: { select: { id: true, name: true } },
            classroom: { select: { id: true, name: true } }
        },
        orderBy: { scheduledDate: 'desc' }
    });
}

    async getCoachHoursForPeriod(coachId: string, startDate: Date, endDate: Date) {
    const sessions = await this.prisma.courseSession.findMany({
        where: {
            coachId,
            status: 'COMPLETED',
            type: { in: ['COURSE', 'MOCK_EXAM'] },
            closedAt: { gte: startDate, lte: endDate }
        },
        select: { durationMinutes: true }
    });

    const totalMinutes = sessions.reduce((sum: number, s: any) => sum + s.durationMinutes, 0);
    return {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        sessionsCount: sessions.length
    };
}
}
