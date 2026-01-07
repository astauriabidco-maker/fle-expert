import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Activity,
    AlertTriangle,
    TrendingUp,
    BrainCircuit,
    Wallet,
    ChevronRight,
    Trophy,
    Target,
    Clock,
    UserPlus,
    BarChart3,
    Settings,
    X,
    Save,
    TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthData {
    pedagogical: {
        successRate: number;
        vitesseProgression: string;
        activeExams30d: number;
    };
    churnRisk: {
        total: number;
        inactive: number;
        percentage: number;
    };
    coachSaturation: {
        totalCoaches: number;
        saturatedCoaches: number;
        avgLoad: number;
    };
    aiQuality: {
        precision: number;
        avgCostPerExam: number;
        totalTokens30d: number;
    };
    commercial: {
        topOrgs: { id: string; name: string; newSignups: number; credits: number; isCritical: boolean }[];
        bottomOrgs: { id: string; name: string; newSignups: number; credits: number; isCritical: boolean }[];
        pipelineRecrutement: number;
        criticalOrgsCount: number;
    };
    settings?: {
        churnDays: number;
        coachSaturation: number;
        creditThreshold: number;
    };
}

export default function GlobalHealthDashboard() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({ churnDays: 14, coachSaturation: 15, creditThreshold: 0.1 });
    const [saving, setSaving] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            fetchHealth();
        }
    }, [token]);

    const fetchHealth = async () => {
        try {
            console.log("Fetching health data with token:", token ? "Token present" : "Token missing");
            const res = await fetch('http://localhost:3333/admin/oversight/health', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Health data fetched successfully:", data);
                setHealth(data);
                if (data.settings) setSettings(data.settings);
            } else {
                const errorText = await res.text();
                console.error(`Fetch health failed with status ${res.status}:`, errorText);
            }
        } catch (error) {
            console.error("Fetch health total failure:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            // For now, we save to the first org as a "global default" placeholder
            // A proper implementation would have a dedicated global settings table
            const res = await fetch('http://localhost:3333/admin/settings/org/global', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setShowSettings(false);
                fetchHealth(); // Refresh data
            }
        } catch (error) {
            console.error("Save settings error:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black">ANALYSE DE LA SANTÉ EN COURS...</div>;
    if (!health) return <div className="p-20 text-center text-red-500 font-bold">Erreur de chargement des données.</div>;


    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white">SEUILS D'ALERTE SANTÉ</h3>
                                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Jours d'inactivité (Churn)</label>
                                    <input
                                        type="number"
                                        value={settings.churnDays}
                                        onChange={(e) => setSettings({ ...settings, churnDays: parseInt(e.target.value) || 14 })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Nombre de jours sans activité avant d'être considéré "à risque".</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Saturation Coach (élèves max)</label>
                                    <input
                                        type="number"
                                        value={settings.coachSaturation}
                                        onChange={(e) => setSettings({ ...settings, coachSaturation: parseInt(e.target.value) || 15 })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Nombre maximum d'élèves par coach avant alerte.</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Seuil Crédit Critique (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.creditThreshold * 100}
                                        onChange={(e) => setSettings({ ...settings, creditThreshold: (parseFloat(e.target.value) || 10) / 100 })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Pourcentage du quota mensuel en dessous duquel un OF est "critique".</p>
                                </div>
                            </div>

                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Enregistrement...' : 'Sauvegarder'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        Santé Plateforme
                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            />
                            Live
                        </div>
                    </h2>
                    <p className="text-slate-400 mt-1">Surveillance proactive des risques, de la performance et de la dynamique commerciale.</p>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-4 py-2 rounded-xl transition-colors"
                >
                    <Settings size={16} />
                    <span className="text-sm font-bold">Configuration</span>
                </button>
            </div>

            {/* Row 1: Core KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthCard
                    title="Succès Examens"
                    value={`${Math.round(health.pedagogical.successRate)}%`}
                    sub="Taux de réussite (30j)"
                    icon={<Target className="text-emerald-400" />}
                    score={health.pedagogical.successRate / 100}
                    color="emerald"
                />
                <HealthCard
                    title="Précision IA"
                    value={`${Math.round(health.aiQuality.precision * 100)}%`}
                    sub="Corrélation Expert/IA"
                    icon={<BrainCircuit className="text-blue-400" />}
                    score={health.aiQuality.precision}
                    color="blue"
                />
                <HealthCard
                    title="Taux Retention"
                    value={`${Math.round(100 - health.churnRisk.percentage)}%`}
                    sub="Actifs vs Inactifs (14j)"
                    icon={<Activity className="text-amber-400" />}
                    score={1 - (health.churnRisk.percentage / 100)}
                    color="amber"
                />
                <HealthCard
                    title="Pipeline Recrut."
                    value={health.commercial.pipelineRecrutement}
                    sub="Formateurs à valider"
                    icon={<UserPlus className="text-indigo-400" />}
                    score={health.commercial.pipelineRecrutement > 5 ? 0.5 : 1}
                    color="indigo"
                />
            </div>

            {/* Row 2: Deep Analysis */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Performance Pédagogique */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-emerald-500" size={20} />
                        Performance Pédagogique
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Vitesse de progression</span>
                            <span className="text-white font-black">{health.pedagogical.vitesseProgression}</span>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Examens complétés (30j)</span>
                            <span className="text-white font-black">{health.pedagogical.activeExams30d}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                        <p className="text-xs text-emerald-400 leading-relaxed font-medium">
                            💡 Conseil: Les apprenants qui pratiquent quotidiennement progressent 40% plus vite.
                        </p>
                    </div>
                </div>

                {/* Dynamique Commerciale (Top/Bottom) */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 lg:col-span-1 xl:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="text-amber-500" size={20} />
                            Dynamique des OF
                        </h3>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Basé sur les 30 derniers jours</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Top OFs */}
                        <div className="space-y-4">
                            <div className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={14} /> Top Croissance
                            </div>
                            <div className="space-y-2">
                                {health.commercial.topOrgs.length > 0 ? health.commercial.topOrgs.map((org, i) => (
                                    <div key={org.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-600 w-4">{i + 1}.</span>
                                            <span className="text-sm font-bold text-white">{org.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-emerald-400">+{org.newSignups}</span>
                                        </div>
                                    </div>
                                )) : <div className="text-slate-600 text-xs py-4 text-center">Aucune croissance détectée</div>}
                            </div>
                        </div>

                        {/* Bottom/Stagnant OFs */}
                        <div className="space-y-4">
                            <div className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} /> Stagnants (0 signup)
                            </div>
                            <div className="space-y-2">
                                {health.commercial.bottomOrgs.length > 0 ? health.commercial.bottomOrgs.map((org) => (
                                    <div key={org.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors">
                                        <span className="text-sm font-bold text-slate-400">{org.name}</span>
                                        {org.isCritical && <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-black uppercase">Crédits Bas</span>}
                                    </div>
                                )) : <div className="text-slate-600 text-xs py-4 text-center">Tous les OF sont actifs</div>}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Row 3: Risks & AI */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* AI Costs & Quality */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BrainCircuit size={120} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">Monitor Rentabilité IA</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-400 text-xs uppercase font-black tracking-widest">Coût moy. / Examen</span>
                                <span className="text-2xl font-black text-white">$ {health.aiQuality.avgCostPerExam.toFixed(3)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-400 text-xs uppercase font-black tracking-widest">Tokens consommés (30j)</span>
                                <span className="text-2xl font-black text-white">{health.aiQuality.totalTokens30d.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-3xl flex flex-col justify-center">
                            <div className="text-blue-400 font-black text-xl mb-1">{Math.round(health.aiQuality.precision * 100)}%</div>
                            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Confiance du modèle</div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                                <motion.div animate={{ width: `${health.aiQuality.precision * 100}%` }} className="h-full bg-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert Center */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        Alertes Systèmes
                    </h3>

                    <div className="space-y-4">
                        {health.commercial.criticalOrgsCount > 0 && (
                            <AlertItem
                                icon={<Wallet size={16} />}
                                label={`${health.commercial.criticalOrgsCount} Centres en risque de crédit`}
                                sub="Réapprovisionnement nécessaire pour continuer les examens"
                                type="danger"
                            />
                        )}
                        {health.churnRisk.inactive > 0 && (
                            <AlertItem
                                icon={<TrendingDown size={16} />}
                                label={`${health.churnRisk.inactive} élèves à risque de churn`}
                                sub="Aucune activité depuis plus de 14 jours"
                                type="warning"
                            />
                        )}
                        {health.coachSaturation.saturatedCoaches > 0 && (
                            <AlertItem
                                icon={<AlertTriangle size={16} />}
                                label={`${health.coachSaturation.saturatedCoaches} coachs surchargés`}
                                sub="Dépassement du ratio optimal de 15 élèves/coach"
                                type="warning"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthCard({ title, value, sub, icon, score, color }: any) {
    const colorClasses: any = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]} border`}>
                    {icon}
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="text-3xl font-black text-white">{value}</h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, score * 100))}%` }}
                        className={`h-full rounded-full ${score > 0.8 ? 'bg-emerald-500' : score > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                    />
                </div>
                <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase">{sub}</p>
            </div>
        </div>
    );
}

function AlertItem({ icon, label, sub, type }: any) {
    const styles: any = {
        danger: "bg-red-500/10 border-red-500/20 text-red-100",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-100",
    };

    return (
        <div className={`flex items-center gap-4 p-4 rounded-3xl border ${styles[type]} group hover:brightness-110 transition-all cursor-pointer`}>
            <div className={`p-2 rounded-xl bg-white/10 group-hover:scale-110 transition-transform`}>{icon}</div>
            <div className="flex-1">
                <div className="text-sm font-black leading-tight">{label}</div>
                <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">{sub}</div>
            </div>
            <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
        </div>
    );
}
