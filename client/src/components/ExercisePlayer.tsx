import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, ArrowRight, BookOpen, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface ExercisePlayerProps {
    content: string;
    questionText: string;
    options: { [key: string]: string } | string[];
    explanation: string;
    correctAnswerKey?: string; // Opt-in correct answer key
}

const ExercisePlayer: React.FC<ExercisePlayerProps> = ({
    content,
    questionText,
    options,
    explanation,
    correctAnswerKey = "A", // Default for demo
}) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isValidated, setIsValidated] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'questions'>('content');

    const optionsList = Array.isArray(options)
        ? options.map((opt, idx) => ({ key: String.fromCharCode(65 + idx), value: opt }))
        : Object.entries(options).map(([key, value]) => ({ key, value }));

    const handleValidate = () => {
        if (!selectedOption) return;
        const correct = selectedOption === correctAnswerKey;
        setIsValidated(true);
        setIsCorrect(correct);

        // Haptic Feedback for errors
        if (!correct && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-800 z-[60]">
                <div className="h-full bg-indigo-600 w-1/3 transition-all duration-500"></div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="md:hidden sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-50 flex items-center p-1">
                <button
                    onClick={() => setActiveTab('content')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'content'
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400 dark:text-slate-500"
                    )}
                >
                    <BookOpen size={18} />
                    Support
                </button>
                <button
                    onClick={() => setActiveTab('questions')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'questions'
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400 dark:text-slate-500"
                    )}
                >
                    <HelpCircle size={18} />
                    Questions
                </button>
            </div>

            <main className="flex-1 flex flex-col md:flex-row gap-0 md:gap-8 max-w-7xl mx-auto md:p-8 w-full">

                {/* Left Column: Content (Visible on Desktop OR when tab is active) */}
                <div className={clsx(
                    "flex-1 md:flex bg-white dark:bg-slate-900 p-6 md:p-10 md:rounded-[2.5rem] shadow-sm md:border border-slate-100 dark:border-slate-800 overflow-y-auto md:max-h-[85vh]",
                    activeTab === 'content' ? 'flex flex-col' : 'hidden'
                )}>
                    <h2 className="text-[10px] md:text-xs font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mb-6 flex items-center gap-2">
                        <span className="w-8 h-px bg-slate-200 dark:bg-slate-700"></span>
                        Document Source
                    </h2>
                    <div className="prose dark:prose-invert prose-slate max-w-none leading-relaxed text-lg md:text-xl text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                        {content}
                    </div>
                </div>

                {/* Right Column: Question & Interaction */}
                <div className={clsx(
                    "flex-1 flex flex-col md:max-w-xl pb-32 md:pb-0",
                    activeTab === 'questions' ? 'flex' : 'hidden md:flex'
                )}>
                    <div className="bg-white dark:bg-slate-900 p-6 md:p-10 md:rounded-[2.5rem] shadow-xl md:border border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
                            {questionText}
                        </h2>

                        <div className="space-y-3">
                            {optionsList.map((option) => {
                                const isSelected = selectedOption === option.key;
                                const isKeyCorrect = option.key === correctAnswerKey;

                                let stateStyles = "border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50";
                                let icon = null;

                                if (isValidated) {
                                    if (isKeyCorrect) {
                                        stateStyles = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 font-bold ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900";
                                        icon = <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
                                    } else if (isSelected && !isKeyCorrect) {
                                        stateStyles = "border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-300 font-bold";
                                        icon = <X className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
                                    } else {
                                        stateStyles = "border-slate-50 dark:border-slate-900 opacity-40";
                                    }
                                } else if (isSelected) {
                                    stateStyles = "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-600 dark:ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 text-indigo-900 dark:text-indigo-400 font-bold";
                                }

                                return (
                                    <button
                                        key={option.key}
                                        disabled={isValidated}
                                        onClick={() => setSelectedOption(option.key)}
                                        className={clsx(
                                            "w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group touch-manipulation",
                                            stateStyles
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={clsx(
                                                "flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black transition-all shadow-sm",
                                                isValidated && isKeyCorrect ? "bg-emerald-500 text-white" :
                                                    isValidated && isSelected && !isKeyCorrect ? "bg-rose-500 text-white" :
                                                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                            )}>
                                                {option.key}
                                            </span>
                                            <span className="text-[17px] font-medium leading-snug">{option.value}</span>
                                        </div>
                                        <AnimatePresence>
                                            {icon && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    {icon}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Desktop Validate Button */}
                        <div className="hidden md:block mt-10">
                            {!isValidated ? (
                                <button
                                    onClick={handleValidate}
                                    disabled={!selectedOption}
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[1.5rem] transition-all shadow-xl hover:shadow-indigo-200 dark:hover:shadow-none hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    <span>Valider la réponse</span>
                                    <ArrowRight className="w-6 h-6" />
                                </button>
                            ) : (
                                <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-400 dark:text-slate-500 font-bold text-sm tracking-widest uppercase">
                                    Réponse enregistrée
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feedback / Explanation Section */}
                    <AnimatePresence>
                        {isValidated && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={clsx(
                                    "mt-8 p-8 rounded-[2.5rem] border-2 shadow-sm transition-colors",
                                    isCorrect
                                        ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30"
                                        : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={clsx("p-3 rounded-2xl shadow-sm", isCorrect ? "bg-emerald-500" : "bg-amber-500")}>
                                        <Info className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className={clsx("font-black text-xl mb-3", isCorrect ? "text-emerald-900 dark:text-emerald-400" : "text-amber-900 dark:text-amber-400")}>
                                            {isCorrect ? "Parfait !" : "Besoin de revoir..."}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {explanation}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Sticky Mobile Footer */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 z-50">
                {!isValidated ? (
                    <button
                        onClick={handleValidate}
                        disabled={!selectedOption}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-[1.25rem] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                    >
                        <span>Valider la réponse</span>
                        <ArrowRight size={20} />
                    </button>
                ) : (
                    <button className="w-full bg-emerald-500 text-white font-bold py-4 rounded-[1.25rem] shadow-lg flex items-center justify-center gap-2">
                        <span>Suivant</span>
                        <ArrowRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExercisePlayer;
