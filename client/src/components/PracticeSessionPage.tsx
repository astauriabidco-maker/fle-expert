import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface Question {
    id: string;
    text: string;
    options: string;
    topic: string;
}

export default function PracticeSessionPage() {
    const { token, user, organization } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean, explanation: string, correctAnswer: string } | null>(null);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        // Parse topic from URL or state
        const params = new URLSearchParams(window.location.search);
        const topic = params.get('topic') || 'Grammaire';

        if (user && organization && token) {
            startPractice(topic);
        }
    }, [user, organization, token]);

    const startPractice = async (topic: string) => {
        try {
            const res = await fetch('http://localhost:3333/learning/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user?.id, organizationId: organization?.id, topic })
            });
            const data = await res.json();
            setSessionId(data.session.id);
            setQuestions(data.questions);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const submitAnswer = async (selectedOption: string) => {
        if (!sessionId) return;
        const currentQ = questions[currentIndex];

        const res = await fetch(`http://localhost:3333/learning/${sessionId}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questionId: currentQ.id, selectedOption })
        });
        const result = await res.json();
        setFeedback(result);
    };

    const nextQuestion = async () => {
        setFeedback(null);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Complete
            await fetch(`http://localhost:3333/learning/${sessionId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Calculate final score based on answers (local state tracking would be better but simple math is fine)
            // Just assume last known score or calculate properly.
            // For MVP, we didn't track local correct count in state properly, let's just display success 
            // or fetch the result from the 'complete' endpoint if we updated it to return score.
            setCompleted(true);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black mb-4 dark:text-white">Session Terminée !</h2>
                    <p className="text-slate-500 mb-8">Tes résultats ont été enregistrés et ta progression mise à jour.</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Retour au Tableau de Bord
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    let options = [];
    try { options = JSON.parse(currentQ.options); } catch (e) { options = ["Err"]; }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <header className="p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
                <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-200 rounded-full">
                    <ArrowLeft className="text-slate-600" />
                </button>
                <div className="flex-1 mx-8 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                    />
                </div>
                <div className="font-mono font-bold text-slate-400">
                    {currentIndex + 1}/{questions.length}
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="max-w-3xl w-full">
                    <div className="mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">{currentQ.topic}</span>
                        <h2 className="text-2xl md:text-3xl font-bold mt-2 text-slate-800 dark:text-white leading-tight">
                            {currentQ.text}
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        {options.map((opt: string, idx: number) => {


                            return (
                                <button
                                    key={idx}
                                    onClick={() => !feedback && submitAnswer(opt)}
                                    disabled={!!feedback}
                                    className={`p-6 text-left rounded-2xl border-2 transition-all font-medium text-lg flex justify-between items-center group
                                        ${feedback
                                            ? (feedback.correctAnswer === opt
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                                : 'bg-white border-slate-100 opacity-60')
                                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg'
                                        }
                                    `}
                                >
                                    <span>{opt}</span>
                                    {feedback && feedback.correctAnswer === opt && <CheckCircle2 className="text-emerald-500" />}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-8 p-6 rounded-2xl ${feedback.isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-red-50 text-red-900'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`mt-1 ${feedback.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {feedback.isCorrect ? <CheckCircle2 /> : <XCircle />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{feedback.isCorrect ? 'Bonne réponse !' : 'Incorrect'}</h3>
                                        <p className="opacity-80">{feedback.explanation}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={nextQuestion}
                                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                                    >
                                        Continuer <ArrowRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
