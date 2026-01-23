import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';
import {
    Trophy,
    Target,
    Zap,
    BookOpen,
    TrendingUp,
    Award,
    Play,
    Flame,
    Mic,
    PenTool,
    Crown,
    Medal,
    Globe
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { RechargePack } from './RechargePack';
import PersonalizedPath from './PersonalizedPath';
import { Portfolio } from './Portfolio';
import { CandidateCalendar } from './CandidateCalendar';
import { CandidateBilling } from './CandidateBilling';
import CivicPath from './CivicPath';
import MessagingPanel from './MessagingPanel';
import CandidateProfile from './CandidateProfile';
import { ErrorBoundary } from './ErrorBoundary';
import UserMenu from './UserMenu';
import NotificationCenter from './NotificationCenter';
import CandidateAttendance from './CandidateAttendance';


type DashboardTab = 'overview' | 'path' | 'portfolio' | 'calendar' | 'profile' | 'messages' | 'billing' | 'civic' | 'attendance';

const INITIAL_SKILLS = [
    { subject: 'Compréhension Orale', A: 0, fullMark: 100 },
    { subject: 'Compréhension Écrite', A: 0, fullMark: 100 },
    { subject: 'Expression Orale', A: 0, fullMark: 100 },
    { subject: 'Expression Écrite', A: 0, fullMark: 100 },
    { subject: 'Lexique & Structure', A: 0, fullMark: 100 },
];

const CandidateDashboard: React.FC = () => {
    const { user, organization, token } = useAuth();
    const isDirect = user?.acquisition === 'DIRECT';
    const [history, setHistory] = React.useState<any[]>([]);
    const [skillsData, setSkillsData] = React.useState(INITIAL_SKILLS);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<DashboardTab>('path'); // Default to path as it's the main guidance
    const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Gamification States
    const [userStats, setUserStats] = React.useState({ xp: 0, streak: 0 });
    const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
    const [badges, setBadges] = React.useState<any[]>([]);
    const [aiDiagnostic, setAiDiagnostic] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!token || !user?.id) return;
            setIsLoading(true);
            try {
                const [historyRes, statsRes, leaderboardRes, pathRes] = await Promise.all([
                    fetch(`/api/exam/history/${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`/api/exam/stats/${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`/api/analytics/leaderboard/${organization?.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`/api/analytics/user/path/${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (historyRes.ok) setHistory(await historyRes.json());
                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    setUserStats({ xp: stats.xp || 0, streak: stats.streak || 0 });
                    setSkillsData([
                        { subject: 'Compréhension Orale', A: Math.min(100, (stats.CO / 699) * 100), fullMark: 100 },
                        { subject: 'Compréhension Écrite', A: Math.min(100, (stats.CE / 699) * 100), fullMark: 100 },
                        { subject: 'Expression Orale', A: Math.min(100, (stats.EO / 699) * 100), fullMark: 100 },
                        { subject: 'Expression Écrite', A: Math.min(100, (stats.EE / 699) * 100), fullMark: 100 },
                        { subject: 'Lexique', A: Math.min(100, (stats.CE / 699) * 95), fullMark: 100 },
                    ]);
                }
                if (leaderboardRes.ok) {
                    setLeaderboard(await leaderboardRes.json());
                }
                if (pathRes.ok) {
                    // Path data could be used here if needed
                }

                // Fetch Gamification Data
                const [badgesRes, leaderboardResReal] = await Promise.all([
                    fetch(`/api/gamification/badges`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`/api/gamification/leaderboard`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (badgesRes.ok) setBadges(await badgesRes.json());
                if (leaderboardResReal.ok) setLeaderboard(await leaderboardResReal.json());

                // Fetch AI Diagnostic
                const aiRes = await fetch(`/api/ai/diagnostic`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (aiRes.ok) setAiDiagnostic(await aiRes.json());
            } catch (err) {
                console.error("Error fetching candidate data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [token, user?.id]);

    const latestSession = history[0];
    const currentLevel = latestSession?.estimatedLevel || user?.currentLevel || 'A1';
    const progressPercent = latestSession ? Math.round(((latestSession.score - 200) / 500) * 100) : 10;

    const handleDownloadCertificate = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/certificate/diagnostic/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificate-${sessionId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                console.error("Failed to download certificate");
                alert("Impossible de télécharger le certificat. Veuillez réessayer plus tard.");
            }
        } catch (error) {
            console.error("Error downloading certificate:", error);
            alert("Erreur technique lors du téléchargement.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 font-sans text-slate-800 dark:text-slate-200 transition-colors">
            {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Header / Welcome */}
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bonjour, {user?.name}</h1>
                            <p className="text-slate-500 dark:text-slate-400">Prêt à progresser vers votre objectif B2 ?</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Streak Badge */}
                            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 px-4 py-2 rounded-xl" title="Série de jours consécutifs">
                                <div className={`p-1.5 rounded-full ${userStats.streak > 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-200 text-slate-400'}`}>
                                    <Flame size={16} className={userStats.streak > 0 ? 'fill-current animate-pulse' : ''} />
                                </div>
                                <div>
                                    <p className="text-xs text-orange-800 dark:text-orange-400 font-bold uppercase tracking-wider">Série</p>
                                    <p className="text-lg font-black text-orange-900 dark:text-orange-300 leading-none">{userStats.streak} Jours</p>
                                </div>
                            </div>

                            {user?.role === 'ADMIN' && (
                                <button
                                    onClick={() => window.location.href = '/admin'}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition font-semibold shadow-sm"
                                >
                                    Panel Admin
                                </button>
                            )}
                            {!isDirect && organization?.availableCredits !== undefined && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 px-4 py-2 rounded-xl flex flex-col items-end">
                                    <p className="text-xs text-amber-800 dark:text-amber-400 font-medium uppercase tracking-wider">Crédits</p>
                                    <p className="text-lg font-bold text-amber-900 dark:text-amber-300 leading-none">{organization.availableCredits} 🪙</p>
                                </div>
                            )}
                            {!isDirect && organization?.logoUrl && (
                                <img
                                    src={organization.logoUrl}
                                    alt={organization.name}
                                    className="h-14 w-auto object-contain opacity-90"
                                />
                            )}
                            <NotificationCenter />
                            <UserMenu />

                        </div>
                    </header>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl w-fit shadow-sm border border-slate-100 dark:border-slate-800 mb-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('path')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'path' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            Mon Parcours
                        </button>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            Tableau de Bord
                        </button>
                        <button
                            onClick={() => setActiveTab('portfolio')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'portfolio' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            Portfolio
                        </button>
                        {!isDirect && (
                            <>
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                >
                                    Calendrier
                                </button>
                                <button
                                    onClick={() => setActiveTab('messages')}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                >
                                    Messages
                                </button>
                                <button
                                    onClick={() => setActiveTab('attendance')}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'attendance' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                >
                                    📝 Émargement
                                </button>
                                <button
                                    onClick={() => setActiveTab('billing')}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                                >
                                    Facturation
                                </button>
                            </>
                        )}

                        {(user?.objective === 'NATURALIZATION' || user?.objective === 'RESIDENCY_10_YEAR') && (
                            <button
                                onClick={() => setActiveTab('civic')}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'civic' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                            >
                                Citoyenneté
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            Mon Profil
                        </button>
                    </div>

                    {activeTab === 'path' ? (
                        <PersonalizedPath />
                    ) : activeTab === 'portfolio' ? (
                        <Portfolio organizationId={user?.organizationId || ''} userId={user?.id || ''} token={token || ''} />
                    ) : activeTab === 'overview' ? (
                        <>
                            {/* Hero Section: Level & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Level Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:rotate-0 duration-700">
                                        <Trophy className="w-32 h-32 text-indigo-600" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Maîtrise Actuelle</p>
                                            <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black">
                                                <Award size={12} /> LEVEL UP PROCHE
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <div className="text-6xl font-black bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">{currentLevel}</div>
                                            <div className="text-sm font-bold text-slate-400 italic">Score: {latestSession?.score || 0}</div>
                                        </div>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                            <TrendingUp className="w-4 h-4" /> {latestSession ? `+12% vs semaine dernière` : 'Prêt pour le diagnostic'}
                                        </p>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                <span>Progression vers {currentLevel === 'A1' ? 'A2' : 'B2'}</span>
                                                <span className="text-indigo-600 dark:text-indigo-400">{Math.max(10, progressPercent)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2.5 p-0.5 overflow-hidden border border-slate-200 dark:border-slate-700">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all duration-1000 ease-out"
                                                    style={{ width: `${Math.max(10, progressPercent)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <Zap size={20} className="fill-current" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">XP Totale</p>
                                                    <p className="text-[10px] font-black text-slate-700 dark:text-white">{userStats.xp} / 5000</p>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 transition-all duration-1000"
                                                        style={{ width: `${(userStats.xp / 5000) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Radar Chart Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 md:col-span-1 flex flex-col items-center justify-center">
                                    <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-full text-left mb-2 pl-2">Compétences</h3>
                                    <div className="w-full h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                                                <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} className="dark:!fill-slate-400" />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar
                                                    name={user?.name || 'Moi'}
                                                    dataKey="A"
                                                    stroke="var(--primary-color)"
                                                    strokeWidth={2}
                                                    fill="var(--primary-color)"
                                                    fillOpacity={0.3}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* AI Feedback Card */}
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/30 flex flex-col relative">
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm">
                                            <Zap className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-indigo-900 dark:text-white mb-3">Le conseil de ton coach AI</h3>
                                    <p className="text-indigo-800 dark:text-slate-300 text-sm leading-relaxed mb-4 flex-grow">
                                        {aiDiagnostic?.status === 'READY' ? (
                                            aiDiagnostic.analysis
                                        ) : (
                                            "Analyse de tes performances en cours... Termine un examen blanc pour un diagnostic complet."
                                        )}
                                    </p>
                                    <button
                                        onClick={() => window.location.href = aiDiagnostic?.status === 'READY' ? '/results' : '/diagnostic'}
                                        className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold py-2 px-4 rounded-xl text-sm shadow-sm border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {aiDiagnostic?.status === 'READY' ? "Voir le détail" : "Lancer le diagnostic"}
                                    </button>
                                </div>

                                {/* Real Coach Card (New) */}
                                {user?.coach && (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col group hover:shadow-xl transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20">
                                                {user.coach.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mon Coach Expert</p>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{user.coach.name}</h3>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6 flex-grow">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Target size={14} className="text-indigo-500" /> Spécialiste Préparation TCF
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <TrendingUp size={14} className="text-emerald-500" /> Taux de réussite : 98%
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('messages')}
                                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10"
                                        >
                                            Envoyer un message
                                        </button>
                                    </div>
                                )}

                                {/* Badges Card (New) */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Medal className="w-4 h-4" /> Mes Badges
                                    </h3>
                                    <div className="grid grid-cols-4 gap-4 flex-grow content-start">
                                        {badges.map((ub: any) => (
                                            <div key={ub.id} className="flex flex-col items-center gap-2 group cursor-help relative" title={ub.badge.description}>
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg" style={{ backgroundColor: `${ub.badge.color}20`, color: ub.badge.color, border: `2px solid ${ub.badge.color}40` }}>
                                                    {ub.badge.icon === 'Zap' && <Zap size={20} />}
                                                    {ub.badge.icon === 'Mic' && <Mic size={20} />}
                                                    {ub.badge.icon === 'Flame' && <Flame size={20} />}
                                                    {ub.badge.icon === 'PenTool' && <PenTool size={20} />}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight">{ub.badge.name}</span>
                                            </div>
                                        ))}
                                        {badges.length === 0 && (
                                            <div className="col-span-4 py-8 flex flex-col items-center opacity-40">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 mb-2"></div>
                                                <span className="text-[10px] italic">Aucun badge débloqué</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Leaderboard Card - Hidden for DIRECT users */}
                                {!isDirect && (
                                    <div className="bg-slate-900 dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 flex flex-col relative overflow-hidden">
                                        <div className="absolute top-[-20px] right-[-20px] opacity-10">
                                            <Crown size={120} className="text-amber-500 rotate-12" />
                                        </div>
                                        <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
                                            <Crown className="w-4 h-4" /> Classement Local
                                        </h3>
                                        <div className="space-y-3 relative z-10 flex-grow">
                                            {leaderboard.slice(0, 5).map((entry, idx) => (
                                                <div key={entry.id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${entry.id === user?.id ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-slate-800'}`}>
                                                    <span className={`w-6 text-center font-black text-xs ${idx === 0 ? 'text-amber-500' : 'text-slate-500'}`}>{idx + 1}</span>
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                                                        {entry.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold truncate ${entry.id === user?.id ? 'text-amber-500' : 'text-slate-200'}`}>{entry.name}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase">{entry.currentLevel}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-slate-300">{entry.xp} XP</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="mt-4 w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Voir tout le classement</button>
                                    </div>
                                )}
                            </div>

                            {/* Histoty Table (New) */}
                            {history.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-slate-400" /> Historique des Examens
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="text-xs text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="pb-3 px-2">Date</th>
                                                    <th className="pb-3 px-2">Score</th>
                                                    <th className="pb-3 px-2">Niveau Est.</th>
                                                    <th className="pb-3 px-2 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                {history.map((session: any) => (
                                                    <tr key={session.id} className="text-sm group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{new Date(session.createdAt).toLocaleDateString()}</td>
                                                        <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                                                            {session.status === 'ASSIGNED' ? (
                                                                <span className="text-amber-500">À FAIRE</span>
                                                            ) : (
                                                                `${session.score} pts`
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            {session.status === 'ASSIGNED' ? (
                                                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md font-bold text-xs">EN ATTENTE</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md font-bold text-xs">{session.estimatedLevel}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            {session.status === 'ASSIGNED' ? (
                                                                <button
                                                                    onClick={() => window.location.href = `/exam/session?sessionId=${session.id}`}
                                                                    className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-bold hover:bg-indigo-700 transition"
                                                                >
                                                                    Démarrer
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleDownloadCertificate(session.id)}
                                                                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 justify-end ml-auto"
                                                                >
                                                                    <Award size={14} /> Certificat
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions & Civisme Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                                {/* Quick Actions - Spans 3 columns */}
                                <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-slate-400" /> Actions Rapides
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {aiDiagnostic?.suggestions?.length > 0 ? (
                                            aiDiagnostic.suggestions.slice(0, 3).map((suggestion: any) => (
                                                <button
                                                    key={suggestion.id}
                                                    onClick={() => window.location.href = `/learning/practice?topic=${suggestion.topic}`}
                                                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group text-left"
                                                >
                                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                                                        {suggestion.type === 'PRACTICE' ? <Play className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> : <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 line-clamp-1">{suggestion.title}</div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                                            {suggestion.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="col-span-3 py-6 text-center text-slate-400 italic text-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                Aucune recommandation personnalisée disponible.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Civisme Card - Spans 1 column */}
                                {(user?.objective === 'NATURALIZATION' || user?.objective === 'RESIDENCY_10_YEAR') ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                <h3 className="font-bold text-slate-900 dark:text-white">Réforme 2026</h3>
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Parcours Citoyenneté & Valeurs</p>

                                            <div className="grid grid-cols-4 gap-2 mb-4">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className={`h-2 rounded-full ${i <= 1 ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-gray-200 dark:bg-slate-800'}`}></div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('civic')}
                                            className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                        >
                                            Démarrer
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                                        <Globe className="w-10 h-10 text-slate-200 mb-4" />
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Culture & FLE</p>
                                        <p className="text-[10px] text-slate-500 mt-2">Pratique ta langue en contexte réel.</p>
                                    </div>
                                )}

                            </div>

                            {/* Recharge Section */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span className="text-xl">💳</span> Recharger mon compte
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <RechargePack
                                        packId="pack-starter"
                                        label="Pack Starter"
                                        price="100.00"
                                        credits={1000}
                                    />
                                    <RechargePack
                                        packId="pack-pro"
                                        label="Pack Pro"
                                        price="450.00"
                                        credits={5000}
                                    />
                                </div>
                            </div>
                        </>
                    ) : null}



                    {activeTab === 'calendar' && (
                        <ErrorBoundary>
                            <CandidateCalendar />
                        </ErrorBoundary>
                    )}

                    {activeTab === 'profile' && (
                        <CandidateProfile />
                    )}

                    {activeTab === 'messages' && (
                        <div className="h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <MessagingPanel initialPartnerId={user?.coach?.id} />
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <CandidateBilling />
                    )}

                    {activeTab === 'attendance' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <CandidateAttendance onToast={(type, message) => {
                                setToast({ type, message });
                                setTimeout(() => setToast(null), 3000);
                            }} />
                        </div>
                    )}

                    {activeTab === 'civic' && (
                        <CivicPath />
                    )}

                    {/* Toast Notification */}
                    {toast && (
                        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg font-medium z-50 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {toast.message}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CandidateDashboard;
