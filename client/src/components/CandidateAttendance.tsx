import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const API_URL = '/api';

interface OpenSession {
    id: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    coach: { id: string; name: string };
    classroom?: { id: string; name: string };
}

interface Props {
    onToast?: (type: 'success' | 'error', message: string) => void;
}

const CandidateAttendance: React.FC<Props> = ({ onToast }) => {
    const { token } = useAuth();
    const [sessions, setSessions] = useState<OpenSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState<string | null>(null);

    const fetchOpenSessions = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/sessions/candidate/open`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSessions(await res.json());
            }
        } catch (e) {
            console.error('Error fetching open sessions:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpenSessions();
        // Refresh every 30 seconds
        const interval = setInterval(fetchOpenSessions, 30000);
        return () => clearInterval(interval);
    }, [token]);

    const handleSignAttendance = async (sessionId: string) => {
        if (!token) return;
        setSigning(sessionId);
        try {
            const res = await fetch(`${API_URL}/sessions/${sessionId}/attend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ signatureData: 'PRESENT' })
            });
            if (res.ok) {
                onToast?.('success', 'Émargement enregistré !');
                // Remove from list since already signed
                setSessions(sessions.filter(s => s.id !== sessionId));
            } else {
                const err = await res.json();
                if (err.message?.includes('Already signed')) {
                    onToast?.('error', 'Vous avez déjà émargé pour cette session.');
                    setSessions(sessions.filter(s => s.id !== sessionId));
                } else {
                    onToast?.('error', err.message || 'Erreur lors de l\'émargement');
                }
            }
        } catch (e) {
            onToast?.('error', 'Erreur réseau');
        } finally {
            setSigning(null);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-slate-400">
                <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
                Recherche de sessions en cours...
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto mb-4 text-slate-500 opacity-50" />
                <p className="text-slate-400 font-medium">Aucune session en cours</p>
                <p className="text-slate-500 text-sm mt-1">
                    Revenez ici quand votre formateur aura ouvert une session.
                </p>
                <button
                    onClick={fetchOpenSessions}
                    className="mt-4 text-emerald-400 hover:underline font-medium flex items-center gap-2 mx-auto"
                >
                    <RefreshCw size={16} /> Actualiser
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-400" />
                    Sessions en cours
                </h3>
                <button
                    onClick={fetchOpenSessions}
                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700"
                >
                    <RefreshCw size={18} />
                </button>
            </div>
            <div className="space-y-3">
                {sessions.map(session => (
                    <div key={session.id} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-white">{session.title}</h4>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {session.startTime} - {session.endTime}
                                    </span>
                                    <span>Formateur : {session.coach.name}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSignAttendance(session.id)}
                                disabled={signing === session.id}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap"
                            >
                                {signing === session.id ? (
                                    <RefreshCw size={18} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={18} />
                                )}
                                Émarger
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CandidateAttendance;
