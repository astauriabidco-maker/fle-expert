import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Building, CheckCircle, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const RegisterPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const mode = searchParams.get('mode');
    const navigate = useNavigate();
    const { login } = useAuth();

    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [invitationData, setInvitationData] = useState<{ email: string, organizationName: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [manualToken, setManualToken] = useState('');

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        objective: 'NATURALIZATION' // Default
    });

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                // No error, just stop verifying to show Gatekeeper UI or Direct Register
                setVerifying(false);
                return;
            }

            try {
                const res = await fetch(`http://localhost:3333/invitations/verify?token=${token}`);
                if (!res.ok) throw new Error("L'invitation est invalide ou a expiré.");

                const data = await res.json();
                setInvitationData(data);
                setVerifying(false);
            } catch (err: any) {
                setError(err.message);
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const body: any = {
                name: form.name,
                password: form.password,
                objective: form.objective,
                token: token
            };

            if (!token) {
                body.email = form.email;
            }

            const response = await fetch('http://localhost:3333/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors de la création du compte.");
            }

            const data = await response.json();
            login(data.access_token, data.user, data.organization);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualTokenSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualToken.trim()) {
            navigate(`/register?token=${manualToken.trim()}`);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Gatekeeper UI: No Token Provided and not in direct mode
    if (!token && mode !== 'direct') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
                <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                    {/* Left Column: Context */}
                    <div className="bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <ShieldCheck size={300} className="text-white" />
                        </div>

                        <div>
                            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8">
                                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                Accès Sécurisé
                            </div>
                            <h2 className="text-4xl font-black mb-6 leading-tight">Réservé aux <br /><span className="text-indigo-400">Centres Partenaires</span>.</h2>
                            <p className="text-slate-400 font-medium leading-relaxed mb-8">
                                PrepTEF n'est pas ouvert aux inscriptions publiques pour garantir la qualité de la pédagogie et le suivi par des formateurs certifiés.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-4 text-sm font-bold text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle size={14} /></div>
                                    Suivi pédagogique personnalisé
                                </li>
                                <li className="flex items-center gap-4 text-sm font-bold text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle size={14} /></div>
                                    Correction humaine & IA
                                </li>
                                <li className="flex items-center gap-4 text-sm font-bold text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle size={14} /></div>
                                    Certificats officiels
                                </li>
                            </ul>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-800">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Vous n'avez pas d'école ?</p>
                            <button
                                onClick={() => navigate('/register?mode=direct')}
                                className="text-white font-bold hover:text-indigo-400 transition flex items-center gap-2 group text-left"
                            >
                                S'inscrire en Candidat Libre <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="p-12 flex flex-col justify-center">
                        <div className="mb-10">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                <Lock size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">J'ai un code d'invitation</h3>
                            <p className="text-slate-500 font-medium text-sm">Entrez le jeton reçu par email pour activer votre compte.</p>
                        </div>

                        <form onSubmit={handleManualTokenSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Code d'invitation</label>
                                <input
                                    type="text"
                                    value={manualToken}
                                    onChange={(e) => setManualToken(e.target.value)}
                                    placeholder="Collez votre code ici..."
                                    className="w-full mt-2 px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 ring-indigo-50 focus:border-indigo-500 focus:bg-white outline-none transition-all font-mono text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!manualToken.trim()}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Valider mon code
                            </button>
                        </form>

                        <div className="mt-8 text-center pt-8 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Déjà inscrit ?</p>
                            <Link to="/login" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                                Se connecter <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !invitationData && token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border-t-8 border-rose-500">
                    <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="text-rose-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-rose-950 mb-3 tracking-tight">Lien expiré ou invalide</h2>
                    <p className="text-rose-900/60 font-medium mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => navigate('/register')}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-lg active:scale-95"
                    >
                        Réessayer un autre code
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
            <div className="w-full max-w-xl">
                <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative">

                    {/* Top Branding / Welcome */}
                    <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <CheckCircle size={100} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Bienvenue 👋</h1>
                        <p className="text-slate-400 font-medium">
                            {token ? "Finalisez votre inscription pour rejoindre votre centre" : "Commencez votre préparation en Candidat Libre"}
                        </p>
                    </div>

                    <div className="p-10 space-y-8">
                        {token ? (
                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4 ring-4 ring-blue-50/50">
                                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                                    <Building size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest mb-1">Organisation</div>
                                    <div className="text-blue-950 font-black text-lg">{invitationData?.organizationName}</div>
                                    <div className="text-blue-900/60 text-sm font-medium">{invitationData?.email}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-start gap-4 ring-4 ring-indigo-50/50">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest mb-1">Parcours</div>
                                    <div className="text-indigo-950 font-black text-lg">Candidat Libre</div>
                                    <div className="text-indigo-900/60 text-sm font-medium">Accès direct au diagnostic IA</div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700 text-sm font-bold flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nom complet</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 ring-blue-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-300"
                                        placeholder="Alex Dupont"
                                        required
                                    />
                                </div>
                            </div>

                            {!token && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 ring-blue-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-300"
                                            placeholder="votre@email.com"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Quel est votre objectif ?</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'RESIDENCY_MULTI_YEAR', label: 'Carte de Séjour Pluriannuelle', desc: 'Objectif A2', icon: '🆔' },
                                        { id: 'RESIDENCY_10_YEAR', label: 'Carte de Résident (10 ans)', desc: 'Objectif B1', icon: '🪪' },
                                        { id: 'NATURALIZATION', label: 'Nationalité Française', desc: 'Objectif B2', icon: '🇫🇷' },
                                        { id: 'CANADA_IMMIGRATION', label: 'Immigration Canada', desc: 'Objectif B2/C1', icon: '🇨🇦' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setForm({ ...form, objective: opt.id })}
                                            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${form.objective === opt.id ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                        >
                                            <div className="text-2xl">{opt.icon}</div>
                                            <div>
                                                <div className={`font-bold ${form.objective === opt.id ? 'text-blue-900' : 'text-slate-900'}`}>{opt.label}</div>
                                                <div className="text-xs font-bold text-slate-400">{opt.desc}</div>
                                            </div>
                                            {form.objective === opt.id && (
                                                <div className="absolute right-4 text-blue-500">
                                                    <CheckCircle size={20} className="fill-blue-100" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 ring-blue-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-300"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirmation</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="password"
                                            value={form.confirmPassword}
                                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 ring-blue-50/50 focus:border-blue-500 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-300"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-3 text-lg"
                            >
                                {loading ? 'Création...' : 'Créer mon compte'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-50 p-6 text-center text-xs font-bold text-slate-400 border-t border-slate-100">
                        En vous inscrivant, vous acceptez nos <a href="#" className="text-slate-900 hover:underline">conditions d'utilisation</a>
                    </div>
                </div>
                <div className="mt-8 text-center text-sm font-bold text-slate-400">
                    Déjà inscrit ? <Link to="/login" className="text-indigo-600 hover:underline">Se connecter</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
