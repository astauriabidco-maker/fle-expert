import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
    constructor(private prisma: PrismaService) { }

    async getCoachAvailability(coachId: string, startDate?: Date, endDate?: Date) {
        const where: any = { coachId };

        if (startDate && endDate) {
            where.OR = [
                { isRecurring: true }, // Always fetch recurring logic
                {
                    isRecurring: false,
                    date: { gte: startDate, lte: endDate }
                }
            ];
        }

        return this.prisma.coachAvailability.findMany({
            where,
            orderBy: [
                { isRecurring: 'desc' },
                { dayOfWeek: 'asc' },
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        });
    }

    async createAvailability(coachId: string, slots: { dayOfWeek: number, startTime: string, endTime: string, isRecurring?: boolean, date?: string }[]) {
        // Clear existing slots for clean update (simple approach for now)
        // Or we could implement a smarter delta update
        await this.prisma.coachAvailability.deleteMany({ where: { coachId } });

        return this.prisma.coachAvailability.createMany({
            data: slots.map(s => ({
                coachId,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                isRecurring: s.isRecurring ?? true,
                date: s.date ? new Date(s.date) : null
            }))
        });
    }

    async createAvailabilityRange(
        coachId: string,
        startDate: Date,
        endDate: Date,
        daysOfWeek: number[],
        startTime: string,
        endTime: string
    ) {
        const slots = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            if (daysOfWeek.includes(current.getDay())) {
                slots.push({
                    coachId,
                    dayOfWeek: current.getDay(),
                    startTime,
                    endTime,
                    isRecurring: false,
                    date: new Date(current)
                });
            }
            current.setDate(current.getDate() + 1);
        }

        return this.prisma.coachAvailability.createMany({
            data: slots
        });
    }

    async deleteSlot(slotId: string) {
        return this.prisma.coachAvailability.delete({
            where: { id: slotId }
        });
    }

    async isSlotAvailable(coachId: string, date: Date, startTime: string, endTime: string): Promise<boolean> {
        const dayOfWeek = date.getDay(); // 0-6
        // Normalize date to remove time for comparison if needed
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Fetch relevant slots: Recurring for this day of week OR Specific date
        const slots = await this.prisma.coachAvailability.findMany({
            where: {
                coachId,
                OR: [
                    { isRecurring: true, dayOfWeek },
                    { isRecurring: false, date: checkDate }
                ]
            }
        });

        if (slots.length === 0) return false;

        // Convert times to minutes for easier comparison
        const sessionStart = this.timeToMinutes(startTime);
        const sessionEnd = this.timeToMinutes(endTime);

        // Check if session fits COMPLETELY within ANY of the slots
        return slots.some(slot => {
            const slotStart = this.timeToMinutes(slot.startTime);
            const slotEnd = this.timeToMinutes(slot.endTime);
            return sessionStart >= slotStart && sessionEnd <= slotEnd;
        });
    }

    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
}
