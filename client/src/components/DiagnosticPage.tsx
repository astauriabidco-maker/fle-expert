import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CandidateExamRunner } from './CandidateExamRunner';
import { motion } from 'framer-motion';
import { Zap, Target, Clock, CheckCircle } from 'lucide-react';

const DiagnosticPage: React.FC = () => {
    const { user, token, login, organization } = useAuth();
    const [started, setStarted] = useState(false);
    const [warningsCount] = useState(0);

    // After exam completes, the backend already updated:
    // - user.currentLevel (from exam result)
    // - user.hasCompletedDiagnostic = true
    // We just need to update local state and redirect
    const handleDiagnosticComplete = () => {
        if (!user || !token || !organization) return;

        // Update local user state with hasCompletedDiagnostic
        // The level will be refreshed on next login or page load
        const updatedUser = { ...user, hasCompletedDiagnostic: true };
        login(token, updatedUser, organization);

        // Small delay to ensure state is saved, then redirect
        setTimeout(() => {
            window.location.href = '/';
        }, 500);
    };

    if (!started) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full"
                >
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-10 text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Target className="text-white" size={40} />
                            </div>
                            <h1 className="text-3xl font-black text-white mb-3">Test de Positionnement</h1>
                            <p className="text-indigo-100 font-medium">Découvrons votre niveau CECRL réel</p>
                        </div>

                        {/* Content */}
                        <div className="p-10 space-y-8">
                            <p className="text-lg text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                                Bienvenue <span className="font-bold text-slate-900 dark:text-white">{user?.name}</span> !
                                Avant d'accéder à votre parcours personnalisé, passez ce test rapide
                                pour que notre IA puisse adapter vos exercices à votre niveau réel.
                            </p>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl text-center">
                                    <Clock className="mx-auto text-indigo-600 dark:text-indigo-400 mb-3" size={28} />
                                    <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Durée</p>
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">15 min</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl text-center">
                                    <Zap className="mx-auto text-emerald-600 dark:text-emerald-400 mb-3" size={28} />
                                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Questions</p>
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">~20</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl text-center">
                                    <CheckCircle className="mx-auto text-amber-600 dark:text-amber-400 mb-3" size={28} />
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Objectif</p>
                                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">A1→C1</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Comment ça marche ?</h3>
                                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 font-bold">1.</span>
                                        Répondez aux questions de grammaire, vocabulaire et compréhension
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 font-bold">2.</span>
                                        L'IA adapte la difficulté en temps réel selon vos réponses
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 font-bold">3.</span>
                                        À la fin, découvrez votre niveau et votre parcours sur-mesure
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={() => setStarted(true)}
                                className="w-full py-5 bg-indigo-600 text-white font-black text-lg rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Zap size={24} /> Commencer le diagnostic
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
            <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex justify-between items-center">
                <h1 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Target size={20} className="text-indigo-600" /> Test de Positionnement
                </h1>
                <div className="text-sm font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                    Diagnostic Initial
                </div>
            </header>

            <main className="flex-grow p-4 sm:p-8 w-full max-w-5xl mx-auto flex flex-col items-center">
                <CandidateExamRunner
                    warningsCount={warningsCount}
                    onExamComplete={handleDiagnosticComplete}
                    examType="DIAGNOSTIC"
                />
            </main>
        </div>
    );
};

export default DiagnosticPage;
