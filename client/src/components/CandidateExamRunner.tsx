import React, { useEffect, useState } from 'react';
import { useExamSession } from '../hooks/useExamSession';
import { ExamResults } from './ExamResults';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';

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
        isLoading,
        isFinished,
        error,
        progress,
        score,
        level,
        downloadUrl,
        startExam,
        submitAnswer
    } = useExamSession(warningsCount, examType);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        startExam();
    }, [startExam]);

    useEffect(() => {
        // Reset selection on new question
        setSelectedOption(null);
    }, [currentQuestion?.id]);

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
        // If onExamComplete callback is provided, call it
        if (onExamComplete) {
            // Use setTimeout to avoid calling during render
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

    return (
        <div className="max-w-4xl mx-auto w-full">
            {/* Progress Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Question {progress + 1}
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-slate-400 font-medium text-sm">
                        <span>Niveau {currentQuestion.level}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{currentQuestion.topic}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Clock size={16} />
                    <span>--:--</span>
                </div>
            </div>

            {/* Question Card */}
            <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 md:p-12"
            >
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

                <div className="mt-10 flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                        Session ID: {sessionId?.slice(0, 8)}...
                    </div>
                    <button
                        onClick={() => selectedOption && submitAnswer(currentQuestion.id, selectedOption)}
                        disabled={!selectedOption || isLoading}
                        className={`px-8 py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg ${!selectedOption || isLoading
                            ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed shadow-none'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                            }`}
                    >
                        {isLoading ? 'Validation...' : 'Valider la réponse'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
