import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Download, ArrowRight, TrendingUp, TrendingDown, Target, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SkillBreakdown {
    score: number;
    max: number;
    percent: number;
    correct: number;
    total: number;
    tcfScore: number;
    level: string;
}

interface ResultBreakdown {
    skills: Record<string, SkillBreakdown>;
    summary: {
        totalCorrect: number;
        totalQuestions: number;
        rawScore: number;
        maxPossible: number;
        tcfScore: number;
        overallLevel: string;
        accuracyPercent: number;
    };
    analysis: {
        strongestSkill: string | null;
        strongestPercent: number;
        weakestSkill: string | null;
        weakestPercent: number;
        recommendations: string[];
    };
}

interface ExamResultsProps {
    score: number;
    level: string;
    downloadUrl?: string;
    onClose: () => void;
    isDiagnostic?: boolean;
    breakdown?: ResultBreakdown;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
    score,
    level,
    downloadUrl,
    onClose,
    isDiagnostic = false,
    breakdown
}) => {

    React.useEffect(() => {
        // Trigger confetti on mount
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // Color mapping for levels
    const levelColors: Record<string, string> = {
        'A1': 'text-gray-500 bg-gray-100 dark:bg-gray-800/50',
        'A2': 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
        'B1': 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
        'B2': 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30',
        'C1': 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
        'C2': 'text-rose-500 bg-rose-100 dark:bg-rose-900/30'
    };

    // Skill name mapping
    const skillNames: Record<string, string> = {
        'CO': 'Compréhension Orale',
        'CE': 'Compréhension Écrite',
        'EO': 'Expression Orale',
        'EE': 'Expression Écrite',
        'Grammaire': 'Grammaire',
        'Vocabulaire': 'Vocabulaire'
    };

    // Progress bar color based on percent
    const getProgressColor = (percent: number) => {
        if (percent >= 80) return 'bg-emerald-500';
        if (percent >= 60) return 'bg-blue-500';
        if (percent >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mb-8 relative"
            >
                <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                <Trophy className="w-24 h-24 text-yellow-500 relative z-10" />
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-slate-900 dark:text-white mb-2"
            >
                Félicitations !
            </motion.h2>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 dark:text-slate-400 mb-8"
            >
                Vous avez terminé la session d'évaluation.
            </motion.p>

            {/* Score and Level Cards */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-4 w-full max-w-md mb-8"
            >
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Score TCF</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{score} <span className="text-sm text-slate-400 font-medium">/ 699</span></p>
                </div>
                <div className={`p-5 rounded-2xl border border-transparent shadow-sm flex flex-col items-center justify-center ${levelColors[level] || levelColors['A1']}`}>
                    <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">
                        {isDiagnostic ? 'Niveau Estimé' : 'Niveau Atteint'}
                    </p>
                    <p className="text-3xl font-black">{level}</p>
                </div>
            </motion.div>

            {/* Skill Breakdown */}
            {breakdown && breakdown.skills && Object.keys(breakdown.skills).length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-lg mb-8"
                >
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                        <Target size={16} /> Détail par Compétence
                    </h3>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
                        {Object.entries(breakdown.skills).map(([skill, data]) => (
                            <div key={skill} className="flex items-center gap-4">
                                <div className="w-24 text-left">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {skillNames[skill] || skill}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getProgressColor(data.percent)} transition-all duration-500`}
                                            style={{ width: `${data.percent}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="w-16 text-right">
                                    <span className={`text-sm font-bold ${levelColors[data.level]?.split(' ')[0] || 'text-slate-600'}`}>
                                        {data.level}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-1">({data.percent}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Strengths & Weaknesses */}
            {breakdown?.analysis && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8"
                >
                    {breakdown.analysis.strongestSkill && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                                <TrendingUp size={16} />
                                <span className="text-xs font-bold uppercase">Point Fort</span>
                            </div>
                            <p className="font-bold text-emerald-700 dark:text-emerald-300">
                                {skillNames[breakdown.analysis.strongestSkill] || breakdown.analysis.strongestSkill}
                            </p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">{breakdown.analysis.strongestPercent}%</p>
                        </div>
                    )}
                    {breakdown.analysis.weakestSkill && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                                <TrendingDown size={16} />
                                <span className="text-xs font-bold uppercase">À Améliorer</span>
                            </div>
                            <p className="font-bold text-amber-700 dark:text-amber-300">
                                {skillNames[breakdown.analysis.weakestSkill] || breakdown.analysis.weakestSkill}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">{breakdown.analysis.weakestPercent}%</p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Recommendations */}
            {breakdown?.analysis?.recommendations && breakdown.analysis.recommendations.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="w-full max-w-lg mb-8"
                >
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-3">
                            <Lightbulb size={16} />
                            <span className="text-xs font-bold uppercase">Recommandations</span>
                        </div>
                        <ul className="space-y-2">
                            {breakdown.analysis.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                                    <span className="text-indigo-400">•</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
            >
                <button
                    onClick={onClose}
                    className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
                >
                    Voir mon rapport détaillé <ArrowRight size={20} />
                </button>

                {downloadUrl && (
                    <button
                        onClick={() => window.open(`http://localhost:3333${downloadUrl}`, '_blank')}
                        className="flex-1 py-4 px-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Download size={20} /> Certificat
                    </button>
                )}
            </motion.div>
        </div>
    );
};
