import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Lock,
    CheckCircle2,
    Star,
    ArrowRight,
    Trophy,
    Zap,
    TrendingUp,
    Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Module {
    id: string;
    title: string;
    topic: string;
    progress: number;
    status: 'locked' | 'completed' | 'current';
}

interface PathData {
    confidence: number;
    roadmap: Module[];
    nextStep: Module;
    badges: { id: string, name: string, earned: boolean }[];
}

export default function PersonalizedPath() {
    const { user, token } = useAuth();
    const [data, setData] = useState<PathData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id || !token) return;
        fetch(`http://localhost:3333/analytics/user/path/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [user?.id, token]);

    if (loading) return (
        <div className="flex items-center justify-center p-20 min-h-[500px]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="mt-4 text-indigo-600 font-bold animate-pulse">Chargement du parcours...</div>
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-16 pb-20 px-4 sm:px-0">
            {/* AI Next Challenge Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:translate-x-1/4 transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-6 max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 shadow-sm"
                        >
                            <Zap size={14} className="text-yellow-300 fill-yellow-300" /> Action Prioritaire
                        </motion.div>

                        <div>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-2">
                                Ton prochain défi
                            </h2>
                            <p className="text-2xl font-bold text-indigo-200">
                                {data.nextStep.title}
                            </p>
                        </div>

                        <p className="text-indigo-100/80 leading-relaxed text-lg">
                            L'IA a détecté que ce module est la clé pour débloquer ton niveau B2.
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.href = `/learning/practice?topic=${encodeURIComponent(data.nextStep.topic)}`}
                            className="flex items-center gap-3 bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-900/20 hover:shadow-2xl hover:bg-slate-50 transition-all group/btn"
                        >
                            <span className="text-lg">Démarrer maintenent</span>
                            <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>

                    {/* Confidence Widget */}
                    <div className="hidden md:flex flex-col items-center">
                        <div className="w-40 h-40 rounded-full border-8 border-white/10 flex items-center justify-center relative bg-white/5 backdrop-blur-sm shadow-inner">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 p-1">
                                <circle
                                    cx="50%" cy="50%" r="45%"
                                    className="stroke-white/10 fill-none"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="50%" cy="50%" r="45%"
                                    className="stroke-emerald-400 fill-none transition-all duration-1000 ease-out"
                                    strokeWidth="8"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 * (1 - data.confidence / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="text-center">
                                <span className="text-4xl font-black tracking-tighter block">{data.confidence}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Réussite</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Gamified Roadmap - Snake Layout */}
            <div className="relative py-10">
                <SnakePath roadmap={data.roadmap} />
            </div>

            {/* Achievement Badges */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm"
            >
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
                    <Trophy className="text-yellow-500 fill-yellow-500" size={28} />
                    Trophées débloqués
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {data.badges.map((badge, i) => (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`flex flex-col items-center gap-4 p-6 rounded-3xl transition-all border ${badge.earned
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60 grayscale'
                                }`}
                        >
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm ${badge.earned ? 'bg-white dark:bg-amber-900/40 text-amber-600' : 'bg-white dark:bg-slate-700 text-slate-400'
                                }`}>
                                <AwardIcon name={badge.name} />
                            </div>
                            <span className="font-bold text-center text-slate-700 dark:text-slate-300">{badge.name}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

// --- Subcomponents ---

function SnakePath({ roadmap }: { roadmap: Module[] }) {
    // Generate SVG path for snake effect
    // This is a simplified logic: In desktop, weave left/right. In mobile, straight line.

    return (
        <div className="relative">
            {/* Snake Connector Line (Desktop Only for simplicity of SVG coords) */}
            <div className="absolute inset-0 pointer-events-none hidden md:block" aria-hidden="true">
                <svg className="w-full h-full" overflow="visible">
                    <path
                        d={generateSnakePath(roadmap.length)}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                        strokeLinecap="round"
                        className="dark:stroke-slate-800"
                    />
                    {/* Progress Fill - would need precise length calc, skipping for MVP robustness */}
                </svg>
            </div>
            {/* Straight Line (Mobile) */}
            <div className="absolute left-8 top-0 bottom-0 w-2 bg-slate-200 dark:bg-slate-800 rounded-full md:hidden"></div>

            <div className="space-y-12 md:space-y-24 relative">
                {roadmap.map((module, index) => (
                    <ModuleNode
                        key={module.id}
                        module={module}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

// Helper to generate a weaving path down the center
function generateSnakePath(count: number) {
    let d = "";
    const rowHeight = 160; // Approximate height per row including gap

    // Starting point
    d += `M 50% 40 `;

    for (let i = 0; i < count - 1; i++) {
        // Curve logic could be complex. For now, let's stick to a central sine wave or simple connection
        // Actually, simulating Duolingo perfectly with SVG requires fixed pixel widths.
        // Let's use a simpler visual connector: The nodes are placed, line connects them.
        d += ` L 50% ${40 + ((i + 1) * rowHeight)}`;
    }

    return d;
}


function ModuleNode({ module, index }: { module: Module, index: number }) {
    const isLocked = module.status === 'locked';
    const isCompleted = module.status === 'completed';
    const isCurrent = module.status === 'current';

    // Snake Alignment: Alternating left/center/right? 
    // Or zig-zag: Left -> Right -> Left
    const alignment = index % 2 === 0 ? 'left' : 'right';

    return (
        <motion.div
            initial={{ opacity: 0, x: alignment === 'left' ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, type: "spring" }}
            className={`flex items-center gap-8 ${alignment === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'}`}
        >
            {/* The Text Content */}
            <div className={`flex-1 hidden md:block ${alignment === 'left' ? 'text-right' : 'text-left'}`}>
                <h4 className={`text-xl font-black mb-1 ${isLocked ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {module.title}
                </h4>
                <span className={`text-xs font-bold uppercase tracking-widest ${isLocked ? 'text-slate-300' : 'text-blue-500'}`}>
                    {module.topic}
                </span>
            </div>

            {/* The Node (Center) */}
            <div className="relative group mx-auto md:mx-0">
                {/* Connector Line Logic helper if we wanted manual lines */}

                {/* Main Circle */}
                <div
                    onClick={() => !isLocked && (window.location.href = `/learning/practice?topic=${encodeURIComponent(module.topic)}`)}
                    className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl border-b-8 transition-all duration-300 transform cursor-pointer
                    ${isLocked
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-slate-200 dark:border-slate-900 cursor-not-allowed'
                            : isCompleted
                                ? 'bg-emerald-500 text-white border-emerald-700 hover:translate-y-1 hover:border-b-0'
                                : 'bg-blue-600 text-white border-blue-800 ring-8 ring-blue-500/20 animate-pulse-slow hover:scale-110'
                        }`}
                >
                    {isLocked && <Lock size={32} strokeWidth={2.5} />}
                    {isCompleted && <CheckCircle2 size={36} strokeWidth={3} />}
                    {isCurrent && <Star size={36} fill="currentColor" className="text-yellow-300" />}
                </div>

                {/* Popover/Tooltip (Always visible on mobile next to it?) */}
                {isCurrent && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: -20 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-xl z-10"
                    >
                        START HERE!
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                    </motion.div>
                )}
            </div>

            {/* Mobile Text Content (Always on right) */}
            <div className="flex-1 md:hidden">
                <h4 className={`text-lg font-bold leading-tight ${isLocked ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                    {module.title}
                </h4>
                <span className="text-xs font-bold text-slate-400 uppercase">{module.topic}</span>
            </div>

            {/* Progress Bar (Desktop only, opposite side) */}
            <div className={`flex-1 hidden md:flex ${alignment === 'left' ? 'justify-start' : 'justify-end'}`}>
                {!isLocked && (
                    <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${module.progress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-400">{module.progress}%</span>
                    </div>
                )}
            </div>

        </motion.div>
    );
}

function AwardIcon({ name }: { name: string }) {
    if (name === 'Incollable') return <TrendingUp size={32} strokeWidth={2} />;
    if (name === '7 Jours') return <Star size={32} strokeWidth={2} />;
    return <Play size={32} strokeWidth={2} />;
}
