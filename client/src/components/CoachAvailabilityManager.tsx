import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar as CalendarIcon, User, ChevronLeft, ChevronRight, Briefcase, GraduationCap, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Slot {
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    date?: string;
    type?: 'AVAILABILITY' | 'SESSION';
    title?: string;
}

interface Coach {
    id: string;
    name: string;
}

interface Props {
    initialCoachId: string;
    coaches: Coach[];
    onClose?: () => void;
    onToast?: (type: 'success' | 'error', message: string) => void;
    onSessionClick?: (sessionId: string) => void;
    isInline?: boolean; // To adjust styling for inline use vs modal
}

interface Classroom {
    id: string;
    name: string;
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const CoachAvailabilityManager: React.FC<Props> = ({ initialCoachId, coaches, onClose, onToast, onSessionClick, isInline = false }) => {
    const { token, user } = useAuth();
    const [selectedCoachId, setSelectedCoachId] = useState(initialCoachId);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Mode: 'AVAILABILITY' (Free Slots) or 'SESSION' (Booked Courses)
    const [mode, setMode] = useState<'AVAILABILITY' | 'SESSION'>('AVAILABILITY');

    // Form
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [newStart, setNewStart] = useState('09:00');
    const [newEnd, setNewEnd] = useState('17:00');

    // Session Specific Form
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionType, setSessionType] = useState('COURSE'); // COURSE, MOCK_EXAM
    const [classroomId, setClassroomId] = useState('');
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    const [processing, setProcessing] = useState(false);

    // Conflict Awareness
    const [checkingConflicts, setCheckingConflicts] = useState(false);
    const [conflictStatus, setConflictStatus] = useState<{
        status: 'CLEAN' | 'WARNING' | 'ERROR';
        message: string;
        details?: { date: string, reason: string }[];
    } | null>(null);

    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);

        // Load classrooms
        fetchClassrooms();
    }, []);

    useEffect(() => {
        if (selectedCoachId) {
            fetchData();
        }
    }, [selectedCoachId, currentMonth]);

    // Auto-check conflicts when form drastically changes (debounce could be better but simplicity first)
    useEffect(() => {
        if (mode === 'SESSION' && startDate && endDate && selectedDays.length > 0 && selectedCoachId) {
            const timer = setTimeout(() => {
                checkPlanningConflicts();
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setConflictStatus(null);
        }
    }, [startDate, endDate, selectedDays, newStart, newEnd, classroomId, selectedCoachId, mode]);

    const fetchClassrooms = async () => {
        try {
            const res = await fetch('/api/classrooms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setClassrooms(await res.json());
        } catch (e) {
            console.error('Failed to load classrooms', e);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();

        try {
            // Fetch Availability
            const availRes = await fetch(`/api/coach/${selectedCoachId}/availability?month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const availData = availRes.ok ? await availRes.json() : [];
            const availabilitySlots = availData.map((s: any) => ({ ...s, type: 'AVAILABILITY' }));

            // Fetch Sessions
            // Default endpoint might need filtering by month/year if huge, assume lightweight for now or use the getSessions logic
            const sessRes = await fetch(`/api/sessions?coachId=${selectedCoachId}&month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sessData = sessRes.ok ? await sessRes.json() : [];
            const sessionSlots = sessData.map((s: any) => ({
                id: s.id,
                date: s.scheduledDate,
                startTime: s.startTime,
                endTime: s.endTime,
                isRecurring: false, // Sessions are always specific instances here
                type: 'SESSION',
                title: s.title
            }));

            setSlots([...availabilitySlots, ...sessionSlots]);

        } catch (e) {
            console.error('Error fetching data', e);
        } finally {
            setLoading(false);
        }
    };

    const checkPlanningConflicts = async () => {
        setCheckingConflicts(true);
        try {
            const res = await fetch('/api/sessions/check-conflicts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    daysOfWeek: selectedDays,
                    startTime: newStart,
                    endTime: newEnd,
                    classroomId: classroomId || undefined,
                    coachId: selectedCoachId
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conflicts.length > 0) {
                    setConflictStatus({
                        status: 'WARNING',
                        message: `${data.conflicts.length} conflit(s) détecté(s)`,
                        details: data.conflicts
                    });
                } else {
                    setConflictStatus({
                        status: 'CLEAN',
                        message: 'Aucun conflit détecté. Voie libre !'
                    });
                }
            }
        } catch (e) {
            console.error('Conflict check error', e);
        } finally {
            setCheckingConflicts(false);
        }
    };

    const handleApply = async () => {
        if (selectedDays.length === 0) return onToast?.('error', 'Sélectionnez au moins un jour');
        if (!startDate || !endDate) return onToast?.('error', 'Définissez la plage courante');

        // If conflicts exist, alert user (simple confirm for now)
        if (conflictStatus?.status === 'WARNING') {
            if (!confirm(`Attention : ${conflictStatus.message}. Voulez-vous vraiment planifier malgré les conflits ?`)) {
                return;
            }
        }

        setProcessing(true);
        try {
            let endpoint = '';
            let body: any = {
                startDate,
                endDate,
                daysOfWeek: selectedDays,
                startTime: newStart,
                endTime: newEnd,
                coachId: selectedCoachId // Explicitly pass coachId
            };

            if (mode === 'AVAILABILITY') {
                endpoint = `/api/coach/${selectedCoachId}/availability/range`;
            } else {
                endpoint = `/api/sessions/range`;
                body = {
                    ...body,
                    title: sessionTitle || (sessionType === 'MOCK_EXAM' ? 'Examen Blanc' : 'Cours'),
                    type: sessionType,
                    classroomId: classroomId || undefined
                };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onToast?.('success', mode === 'AVAILABILITY' ? 'Disponibilités ajoutées' : 'Sessions planifiées');
                setConflictStatus(null);
                fetchData();
            } else {
                const err = await res.json();
                onToast?.('error', err.message || 'Erreur');
            }
        } catch (e) {
            onToast?.('error', 'Erreur réseau');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (slot: Slot) => {
        if (!confirm('Supprimer cet élément ?')) return;
        try {
            const endpoint = slot.type === 'SESSION'
                ? `/api/sessions/${slot.id}/cancel`
                : `/api/coach/${selectedCoachId}/availability/${slot.id}`;

            const method = slot.type === 'SESSION' ? 'POST' : 'DELETE';
            const finalEndpoint = slot.type === 'SESSION' ? `/api/sessions/${slot.id}/cancel` : endpoint;

            const res = await fetch(finalEndpoint, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                onToast?.('success', 'Supprimé/Annulé');
                fetchData();
            }
        } catch (e) {
            onToast?.('error', 'Erreur');
        }
    };

    const toggleDaySelector = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            setSelectedDays(selectedDays.filter(d => d !== dayIndex));
        } else {
            setSelectedDays([...selectedDays, dayIndex]);
        }
    };

    const calendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
        return days;
    };

    const getSlotsForDate = (date: Date) => {
        return slots.filter(s => {
            if (s.type === 'SESSION' && (s as any).status === 'CANCELLED') return false;
            if (s.isRecurring) return s.dayOfWeek === date.getDay();
            if (s.date) {
                const sd = new Date(s.date);
                return sd.toDateString() === date.toDateString();
            }
            return false;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    return (
        <div className={isInline ? "flex flex-col h-full bg-[#1E293B] rounded-2xl border border-slate-700 w-full" : "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"}>
            <div className={isInline ? "flex flex-col h-full w-full" : "bg-[#1E293B] rounded-2xl border border-slate-700 w-full max-w-7xl flex flex-col max-h-[95vh] text-slate-200"}>
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400">
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Agenda & Planning Intelligent</h3>
                            <p className="text-slate-400 text-sm">Planification assistée avec détection de conflits</p>
                        </div>
                    </div>

                    {/* Coach Selector */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={selectedCoachId}
                                onChange={(e) => setSelectedCoachId(e.target.value)}
                                className="pl-10 pr-8 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 ring-purple-500 appearance-none"
                            >
                                {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <button onClick={onClose} className={`text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg ${!onClose && 'hidden'}`}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Controls */}
                    <div className="w-96 border-r border-slate-700 p-6 bg-slate-800/30 overflow-y-auto flex flex-col gap-6">
                        {/* Mode Switcher */}
                        <div className="bg-slate-900/50 p-1 rounded-xl flex">
                            <button
                                onClick={() => setMode('AVAILABILITY')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'AVAILABILITY' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Disponibilités
                            </button>
                            <button
                                onClick={() => setMode('SESSION')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'SESSION' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Planifier Séances
                            </button>
                        </div>

                        {/* Common: Date & Time */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Période</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs text-white" />
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs text-white" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Jours</label>
                                <div className="flex flex-wrap gap-1">
                                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => {
                                        const val = i === 6 ? 0 : i + 1;
                                        return (
                                            <button
                                                key={d}
                                                onClick={() => toggleDaySelector(val)}
                                                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${selectedDays.includes(val) ? (mode === 'SESSION' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white') : 'bg-slate-700/50 text-slate-400'}`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Début</label>
                                    <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Fin</label>
                                    <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Session Specifics */}
                        {mode === 'SESSION' && (
                            <div className="space-y-4 pt-4 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSessionType('COURSE')}
                                        className={`flex-1 p-2 rounded-lg border ${sessionType === 'COURSE' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-slate-700 text-slate-400'}`}
                                    >
                                        <Briefcase size={16} className="mx-auto mb-1" />
                                        <span className="text-[10px] uppercase font-bold block text-center">Cours</span>
                                    </button>
                                    <button
                                        onClick={() => setSessionType('MOCK_EXAM')}
                                        className={`flex-1 p-2 rounded-lg border ${sessionType === 'MOCK_EXAM' ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'border-slate-700 text-slate-400'}`}
                                    >
                                        <GraduationCap size={16} className="mx-auto mb-1" />
                                        <span className="text-[10px] uppercase font-bold block text-center">Examen Blanc</span>
                                    </button>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Titre de la séance</label>
                                    <input
                                        type="text"
                                        value={sessionTitle}
                                        onChange={e => setSessionTitle(e.target.value)}
                                        placeholder="Ex: Grammaire B1, Oral..."
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Salle de classe</label>
                                    <select
                                        value={classroomId}
                                        onChange={e => setClassroomId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm"
                                    >
                                        <option value="">-- Sans salle --</option>
                                        {classrooms.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Traffic Light Conflict Status */}
                        {mode === 'SESSION' && conflictStatus && (
                            <div className={`p-3 rounded-xl border ${conflictStatus.status === 'CLEAN' ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-orange-900/20 border-orange-500/30'
                                }`}>
                                <div className="flex items-start gap-3">
                                    {conflictStatus.status === 'CLEAN' ? (
                                        <CheckCircle className="text-emerald-400 shrink-0" size={18} />
                                    ) : (
                                        <AlertTriangle className="text-orange-400 shrink-0" size={18} />
                                    )}
                                    <div className="flex-1">
                                        <h5 className={`text-xs font-bold mb-1 ${conflictStatus.status === 'CLEAN' ? 'text-emerald-300' : 'text-orange-300'
                                            }`}>
                                            {conflictStatus.status === 'CLEAN' ? 'Analyse OK' : 'Conflits Détectés'}
                                        </h5>
                                        <p className="text-[10px] text-slate-400 leading-tight mb-2">
                                            {conflictStatus.message}
                                        </p>
                                        {conflictStatus.details && (
                                            <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                                {conflictStatus.details.slice(0, 3).map((d, i) => (
                                                    <li key={i} className="text-[10px] text-orange-200/70 border-l-2 border-orange-500/30 pl-2">
                                                        <span className="font-bold">{new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>: {d.reason}
                                                    </li>
                                                ))}
                                                {conflictStatus.details.length > 3 && (
                                                    <li className="text-[10px] text-orange-200/50 italic">
                                                        + {conflictStatus.details.length - 3} autres...
                                                    </li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleApply}
                            disabled={processing}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all ${processing ? 'opacity-50 cursor-not-allowed' :
                                mode === 'SESSION' ? (conflictStatus?.status === 'WARNING' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20')
                                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                                }`}
                        >
                            {processing ? 'Traitement...' : mode === 'SESSION' ? 'Planifier les Séances' : 'Ajouter Disponibilités'}
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 flex flex-col bg-[#0F172A]">
                        {/* Nav */}
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-lg font-bold text-white capitalize">
                                {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 border-b border-slate-800 text-center py-2 bg-slate-900/50">
                            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="text-xs font-bold text-slate-500 uppercase">{d}</div>)}
                        </div>

                        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
                            {calendarDays().map((date, idx) => {
                                if (!date) return <div key={idx} className="bg-slate-900/20 border-r border-b border-slate-800/50 min-h-[100px]" />;
                                const daySlots = getSlotsForDate(date);
                                const isToday = new Date().toDateString() === date.toDateString();

                                return (
                                    <div key={idx} className={`border-r border-b border-slate-800/50 p-2 min-h-[100px] flex flex-col ${isToday ? 'bg-purple-900/10' : ''}`}>
                                        <div className={`text-right text-xs font-bold mb-1 ${isToday ? 'text-purple-400' : 'text-slate-500'}`}>{date.getDate()}</div>
                                        <div className="flex-1 space-y-1 overflow-y-auto max-h-[120px]">
                                            {daySlots.map(slot => (
                                                <div
                                                    key={slot.id || Math.random()}
                                                    onClick={(e) => {
                                                        if (slot.type === 'SESSION' && slot.id && onSessionClick) {
                                                            e.stopPropagation();
                                                            onSessionClick(slot.id);
                                                        }
                                                    }}
                                                    className={`
                                                        border rounded px-1.5 py-1 text-[10px] flex justify-between items-center group cursor-pointer
                                                        ${slot.type === 'SESSION'
                                                            ? (slot as any).type === 'MOCK_EXAM' ? 'bg-orange-900/20 border-orange-500/30 text-orange-200' : 'bg-purple-900/20 border-purple-500/30 text-purple-200'
                                                            : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200'}
                                                    `}
                                                    title={slot.title || 'Disponibilité'}
                                                >
                                                    <div className="truncate flex-1">
                                                        <span className="font-bold mr-1">{slot.startTime}</span>
                                                        <span className="opacity-75">{slot.title}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(slot); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 ml-1"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachAvailabilityManager;
