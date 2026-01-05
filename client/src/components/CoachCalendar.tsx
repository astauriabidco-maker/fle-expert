import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Video, BookOpen } from 'lucide-react';

interface CalendarEvent {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    type: 'session' | 'exam' | 'coaching' | 'available';
    title: string;
    studentName?: string;
    studentId?: string;
}

interface CoachCalendarProps {
    events?: CalendarEvent[];
    availabilities?: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isRecurring: boolean;
    }>;
    onEventClick?: (event: CalendarEvent) => void;
    onSlotClick?: (date: Date, time: string) => void;
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const CoachCalendar: React.FC<CoachCalendarProps> = ({
    events = [],
    availabilities = [],
    onEventClick,
    onSlotClick
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week'>('month');

    const { year, month } = useMemo(() => ({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth()
    }), [currentDate]);

    const daysInMonth = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const days: (Date | null)[] = [];

        // Add padding for days before the month starts
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Add all days in the month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    }, [year, month]);

    const getEventsForDate = (date: Date | null) => {
        if (!date) return [];
        return events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    const isAvailableDay = (date: Date | null) => {
        if (!date) return false;
        const dayOfWeek = date.getDay();
        return availabilities.some(a => a.dayOfWeek === dayOfWeek && a.isRecurring);
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === new Date().toDateString();
    };

    const navigateMonth = (delta: number) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'session': return 'bg-emerald-500';
            case 'exam': return 'bg-amber-500';
            case 'coaching': return 'bg-indigo-500';
            case 'available': return 'bg-teal-500/30';
            default: return 'bg-slate-500';
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'session': return <Video size={12} />;
            case 'exam': return <BookOpen size={12} />;
            case 'coaching': return <User size={12} />;
            default: return <Clock size={12} />;
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-400" />
                    </button>
                    <h3 className="text-lg font-bold text-white">
                        {MONTHS[month]} {year}
                    </h3>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-400" />
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                    >
                        Aujourd'hui
                    </button>
                    <div className="flex bg-slate-800 rounded-lg p-0.5">
                        <button
                            onClick={() => setView('month')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Mois
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            Semaine
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-2 border-b border-slate-800 flex gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-400">Session</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-slate-400">Examen</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span className="text-slate-400">Coaching</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500/50 border border-teal-500"></span>
                    <span className="text-slate-400">Disponible</span>
                </span>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((date, idx) => {
                        const dayEvents = getEventsForDate(date);
                        const available = isAvailableDay(date);
                        const today = isToday(date);

                        return (
                            <div
                                key={idx}
                                onClick={() => date && onSlotClick?.(date, '09:00')}
                                className={`
                                    min-h-[100px] p-2 rounded-xl border transition-all cursor-pointer
                                    ${date ? 'hover:border-indigo-500/50' : 'opacity-30'}
                                    ${today ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-800/30'}
                                    ${available && !today ? 'border-teal-500/30 bg-teal-500/5' : ''}
                                `}
                            >
                                {date && (
                                    <>
                                        <div className={`text-sm font-bold mb-1 ${today ? 'text-indigo-400' : 'text-slate-300'}`}>
                                            {date.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEventClick?.(event);
                                                    }}
                                                    className={`
                                                        ${getEventColor(event.type)} 
                                                        text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md 
                                                        flex items-center gap-1 truncate hover:opacity-80 transition-opacity
                                                    `}
                                                >
                                                    {getEventIcon(event.type)}
                                                    <span className="truncate">{event.title}</span>
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-slate-400 font-medium">
                                                    +{dayEvents.length - 3} autres
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CoachCalendar;
