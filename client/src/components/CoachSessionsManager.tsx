import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Calendar, Clock, Plus, X, Users, Play, Square, CheckCircle2,
    ChevronLeft, ChevronRight, AlertCircle, Settings, List, LayoutGrid
} from 'lucide-react';
import CoachAvailabilityManager from './CoachAvailabilityManager';

const API_URL = '/api';

interface CourseSession {
    id: string;
    title: string;
    description?: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: 'SCHEDULED' | 'OPEN' | 'COMPLETED' | 'CANCELLED';
    type: 'COURSE' | 'MOCK_EXAM';
    recurrenceId?: string;
    openedAt?: string;
    closedAt?: string;
    coach?: { id: string; name: string; email: string };
    attendances?: { id: string; candidate: { id: string; name: string; email: string }; signedAt: string }[];
}

interface Props {
    onToast?: (type: 'success' | 'error', message: string) => void;
}

const CoachSessionsManager: React.FC<Props> = ({ onToast }) => {
    const { token, user } = useAuth();
    const [sessions, setSessions] = useState<CourseSession[]>([]);
    const [coaches, setCoaches] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<CourseSession | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('CALENDAR'); // Default to Calendar as requested (Agenda Hub)

    // Form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        durationMinutes: 120,
        type: 'COURSE',
        weeks: 1,
        coachId: user?.id || ''
    });

    const fetchSessions = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const month = currentMonth.getMonth() + 1;
            const year = currentMonth.getFullYear();
            const res = await fetch(`${API_URL}/sessions?month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSessions(await res.json());
            }
        } catch (e) {
            console.error('Error fetching sessions:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoaches = async () => {
        if (!token || (user?.role !== 'ADMIN' && user?.role !== 'ORG_ADMIN' && user?.role !== 'SUPER_ADMIN')) return;
        try {
            const res = await fetch(`${API_URL}/coach/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCoaches(await res.json());
            }
        } catch (e) {
            console.error('Error fetching coaches:', e);
        }
    };

    useEffect(() => {
        fetchSessions();
        if (user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') fetchCoaches();
    }, [token, user?.role, currentMonth]);

    // Calculate duration when times change
    useEffect(() => {
        if (form.startTime && form.endTime) {
            const [startH, startM] = form.startTime.split(':').map(Number);
            const [endH, endM] = form.endTime.split(':').map(Number);
            const duration = (endH * 60 + endM) - (startH * 60 + startM);
            if (duration > 0) {
                setForm(f => ({ ...f, durationMinutes: duration }));
            }
        }
    }, [form.startTime, form.endTime]);

    const handleCreateSession = async () => {
        if (!token || !form.title) return;
        try {
            const res = await fetch(`${API_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                onToast?.('success', 'Session(s) créée(s) !');
                setIsCreateModalOpen(false);
                setForm({
                    title: '', description: '',
                    scheduledDate: new Date().toISOString().split('T')[0],
                    startTime: '09:00', endTime: '11:00',
                    durationMinutes: 120, type: 'COURSE', weeks: 1,
                    coachId: user?.id || ''
                });
                fetchSessions();
            } else {
                onToast?.('error', 'Erreur lors de la création');
            }
        } catch (e) {
            onToast?.('error', 'Erreur réseau');
        }
    };

    const handleOpenSession = async (sessionId: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/sessions/${sessionId}/open`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onToast?.('success', 'Session ouverte ! Les candidats peuvent émarger.');
                fetchSessions();
            } else {
                const err = await res.json();
                onToast?.('error', err.message || 'Erreur');
            }
        } catch (e) {
            onToast?.('error', 'Erreur réseau');
        }
    };

    const handleCloseSession = async (sessionId: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/sessions/${sessionId}/close`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                onToast?.('success', 'Session clôturée.');
                fetchSessions();
            } else {
                const err = await res.json();
                onToast?.('error', err.message || 'Erreur');
            }
        } catch (e) {
            onToast?.('error', 'Erreur réseau');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'OPEN': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse';
            case 'COMPLETED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'Planifiée';
            case 'OPEN': return '🔴 En cours';
            case 'COMPLETED': return 'Terminée';
            case 'CANCELLED': return 'Annulée';
            default: return status;
        }
    };

    // Calculate monthly stats
    const monthSessions = sessions.filter(s => {
        const d = new Date(s.scheduledDate);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });
    const completedHours = monthSessions
        .filter(s => s.status === 'COMPLETED')
        .reduce((sum, s) => sum + s.durationMinutes, 0) / 60;

    if (loading) {
        return <div className="text-center py-12 text-slate-400">Chargement des sessions...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-emerald-400" size={24} />
                        {user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'Planning des Sessions' : 'Mes Sessions de Cours'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
                            ? 'Consultez et gérez toutes les sessions de votre organisation'
                            : 'Gérez vos sessions et l\'émargement des candidats'}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2"
                >
                    <Plus size={18} /> Planifier une Session
                </button>
                {(user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <button
                        onClick={() => {
                            if (!form.coachId || form.coachId === user?.id) {
                                // If no specific coach filtered but we are admin, default to first list or error
                                // But form.coachId is part of create form state, not filter state... 
                                // We need a way to know WHICH coach we are managing.
                                // Currently the filter in create form (form.coachId) might be the only place.
                                // Or we assume the admin wants to manage the coach currently selected in UI?
                                // Actually, there is no global coach filter in the UI yet, only in the Create Modal.
                                // Let's use the 'form.coachId' as the "Selected Coach" for now or prompt to select.
                                if (!form.coachId) {
                                    onToast?.('error', 'Veuillez sélectionner un formateur dans la création pour gérer son planning (ou ajoutez un filtre global).');
                                    // Hacky interaction. Better to have a dedicated selector for "Manage Planning".
                                    // Let's just open it and if no coachId set, default to user.id or first coach.
                                }
                                setIsAvailabilityModalOpen(true);
                            } else {
                                setIsAvailabilityModalOpen(true);
                            }
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2"
                    >
                        <Settings size={18} /> Gérer Disponibilités
                    </button>
                )}
            </div>




            {/* View Toggle & Stats */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="bg-slate-800/50 p-1 rounded-xl flex gap-1 border border-slate-700">
                        <button
                            onClick={() => setViewMode('CALENDAR')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'CALENDAR' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <LayoutGrid size={16} /> Agenda
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <List size={16} /> Liste
                        </button>
                    </div>

                    {/* Only show stats in List mode or always? Maybe always useful */}
                </div>

                {viewMode === 'LIST' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="text-2xl font-black text-white">{monthSessions.length}</div>
                            <div className="text-xs text-slate-400 font-medium">Sessions ce mois</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="text-2xl font-black text-emerald-400">{completedHours.toFixed(1)}h</div>
                            <div className="text-xs text-slate-400 font-medium">Heures validées</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="text-2xl font-black text-blue-400">
                                {monthSessions.filter(s => s.status === 'SCHEDULED').length}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">À venir</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="text-2xl font-black text-amber-400">
                                {sessions.filter(s => s.status === 'OPEN').length}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">En cours</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {
                viewMode === 'CALENDAR' ? (
                    <div className="h-[800px] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                        <CoachAvailabilityManager
                            initialCoachId={form.coachId || user?.id || ''}
                            coaches={coaches}
                            isInline={true}
                            onSessionClick={async (sessionId) => {
                                // Find session in current list or fetch it
                                let session = sessions.find(s => s.id === sessionId);
                                if (!session) {
                                    // Fallback: try fetching singular session if not in list
                                    try {
                                        const res = await fetch(`${API_URL}/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } });
                                        if (res.ok) session = await res.json();
                                    } catch (e) {
                                        console.error("Session not found");
                                    }
                                }
                                if (session) {
                                    setSelectedSession(session);
                                } else {
                                    onToast?.('error', 'Session introuvable');
                                }
                            }}
                        />
                    </div>
                ) : (
                    /* Sessions List */
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-white">Sessions</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-slate-700 rounded-lg">
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-medium min-w-[120px] text-center">
                                    {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-slate-700 rounded-lg">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Aucune session planifiée</p>
                                <button onClick={() => setIsCreateModalOpen(true)} className="mt-4 text-emerald-400 hover:underline font-medium">
                                    Créer votre première session
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700">
                                {sessions.map(session => (
                                    <div key={session.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-white">{session.title}</h4>
                                                    {session.coach && (user?.role === 'ORG_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
                                                            Formateur: {session.coach.name}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${session.type === 'MOCK_EXAM' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                                                        {session.type === 'MOCK_EXAM' ? 'Examen Blanc' : 'Cours'}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(session.status)}`}>
                                                        {getStatusLabel(session.status)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(session.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {session.startTime} - {session.endTime}
                                                    </span>
                                                    <span className="text-emerald-400 font-medium">
                                                        {session.durationMinutes / 60}h
                                                    </span>
                                                    {session.attendances && session.attendances.length > 0 && (
                                                        <span className="flex items-center gap-1 text-blue-400">
                                                            <Users size={14} />
                                                            {session.attendances.length} émargés
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {session.status === 'SCHEDULED' && (
                                                    <button
                                                        onClick={() => handleOpenSession(session.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                                                    >
                                                        <Play size={16} /> Ouvrir
                                                    </button>
                                                )}
                                                {session.status === 'OPEN' && (
                                                    <>
                                                        <button
                                                            onClick={() => setSelectedSession(session)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                                                        >
                                                            <Users size={16} /> Émargements
                                                        </button>
                                                        <button
                                                            onClick={() => handleCloseSession(session.id)}
                                                            className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                                                        >
                                                            <Square size={16} /> Clôturer
                                                        </button>
                                                    </>
                                                )}
                                                {session.status === 'COMPLETED' && (
                                                    <button
                                                        onClick={() => setSelectedSession(session)}
                                                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={16} /> Détails
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* Create Session Modal */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 w-full max-w-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Nouvelle Session</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {(user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Formateur *</label>
                                        <select
                                            value={form.coachId}
                                            onChange={(e) => setForm(f => ({ ...f, coachId: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none text-white"
                                        >
                                            <option value={user.id}>Moi-même</option>
                                            {coaches.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Titre *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="Ex: Cours B1 - Grammaire"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Type de Session</label>
                                        <select
                                            value={form.type}
                                            onChange={(e) => setForm(f => ({ ...f, type: e.target.value as any }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none text-white"
                                        >
                                            <option value="COURSE">Cours</option>
                                            <option value="MOCK_EXAM">Examen Blanc</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Répéter (semaines)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="52"
                                            value={form.weeks}
                                            onChange={(e) => setForm(f => ({ ...f, weeks: parseInt(e.target.value) }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Détails de la session..."
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={form.scheduledDate}
                                            onChange={(e) => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Durée</label>
                                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-emerald-400 font-bold">
                                            {form.durationMinutes / 60}h ({form.durationMinutes} min)
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Heure début</label>
                                        <input
                                            type="time"
                                            value={form.startTime}
                                            onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Heure fin</label>
                                        <input
                                            type="time"
                                            value={form.endTime}
                                            onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 ring-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateSession}
                                    disabled={!form.title}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold"
                                >
                                    Créer la Session
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Session Details Modal */}
            {
                selectedSession && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1E293B] rounded-2xl border border-slate-700 w-full max-w-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{selectedSession.title}</h3>
                                <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span>{new Date(selectedSession.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                    <span>{selectedSession.startTime} - {selectedSession.endTime}</span>
                                    <span className={`px-2 py-0.5 rounded-full border text-xs ${getStatusColor(selectedSession.status)}`}>
                                        {getStatusLabel(selectedSession.status)}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                        <Users size={18} /> Émargements ({selectedSession.attendances?.length || 0})
                                    </h4>
                                    {selectedSession.attendances && selectedSession.attendances.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedSession.attendances.map(a => (
                                                <div key={a.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                                                    <div>
                                                        <div className="font-medium text-white">{a.candidate.name}</div>
                                                        <div className="text-xs text-slate-400">{a.candidate.email}</div>
                                                    </div>
                                                    <div className="text-xs text-emerald-400">
                                                        <CheckCircle2 size={14} className="inline mr-1" />
                                                        {new Date(a.signedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-500">
                                            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                            Aucun émargement
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSession(null)}
                                className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )
            }
            {
                isAvailabilityModalOpen && (user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <CoachAvailabilityManager
                        initialCoachId={form.coachId || user.id} // Default selection
                        coaches={coaches.length > 0 ? coaches : [{ id: user.id, name: user.name || 'Moi' }]} // Ensure at least self is there
                        onClose={() => setIsAvailabilityModalOpen(false)}
                        onToast={onToast}
                    />
                )
            }
        </div>
    );
};

export default CoachSessionsManager;
