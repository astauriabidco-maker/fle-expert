import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Mail, Phone, Target, User, Share2, FileText, PhoneCall, Send,
    CheckCircle2, Clock, Copy, Sparkles, MessageSquare, Calendar,
    Plus, Trash2, Download, Eye,
} from 'lucide-react';
import type { Candidate } from './CandidateCard';
import { useAuth } from '../../contexts/AuthContext';

interface CandidateDetailPanelProps {
    candidate: Candidate | null;
    isOpen: boolean;
    onClose: () => void;
    onGenerateLink: (id: string) => void;
}

type TabType = 'overview' | 'timeline' | 'documents' | 'notes';

interface Interaction {
    id: string;
    type: string;
    content?: string;
    createdAt: string;
    user: { name: string };
}

const INTERACTION_ICONS: Record<string, React.ReactNode> = {
    CALL: <PhoneCall className="w-4 h-4" />,
    EMAIL: <Mail className="w-4 h-4" />,
    MEETING: <Calendar className="w-4 h-4" />,
    NOTE: <MessageSquare className="w-4 h-4" />,
};

const INTERACTION_COLORS: Record<string, string> = {
    CALL: 'text-blue-400 bg-blue-500/10',
    EMAIL: 'text-purple-400 bg-purple-500/10',
    MEETING: 'text-emerald-400 bg-emerald-500/10',
    NOTE: 'text-amber-400 bg-amber-500/10',
};

const CandidateDetailPanel: React.FC<CandidateDetailPanelProps> = ({
    candidate,
    isOpen,
    onClose,
    onGenerateLink,
}) => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [linkGenerated, setLinkGenerated] = useState<string | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [newNote, setNewNote] = useState('');
    const [newInteractionType, setNewInteractionType] = useState('NOTE');

    useEffect(() => {
        if (candidate && isOpen) {
            fetchInteractions();
        }
    }, [candidate, isOpen]);

    const fetchInteractions = async () => {
        if (!candidate || !token) return;
        try {
            const res = await fetch(`http://localhost:3333/interactions/${candidate.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInteractions(data);
            }
        } catch (error) {
            console.error('Failed to fetch interactions:', error);
        }
    };

    const addInteraction = async () => {
        if (!candidate || !token || !newNote.trim()) return;
        try {
            const res = await fetch('http://localhost:3333/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    candidateId: candidate.id,
                    type: newInteractionType,
                    content: newNote,
                })
            });
            if (res.ok) {
                setNewNote('');
                fetchInteractions();
            }
        } catch (error) {
            console.error('Failed to add interaction:', error);
        }
    };

    if (!candidate) return null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleGenerateLink = () => {
        onGenerateLink(candidate.id);
        setLinkGenerated(`http://localhost:5173/onboarding?token=demo-${candidate.id}`);
    };

    const copyLink = () => {
        if (linkGenerated) {
            navigator.clipboard.writeText(linkGenerated);
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
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-3xl bg-[#1E293B] border-l border-slate-800 z-50 flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {candidate.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{candidate.name || 'Sans nom'}</h2>
                                    <p className="text-slate-400 text-sm">{candidate.email}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 px-6 pt-4 border-b border-slate-800">
                            {[
                                { id: 'overview', label: 'Vue d\'ensemble', icon: User },
                                { id: 'timeline', label: 'Timeline', icon: Clock },
                                { id: 'documents', label: 'Documents', icon: FileText },
                                { id: 'notes', label: 'Notes', icon: MessageSquare },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white border-b-2 border-blue-500'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Informations */}
                                    <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
                                        <h3 className="text-sm font-bold text-white mb-4">Informations</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-slate-500" />
                                                <span className="text-slate-300 text-sm">{candidate.email}</span>
                                            </div>
                                            {candidate.phone && (
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-slate-500" />
                                                    <span className="text-slate-300 text-sm">{candidate.phone}</span>
                                                </div>
                                            )}
                                            {candidate.targetLevel && (
                                                <div className="flex items-center gap-3">
                                                    <Target className="w-4 h-4 text-slate-500" />
                                                    <span className="text-slate-300 text-sm">
                                                        Objectif : <span className="font-bold text-blue-400">{candidate.targetLevel}</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Diagnostic Result */}
                                    {candidate.hasDiagnostic && (
                                        <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                                            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Diagnostic Terminé
                                            </h3>
                                            <p className="text-sm text-slate-300">Niveau évalué : <span className="font-bold">{candidate.level}</span></p>
                                        </div>
                                    )}

                                    {linkGenerated && (
                                        <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30">
                                            <h3 className="text-sm font-bold text-blue-400 mb-3">Lien généré</h3>
                                            <div className="flex gap-2">
                                                <input
                                                    readOnly
                                                    value={linkGenerated}
                                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono"
                                                />
                                                <button onClick={copyLink} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'timeline' && (
                                <div className="space-y-4">
                                    {interactions.map(interaction => (
                                        <div key={interaction.id} className="flex gap-3">
                                            <div className={`p-2 rounded-lg ${INTERACTION_COLORS[interaction.type] || INTERACTION_COLORS.NOTE}`}>
                                                {INTERACTION_ICONS[interaction.type] || INTERACTION_ICONS.NOTE}
                                            </div>
                                            <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-slate-500">{interaction.type}</span>
                                                    <span className="text-xs text-slate-600">{formatDate(interaction.createdAt)}</span>
                                                </div>
                                                {interaction.content && (
                                                    <p className="text-sm text-slate-300">{interaction.content}</p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-2">Par {interaction.user.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {interactions.length === 0 && (
                                        <p className="text-center text-slate-500 py-8">Aucune interaction enregistrée</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    <p className="text-center text-slate-500 py-8">Aucun document disponible</p>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                        <h3 className="text-sm font-bold text-white mb-3">Ajouter une note</h3>
                                        <select
                                            value={newInteractionType}
                                            onChange={e => setNewInteractionType(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm mb-3"
                                        >
                                            <option value="NOTE">📝 Note</option>
                                            <option value="CALL">📞 Appel</option>
                                            <option value="EMAIL">✉️ Email</option>
                                            <option value="MEETING">📅 RDV</option>
                                        </select>
                                        <textarea
                                            value={newNote}
                                            onChange={e => setNewNote(e.target.value)}
                                            placeholder="Votre note..."
                                            rows={3}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm mb-3 resize-none"
                                        />
                                        <button
                                            onClick={addInteraction}
                                            disabled={!newNote.trim()}
                                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Ajouter
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {interactions.filter(i => i.type === 'NOTE').map(note => (
                                            <div key={note.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-slate-500">{formatDate(note.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-slate-300">{note.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Actions Rapides</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleGenerateLink}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-all"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Lien Diagnostic
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-xl font-bold transition-all">
                                    <FileText className="w-4 h-4" />
                                    Créer Devis
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CandidateDetailPanel;
