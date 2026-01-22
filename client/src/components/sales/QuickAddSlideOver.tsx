import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Mail,
    Phone,
    Target,
    Calendar,
    UserCheck,
    Send,
    Copy,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Coach {
    id: string;
    name: string;
    email: string;
}

interface QuickAddSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const OBJECTIVES = [
    { value: 'NATURALISATION_B1', label: '🇫🇷 Naturalisation (B1 oral)' },
    { value: 'TITRE_SEJOUR_A2', label: '📄 Titre de séjour (A2)' },
    { value: 'PROFESSIONNEL_C1', label: '💼 Professionnel (C1)' },
    { value: 'ETUDES_B2', label: '🎓 Études supérieures (B2)' },
    { value: 'DECOUVERTE_A1', label: '🌱 Découverte (A1)' },
];

const QuickAddSlideOver: React.FC<QuickAddSlideOverProps> = ({ isOpen, onClose, onSuccess }) => {
    const { token } = useAuth();

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [objective, setObjective] = useState('NATURALISATION_B1');
    const [desiredStartDate, setDesiredStartDate] = useState('');
    const [coachId, setCoachId] = useState('');
    const [sendEmail, setSendEmail] = useState(true);

    // UI State
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<{ link: string; message: string; emailSent: boolean } | null>(null);
    const [error, setError] = useState('');

    // Validation State
    const [emailValid, setEmailValid] = useState<boolean | null>(null);

    // Fetch coaches on open
    useEffect(() => {
        if (isOpen && token) {
            fetch('http://localhost:3333/sales/coaches', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setCoaches(Array.isArray(data) ? data : []))
                .catch(() => setCoaches([]));
        }
    }, [isOpen, token]);

    // Reset form on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setFirstName('');
                setLastName('');
                setEmail('');
                setPhone('');
                setObjective('NATURALISATION_B1');
                setDesiredStartDate('');
                setCoachId('');
                setSendEmail(true);
                setSuccess(null);
                setError('');
                setEmailValid(null);
            }, 300);
        }
    }, [isOpen]);

    // Email validation
    const validateEmail = (value: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailValid(value.length > 0 ? regex.test(value) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3333/sales/quick-add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone: phone || undefined,
                    objective,
                    desiredStartDate: desiredStartDate || undefined,
                    coachId: coachId || undefined,
                    sendEmail
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSuccess({
                    link: data.diagnosticLink,
                    message: data.message,
                    emailSent: data.emailSent
                });
                onSuccess();
            } else {
                const err = await res.json();
                setError(err.message || 'Une erreur est survenue');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (success?.link) {
            navigator.clipboard.writeText(success.link);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#1E293B] border-l border-slate-800 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Ajout Rapide</h2>
                                    <p className="text-xs text-slate-400">Candidat + Test en 30 secondes</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {success ? (
                                /* Success State */
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center"
                                >
                                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                                        <CheckCircle2 className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Candidat Créé !</h3>
                                    <p className="text-emerald-400 font-medium mb-8">{success.message}</p>

                                    <div className="w-full bg-slate-900/50 rounded-2xl p-4 border border-slate-700">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                                            Lien du diagnostic
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={success.link}
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono truncate"
                                            />
                                            <button
                                                onClick={copyToClipboard}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copier
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">
                                            {success.emailSent
                                                ? '✅ Email envoyé automatiquement'
                                                : '📋 Envoyez ce lien par WhatsApp ou SMS'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="mt-8 text-slate-400 hover:text-white font-medium transition-colors"
                                    >
                                        Fermer
                                    </button>
                                </motion.div>
                            ) : (
                                /* Form */
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Identity Section */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <User className="w-3 h-3" /> Identité
                                        </h4>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-slate-400 block mb-1.5">Prénom *</label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={e => setFirstName(e.target.value)}
                                                    placeholder="Jean"
                                                    required
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-400 block mb-1.5">Nom *</label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    placeholder="Dupont"
                                                    required
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <label className="text-xs font-medium text-slate-400 block mb-1.5">Email *</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={e => {
                                                        setEmail(e.target.value);
                                                        validateEmail(e.target.value);
                                                    }}
                                                    placeholder="jean.dupont@email.fr"
                                                    required
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                                {emailValid !== null && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        {emailValid ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        ) : (
                                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-400 block mb-1.5">Téléphone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    placeholder="06 12 34 56 78"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Training Section */}
                                    <div className="space-y-4 pt-4 border-t border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Target className="w-3 h-3" /> Formation
                                        </h4>

                                        <div>
                                            <label className="text-xs font-medium text-slate-400 block mb-1.5">Objectif *</label>
                                            <select
                                                value={objective}
                                                onChange={e => setObjective(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            >
                                                {OBJECTIVES.map(obj => (
                                                    <option key={obj.value} value={obj.value}>{obj.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-400 block mb-1.5">Date de début souhaitée</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input
                                                    type="date"
                                                    value={desiredStartDate}
                                                    onChange={e => setDesiredStartDate(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-400 block mb-1.5">Formateur (optionnel)</label>
                                            <div className="relative">
                                                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <select
                                                    value={coachId}
                                                    onChange={e => setCoachId(e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                >
                                                    <option value="">Assigner plus tard</option>
                                                    {coaches.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    <div className="space-y-4 pt-4 border-t border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Send className="w-3 h-3" /> Actions
                                        </h4>

                                        <label className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-900 transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={sendEmail}
                                                onChange={e => setSendEmail(e.target.checked)}
                                                className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                            />
                                            <div className="flex-1">
                                                <span className="text-white font-medium block">Envoyer l'invitation par email</span>
                                                <span className="text-xs text-slate-500">Le candidat recevra un email avec le lien de test</span>
                                            </div>
                                            <Mail className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                        </label>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Footer */}
                        {!success && (
                            <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !firstName || !lastName || !email || !emailValid}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Création en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Créer & Générer le lien
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuickAddSlideOver;
