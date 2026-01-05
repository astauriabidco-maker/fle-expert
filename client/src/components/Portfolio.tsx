import React, { useState, useEffect } from 'react';
import {
    Plus,
    Image as ImageIcon,
    FileText,
    CheckCircle,
    Clock,
    WifiOff,
    CloudLightning,
    Send
} from 'lucide-react';

interface Proof {
    id: string;
    title: string;
    type: string;
    description: string;
    status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'OFFLINE';
    createdAt: string;
    proofUrl?: string;
}

export const Portfolio: React.FC<{ organizationId: string; userId: string; token: string }> = ({ organizationId, userId, token }) => {
    const [proofs, setProofs] = useState<Proof[]>([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isAdding, setIsAdding] = useState(false);
    const [newProof, setNewProof] = useState({ title: '', type: 'PRACTICE', description: '' });

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineProofs();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        fetchProofs();
        loadOfflineProofs();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchProofs = async () => {
        try {
            const res = await fetch(`http://localhost:3333/proofs/mine`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProofs(prev => {
                    const offline = prev.filter(p => p.status === 'OFFLINE');
                    return [...offline, ...data];
                });
            }
        } catch (err) {
            console.error("Failed to fetch proofs", err);
        }
    };

    const loadOfflineProofs = () => {
        const saved = localStorage.getItem(`offline_proofs_${userId}`);
        if (saved) {
            const offline = JSON.parse(saved).map((p: any) => ({ ...p, status: 'OFFLINE' }));
            setProofs(prev => {
                const online = prev.filter(p => p.status !== 'OFFLINE');
                return [...offline, ...online];
            });
        }
    };

    const syncOfflineProofs = async () => {
        const saved = localStorage.getItem(`offline_proofs_${userId}`);
        if (!saved) return;

        const offline = JSON.parse(saved);
        if (offline.length === 0) return;

        console.log("Syncing offline proofs...");
        for (const proof of offline) {
            try {
                const res = await fetch(`http://localhost:3333/proofs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        organizationId,
                        title: proof.title,
                        type: proof.type,
                        description: proof.description
                    })
                });
                if (res.ok) {
                    // Success, remove from local storage after all? 
                    // Better to filter and update at each step
                }
            } catch (err) {
                console.error("Sync failed for", proof.title);
            }
        }
        localStorage.removeItem(`offline_proofs_${userId}`);
        fetchProofs();
    };

    const handleAddProof = async () => {
        if (!newProof.title) return;

        const proofData = {
            id: `offline-${Date.now()}`,
            ...newProof,
            createdAt: new Date().toISOString()
        };

        if (isOnline) {
            try {
                const res = await fetch(`http://localhost:3333/proofs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        organizationId,
                        ...newProof
                    })
                });
                if (res.ok) {
                    fetchProofs();
                    setIsAdding(false);
                    setNewProof({ title: '', type: 'PRACTICE', description: '' });
                    return;
                }
            } catch (err) {
                console.warn("Upload failed, saving offline", err);
            }
        }

        // Logic for Offline or Failed Online
        const saved = localStorage.getItem(`offline_proofs_${userId}`);
        const offline = saved ? JSON.parse(saved) : [];
        offline.push(proofData);
        localStorage.setItem(`offline_proofs_${userId}`, JSON.stringify(offline));

        loadOfflineProofs();
        setIsAdding(false);
        setNewProof({ title: '', type: 'PRACTICE', description: '' });
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolio de Compétences</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gère tes preuves d'apprentissage même sans connexion.</p>
                </div>
                <div className="flex items-center gap-4">
                    {!isOnline && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-bold">
                            <WifiOff size={14} /> MODE HORS-LIGNE
                        </div>
                    )}
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 font-bold text-sm"
                    >
                        <Plus size={18} /> Ajouter une preuve
                    </button>
                </div>
            </header>

            {isAdding && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-4">Nouvelle Preuve</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Titre</label>
                            <input
                                value={newProof.title}
                                onChange={e => setNewProof(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="ex: Dictée réussie sans faute"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Type</label>
                                <select
                                    value={newProof.type}
                                    onChange={e => setNewProof(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    <option value="PRACTICE">Pratique libre</option>
                                    <option value="EXAM">Examen blanc</option>
                                    <option value="OTHER">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Fichier (Simulé)</label>
                                <div className="w-full h-[48px] bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center px-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-not-allowed">
                                    <ImageIcon size={16} className="mr-2" /> Upload désactivé hors-ligne
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Description / Réflexion</label>
                            <textarea
                                value={newProof.description}
                                onChange={e => setNewProof(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Qu'as-tu appris ? Quelles ont été les difficultés ?"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition-all h-24"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">Annuler</button>
                            <button
                                onClick={handleAddProof}
                                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                            >
                                {!isOnline ? <WifiOff size={16} /> : <Send size={16} />}
                                {isOnline ? 'Publier' : 'Sauvegarder (Hors-ligne)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proofs.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-slate-300" size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ton portfolio est vide</h4>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Commence par ajouter des preuves de tes progrès, même si tu n'as pas internet !</p>
                    </div>
                )}

                {proofs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(proof => (
                    <div key={proof.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg ${proof.status === 'OFFLINE' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                                {proof.type === 'EXAM' ? <FileText size={20} /> : <ImageIcon size={20} />}
                            </div>
                            <div className="flex flex-col items-end">
                                {proof.status === 'OFFLINE' ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full uppercase">
                                        <WifiOff size={10} /> En attente
                                    </span>
                                ) : proof.status === 'VALIDATED' ? (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase">
                                        <CheckCircle size={10} /> Validé
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                                        <Clock size={10} /> En cours
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-400 mt-1 font-medium italic">
                                    {new Date(proof.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <h4 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                            {proof.title}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                            {proof.description || "Aucune description fournie."}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4 mt-auto">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900"></div>
                                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold">AI</div>
                            </div>
                            {proof.status === 'OFFLINE' && isOnline && (
                                <button className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:underline">
                                    <CloudLightning size={12} /> Sync maintenant
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
