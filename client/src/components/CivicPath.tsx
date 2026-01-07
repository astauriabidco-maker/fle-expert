import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    Flag,
    BookOpen,
    CheckCircle2,
    Lock,
    ArrowRight,
    Globe,
    Users,
    Gavel,
    Play,
    Zap,
    X,
    Trophy
} from 'lucide-react';
import CivicExamSimulator from './CivicExamSimulator';

interface Lesson {
    title: string;
    content: string;
    videoId: string;
    keyPoints?: string[];
}

interface Question {
    question: string;
    options: string[];
    correct: number;
}

interface Module {
    id: string;
    title: string;
    topic: string;
    status: 'completed' | 'current' | 'locked';
    progress: number;
    lessons: Lesson[];
    quiz: Question[];
    order: number;
}

export default function CivicPath() {
    const [activeModule, setActiveModule] = React.useState<string | null>(null);
    const [activeLesson, setActiveLesson] = React.useState<number | null>(null);
    const [isQuizActive, setIsQuizActive] = React.useState(false);
    const [quizResult, setQuizResult] = React.useState<{ score: number, total: number } | null>(null);
    const [isSimulatorOpen, setIsSimulatorOpen] = React.useState(false);

    const [modules, setModules] = React.useState<Module[]>([]);
    const [userProgress, setUserProgress] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { token } = useAuth();

    const fetchData = React.useCallback(async () => {
        try {
            const [modulesRes, progressRes] = await Promise.all([
                fetch('http://localhost:3333/civic/modules', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:3333/civic/progress', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const modulesData = await modulesRes.json();
            const progressData = await progressRes.json();

            // Sort modules by order
            const sortedModulesData = [...modulesData].sort((a, b) => a.order - b.order);

            // Parse dynamic data
            const parsedModules = sortedModulesData.map((m: any, index: number) => {
                const moduleProgress = progressData.find((p: any) => p.moduleId === m.id);

                // Logic for locked/current status:
                // 1. First module is current if not completed.
                // 2. Subsequent modules are locked if previous one is not completed.
                let status: 'completed' | 'current' | 'locked' = 'locked';
                if (moduleProgress) {
                    status = 'completed';
                } else if (index === 0) {
                    status = 'current';
                } else {
                    const prevModule = sortedModulesData[index - 1];
                    const prevProgress = progressData.find((p: any) => p.moduleId === prevModule.id);
                    if (prevProgress) {
                        status = 'current';
                    }
                }

                return {
                    ...m,
                    lessons: m.lessons.map((l: any) => ({
                        ...l,
                        keyPoints: l.keyPoints ? JSON.parse(l.keyPoints) : []
                    })),
                    quiz: m.questions.map((q: any) => ({
                        ...q,
                        options: JSON.parse(q.options)
                    })),
                    status,
                    progress: moduleProgress ? 100 : (status === 'current' ? 15 : 0)
                };
            });

            setModules(parsedModules);
            setUserProgress(progressData);
        } catch (err) {
            console.error('Error fetching civic data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [fetchData, token]);

    const handleQuizComplete = async (score: number, total: number) => {
        setQuizResult({ score, total });

        if (activeModule) {
            try {
                await fetch('http://localhost:3333/civic/progress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        moduleId: activeModule,
                        score: Math.round((score / total) * 100)
                    })
                });
                fetchData(); // Refresh progress
            } catch (err) {
                console.error('Error tracking progress:', err);
            }
        }
    };

    const currentModule = modules.find(m => m.id === activeModule);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Préparation de votre parcours...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Alert / Info Card */}
            <div className="bg-emerald-600 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Flag size={160} />
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
                        Objectif : Naturalisation Française
                    </div>
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-black italic mb-6 leading-tight">
                            Maîtrisez les fondamentaux de la République.
                        </h2>
                        <p className="text-lg opacity-90 font-medium leading-relaxed">
                            Ce parcours progressif couvre l'histoire, la géographie, les institutions et les valeurs de la France pour réussir votre entretien d'assimilation.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => setIsSimulatorOpen(true)}
                            className="w-full sm:w-auto bg-white text-emerald-600 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            Démarrer l'examen blanc <ArrowRight size={20} />
                        </button>
                    </div>

                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progression</p>
                        <p className="text-2xl font-black dark:text-white">{userProgress.length} / {modules.length} Modules</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Moyen</p>
                        <p className="text-2xl font-black dark:text-white">
                            {userProgress.length > 0
                                ? Math.round(userProgress.reduce((acc, p) => acc + p.score, 0) / userProgress.length)
                                : 0} / 100
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communauté</p>
                        <p className="text-2xl font-black dark:text-white">+12k Certifiés</p>
                    </div>
                </div>
            </div>

            {/* Modules List or Detail View */}
            {activeModule ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <button
                        onClick={() => { setActiveModule(null); setActiveLesson(null); setIsQuizActive(false); setQuizResult(null); }}
                        className="text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                        <ArrowRight size={14} className="rotate-180" /> Retour au parcours
                    </button>

                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl">
                        <div className="p-6 md:p-12 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                                    <Trophy size={24} className="md:w-8 md:h-8" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{currentModule?.topic}</p>
                                    <h3 className="text-xl md:text-3xl font-black dark:text-white italic">{currentModule?.title}</h3>
                                </div>
                            </div>
                        </div>


                        <div className="p-8 md:p-12">
                            {isQuizActive ? (
                                <CivicQuiz
                                    questions={currentModule?.quiz || []}
                                    onComplete={handleQuizComplete}
                                    onClose={() => setIsQuizActive(false)}
                                />
                            ) : quizResult ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-2xl mx-auto text-center space-y-8 py-12"
                                >
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${quizResult.score / quizResult.total >= 0.7 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {quizResult.score / quizResult.total >= 0.7 ? <CheckCircle2 size={48} /> : <Zap size={48} />}
                                    </div>
                                    <h4 className="text-3xl font-black dark:text-white">
                                        {quizResult.score / quizResult.total >= 0.7 ? "Félicitations !" : "Encore un effort !"}
                                    </h4>
                                    <p className="text-lg text-slate-500">
                                        Vous avez obtenu un score de <span className="font-black text-slate-900 dark:text-white">{quizResult.score} / {quizResult.total}</span>.
                                    </p>
                                    <button
                                        onClick={() => { setQuizResult(null); setActiveModule(null); }}
                                        className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl"
                                    >
                                        RETOUR AU PARCOURS
                                    </button>
                                </motion.div>
                            ) : activeLesson !== null ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-12"
                                >
                                    <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden relative group border-4 border-slate-100 dark:border-slate-800 shadow-2xl">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white cursor-pointer group-hover:scale-110 transition-transform">
                                                <Play size={48} />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-white font-black text-xs uppercase tracking-[0.3em]">Module {currentModule?.order} • Leçon {activeLesson + 1}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                        <div className="lg:col-span-2 space-y-6">
                                            <h4 className="text-2xl font-black dark:text-white uppercase tracking-tight">
                                                {currentModule?.lessons[activeLesson]?.title}
                                            </h4>
                                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {currentModule?.lessons[activeLesson]?.content}
                                            </p>
                                        </div>
                                        <div className="space-y-8">
                                            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                                <h5 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest mb-6">Points Clés</h5>
                                                <ul className="space-y-4">
                                                    {currentModule?.lessons[activeLesson]?.keyPoints?.map((point) => (
                                                        <li key={point} className="flex gap-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => {
                                                        if (activeLesson + 1 < (currentModule?.lessons.length || 0)) {
                                                            setActiveLesson(activeLesson + 1);
                                                        } else {
                                                            setIsQuizActive(true);
                                                        }
                                                    }}
                                                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 hover:translate-x-1 transition-all"
                                                >
                                                    {activeLesson + 1 < (currentModule?.lessons.length || 0) ? 'LEÇON SUIVANTE' : 'PASSER LE QUIZ'}
                                                    <ArrowRight size={20} />
                                                </button>
                                                <button
                                                    onClick={() => setActiveLesson(null)}
                                                    className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-widest"
                                                >
                                                    Fermer la leçon
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentModule?.lessons.map((lesson, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ y: -5 }}
                                            onClick={() => setActiveLesson(idx)}
                                            className="group cursor-pointer bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all shadow-sm flex flex-col justify-between aspect-square"
                                        >
                                            <div>
                                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Play size={20} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Leçon {idx + 1}</p>
                                                <h4 className="font-black dark:text-white text-lg leading-tight uppercase group-hover:text-indigo-600 transition-colors">
                                                    {lesson.title}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                                <span className="font-black text-xs uppercase">Étudier</span>
                                                <ArrowRight size={16} />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {currentModule?.quiz && (
                                        <button
                                            onClick={() => setIsQuizActive(true)}
                                            className="w-full mt-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Zap size={20} /> PASSER LE QUIZ DU MODULE
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                        VOTRE PARCOURS DE FORMATION
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {modules.map((m) => (
                            <motion.div
                                key={m.id}
                                whileHover={m.status !== 'locked' ? { scale: 1.02 } : {}}
                                className={`p-8 rounded-[3rem] border transition-all h-full flex flex-col justify-between ${m.status === 'locked'
                                    ? 'bg-slate-50 dark:bg-slate-900 opacity-50 border-slate-100 dark:border-slate-800 grayscale'
                                    : m.status === 'completed'
                                        ? 'bg-white dark:bg-slate-900 border-emerald-500/30'
                                        : 'bg-white dark:bg-slate-900 border-indigo-500/30 shadow-2xl shadow-indigo-500/10'}`}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${m.status === 'locked' ? 'bg-slate-300' : m.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                                            {m.status === 'completed' ? <CheckCircle2 size={24} /> : m.status === 'current' ? <Play size={24} /> : <Lock size={24} />}
                                        </div>
                                        {m.status !== 'locked' && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.progress}% Terminés</p>
                                                <div className="h-1 w-24 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${m.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${m.progress}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 italic">Module {m.order} • {m.topic}</p>
                                    <h4 className="text-2xl font-black dark:text-white mb-4 uppercase leading-tight font-serif italic">{m.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium line-clamp-2 italic">
                                        {m.lessons.length} leçons interactives et un quiz final pour valider vos acquis sur {m.topic.toLowerCase()}.
                                    </p>
                                </div>
                                <div className="mt-8">
                                    <button
                                        disabled={m.status === 'locked'}
                                        onClick={() => setActiveModule(m.id)}
                                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all
                                            ${m.status === 'locked'
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95'}`}
                                    >
                                        {m.status === 'completed' ? 'Revoir' : m.status === 'current' ? 'Continuer' : 'Verrouillé'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                        <Gavel size={24} />
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase">Textes de Référence</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Consultez la Charte des Droits et Devoirs du Citoyen Français, adoptée par le Conseil d'État. Un document clé pour comprendre les fondements de notre société.
                    </p>
                    <button className="mt-6 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                        Lire le document <ArrowRight size={14} />
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                        <Globe size={24} />
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase">Cérémonie d'Accueil</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Saviez-vous que la remise du décret se fait lors d'une cérémonie solennelle en préfecture ? Découvrez le déroulement et les symboles de ce moment historique.
                    </p>
                    <button className="mt-6 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                        Découvrir <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Exam Simulator Overlay */}
            {isSimulatorOpen && (
                <CivicExamSimulator onClose={() => setIsSimulatorOpen(false)} />
            )}
        </div>
    );
}

// --- Internal Quiz Component ---

interface CivicQuizProps {
    questions: Question[];
    onComplete: (score: number, total: number) => void;
    onClose: () => void;
}

function CivicQuiz({ questions, onComplete, onClose }: CivicQuizProps) {
    const [currentQuestion, setCurrentQuestion] = React.useState(0);
    const [score, setScore] = React.useState(0);
    const [selectedOption, setSelectedOption] = React.useState<number | null>(null);

    if (questions.length === 0) return null;

    const q = questions[currentQuestion];

    const handleNext = () => {
        const isCorrect = selectedOption === q.correct;
        const newScore = isCorrect ? score + 1 : score;

        if (currentQuestion + 1 < questions.length) {
            setScore(newScore);
            setCurrentQuestion(c => c + 1);
            setSelectedOption(null);
        } else {
            onComplete(newScore, questions.length);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-slate-100 dark:border-slate-800 shadow-2xl relative"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={20} className="md:w-6 md:h-6" />
            </button>


            <div className="max-w-2xl mx-auto space-y-8">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                        <span>Question {currentQuestion + 1} / {questions.length}</span>
                        <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-10">
                    <h3 className="text-xl md:text-3xl font-black dark:text-white leading-tight uppercase font-serif italic text-center">
                        {q.question}
                    </h3>


                    <div className="grid gap-4">
                        {q.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedOption(idx)}
                                className={`w-full text-left p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex items-center gap-4 md:gap-6 group
                                    ${selectedOption === idx
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
                            >
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[10px] md:text-xs transition-all shrink-0
                                    ${selectedOption === idx ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50'}`}>
                                    {String.fromCharCode(64 + (idx + 1))}
                                </div>
                                <span className={`text-sm md:text-lg font-bold ${selectedOption === idx ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {opt}
                                </span>
                            </button>

                        ))}
                    </div>
                </div>

                <div className="flex justify-center pt-8">
                    <button
                        disabled={selectedOption === null}
                        onClick={handleNext}
                        className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-3"
                    >
                        {currentQuestion === questions.length - 1 ? "TERMINER LE QUIZ" : "QUESTION SUIVANTE"}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
