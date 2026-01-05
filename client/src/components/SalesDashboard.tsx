
import React, { useState, useEffect } from 'react';

import {
    Users,
    ClipboardList,
    TrendingUp,
    DollarSign,
    Plus,
    FileText,
    Search,
    Mail,
    ArrowRight,
    CheckCircle2,
    X,
    Loader2,
    Copy,
    Share2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';

const SalesDashboard: React.FC = () => {
    const { organization, token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState<any>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [statsRes, candidatesRes] = await Promise.all([
                fetch('http://localhost:3333/sales/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3333/sales/candidates', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (candidatesRes.ok) setCandidates(await candidatesRes.json());
        } catch (error) {
            console.error("Sales Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateCandidate = async (e: React.FormEvent, data: any) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3333/sales/candidates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                fetchData(); // Refresh list
            } else {
                alert("Erreur lors de la création");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleGenerateLink = async (candidateId: string) => {
        try {
            const res = await fetch('http://localhost:3333/sales/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ candidateId })
            });
            if (res.ok) {
                const data = await res.json();
                setIsLinkModalOpen({ link: data.link });
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] p-6 font-sans text-white">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1E293B]/50 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-xl">
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Espace Commercial
                        </h1>
                        <p className="text-slate-400 font-medium mt-1">
                            {organization?.name} • Votre Pipeline de Vente
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={20} />
                            Nouveau Prospect
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Users className="text-blue-400" />}
                        label="Prospects Actifs"
                        value={stats?.activeLeads || 0}
                        loading={loading}
                    />
                    <StatCard
                        icon={<ClipboardList className="text-amber-400" />}
                        label="Devis en attente"
                        value={stats?.pendingQuotes || 0}
                        loading={loading}
                    />
                    <StatCard
                        icon={<TrendingUp className="text-emerald-400" />}
                        label="Taux Conversion"
                        value={stats?.conversionRate || '0%'}
                        loading={loading}
                    />
                    <StatCard
                        icon={<DollarSign className="text-indigo-400" />}
                        label="C.A Mensuel"
                        value={stats?.monthlyRevenue || '0€'}
                        loading={loading}
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CRM Table */}
                    <div className="lg:col-span-3 bg-[#1E293B]/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users size={24} className="text-slate-400" />
                                Gestion des Candidats
                            </h2>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un nom, email..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 ring-blue-500 outline-none transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none focus:ring-2 ring-blue-500"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">Tous les statuts</option>
                                    <option value="PROSPECT">Prospects</option>
                                    <option value="DIAGNOSTIC_FAIT">Diagnostic Fait</option>
                                    <option value="DEVIS_EN_COURS">Devis en cours</option>
                                    <option value="INSCRIT">Inscrits</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#1E293B] text-slate-400 text-xs font-bold uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="p-6">Candidat</th>
                                        <th className="p-6">Statut</th>
                                        <th className="p-6">Dernière Activité</th>
                                        <th className="p-6">Niveau Cible</th>
                                        <th className="p-6 text-right">Actions Rapides</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-sm">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-20 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" /> Chargement...</td></tr>
                                    ) : filteredCandidates.length === 0 ? (
                                        <tr><td colSpan={5} className="p-20 text-center text-slate-500 italic">Aucun candidat trouvé. Ajoutez-en un !</td></tr>
                                    ) : filteredCandidates.map((c) => (
                                        <tr key={c.id} className="group hover:bg-slate-800/30 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700">
                                                        {c.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-base">{c.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                            <Mail size={10} /> {c.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="p-6 text-slate-400 font-medium">
                                                {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : 'Jamais'}
                                            </td>
                                            <td className="p-6">
                                                <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 border border-slate-700">
                                                    {c.level || '?'} → {c.targetLevel || 'B2'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleGenerateLink(c.id)}
                                                        className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors tooltip"
                                                        title="Envoyer Test"
                                                    >
                                                        <Share2 size={18} />
                                                    </button>
                                                    <button className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
                                                        <FileText size={18} />
                                                    </button>
                                                    <button className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors">
                                                        <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddCandidateModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateCandidate}
            />

            <AnimatePresence>
                {isLinkModalOpen && (
                    <LinkModal
                        isOpen={!!isLinkModalOpen}
                        onClose={() => setIsLinkModalOpen(null)}
                        link={isLinkModalOpen?.link}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components

function StatCard({ icon, label, value, loading }: any) {
    return (
        <div className="bg-[#1E293B]/50 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 flex items-center gap-5 hover:border-slate-700 transition-colors group">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
                ) : (
                    <p className="text-2xl font-black text-white">{value}</p>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'PROSPECT': 'bg-slate-800 text-slate-400 border-slate-700',
        'DIAGNOSTIC_FAIT': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'DEVIS_EN_COURS': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        'INSCRIT': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    };
    const labels: any = {
        'PROSPECT': 'Nouveau',
        'DIAGNOSTIC_FAIT': 'Diag. Terminé',
        'DEVIS_EN_COURS': 'Offre Envoyée',
        'INSCRIT': 'Inscrit'
    };

    return (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles['PROSPECT']}`}>
            {labels[status] || status}
        </span>
    );
}

function AddCandidateModal({ isOpen, onClose, onSubmit }: any) {
    const [formData, setFormData] = useState({ name: '', email: '', targetLevel: 'B2' });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Nouveau Prospect</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white" /></button>
                </div>
                <form onSubmit={(e) => onSubmit(e, formData)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Nom Complet</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 ring-blue-500 outline-none"
                                placeholder="ex: Jean Dupont"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Email</label>
                            <input
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 ring-blue-500 outline-none"
                                type="email"
                                placeholder="jean@exemple.fr"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Objectif visé</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 ring-blue-500 outline-none"
                                value={formData.targetLevel}
                                onChange={e => setFormData({ ...formData, targetLevel: e.target.value })}
                            >
                                <option value="A2">A2 (Basique)</option>
                                <option value="B1">B1 (Intermédiaire)</option>
                                <option value="B2">B2 (Avancé - Standard)</option>
                                <option value="C1">C1 (Expert)</option>
                            </select>
                        </div>
                    </div>
                    <button className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                        Ajouter au Pipeline
                    </button>
                </form>
            </div>
        </div>
    );
}

function LinkModal({ isOpen, onClose, link }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="p-8 bg-emerald-500/10 border-b border-emerald-500/20 text-center">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Lien Généré !</h3>
                    <p className="text-emerald-400 font-medium">Le candidat peut commencer son diagnostic.</p>
                </div>
                <div className="p-8">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Lien unique de test</label>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={link}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm font-mono"
                        />
                        <button
                            onClick={() => { navigator.clipboard.writeText(link); alert('Copié !'); onClose(); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors"
                        >
                            <Copy size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        Ce lien redirige vers la création de compte et le test de positionnement.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SalesDashboard;
