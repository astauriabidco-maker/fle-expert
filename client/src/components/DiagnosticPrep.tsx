import React, { useState } from 'react';
import {
    ShieldCheck,
    Mic,
    Volume2,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DiagnosticPrep: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [micPermission, setMicPermission] = useState<boolean | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    React.useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            verifySession(sessionId);
        }
    }, [searchParams]);

    const verifySession = async (sessionId: string) => {
        setIsVerifying(true);
        try {
            const res = await fetch(`http://localhost:3333/payments/b2c-verify/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                login(data.access_token, data.user, data.organization);
            }
        } catch (error) {
            console.error("Session verification failed:", error);
        } finally {
            setIsVerifying(false);
        }
    };

    const checkMicPermission = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicPermission(true);
            setStep(2);
        } catch (err) {
            setMicPermission(false);
            console.error("Mic error:", err);
        }
    };

    const startTest = () => {
        navigate('/diagnostic');
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Vérification de votre paiement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-900">
            <div className="max-w-xl w-full">
                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mb-10">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-indigo-600' : 'w-6 bg-slate-200'}`}
                        />
                    ))}
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-slate-100">
                    <div className="p-10 text-center">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <ShieldCheck size={40} />
                                </div>
                                <h1 className="text-3xl font-black mb-4 tracking-tight">On y est ! 🚀</h1>
                                <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
                                    Votre paiement a été validé. Avant de commencer l'évaluation, vérifions que tout est prêt pour que votre expérience soit parfaite.
                                </p>
                                <button
                                    onClick={checkMicPermission}
                                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    Vérifier mon équipement <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <Mic size={40} />
                                </div>
                                <h1 className="text-3xl font-black mb-4 tracking-tight">Micro OK ✅</h1>
                                <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
                                    Excellent, votre micro fonctionne correctement. Vous allez devoir parler à l'IA pendant le test.
                                </p>

                                <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl mb-10 text-left space-y-4">
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Conseils pour le test</div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm font-bold text-slate-600">Assurez-vous d'être dans un endroit calme.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm font-bold text-slate-600">Utilisez de préférence des écouteurs pour mieux entendre.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm font-bold text-slate-600">Prévoyez environ 20 minutes sans interruption.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(3)}
                                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-indigo-100"
                                >
                                    Je suis prêt <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200">
                                    <Sparkles size={48} className="animate-pulse" />
                                </div>
                                <h1 className="text-4xl font-black mb-4 tracking-tighter">C'est parti !</h1>
                                <p className="text-slate-500 font-medium mb-12 leading-relaxed text-xl">
                                    Prêt à découvrir votre véritable niveau ? Cliquez sur le bouton ci-dessous pour lancer l'IA.
                                </p>

                                <button
                                    onClick={startTest}
                                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-2xl hover:bg-slate-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-200"
                                >
                                    COMMENCER LE TEST
                                </button>

                                <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    <Volume2 size={14} /> Montez le son de votre appareil
                                </div>
                            </div>
                        )}

                        {micPermission === false && (
                            <div className="mt-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold">
                                <AlertCircle size={18} />
                                L'accès au micro est requis pour passer le test oral.
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Besoin d'aide ?</p>
                    <button className="text-indigo-600 font-black text-sm hover:underline">Contacter le support PrepTEF</button>
                </div>
            </div>
        </div>
    );
};

export default DiagnosticPrep;
