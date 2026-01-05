import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3333/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Identifiants invalides');
            }

            const data = await response.json();
            login(data.access_token, data.user, data.organization);

            // Navigate to central dashboard selector
            navigate('/dashboard');
        } catch (err) {
            setError("Email ou mot de passe incorrect");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 text-center bg-slate-900 dark:bg-slate-800">
                    <h1 className="text-3xl font-black text-white mb-2">Prep<span className="text-blue-500">TEF</span></h1>
                    <p className="text-slate-400 text-sm font-medium">Connexion à votre espace sécurisé</p>
                </div>

                {error && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 text-sm text-center font-bold border-b border-rose-100 dark:border-rose-900/30">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Professionnel</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 dark:text-slate-600" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:ring-4 ring-blue-50 dark:ring-blue-900/10 focus:border-blue-400 dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium"
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Mot de passe</label>
                            <button
                                type="button"
                                onClick={() => alert("Fonctionnalité de récupération en cours de déploiement. Veuillez contacter votre administrateur.")}
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Oublié ?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 dark:text-slate-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-50 dark:border-slate-800 rounded-2xl focus:ring-4 ring-blue-50 dark:ring-blue-900/10 focus:border-blue-400 dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 dark:bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 dark:hover:shadow-none transition-all shadow-lg active:scale-[0.98]"
                    >
                        Se connecter
                    </button>
                </form>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 text-center text-xs font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800 transition-colors">
                    Pas encore de compte ? <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Contactez votre organisme de formation</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
