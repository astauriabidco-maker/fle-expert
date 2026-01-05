
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Play } from 'lucide-react';

interface BookDemoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BookDemoModal: React.FC<BookDemoModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        schoolName: '',
        contactName: '',
        email: '',
        phone: ''
    });

    // Calendly URL - Placeholder
    const CALENDLY_URL = "https://calendly.com/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Capture Lead in Database
            const response = await fetch('http://localhost:3333/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save lead');

            // 2. Show Success & Redirect
            setStep('success');

            // Auto redirect to Calendly after 2 seconds
            setTimeout(() => {
                window.open(CALENDLY_URL, '_blank');
                onClose();
                // Reset form for next time
                setTimeout(() => {
                    setStep('form');
                    setFormData({ schoolName: '', contactName: '', email: '', phone: '' });
                }, 500);
            }, 2000);

        } catch (error) {
            console.error(error);
            // Fallback: Redirect anyway so we don't block the user
            window.open(CALENDLY_URL, '_blank');
            onClose();
        } finally {
            setIsLoading(false);
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
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl z-[101] border border-slate-100 dark:border-slate-800"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {step === 'form' ? (
                            <>
                                <div className="mb-8 text-center">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Play className="text-indigo-600 dark:text-indigo-400 ml-1" fill="currentColor" size={20} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Démo Stratégique</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                        Dites-nous qui vous êtes pour préparer votre démo.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Établissement</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ex: Alliance Française Tokyo"
                                            value={formData.schoolName}
                                            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Votre Nom</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ex: Jean Dupont"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Pro</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="jean@ecole.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 mt-6"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : 'Accéder au Calendrier'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                    <Check className="text-emerald-600 dark:text-emerald-400" size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">C'est noté !</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Redirection vers l'agenda en cours...
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookDemoModal;
