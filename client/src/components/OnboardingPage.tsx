
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Lien manquant ou invalide');
            setLoading(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`http://localhost:3333/onboarding/verify/${token}`);
                if (!res.ok) throw new Error('Lien invalide ou expiré');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError('Ce lien d\'invitation ne semble plus valide (expiré ou déjà utilisé).');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:3333/onboarding/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            if (!res.ok) throw new Error('Erreur lors de l\'activation');

            // Success! Redirect to login
            navigate(`/login?email=${encodeURIComponent(data.user.email)}&activated=true`);
        } catch (err) {
            alert("Une erreur est survenue lors de l'activation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Lien invalide</h1>
            <p className="text-slate-400 max-w-md">{error}</p>
            <button
                onClick={() => navigate('/login')}
                className="mt-8 text-emerald-500 font-bold hover:underline"
            >
                Retour à la connexion
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col md:flex-row">
            {/* Left Side: Brand & Welcome */}
            <div className="md:w-1/2 bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-12 flex flex-col justify-between border-r border-slate-800">
                <div>
                    {data?.organization?.logoUrl ? (
                        <img src={data.organization.logoUrl} alt="Logo" className="h-12 mb-8" />
                    ) : (
                        <h2 className="text-2xl font-black text-white mb-8 tracked-tighter">FLE<span className="text-emerald-500">EXPERT</span></h2>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-5xl font-black text-white mb-6 leading-tight">
                            Bienvenue, <br />
                            <span className="text-emerald-400">{data?.user?.name}</span> !
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed max-w-md">
                            Votre espace personnel est prêt. Définissez votre mot de passe secret pour commencer votre parcours d'apprentissage.
                        </p>
                    </motion.div>
                </div>

                <div className="hidden md:block">
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div className="text-white font-bold">Inclus dans votre invitation</div>
                        </div>
                        <ul className="space-y-2 text-slate-400 ml-14">
                            <li>• Accès complet à la plateforme</li>
                            <li>• Diagnostic de niveau IA offert</li>
                            <li>• Suivi par votre coach dédié</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="md:w-1/2 p-12 flex items-center justify-center">
                <div className="w-full max-w-md">
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        onSubmit={handleActivate}
                        className="space-y-6"
                    >
                        <div>
                            <label className="block text-slate-400 text-sm font-bold mb-2 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                value={data?.user?.email}
                                disabled
                                className="w-full bg-slate-900 border border-slate-800 text-slate-500 px-4 py-3 rounded-xl cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-white text-sm font-bold mb-2 uppercase tracking-wider">Créer un mot de passe</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="8 caractères minimum"
                                    className="w-full bg-slate-800 border-2 border-transparent focus:border-emerald-500 focus:bg-slate-900 text-white px-4 py-3 rounded-xl outline-none transition-all placeholder:text-slate-600"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Utilisez au moins 8 caractères pour sécuriser votre compte.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <>Activer mon compte <ArrowRight size={20} /></>}
                        </button>
                    </motion.form>
                </div>
            </div>
        </div>
    );
}
