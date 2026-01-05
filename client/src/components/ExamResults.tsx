import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Download, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamResultsProps {
    score: number;
    level: string;
    downloadUrl?: string;
    onClose: () => void;
    isDiagnostic?: boolean;
}

export const ExamResults: React.FC<ExamResultsProps> = ({ score, level, downloadUrl, onClose, isDiagnostic = false }) => {

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
        'A1': 'text-gray-500 bg-gray-100',
        'A2': 'text-blue-500 bg-blue-100',
        'B1': 'text-emerald-500 bg-emerald-100',
        'B2': 'text-indigo-500 bg-indigo-100',
        'C1': 'text-purple-500 bg-purple-100',
        'C2': 'text-rose-500 bg-rose-100'
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
                <Trophy className="w-32 h-32 text-yellow-500 relative z-10" />
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black text-slate-900 dark:text-white mb-4"
            >
                Félicitations !
            </motion.h2>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 dark:text-slate-400 text-lg mb-8"
            >
                Vous avez terminé la session d'évaluation.
            </motion.p>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-6 w-full max-w-md mb-12"
            >
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Score Global</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{score} <span className="text-sm text-slate-400 font-medium">pts</span></p>
                </div>
                <div className={`p-6 rounded-3xl border border-transparent shadow-sm flex flex-col items-center justify-center ${levelColors[level] || levelColors['A1']}`}>
                    <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-2">
                        {isDiagnostic ? 'Niveau Estimé' : 'Niveau Atteint'}
                    </p>
                    <p className="text-4xl font-black">{level}</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
            >
                <button
                    onClick={onClose}
                    className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2"
                >
                    Retour <ArrowRight size={20} />
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
