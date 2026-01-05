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
    AlertCircle,
    TrendingUp,
    Award,
    Play,
    Flame
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { RechargePack } from './RechargePack';
import PersonalizedPath from './PersonalizedPath';
import CandidatePortfolio from './CandidatePortfolio';
import { CandidateCalendar } from './CandidateCalendar';
import CandidateProfile from './CandidateProfile';
import { ErrorBoundary } from './ErrorBoundary';

type DashboardTab = 'overview' | 'path' | 'portfolio' | 'calendar' | 'profile';

const INITIAL_SKILLS = [
    { subject: 'Compréhension Orale', A: 0, fullMark: 100 },
    { subject: 'Compréhension Écrite', A: 0, fullMark: 100 },
    { subject: 'Expression Orale', A: 0, fullMark: 100 },
    { subject: 'Expression Écrite', A: 0, fullMark: 100 },
    { subject: 'Lexique & Structure', A: 0, fullMark: 100 },
];

const CandidateDashboard: React.FC = () => {
    const { user, organization, token, logout } = useAuth();
    const [history, setHistory] = React.useState<any[]>([]);
    const [skillsData, setSkillsData] = React.useState(INITIAL_SKILLS);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<DashboardTab>('path'); // Default to path as it's the main guidance

    // Gamification States
    const [userStats, setUserStats] = React.useState({ xp: 0, streak: 0 });
    const [_leaderboard, setLeaderboard] = React.useState<any[]>([]);
    const [pathData, setPathData] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!token || !user?.id) return;
            setIsLoading(true);
            try {
                const [historyRes, statsRes, leaderboardRes, pathRes] = await Promise.all([
                    fetch(`http://localhost:3333/exam/history/${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`http://localhost:3333/exam/stats/${user.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`http://localhost:3333/analytics/leaderboard/${organization?.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`http://localhost:3333/analytics/user/path/${user.id}`, {
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
                    setPathData(await pathRes.json());
                }
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
            const response = await fetch(`http://localhost:3333/certificate/download/${sessionId}`, {
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
                            {organization?.availableCredits !== undefined && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 px-4 py-2 rounded-xl flex flex-col items-end">
                                    <p className="text-xs text-amber-800 dark:text-amber-400 font-medium uppercase tracking-wider">Crédits</p>
                                    <p className="text-lg font-bold text-amber-900 dark:text-amber-300 leading-none">{organization.availableCredits} 🪙</p>
                                </div>
                            )}
                            {organization?.logoUrl && (
                                <img
                                    src={organization.logoUrl}
                                    alt={organization.name}
                                    className="h-14 w-auto object-contain opacity-90"
                                />
                            )}
                            <button
                                onClick={logout}
                                className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                title="Se déconnecter"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                            </button>
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
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            Calendrier
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                        >
                            Mon Profil
                        </button>
                    </div>

                    {activeTab === 'path' ? (
                        <PersonalizedPath />
                    ) : activeTab === 'overview' ? (
                        <>
                            {/* Hero Section: Level & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Level Card */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Trophy className="w-24 h-24 text-primary/80" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Niveau Actuel</p>
                                        <div className="text-5xl font-extrabold text-primary dark:text-indigo-400 mb-2">{currentLevel}</div>
                                        <p className="text-sm text-green-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" /> {latestSession ? `Basé sur ton score de ${latestSession.score}` : 'En attente de diagnostic'}
                                        </p>
                                    </div>
                                    <div className="mt-6">
                                        <div className="flex justify-between text-sm font-medium mb-2 text-slate-600 dark:text-slate-400">
                                            <span>Objectif : B2+</span>
                                            <span>{Math.max(10, progressPercent)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-primary dark:bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.max(10, progressPercent)}%` }}
                                            ></div>
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
                                    <h3 className="text-lg font-bold text-indigo-900 dark:text-white mb-3">Le conseil de ton coach</h3>
                                    <p className="text-indigo-800 dark:text-slate-300 text-sm leading-relaxed mb-4 flex-grow">
                                        {latestSession ? (
                                            <>"Bravo pour ton dernier score de <span className="font-semibold text-indigo-900 dark:text-white">{latestSession.score}</span> ! Tes performances en CO sont solides, mais nous devrions travailler l'expression orale ensemble."</>
                                        ) : (
                                            <>"Bienvenue ! Passe ton premier examen blanc pour obtenir un diagnostic complet de tes compétences."</>
                                        )}
                                    </p>
                                    <button className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold py-2 px-4 rounded-xl text-sm shadow-sm border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors">
                                        {latestSession ? "Voir l'exercice recommandé" : "Lancer le diagnostic"}
                                    </button>
                                </div>
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
                                        <button
                                            onClick={() => pathData?.nextStep && (window.location.href = `/learning/practice?topic=${encodeURIComponent(pathData.nextStep.topic)}`)}
                                            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group text-left"
                                        >
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                                                <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">Reprendre</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {pathData?.nextStep ? `Module ${pathData.nextStep.title}` : 'Chargement...'}
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => window.location.href = '/exam/session'}
                                            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group text-left">
                                            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                                                <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400">Examen Blanc</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Prêt à te tester ?</div>
                                            </div>
                                        </button>

                                        <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group text-left">
                                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400">Mes Erreurs</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {pathData ? `${pathData.totalErrors} points à revoir` : '-- points'}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Civisme Card - Spans 1 column */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            <h3 className="font-bold text-slate-900 dark:text-white">Réforme 2026</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Parcours Citoyenneté & Valeurs</p>

                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className={`h-2 rounded-full ${i <= 3 ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-gray-200 dark:bg-slate-800'}`}></div>
                                            ))}
                                        </div>
                                    </div>

                                    <button className="w-full py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                                        Continuer
                                    </button>
                                </div>

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

                    {activeTab === 'portfolio' && (
                        <CandidatePortfolio />
                    )}

                    {activeTab === 'calendar' && (
                        <div className="p-10 bg-blue-100 text-blue-900 font-bold text-2xl border-4 border-blue-500">
                            TEST AFFICHAGE CALENDRIER
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <CandidateProfile />
                    )}
                </div>
            )}
        </div>
    );
};

export default CandidateDashboard;
