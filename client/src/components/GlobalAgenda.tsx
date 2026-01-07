import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, User, Store } from 'lucide-react';
import CoachCalendar from './CoachCalendar';

export default function GlobalAgenda() {
    const { token } = useAuth();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [coaches, setCoaches] = useState<any[]>([]);

    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [selectedCoachId, setSelectedCoachId] = useState('');

    const [events, setEvents] = useState<any[]>([]);
    const [availabilities, setAvailabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) return;
        // Fetch Organizations
        fetch('http://localhost:3333/admin/organizations', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setOrganizations(data));
    }, [token]);

    useEffect(() => {
        if (!token || !selectedOrgId) {
            setCoaches([]);
            return;
        }
        // Fetch Users with role COACH for this Org
        // We can reuse the admin/users endpoint
        fetch(`http://localhost:3333/admin/users?role=COACH&orgId=${selectedOrgId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setCoaches(data));
    }, [token, selectedOrgId]);

    useEffect(() => {
        if (!token || !selectedCoachId) {
            setEvents([]);
            setAvailabilities([]);
            return;
        }

        // Fetch Calendar Data for selected Coach
        // We need a new endpoint or reuse impersonation logic?
        // Simpler: admin endpoint to get availability.
        // But wait, the previous plan said: GET /admin/coaches/:id/calendar
        // I haven't implemented that yet in backend! 
        // Let's implement that backend endpoint quickly or see if I can use existing logic.
        // CoachCalendar expects 'events' and 'availabilities'.
        // I'll need to fetch these.
        // Let's assume the endpoint exists for now or I will mock it / implement it in next step.
        // Plan: I'll implement the fetch here, and then go BACK to backend to add the endpoint.

        setLoading(true);
        // Using a new admin endpoint
        fetch(`http://localhost:3333/admin/coaches/${selectedCoachId}/calendar`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : { events: [], availabilities: [] })
            .then(data => {
                setEvents(data.events || []);
                setAvailabilities(data.availabilities || []);
            })
            .finally(() => setLoading(false));

    }, [token, selectedCoachId]);

    const handleExportAgenda = () => {
        if (!events.length) return;

        const headers = ['Date', 'Heure Début', 'Heure Fin', 'Type', 'Titre', 'Étudiant', 'ID Étudiant'];
        const rows = events.map(e => [
            new Date(e.date).toLocaleDateString('fr-FR'),
            e.startTime,
            e.endTime,
            e.type,
            e.title,
            e.studentName || 'N/A',
            e.studentId || 'N/A'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `agenda_export_coach_${selectedCoachId}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-wrap gap-6 items-center justify-between">
                <div className="flex flex-wrap gap-6 items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Store size={20} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Organisme</label>
                            <select
                                value={selectedOrgId}
                                onChange={(e) => { setSelectedOrgId(e.target.value); setSelectedCoachId(''); }}
                                className="bg-slate-800 border-none text-white text-sm font-bold rounded-lg py-2 pl-3 pr-8 w-64 focus:ring-2 ring-blue-500/50 outline-none"
                            >
                                <option value="">-- Choisir un organisme --</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <User size={20} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Formateur</label>
                            <select
                                value={selectedCoachId}
                                onChange={(e) => setSelectedCoachId(e.target.value)}
                                disabled={!selectedOrgId}
                                className="bg-slate-800 border-none text-white text-sm font-bold rounded-lg py-2 pl-3 pr-8 w-64 focus:ring-2 ring-indigo-500/50 outline-none disabled:opacity-50"
                            >
                                <option value="">-- Choisir un formateur --</option>
                                {coaches.map(coach => (
                                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {selectedCoachId && events.length > 0 && (
                    <button
                        onClick={handleExportAgenda}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-slate-900/50"
                    >
                        Export Agenda CSV
                    </button>
                )}
            </div>

            {/* Calendar View */}
            {selectedCoachId ? (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-20 text-center text-slate-400">Chargement du planning...</div>
                    ) : (
                        <CoachCalendar events={events} availabilities={availabilities} />
                    )}
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-20 text-center flex flex-col items-center justify-center">
                    <Calendar className="w-16 h-16 text-slate-800 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Sélectionnez un formateur</h3>
                    <p className="text-slate-500">Choisissez un organisme puis un formateur pour voir son agenda.</p>
                </div>
            )}
        </div>
    );
}
