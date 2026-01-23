import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Trophy,
    MapPin,
    Star,
    ArrowRight,
    MessageCircle,
    Calendar,
    Sparkles,
    CheckCircle2,
    Building2,
    Coins,
    Download,
    Share2,
    Target,
    TrendingUp,
    Lock,
    Key,
    Loader2
} from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordSetupModal from './PasswordSetupModal';

interface SkillBreakdown {
    score: number;
    max: number;
    percent: number;
    correct: number;
    total: number;
    tcfScore: number;
    level: string;
}

interface SkillAdvice {
    feedback: string;
    priority: 'high' | 'medium' | 'low';
    exercises: string[];
    improvement: string;
}

interface DiagnosticData {
    id: string;
    score: number;
    estimatedLevel: string;
    completedAt: string;
    breakdown: {
        skills: Record<string, SkillBreakdown>;
        summary: any;
        analysis: any;
        skillAdvice?: Record<string, SkillAdvice>;
        globalSummary?: string;
    };
}

const DiagnosticReport: React.FC = () => {
    const { user, token } = useAuth();
    const [data, setData] = useState<DiagnosticData | null>(null);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [showPasswordSetup, setShowPasswordSetup] = useState(false);

    useEffect(() => {
        const fetchDiagnostic = async () => {
            if (!user || !token) return;
            try {
                const res = await fetch(`http://localhost:3333/exam/latest-diagnostic/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const session = await res.json();
                    setData(session);
                }
            } catch (err) {
                console.error("Failed to fetch diagnostic", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDiagnostic();
    }, [user, token]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user || !token || !data) return;
            try {
                const res = await fetch(`http://localhost:3333/recommendations/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations(data);
                }
            } catch (err) {
                console.error("Failed to fetch recommendations", err);
            }
        };

        fetchRecommendations();
    }, [data, user, token]);

    useEffect(() => {
        // Prompt B2C users without a defined password to set one
        if (user?.acquisition === 'DIRECT' && !localStorage.getItem('passwordSet')) {
            setShowPasswordSetup(true);
        }
    }, [user]);

    const handlePasswordSubmit = () => {
        setShowPasswordSetup(false);
    };

    const handleConnect = async (schoolId: string) => {
        if (!token || !user) return;
        setConnectingId(schoolId);
        try {
            const res = await fetch(`http://localhost:3333/recommendations/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    candidateId: user.id,
                    organizationId: schoolId
                })
            });

            if (res.ok) {
                alert("Dossier transmis avec succès ! L'école vous contactera bientôt.");
            }
        } catch (error) {
            console.error("Failed to connect", error);
        } finally {
            setConnectingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Trophy className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900">Aucun diagnostic trouvé</h2>
                    <p className="text-slate-500">Commencez par passer votre test de positionnement.</p>
                    <a href="/diagnostic" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Passer le test</a>
                </div>
            </div>
        );
    }

    const skillsData = data.breakdown.skills ? Object.entries(data.breakdown.skills).map(([key, value]) => ({
        subject: key,
        A: value.percent,
        fullMark: 100,
    })) : [];

    const getTrainingPlan = (currentLevel: string) => {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const currentIndex = levels.indexOf(currentLevel);
        const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'C2 Expert';

        let hours = 60;
        if (currentLevel === 'A2') hours = 80;
        if (currentLevel === 'B1') hours = 100;
        if (currentLevel === 'B2') hours = 150;
        if (currentLevel === 'C1') hours = 200;

        return { nextLevel, hours };
    };

    const trainingPlan = getTrainingPlan(data.estimatedLevel);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white pt-16 pb-32 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Target size={300} />
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4"
                            >
                                <Sparkles size={14} />
                                Bilan Complet & Orientation
                            </motion.div>
                            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                                Félicitations {user?.name?.split(' ')[0]} !
                            </h1>
                            <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                                Vous avez validé un niveau <span className="text-white font-bold">{data.estimatedLevel}</span>.
                                {data.estimatedLevel === 'B1' || data.estimatedLevel === 'B2'
                                    ? " Une excellente base pour l'insertion professionnelle, mais quelques ajustements sont nécessaires pour l'excellence."
                                    : " Un bon début ! Avec un plan structuré, vous progresserez rapidement."}
                            </p>
                        </div>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex items-center gap-8 shadow-2xl"
                        >
                            <div className="w-32 h-32 bg-indigo-500 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <span className="text-6xl font-black tracking-tighter">{data.estimatedLevel}</span>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Score Global IA</div>
                                <div className="text-4xl font-black mb-1">{data.score} <span className="text-lg text-slate-400 font-medium">/ 699</span></div>
                                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                                    <TrendingUp size={16} />
                                    <span>Potentiel: {trainingPlan.nextLevel}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Radar Chart Section */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-100 flex flex-col">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Target className="text-indigo-600" /> Profil de Compétences
                            </h3>
                        </div>
                        <div className="flex-1 min-h-[300px] -ml-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Compétences"
                                        dataKey="A"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fill="#4f46e5"
                                        fillOpacity={0.3}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: any) => [`${value}%`, 'Maitrise']}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Training Plan Section */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-100 flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-2">
                                <Calendar className="text-emerald-500" /> Plan de Formation Recommandé
                            </h3>
                            <p className="text-slate-500 text-sm">Basé sur vos lacunes actuelles et votre objectif.</p>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-end gap-4 mb-8">
                                <div className="text-6xl font-black text-slate-900 leading-none">{trainingPlan.hours}h</div>
                                <div className="pb-2 text-lg font-bold text-slate-500">
                                    de formation pour <br />
                                    atteindre le <span className="text-indigo-600">Niveau {trainingPlan.nextLevel}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-slate-700">Français Général (FLE)</span>
                                        <span className="text-slate-900">70%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[70%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-slate-700">Civisme & Valeurs</span>
                                        <span className="text-slate-900">30%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[30%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 flex gap-4">
                                <button className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition">
                                    <Download size={18} /> Télécharger PDF
                                </button>
                                <button className="py-4 px-6 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LLM Skill Advice Section */}
                {data.breakdown.skillAdvice && (
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <Sparkles className="text-violet-600" />
                                    Conseils Personnalisés par l'IA
                                </h2>
                                <p className="text-slate-500 font-medium mt-1">
                                    {data.breakdown.globalSummary || "Recommandations basées sur vos résultats"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(data.breakdown.skillAdvice).map(([skill, advice]) => {
                                const skillNames: Record<string, string> = {
                                    'CO': 'Compréhension Orale',
                                    'EO': 'Expression Orale',
                                    'CE': 'Compréhension Écrite',
                                    'EE': 'Expression Écrite'
                                };
                                const skillIcons: Record<string, string> = {
                                    'CO': '🎧',
                                    'EO': '🗣️',
                                    'CE': '📖',
                                    'EE': '✍️'
                                };
                                const priorityColors: Record<string, string> = {
                                    high: 'bg-rose-100 text-rose-600 border-rose-200',
                                    medium: 'bg-amber-100 text-amber-600 border-amber-200',
                                    low: 'bg-emerald-100 text-emerald-600 border-emerald-200'
                                };
                                const priorityLabels: Record<string, string> = {
                                    high: 'Priorité haute',
                                    medium: 'À améliorer',
                                    low: 'Bon niveau'
                                };

                                return (
                                    <motion.div
                                        key={skill}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg shadow-slate-100/50"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                                                    {skillIcons[skill] || '📚'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{skillNames[skill] || skill}</h3>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${priorityColors[advice.priority]}`}>
                                                        {priorityLabels[advice.priority]}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-400 uppercase">Objectif</div>
                                                <div className="text-sm font-black text-indigo-600">{advice.improvement}</div>
                                            </div>
                                        </div>

                                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                            {advice.feedback}
                                        </p>

                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Exercices recommandés</div>
                                            <ul className="space-y-2">
                                                {advice.exercises.map((exercise, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        {exercise}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Partner Schools Section */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Building2 className="text-indigo-600" />
                                Écoles Partenaires Recommandées
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">Sélectionnées pour vous accompagner vers le niveau {trainingPlan.nextLevel}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {recommendations.length === 0 ? (
                            <div className="p-8 text-center bg-slate-100 rounded-3xl text-slate-500">
                                Aucune école ne correspond exactement à votre profil pour le moment.
                            </div>
                        ) : (
                            recommendations.map((school) => (
                                <div key={school.id} className="group bg-white rounded-[2.5rem] p-2 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-200/20 transition-all overflow-hidden flex flex-col md:flex-row">
                                    <div className="md:w-1/3 bg-slate-100 h-48 md:h-auto rounded-[2rem] relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:scale-110 transition-transform duration-700"></div>
                                        {school.logoUrl ? (
                                            <img src={school.logoUrl} alt={school.name} className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                                <Building2 size={60} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                                            <Star size={14} className="fill-amber-400 text-amber-400" />
                                            <span className="text-xs font-black text-slate-900">{school.averageRating || '4.5'}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 md:p-8 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{school.name}</h3>
                                                <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">{school.specialties?.[0] || 'Généraliste'}</p>
                                            </div>
                                            <div className="text-right">
                                                {school.publicHourlyRate && (
                                                    <>
                                                        <div className="text-lg font-black text-slate-900">{school.publicHourlyRate}€</div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Heure</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 mb-8">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                                                <MapPin size={14} />
                                                {school.city || 'Distance ignorée'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                                <Calendar size={14} />
                                                Prochaine session : {school.nextSessionStart ? new Date(school.nextSessionStart).toLocaleDateString() : 'En continu'}
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center gap-3">
                                            <button
                                                onClick={() => handleConnect(school.id)}
                                                disabled={!!connectingId}
                                                className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {connectingId === school.id ? 'Transmission...' : "Contacter l'école"} <ArrowRight size={18} />
                                            </button>

                                            {user?.refundCode && (
                                                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                                    <Coins size={16} className="text-amber-500" />
                                                    <div className="text-left">
                                                        <div className="text-[10px] uppercase font-bold text-amber-500 leading-none">Votre Code</div>
                                                        <div className="text-xs font-black text-amber-700 leading-none mt-0.5">{user.refundCode}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )))}
                    </div>
                </div>
            </div>

            {/* Password Setup Modal */}
            <PasswordSetupModal
                isOpen={showPasswordSetup}
                onClose={() => setShowPasswordSetup(false)}
            />
        </div>
    );
};

export default DiagnosticReport;
