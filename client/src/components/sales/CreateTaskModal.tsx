import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, FileText, AlertCircle, Calendar, User } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    candidateId?: string;
    candidateName?: string;
}

const TASK_TYPES = [
    { value: 'CALL', label: '📞 Appel téléphonique', icon: Phone, color: 'blue' },
    { value: 'EMAIL', label: '✉️ Envoyer un email', icon: Mail, color: 'purple' },
    { value: 'QUOTE', label: '📋 Préparer devis', icon: FileText, color: 'amber' },
    { value: 'FOLLOW_UP', label: '🔔 Relance / Suivi', icon: AlertCircle, color: 'emerald' },
];

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    candidateId,
    candidateName,
}) => {
    const [type, setType] = useState('FOLLOW_UP');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3333/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    title,
                    description: description || undefined,
                    dueDate: new Date(dueDate).toISOString(),
                    candidateId: candidateId || undefined,
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
                // Reset form
                setType('FOLLOW_UP');
                setTitle('');
                setDescription('');
                setDueDate('');
            }
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setLoading(false);
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
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-[#1E293B] w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <h2 className="text-xl font-black text-white">Créer une tâche</h2>
                                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {candidateName && (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm text-blue-300">Pour : {candidateName}</span>
                                    </div>
                                )}

                                {/* Type */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                                        Type de tâche
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TASK_TYPES.map(taskType => (
                                            <button
                                                key={taskType.value}
                                                type="button"
                                                onClick={() => setType(taskType.value)}
                                                className={`p-3 rounded-xl border text-left transition-all ${type === taskType.value
                                                    ? `bg-${taskType.color}-500/20 border-${taskType.color}-500/40 text-${taskType.color}-300`
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                <span className="text-sm font-medium">{taskType.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                                        Titre *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Ex: Relancer Jean Dupont"
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                                        Description (optionnel)
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Notes supplémentaires..."
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                    />
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                                        Date et heure *
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="datetime-local"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            required
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                                >
                                    {loading ? 'Création...' : 'Créer la tâche'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CreateTaskModal;
