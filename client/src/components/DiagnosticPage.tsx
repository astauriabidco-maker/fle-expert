
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CandidateExamRunner } from './CandidateExamRunner';
import { motion } from 'framer-motion';
import { Zap, Target, Clock, ArrowRight, BookOpen, Info } from 'lucide-react';

const DiagnosticPage: React.FC = () => {
    const { user, token, login, organization } = useAuth();
    const [started, setStarted] = useState(false);
    const [showPedagogicalGuide, setShowPedagogicalGuide] = useState(false);
    const [warningsCount] = useState(0);

    const levels = [
        { id: 'A1', title: 'Découverte', desc: 'Rudiments de la langue. Comprendre et utiliser des expressions familières pour satisfaire des besoins concrets et immédiats.' },
        { id: 'A2', title: 'Survie', desc: 'Vie quotidienne et sociale. Communiquer lors de tâches simples demandant un échange d’informations direct sur des sujets familiers.' },
        { id: 'B1', title: 'Seuil', desc: 'Autonomie et Opinion. Raconter un événement, décrire un espoir et donner brièvement les raisons ou explications d’un projet.' },
        { id: 'B2', title: 'Avancé', desc: 'Argumentation et Spontanéité. Comprendre des sujets complexes et s’exprimer avec aisance sur une large gamme de sujets d’actualité.' },
        { id: 'C1/C2', title: 'Expert', desc: 'Expertise et Nuances. S’exprimer de façon fluide, structurée et sans effort apparent sur des sujets complexes et des implicites.' },
    ];

    const handleDiagnosticComplete = () => {
        if (!user || !token || !organization) return;

        const updatedUser = { ...user, hasCompletedDiagnostic: true };
        login(token, updatedUser, organization);

        setTimeout(() => {
            window.location.href = '/';
        }, 500);
    };

    const handleAcceptPrerequisites = async () => {
        if (!token) return;
        // Simple log for conformity: user viewed and accepted pedagogical prerequisites
        await fetch(`http://localhost:3333/auth/verify-prerequisites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ verified: true, type: 'PEDAGOGICAL_ACK' })
        });

        setShowPedagogicalGuide(false);
        setStarted(true);
    };

    if (!started) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-3xl w-full"
                >
                    {!showPedagogicalGuide ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 md:p-10 text-center">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                                    <Target className="text-white" size={32} />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 md:mb-3 uppercase tracking-tight">Test de Positionnement</h1>
                                <p className="text-xs md:text-sm text-indigo-100 font-medium uppercase tracking-widest opacity-80">Découvrons votre niveau CECRL réel</p>
                            </div>


                            {/* Content */}
                            <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                                <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400 text-center leading-relaxed font-medium">
                                    Bienvenue <span className="font-black text-slate-900 dark:text-white">{user?.name}</span> !<br />
                                    Avant de commencer, prenez connaissance des prérequis pédagogiques pour chaque niveau.
                                </p>

                                <div className="grid grid-cols-3 gap-3 md:gap-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-100/10 p-3 md:p-4 rounded-2xl text-center border border-indigo-100 dark:border-indigo-900/30">
                                        <BookOpen className="mx-auto text-indigo-600 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" />
                                        <p className="text-[8px] md:text-[10px] font-black uppercase text-indigo-400">Pédagogie</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-100/10 p-3 md:p-4 rounded-2xl text-center border border-emerald-100 dark:border-emerald-900/30">
                                        <Zap className="mx-auto text-emerald-600 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" />
                                        <p className="text-[8px] md:text-[10px] font-black uppercase text-emerald-400">Adaptatif</p>
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-100/10 p-3 md:p-4 rounded-2xl text-center border border-amber-100 dark:border-amber-900/30">
                                        <Clock className="mx-auto text-amber-600 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" />
                                        <p className="text-[8px] md:text-[10px] font-black uppercase text-amber-400">15 min</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowPedagogicalGuide(true)}
                                    className="w-full py-4 md:py-5 bg-slate-900 dark:bg-indigo-600 text-white font-black text-base md:text-lg rounded-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest"
                                >
                                    Voir les prérequis <ArrowRight size={20} />
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 rounded-xl md:rounded-2xl text-white shrink-0">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Prérequis CECRL</h2>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Cadre Européen de Référence</p>
                                    </div>
                                </div>

                                <div className="space-y-2 md:space-y-3">
                                    {levels.map((l) => (
                                        <div key={l.id} className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3 md:gap-4">
                                            <div className="shrink-0 px-2 py-1 bg-white dark:bg-slate-700 rounded-lg text-indigo-600 font-black text-[10px] md:text-sm shadow-sm">{l.id}</div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-xs md:text-sm uppercase tracking-tight">{l.title}</h4>
                                                <p className="text-[9px] md:text-xs text-slate-500 leading-tight font-medium">{l.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex gap-3 border border-blue-100 dark:border-blue-800">
                                    <Info className="text-blue-600 shrink-0" size={16} />
                                    <p className="text-[9px] md:text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed italic font-medium">
                                        En continuant, vous confirmez avoir pris connaissance de ces niveaux. Le diagnostic vous aidera à confirmer votre positionnement exact.
                                    </p>
                                </div>

                                <div className="flex gap-3 md:gap-4 flex-col sm:flex-row">
                                    <button
                                        onClick={() => setShowPedagogicalGuide(false)}
                                        className="w-full sm:flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                                    >
                                        Retour
                                    </button>
                                    <button
                                        onClick={handleAcceptPrerequisites}
                                        className="w-full sm:flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                    >
                                        Accepter & Commencer <Zap size={16} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
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
