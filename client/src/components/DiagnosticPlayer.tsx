import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, AlertTriangle, Sparkles, Star, Target } from 'lucide-react';
import { useExamSession } from '../hooks/useExamSession';
import { DiagnosticHeader } from './DiagnosticHeader';
import { DiagnosticAudioPlayer } from './DiagnosticAudioPlayer';
import { DiagnosticVoiceRecorder } from './DiagnosticVoiceRecorder';
import { ExamResults } from './ExamResults';

export const DiagnosticPlayer: React.FC = () => {
    const {
        sessionId,
        currentQuestion,
        currentQuestionIndex,
        allQuestions,
        answers,
        isLoading,
        isFinished,
        error,
        score,
        level,
        downloadUrl,
        timeRemainingSeconds,
        startExam,
        submitAnswer,
        saveAnswer,
        completeExam
    } = useExamSession(0, 'DIAGNOSTIC');

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [audioListened, setAudioListened] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [showEncouragement, setShowEncouragement] = useState(false);
    const [showConfirmQuit, setShowConfirmQuit] = useState(false);

    useEffect(() => {
        startExam();
    }, [startExam]);

    // Show encouragement after 10 questions
    useEffect(() => {
        if (currentQuestionIndex === 9 && !showEncouragement) {
            setShowEncouragement(true);
            setTimeout(() => setShowEncouragement(false), 3000);
        }
    }, [currentQuestionIndex]);

    // Handle answer change
    useEffect(() => {
        if (currentQuestion) {
            setSelectedOption(answers[currentQuestion.id] || null);
            setAudioListened(false);
            setRecordedBlob(null);
        }
    }, [currentQuestion?.id, answers]);

    const handleConfirmSelection = () => {
        if (!currentQuestion) return;

        if (currentQuestion.isRecording) {
            // In a real app we'd upload the blob, here we simulate selection
            submitAnswer(currentQuestion.id, "RECORDING_SUBMITTED");
        } else {
            if (selectedOption) {
                submitAnswer(currentQuestion.id, selectedOption);
            }
        }
    };

    if (isLoading && !currentQuestion && !isFinished) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 mb-8 relative">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-indigo-600" size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Analyse IA en cours...</h2>
                <p className="text-slate-500 font-medium">Nous préparons votre parcours adaptatif personnalisé.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md">
                    <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-2xl font-black mb-2 tracking-tight">Oups ! Une erreur est survenue</h2>
                    <p className="text-slate-500 mb-8">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">Réessayer</button>
                </div>
            </div>
        );
    }

    if (isFinished && score !== undefined && level) {
        return (
            <ExamResults
                score={score}
                level={level}
                downloadUrl={downloadUrl}
                isDiagnostic={true}
                onClose={() => window.location.href = '/results'}
            />
        );
    }

    if (!currentQuestion) return null;

    let options: string[] = [];
    try {
        options = JSON.parse(currentQuestion.options);
    } catch (e) {
        options = ["A", "B", "C", "D"];
    }

    // Validation rule: must listen to audio at least once if present
    const isNavigationDisabled = (currentQuestion.audioUrl && !audioListened) || (!selectedOption && !currentQuestion.isRecording && !recordedBlob);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors overflow-x-hidden">
            <DiagnosticHeader
                currentIndex={currentQuestionIndex}
                totalQuestions={20} // Simulated total for UX
                timeRemaining={timeRemainingSeconds}
                onExit={() => setShowConfirmQuit(true)}
            />

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12">
                <AnimatePresence mode="wait">
                    {showEncouragement ? (
                        <motion.div
                            key="encouragement"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            className="flex flex-col items-center text-center max-w-md p-12 bg-white dark:bg-slate-900 rounded-[3rem] shadow-3xl"
                        >
                            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500">
                                <Star size={48} fill="currentColor" />
                            </div>
                            <h2 className="text-3xl font-black mb-4">Vous assurez ! ✨</h2>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed">
                                Déjà 10 questions traitées. Gardez ce rythme, l'IA cerne de mieux en mieux votre niveau.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                            className="w-full max-w-4xl"
                        >
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 md:p-16 relative overflow-hidden">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Target size={120} />
                                </div>

                                {/* Question Metadata */}
                                <div className="flex items-center gap-2 mb-8">
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest ">
                                        {currentQuestion.topic}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                                        Niveau Ciblé: {currentQuestion.level}
                                    </span>
                                </div>

                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-12 max-w-2xl">
                                    {currentQuestion.text}
                                </h2>

                                {/* Media Zone */}
                                <div className="mb-12">
                                    {currentQuestion.audioUrl ? (
                                        <DiagnosticAudioPlayer
                                            src={currentQuestion.audioUrl}
                                            maxListens={currentQuestion.maxListens || 2}
                                            onFirstListen={() => setAudioListened(true)}
                                        />
                                    ) : currentQuestion.isRecording ? (
                                        <DiagnosticVoiceRecorder
                                            onRecordingComplete={(blob) => setRecordedBlob(blob)}
                                        />
                                    ) : null}
                                </div>

                                {/* Answers Zone (if not voice recording) */}
                                {!currentQuestion.isRecording && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {options.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedOption(opt)}
                                                className={`p-6 rounded-2xl border-2 text-left transition-all group flex items-center gap-4 ${selectedOption === opt
                                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border transition-colors ${selectedOption === opt
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 group-hover:border-indigo-300'
                                                    }`}>
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <span className={`font-bold transition-colors ${selectedOption === opt ? 'text-indigo-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                                                    }`}>
                                                    {opt}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Navigation Zone */}
                            <div className="mt-12 flex justify-end">
                                <button
                                    onClick={handleConfirmSelection}
                                    disabled={isNavigationDisabled || isLoading}
                                    className={`px-12 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 shadow-2xl active:scale-95 group ${isNavigationDisabled || isLoading
                                        ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30'
                                        }`}
                                >
                                    {isLoading ? 'Calcul IA...' : 'Confirmer'}
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showConfirmQuit && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-sm w-full text-center border border-slate-200 dark:border-slate-800 shadow-3xl"
                        >
                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black mb-2 tracking-tight">Vraiment quitter ?</h3>
                            <p className="text-slate-500 font-medium mb-8">
                                Votre progression actuelle sera perdue. Vous pourrez reprendre le diagnostic plus tard.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmQuit(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-sm uppercase tracking-widest"
                                >
                                    Rester
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200"
                                >
                                    Quitter
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
