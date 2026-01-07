import React, { useState, useEffect } from 'react';
import { X, Calendar, Award, CheckCircle2, PlayCircle, Plus, TrendingUp, TrendingDown, Clock, Target, Flame, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar
} from 'recharts';

interface StudentDetailModalProps {
    student: any | null;
    onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
    const { token, organization } = useAuth();
    const [assigning, setAssigning] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [classrooms, setClassrooms] = useState<any[]>([]);

    useEffect(() => {
        if (student && organization?.id) {
            fetchDetailedProfile();
            fetchClassrooms();
        }
    }, [student, organization?.id]);

    const fetchClassrooms = async () => {
        try {
            const res = await fetch(`http://localhost:3333/classrooms/org/${organization?.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setClassrooms(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchDetailedProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:3333/analytics/student/${student.id}/org/${organization?.id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!student) return null;

    const handleAssignExam = async () => {
        setAssigning(true);
        try {
            const response = await fetch('http://localhost:3333/exam/assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: student.id, organizationId: organization?.id })
            });
            if (response.ok) {
                setMessage("Examen assigné avec succès !");
                setTimeout(() => {
                    setMessage(null);
                    onClose();
                }, 1500);
            } else {
                setMessage("Erreur lors de l'assignation.");
            }
        } catch (err) {
            setMessage("Erreur technique.");
        } finally {
            setAssigning(false);
        }
    };

    const radarData = profile?.levelGauge ? [
        { skill: 'CO', value: profile.levelGauge.CO, fullMark: 100 },
        { skill: 'CE', value: profile.levelGauge.CE, fullMark: 100 },
        { skill: 'EO', value: profile.levelGauge.EO, fullMark: 100 },
        { skill: 'EE', value: profile.levelGauge.EE, fullMark: 100 },
        { skill: 'Gram.', value: profile.levelGauge.Grammaire, fullMark: 100 },
        { skill: 'Vocab.', value: profile.levelGauge.Vocabulaire, fullMark: 100 }
    ] : [];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-gradient-to-r from-blue-600 to-indigo-600">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                                {(profile?.name || student.name)?.[0] || 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">{profile?.name || student.name}</h2>
                                <p className="text-white/70 font-medium">{profile?.email || student.email}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur text-white rounded-full text-xs font-bold uppercase tracking-wider">
                                        {profile?.currentLevel || student.currentLevel}
                                    </span>
                                    {profile?.targetLevel && (
                                        <span className="px-3 py-1 bg-emerald-500/30 text-emerald-100 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Target size={12} /> Objectif: {profile.targetLevel}
                                        </span>
                                    )}

                                    {/* Classroom Selector */}
                                    <div className="relative">
                                        <select
                                            className="appearance-none pl-8 pr-4 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider outline-none border border-white/20 cursor-pointer transition-colors"
                                            value={profile?.classroomId || student.classroomId || ''}
                                            onChange={async (e) => {
                                                const newClassroomId = e.target.value;
                                                if (!newClassroomId) return;
                                                try {
                                                    const res = await fetch(`http://localhost:3333/classrooms/${newClassroomId}/assign/${student.id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    if (res.ok) {
                                                        setMessage("Salle mise à jour !");
                                                        fetchDetailedProfile(); // Refresh
                                                        setTimeout(() => setMessage(null), 2000);
                                                    }
                                                } catch (err) { console.error(err); }
                                            }}
                                        >
                                            <option value="" className="text-slate-900">-- Salle --</option>
                                            {classrooms.map(c => (
                                                <option key={c.id} value={c.id} className="text-slate-900">
                                                    {c.name} ({c.level})
                                                </option>
                                            ))}
                                        </select>
                                        <BookOpen size={12} className="absolute left-2.5 top-1.5 text-white/70" />
                                    </div>

                                    <button
                                        onClick={handleAssignExam}
                                        disabled={assigning}
                                        className="px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                    >
                                        {assigning ? '...' : <><Plus size={12} /> Examen</>}
                                    </button>
                                </div>
                                {message && <p className="text-xs text-emerald-300 font-bold mt-1">{message}</p>}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={24} className="text-white" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Chargement du profil détaillé...</div>
                    ) : (
                        <>
                            {/* Stats Summary */}
                            <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-5 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Score Moyen</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white">{profile?.avgScore || 0}</p>
                                </div>
                                <div className="p-5 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Dernier Score</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white">{profile?.lastScore || '-'}</p>
                                </div>
                                <div className="p-5 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Progression</p>
                                    <p className={`text-3xl font-black flex items-center justify-center gap-1 ${(profile?.progression || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {(profile?.progression || 0) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                        {profile?.progression || 0}%
                                    </p>
                                </div>
                                <div className="p-5 text-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">XP Total</p>
                                    <p className="text-3xl font-black text-amber-500">{profile?.xp || 0}</p>
                                </div>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid md:grid-cols-2 gap-6 p-6">
                                {/* Radar Chart */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Target className="text-blue-500" /> Profil de Compétences
                                    </h3>
                                    {radarData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <RadarChart data={radarData}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 12 }} />
                                                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[220px] flex items-center justify-center text-slate-400">
                                            Pas assez de données
                                        </div>
                                    )}
                                </div>

                                {/* Stats Cards */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <BookOpen className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Sessions d'examen</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{profile?.totalExams || 0}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <Flame className="text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Série actuelle</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{profile?.streakCurrent || 0} jours</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <Clock className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Temps d'étude estimé</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">
                                                {Math.floor((profile?.estimatedStudyMinutes || 0) / 60)}h {(profile?.estimatedStudyMinutes || 0) % 60}m
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Strengths & Weaknesses */}
                            {(profile?.strengths?.length > 0 || profile?.weaknesses?.length > 0) && (
                                <div className="px-6 pb-4 grid md:grid-cols-2 gap-4">
                                    {profile?.strengths?.length > 0 && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                                            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                                <TrendingUp size={16} /> Points Forts
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.strengths.map((s: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-bold">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {profile?.weaknesses?.length > 0 && (
                                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4">
                                            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                                                <TrendingDown size={16} /> À Améliorer
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.weaknesses.map((w: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-rose-100 dark:bg-rose-800/40 text-rose-700 dark:text-rose-300 rounded-full text-sm font-bold">
                                                        {w}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Badges */}
                            {profile?.badges && (
                                <div className="px-6 pb-4">
                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-500 uppercase tracking-widest">
                                        <Award size={16} /> Badges
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {profile.badges.map((badge: any) => (
                                            <div
                                                key={badge.id}
                                                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${badge.earned
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50'
                                                    }`}
                                            >
                                                <span className="text-lg">{badge.icon}</span>
                                                {badge.name}
                                                {badge.earned && <Star size={14} className="text-amber-500" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Session History */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <HistoryIcon className="text-blue-500" /> Historique des Sessions
                                </h3>

                                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                                    {profile?.examSessions && profile.examSessions.length > 0 ? (
                                        profile.examSessions.map((session: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                                        ${session.status === 'ASSIGNED' ? 'bg-slate-200 text-slate-500' :
                                                            session.score >= 500 ? 'bg-emerald-100 text-emerald-600' :
                                                                session.score >= 300 ? 'bg-blue-100 text-blue-600' :
                                                                    'bg-amber-100 text-amber-600'}`}>
                                                        {session.status === 'ASSIGNED' ? <PlayCircle size={20} /> : session.estimatedLevel || '-'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {session.status === 'ASSIGNED' ? 'Examen Assigné' : "Session d'examen"}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                                                            <Calendar size={12} />
                                                            {new Date(session.createdAt).toLocaleDateString('fr-FR', {
                                                                day: 'numeric', month: 'long', year: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xl font-black text-slate-900 dark:text-white">
                                                        {session.score ?? '-'} <span className="text-xs text-slate-400 font-bold">pts</span>
                                                    </div>
                                                    <div className={`text-xs font-bold uppercase tracking-wider flex items-center justify-end gap-1 ${session.status === 'ASSIGNED' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                        {session.status === 'ASSIGNED' ? 'À FAIRE' : <><CheckCircle2 size={12} /> Complété</>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <Award size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>Aucune session d'examen enregistrée.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const HistoryIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
    </svg>
);
