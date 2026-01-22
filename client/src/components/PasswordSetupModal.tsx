import React, { useState } from 'react';

interface PasswordSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PasswordSetupModal: React.FC<PasswordSetupModalProps> = ({ isOpen, onClose }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Le mot de passe doit faire au moins 8 caractères.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('http://localhost:3333/auth/set-password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                setIsSuccess(true);
                // Mark in localStorage that password is set to avoid showing modal again
                localStorage.setItem('passwordSet', 'true');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Une erreur est survenue lors de l'enregistrement.");
            }
        } catch (err) {
            setError("Erreur de connexion au serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                {!isSuccess ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Sécurisez vos résultats 🔒</h2>
                        <p className="text-slate-500 mb-8 font-medium">
                            Félicitations ! Votre diagnostic est terminé. Créez un mot de passe pour sauvegarder vos résultats et y accéder plus tard.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    placeholder="Nouveau mot de passe"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Confirmer le mot de passe"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            {error && (
                                <p className="text-rose-500 text-sm font-bold bg-rose-50 py-2 rounded-xl">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
                            >
                                {isLoading ? 'Enregistrement...' : 'Enregistrer mon accès'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Accès sécurisé !</h2>
                        <p className="text-slate-500 font-medium">Vos résultats sont maintenant sauvegardés.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordSetupModal;
