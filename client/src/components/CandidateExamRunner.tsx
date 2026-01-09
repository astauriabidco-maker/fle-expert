import React, { useEffect, useState, useMemo } from 'react';
import { useExamSession } from '../hooks/useExamSession';
import { ExamResults } from './ExamResults';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Check, AlertTriangle, Send } from 'lucide-react';

interface CandidateExamRunnerProps {
    warningsCount: number;
    onExamComplete?: () => void;
    examType?: 'EXAM' | 'DIAGNOSTIC';
}

export const CandidateExamRunner: React.FC<CandidateExamRunnerProps> = ({
    warningsCount,
    onExamComplete,
    examType = 'EXAM'
}) => {
    const {
        sessionId,
        currentQuestion,
        currentQuestionIndex,
        allQuestions,
        answers,
        answeredCount,
        isLoading,
        isFinished,
        error,
        progress,
        score,
        level,
        downloadUrl,
        timeRemainingSeconds,
        startExam,
        submitAnswer,
        saveAnswer,
        goToQuestion,
        completeExam
    } = useExamSession(warningsCount, examType);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        startExam();
    }, [startExam]);

    useEffect(() => {
        // Reset selection on new question, but pre-fill if already answered
        if (currentQuestion) {
            setSelectedOption(answers[currentQuestion.id] || null);
        }
    }, [currentQuestion?.id, answers]);

    // Auto-save when selection changes
    useEffect(() => {
        if (selectedOption && currentQuestion) {
            saveAnswer(currentQuestion.id, selectedOption);
        }
    }, [selectedOption, currentQuestion?.id]);

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Timer urgency color
    const timerColor = useMemo(() => {
        if (timeRemainingSeconds <= 60) return 'text-red-500 bg-red-500/10 border-red-500/30 animate-pulse';
        if (timeRemainingSeconds <= 300) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
        return 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }, [timeRemainingSeconds]);

    // Handle time up
    useEffect(() => {
        if (timeRemainingSeconds === 0 && !isFinished && sessionId) {
            setShowConfirmModal(true);
        }
    }, [timeRemainingSeconds, isFinished, sessionId]);

    if (isLoading && !currentQuestion && !isFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-medium animate-pulse">Préparation de votre session...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Une erreur est survenue</h3>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (isFinished && score !== undefined && level) {
        if (onExamComplete) {
            setTimeout(() => onExamComplete(), 100);
        }

        return (
            <ExamResults
                score={score}
                level={level}
                downloadUrl={downloadUrl}
                onClose={() => window.location.href = '/'}
                isDiagnostic={examType === 'DIAGNOSTIC'}
            />
        );
    }

    if (!currentQuestion) return null;

    let parsedOptions: string[] = [];
    try {
        parsedOptions = JSON.parse(currentQuestion.options);
    } catch (e) {
        parsedOptions = ["Option A", "Option B", "Option C", "Option D"];
    }

    const handleSubmitAndNext = () => {
        if (selectedOption) {
            submitAnswer(currentQuestion.id, selectedOption);
        }
    };

    const handleFinalSubmit = () => {
        setShowConfirmModal(false);
        completeExam();
    };

    const unansweredCount = allQuestions.length - answeredCount;

    return (
        <div className="max-w-5xl mx-auto w-full">
            {/* Top Bar: Timer & Progress */}
            <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                {/* Progress */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Question {currentQuestionIndex + 1} / {allQuestions.length > 0 ? allQuestions.length : '?'}
                    </div>

                    {/* Progress Bar */}
                    <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-500">{answeredCount} répondues</span>
                    </div>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-xl border ${timerColor}`}>
                    <Clock size={20} />
                    <span>{formatTime(timeRemainingSeconds)}</span>
                </div>

                {/* Submit Button */}
                <button
                    onClick={() => setShowConfirmModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                    <Send size={18} />
                    Terminer l'examen
                </button>
            </div>

            <div className="flex gap-6">
                {/* Question Navigation Panel */}
                <div className="hidden lg:block w-20 flex-shrink-0">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 sticky top-4">
                        <div className="grid grid-cols-2 gap-2">
                            {allQuestions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = idx === currentQuestionIndex;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => goToQuestion(idx)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${isCurrent
                                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                                                : isAnswered
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {isAnswered && !isCurrent ? <Check size={14} /> : idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 md:p-12"
                        >
                            {/* Question Meta */}
                            <div className="flex items-center gap-2 text-slate-400 font-medium text-sm mb-6">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">{currentQuestion.level}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{currentQuestion.topic}</span>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-relaxed mb-10">
                                {currentQuestion.text}
                            </h2>

                            <div className="space-y-4">
                                {parsedOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(opt)}
                                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${selectedOption === opt
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${selectedOption === opt
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 group-hover:border-indigo-300'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`font-medium ${selectedOption === opt ? 'text-indigo-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {opt}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Navigation Footer */}
                            <div className="mt-10 flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => goToQuestion(currentQuestionIndex - 1)}
                                    disabled={currentQuestionIndex === 0}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${currentQuestionIndex === 0
                                            ? 'text-slate-300 cursor-not-allowed'
                                            : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <ChevronLeft size={18} />
                                    Précédent
                                </button>

                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                                    Session: {sessionId?.slice(0, 8)}...
                                </div>

                                <button
                                    onClick={handleSubmitAndNext}
                                    disabled={!selectedOption || isLoading}
                                    className={`px-8 py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg flex items-center gap-2 ${!selectedOption || isLoading
                                        ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed shadow-none'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                                        }`}
                                >
                                    {isLoading ? 'Validation...' : 'Suivant'}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700"
                        >
                            <div className="text-center mb-6">
                                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${unansweredCount > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                                    }`}>
                                    {unansweredCount > 0
                                        ? <AlertTriangle className="w-8 h-8 text-amber-500" />
                                        : <Check className="w-8 h-8 text-emerald-500" />
                                    }
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    {timeRemainingSeconds === 0 ? 'Temps écoulé !' : 'Terminer l\'examen ?'}
                                </h3>
                                <p className="text-slate-500">
                                    {unansweredCount > 0
                                        ? `Vous avez ${unansweredCount} question(s) sans réponse.`
                                        : 'Toutes les questions ont été répondues.'
                                    }
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500">Questions répondues</span>
                                    <span className="font-bold text-emerald-600">{answeredCount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Sans réponse</span>
                                    <span className={`font-bold ${unansweredCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                        {unansweredCount}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {timeRemainingSeconds > 0 && (
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="flex-1 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        Continuer
                                    </button>
                                )}
                                <button
                                    onClick={handleFinalSubmit}
                                    className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
                                >
                                    Soumettre
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
