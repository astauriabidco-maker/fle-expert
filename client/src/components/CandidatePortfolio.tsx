import React, { useState, useEffect } from 'react';
import { Plus, Wifi, WifiOff, RefreshCw, UploadCloud } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { offlineStorage } from '../services/offline-storage';
import type { OfflineProof } from '../services/offline-storage';

const CandidatePortfolio: React.FC = () => {
    const { token, organization } = useAuth();
    const [proofs, setProofs] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('ESSAY');
    const [desc, setDesc] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string, text: string } | null>(null);

    // Offline Handling
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingProofs, setPendingProofs] = useState<OfflineProof[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchProofs();
        loadPendingProofs();

        const handleOnline = () => {
            setIsOnline(true);
            syncProofs();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadPendingProofs = async () => {
        const pending = await offlineStorage.getPendingProofs();
        setPendingProofs(pending);
    };

    const fetchProofs = async () => {
        if (!token || !navigator.onLine) return; // Don't fetch if offline
        try {
            const res = await fetch('http://localhost:3333/proofs/mine', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setProofs(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const syncProofs = async () => {
        const pending = await offlineStorage.getPendingProofs();
        if (pending.length === 0) return;

        setIsSyncing(true);
        let syncedCount = 0;

        for (const proof of pending) {
            try {
                const res = await fetch('http://localhost:3333/proofs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: proof.title,
                        type: proof.type,
                        description: proof.description,
                        proofUrl: proof.proofUrl,
                        organizationId: proof.organizationId
                    })
                });

                if (res.ok) {
                    if (proof.id) await offlineStorage.removeProof(proof.id);
                    syncedCount++;
                }
            } catch (err) {
                console.error("Sync failed for proof", proof.title, err);
            }
        }

        setIsSyncing(false);
        await loadPendingProofs();
        if (syncedCount > 0) {
            fetchProofs();
            setMessage({ type: 'success', text: `${syncedCount} preuves synchronisées !` });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const newProofData = {
            organizationId: organization?.id || '',
            title,
            type,
            description: desc,
            proofUrl: url,
        };

        if (!isOnline) {
            // Offline Save
            try {
                await offlineStorage.saveProof({
                    ...newProofData,
                    tempId: crypto.randomUUID(),
                    createdAt: new Date().toISOString()
                });
                setMessage({ type: 'success', text: "Sauvegardé hors-ligne. Sera synchro au retour du réseau." });
                await loadPendingProofs();
                resetForm();
            } catch (err) {
                setMessage({ type: 'error', text: "Erreur sauvegarde locale." });
            } finally {
                setLoading(false);
            }
            return;
        }

        // Online Save
        try {
            const res = await fetch('http://localhost:3333/proofs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newProofData)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: "Preuve soumise avec succès !" });
                resetForm();
                fetchProofs();
            } else {
                setMessage({ type: 'error', text: "Erreur lors de l'envoi." });
            }
        } catch (err) {
            console.error(err);
            // Fallback to offline if fetch fails (network interruption)
            try {
                await offlineStorage.saveProof({
                    ...newProofData,
                    tempId: crypto.randomUUID(),
                    createdAt: new Date().toISOString()
                });
                setMessage({ type: 'success', text: "Réseau instable. Sauvegardé hors-ligne." });
                await loadPendingProofs();
                resetForm();
            } catch (fallbackErr) {
                setMessage({ type: 'error', text: "Erreur technique majeure." });
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDesc('');
        setUrl('');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Submission Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                {/* Network Status Badge */}
                <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {isOnline ? 'Online' : 'Mode Hors-ligne'}
                </div>

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Plus className="text-blue-600" /> Nouvelle Soumission
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Titre de l'activité</label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                            placeholder="Ex: Rédaction sur l'écologie"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Type</label>
                            <select
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="ESSAY">Production Écrite</option>
                                <option value="ORAL">Production Orale</option>
                                <option value="WORKSHOP">Atelier / Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Lien (Drive, YouTube...)</label>
                            <input
                                type="url"
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                placeholder="https://..."
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Description / Contexte</label>
                        <textarea
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl min-h-[100px]"
                            placeholder="Expliquez brièvement votre travail..."
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 ${isOnline
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-600 text-white hover:bg-slate-700'
                            }`}
                    >
                        {loading ? 'Traitement...' : isOnline ? 'Soumettre (Online)' : 'Sauvegarder (Offline)'}
                        {!isOnline && <WifiOff size={16} />}
                    </button>
                    {message && (
                        <div className={`p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </div>

            {/* Lists: Pending & History */}
            <div className="space-y-6">

                {/* Pending / Offline Queue */}
                {pendingProofs.length > 0 && (
                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <UploadCloud size={20} /> En attente de synchro ({pendingProofs.length})
                            </h4>
                            {isOnline && !isSyncing && (
                                <button
                                    onClick={syncProofs}
                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <RefreshCw size={12} /> Forcer la synchro
                                </button>
                            )}
                            {isSyncing && <span className="text-xs text-blue-500 animate-pulse">Synchronisation...</span>}
                        </div>
                        <div className="space-y-3">
                            {pendingProofs.map((proof, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-xl text-sm opacity-70">
                                    <div className="font-bold">{proof.title}</div>
                                    <div className="text-xs text-slate-400">Enregistré le {new Date(proof.createdAt).toLocaleTimeString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main History */}
                {proofs.map(proof => (
                    <div key={proof.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${proof.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-700' :
                                    proof.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {proof.status === 'VALIDATED' ? 'Validé (+20 XP)' : proof.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                                </span>
                                <span className="text-xs text-slate-400">{new Date(proof.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-lg leading-tight mb-1">{proof.title}</h4>
                            <p className="text-slate-500 text-sm line-clamp-2">{proof.description}</p>
                            {proof.feedback && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 italic border-l-2 border-blue-400">
                                    " {proof.feedback} " — Coach
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {proofs.length === 0 && pendingProofs.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <p>Aucune preuve soumise pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidatePortfolio;
