import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, HelpCircle } from 'lucide-react';

interface DiagnosticHeaderProps {
    currentIndex: number;
    totalQuestions: number;
    timeRemaining: number;
    onExit: () => void;
}

export const DiagnosticHeader: React.FC<DiagnosticHeaderProps> = ({
    currentIndex,
    totalQuestions,
    timeRemaining,
    onExit
}) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((currentIndex + 1) / totalQuestions) * 100;

    return (
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-50">
            {/* Exit Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onExit}
                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white group"
                    title="Quitter le test"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest">
                    Diagnostic Adaptatif
                </div>
            </div>

            {/* Progress Section */}
            <div className="flex-1 max-w-xl px-12 hidden md:block">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Progression : {currentIndex + 1} / {totalQuestions}
                    </span>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 40, damping: 10 }}
                    />
                </div>
            </div>

            {/* Timer & Help */}
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold border ${timeRemaining < 60
                        ? 'border-rose-200 bg-rose-50 text-rose-600 animate-pulse'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                    <Clock size={16} />
                    <span>{formatTime(timeRemaining)}</span>
                </div>
                <button className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                    <HelpCircle size={20} />
                </button>
            </div>
        </header>
    );
};
