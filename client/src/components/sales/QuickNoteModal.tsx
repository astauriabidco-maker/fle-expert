import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface QuickNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateName: string;
    onSuccess: () => void;
}

const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
    isOpen,
    onClose,
    candidateId,
    candidateName,
    onSuccess,
}) => {
    const { token } = useAuth();
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!note.trim() || !token) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3333/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    candidateId,
                    type: 'NOTE',
                    content: note,
                })
            });
            if (res.ok) {
                setNote('');
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Failed to add quick note:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-[70] overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">Note Rapide</h3>
                                <p className="text-slate-500 text-sm">Pour {candidateName}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6">
                            <textarea
                                autoFocus
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Taper votre note ici..."
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:ring-2 ring-blue-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="p-6 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !note.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Enregistrer
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default QuickNoteModal;
