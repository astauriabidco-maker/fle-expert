import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Timer,
    ShieldCheck,
    Search,
    ChevronRight,
    ArrowRight,
    Trophy,
    AlertCircle,
    BookOpen,
    CheckCircle2
} from 'lucide-react';

interface Question {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface CivicExamSimulatorProps {
    onClose: () => void;
}

export default function CivicExamSimulator({ onClose }: CivicExamSimulatorProps) {
    const [step, setStep] = useState<'intro' | 'exam' | 'results'>('intro');
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [isComplete, setIsComplete] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('http://localhost:3333/civic/simulator/questions');
                const data = await res.json();
                const parsedQuestions = data.map((q: any) => ({
                    ...q,
                    options: JSON.parse(q.options),
                    correctAnswer: q.correctAnswer
                }));
                // Shuffle and pick 10
                const shuffled = [...parsedQuestions].sort(() => 0.5 - Math.random());
                setQuestions(shuffled.slice(0, 10));
            } catch (err) {
                console.error('Error fetching simulator questions:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    useEffect(() => {
        let timer: any;
        if (step === 'exam' && timeLeft > 0 && !isComplete) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && !isComplete) {
            handleFinish();
        }
        return () => clearInterval(timer);
    }, [step, timeLeft, isComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleAnswer = (optionIdx: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIdx]: optionIdx }));
    };

    const handleNext = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setIsComplete(true);
        setStep('results');
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) {
                score++;
            }
        });
        return {
            points: score,
            total: questions.length,
            percentage: Math.round((score / questions.length) * 100)
        };
    };

    const score = calculateScore();
    const passed = score.percentage >= 70;

    if (isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-5xl h-full max-h-[900px] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative"
            >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-500/20">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Simulateur Examen Blanc</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naturalisation Française 2026</p>
                        </div>
                    </div>

                    {step === 'exam' && (
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-colors ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            <Timer size={20} />
                            <span className="tabular-nums">{formatTime(timeLeft)}</span>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12">
                    <AnimatePresence mode="wait">
                        {step === 'intro' && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="max-w-2xl mx-auto text-center space-y-8 py-12"
                            >
                                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
                                    <Search size={48} />
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-tight italic">
                                    Prêt pour le test réel ?
                                </h3>
                                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                                    Cet examen blanc simule les conditions réelles de l'entretien de naturalisation. Vous avez 10 minutes pour répondre à 10 questions aléatoires.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <p className="font-black text-slate-900 dark:text-white text-sm mb-2">Conditions de réussite</p>
                                        <p className="text-xs text-slate-500 italic">Score minimum de 70% requis pour valider votre préparation.</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <p className="font-black text-slate-900 dark:text-white text-sm mb-2">Temps limité</p>
                                        <p className="text-xs text-slate-500 italic">Un chronomètre s'active. La gestion du temps fait partie de l'examen.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('exam')}
                                    className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group"
                                >
                                    COMMENCER L'EXAMEN BLANC
                                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        )}

                        {step === 'exam' && (
                            <motion.div
                                key="exam"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-3xl mx-auto space-y-12"
                            >
                                {/* Progress */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                        <span>Question {currentQuestionIdx + 1} / {questions.length}</span>
                                        <span>{Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-500"
                                            style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="space-y-6 md:space-y-10">
                                    <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                        {questions[currentQuestionIdx]?.text}
                                    </h3>


                                    <div className="grid gap-3 md:gap-4">
                                        {questions[currentQuestionIdx]?.options.map((opt, idx) => {
                                            const isSelected = answers[currentQuestionIdx] === idx;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAnswer(idx)}
                                                    className={`w-full text-left p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex items-center gap-4 md:gap-6 group
                                                        ${isSelected
                                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-4 ring-indigo-500/10'
                                                            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                                                >
                                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[10px] md:text-xs transition-all shadow-sm shrink-0
                                                        ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50'}`}>
                                                        {String.fromCharCode(64 + (idx + 1))}
                                                    </div>
                                                    <span className={`text-sm md:text-lg font-bold transition-colors ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        {opt}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex gap-2">
                                        {questions.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentQuestionIdx ? 'w-8 bg-indigo-600' : answers[i] !== undefined ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'}`}
                                            ></div>
                                        ))}
                                    </div>
                                    <button
                                        disabled={answers[currentQuestionIdx] === undefined}
                                        onClick={handleNext}
                                        className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-3"
                                    >
                                        {currentQuestionIdx === questions.length - 1 ? "VOIR LES RÉSULTATS" : "SUIVANT"}
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'results' && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="max-w-4xl mx-auto space-y-12 py-8"
                            >
                                <div className={`p-12 rounded-[4rem] text-center border-b-8 relative overflow-hidden shadow-2xl ${passed ? 'bg-emerald-600 border-emerald-800 text-white' : 'bg-red-600 border-red-800 text-white'}`}>
                                    <div className="absolute top-0 right-0 p-12 opacity-10">
                                        {passed ? <Trophy size={200} /> : <AlertCircle size={200} />}
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                                            Simulation Terminée
                                        </div>
                                        <h3 className="text-5xl md:text-6xl font-black italic leading-tight">
                                            {passed ? "Félicitations, Citoyen !" : "Encore un effort..."}
                                        </h3>
                                        <div className="flex items-center justify-center gap-8">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-black opacity-70 mb-1">Score Global</p>
                                                <p className="text-5xl font-black italic">{score.percentage}%</p>
                                            </div>
                                            <div className="w-px h-16 bg-white/20"></div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-black opacity-70 mb-1">Précision</p>
                                                <p className="text-5xl font-black italic">{score.points}/{score.total}</p>
                                            </div>
                                        </div>
                                        <p className="text-xl font-medium max-w-lg mx-auto opacity-90">
                                            {passed
                                                ? "Votre niveau de connaissance des institutions et de l'histoire de France est suffisant pour l'examen officiel."
                                                : "Certaines notions clés ne sont pas encore acquises. Nous vous recommandons de revoir les modules théoriques."}
                                        </p>
                                    </div>
                                </div>

                                {/* Review List */}
                                <div className="space-y-6">
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-3">
                                        <BookOpen size={28} className="text-indigo-600" />
                                        Analyse des réponses
                                    </h4>
                                    <div className="grid gap-4">
                                        {questions.map((q, idx) => {
                                            const isCorrect = answers[idx] === q.correctAnswer;
                                            return (
                                                <div
                                                    key={q.id}
                                                    className={`p-8 rounded-3xl border flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all ${isCorrect ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/5 dark:border-emerald-900/20' : 'bg-red-50/30 border-red-100 dark:bg-red-900/5 dark:border-red-900/20'}`}
                                                >
                                                    <div className="flex items-center gap-6 flex-1">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                            {isCorrect ? <CheckCircle2 size={28} /> : <X size={28} />}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-lg font-black text-slate-900 dark:text-white leading-snug">{q.text}</p>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">"{q.explanation}"</p>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 font-bold text-sm uppercase px-5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                        {isCorrect ? <span className="text-emerald-600">+1 Point</span> : <span className="text-red-500">Erreur</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 pt-10">
                                    <button
                                        onClick={() => {
                                            setStep('intro');
                                            setCurrentQuestionIdx(0);
                                            setAnswers({});
                                            setTimeLeft(600);
                                            setIsComplete(false);
                                        }}
                                        className="flex-1 py-6 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-3xl hover:bg-slate-200 transition-all border-b-4 border-slate-200 dark:border-slate-950"
                                    >
                                        RECOMMENCER LA SIMULATION
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-6 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 border-b-4 border-indigo-800"
                                    >
                                        RETOURNER AU PARCOURS
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
