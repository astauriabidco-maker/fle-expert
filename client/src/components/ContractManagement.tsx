
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    FileText,
    Plus,
    DollarSign,
    Clock,
    Trash2,
    Search,
    User,
    Building2,
    CheckCircle,
    AlertCircle,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Contract {
    id: string;
    startDate: string;
    endDate?: string;
    hourlyRate: number;
    totalHours: number;
    status: string;
    formateurId: string;
    formateur: {
        id: string;
        name: string;
        email: string;
    };
    organizationId: string;
    organization?: {
        id: string;
        name: string;
    };
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function ContractManagement() {
    const { token } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [formateurs, setFormateurs] = useState<User[]>([]);
    const [organizations, setOrganizations] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    const [newContract, setNewContract] = useState({
        formateurId: '',
        organizationId: user?.role === 'SUPER_ADMIN' ? '' : (user as any)?.organizationId || '',
        startDate: '',
        endDate: '',
        hourlyRate: 0,
        totalHours: 0,
    });

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const endpoints = [
                fetch('http://localhost:3333/contracts', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3333/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
            ];

            if (user?.role === 'SUPER_ADMIN') {
                endpoints.push(fetch('http://localhost:3333/admin/organizations', { headers: { 'Authorization': `Bearer ${token}` } }));
            }

            const results = await Promise.all(endpoints);
            const [contractsRes, usersRes, orgsRes] = results;

            if (contractsRes.ok) setContracts(await contractsRes.json());
            if (usersRes.ok) {
                const allUsers = await usersRes.json();
                setFormateurs(allUsers.filter((u: User) => u.role === 'COACH' || u.role === 'ADMIN'));
            }
            if (orgsRes && orgsRes.ok) {
                setOrganizations(await orgsRes.json());
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3333/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newContract)
            });

            if (response.ok) {
                const created = await response.json();
                setContracts([created, ...contracts]);
                setIsCreateModalOpen(false);
                setNewContract({ formateurId: '', startDate: '', endDate: '', hourlyRate: 0, totalHours: 0, ...(user?.role !== 'SUPER_ADMIN' ? { organizationId: (user as any).organizationId } : { organizationId: '' }) } as any);
            }
        } catch (error) {
            console.error("Create contract error:", error);
        }
    };

    const handleToggleStatus = async (contract: Contract) => {
        const newStatus = contract.status === 'ACTIVE' ? 'CLÔTURÉ' : 'ACTIVE';
        try {
            const response = await fetch(`http://localhost:3333/contracts/${contract.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setContracts(contracts.map(c => c.id === contract.id ? { ...c, status: newStatus } : c));
            }
        } catch (error) {
            console.error("Status update error:", error);
        }
    };

    const handleDeleteContract = async (id: string) => {
        if (!window.confirm("Supprimer ce contrat ?")) return;
        try {
            const response = await fetch(`http://localhost:3333/contracts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setContracts(contracts.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const filteredContracts = contracts.filter(c =>
        c.formateur?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.formateur?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: contracts.length,
        active: contracts.filter(c => c.status === 'ACTIVE').length,
        totalBilling: contracts.reduce((acc, c) => acc + (c.hourlyRate * c.totalHours), 0)
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <FileText className="text-blue-600" /> Gestion des Contrats
                </h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20"
                >
                    <Plus size={18} /> Nouveau Contrat
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Contrats Actifs"
                    value={stats.active}
                    icon={<Activity className="text-emerald-500" />}
                    subValue={`${stats.total} total`}
                />
                <StatCard
                    label="Engagement Total"
                    value={`${stats.totalBilling.toLocaleString()} €`}
                    icon={<DollarSign className="text-blue-500" />}
                />
                <StatCard
                    label="Volume Horaire"
                    value={`${contracts.reduce((acc, c) => acc + c.totalHours, 0)} h`}
                    icon={<Clock className="text-amber-500" />}
                />
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un formateur ou une organisation..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl border-none focus:ring-2 ring-blue-500 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Chargement...</div>
                ) : filteredContracts.length === 0 ? (
                    <div className="col-span-full py-24 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                            <FileText size={48} className="opacity-20" />
                            <p className="font-bold">Aucun contrat trouvé</p>
                        </div>
                    </div>
                ) : filteredContracts.map(contract => (
                    <div key={contract.id} className="bg-white dark:bg-slate-900 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className={`h-1.5 w-full ${contract.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                        {(contract.formateur?.name?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{contract.formateur?.name || 'Inconnu'}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1">{contract.formateur?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleStatus(contract)}
                                    className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${contract.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {contract.status}
                                </button>
                            </div>

                            {contract.organization && (
                                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <Building2 size={12} className="text-slate-400" />
                                    <span className="text-[10px] font-black uppercase text-slate-500 truncate">{contract.organization.name}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Taux Horaire</span>
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{contract.hourlyRate} €/h</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Total Heures</span>
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{contract.totalHours} h</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Montant Total</span>
                                    <p className="font-bold text-sm text-blue-600">{contract.hourlyRate * contract.totalHours} €</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Date Début</span>
                                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{new Date(contract.startDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t dark:border-slate-800 flex justify-between items-center">
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                    {contract.status === 'ACTIVE' ? <CheckCircle size={10} className="text-emerald-500" /> : <AlertCircle size={10} className="text-amber-500" />}
                                    Contrat {contract.status === 'ACTIVE' ? 'en cours' : 'clôturé'}
                                </p>
                                <button
                                    onClick={() => handleDeleteContract(contract.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-all"
                                    title="Supprimer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-8 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-6">Nouveau Contrat</h3>
                            <form onSubmit={handleCreateContract} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Formateur</label>
                                    <select
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                        value={newContract.formateurId}
                                        onChange={e => setNewContract({ ...newContract, formateurId: e.target.value })}
                                        required
                                    >
                                        <option value="">Sélectionner un formateur</option>
                                        {formateurs.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date de début</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                            value={newContract.startDate}
                                            onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date de fin (Optionnel)</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                            value={newContract.endDate}
                                            onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Taux Horaire (€)</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                            value={newContract.hourlyRate}
                                            onChange={e => setNewContract({ ...newContract, hourlyRate: parseFloat(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Total Heures</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                            value={newContract.totalHours}
                                            onChange={e => setNewContract({ ...newContract, totalHours: parseFloat(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                {user?.role === 'SUPER_ADMIN' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Organisation</label>
                                        <select
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                            value={newContract.organizationId}
                                            onChange={e => setNewContract({ ...newContract, organizationId: e.target.value })}
                                            required
                                        >
                                            <option value="">Sélectionner une organisation</option>
                                            {organizations.map(o => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        Créer le contrat
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon, subValue }: { label: string, value: string | number, icon: React.ReactNode, subValue?: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h4>
                    {subValue && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
                </div>
            </div>
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center">
                {icon}
            </div>
        </div>
    );
}
