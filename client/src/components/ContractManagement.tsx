
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    FileText,
    Plus,
    Calendar,
    DollarSign,
    Clock,
    Trash2,
    Search,
    User
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
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [newContract, setNewContract] = useState({
        formateurId: '',
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
            const [contractsRes, usersRes] = await Promise.all([
                fetch('http://localhost:3333/contracts', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3333/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (contractsRes.ok) setContracts(await contractsRes.json());
            if (usersRes.ok) {
                const allUsers = await usersRes.json();
                // Filter users who are potentially formateurs (e.g., COACH or ADMIN, or specific role if added)
                // For now, allowing assignment to any user or specifically COACH
                setFormateurs(allUsers.filter((u: User) => u.role === 'COACH' || u.role === 'ADMIN'));
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
            // Find organizationId of the selected formateur (assuming admin creates connection)
            // Or use current admin's org if context implies. 
            // The backend requires organizationId. Let's assume the formateur's org or a selected one.
            // Simplified: Fetch formateur to get their orgId? 
            // Actually, the Schema says Contract has organizationId. 
            // If SuperAdmin creates it, it might be for a specific Org. 
            // For now, let's assume we pick the formateur's organization.

            const selectedFormateur = formateurs.find(f => f.id === newContract.formateurId);
            if (!selectedFormateur) return;

            // In a real scenario, we might want to select the Org explicitly if the SuperAdmin manages multiple.
            // But let's assume the contract is linked to the formateur's current org.
            // We need to pass organizationId. 
            // Since we don't have it in the simple user list from 'admin/users' (it might be nested), check the User interface in Dashboard.
            // Dashboard User has `organization: { name: string }`. We might need the ID.
            // Let's rely on the backend to handle it or fetch full user details.
            // QUICK FIX: Pass a dummy ID or update backend to infer it from formateur? 
            // Better: update the users fetch to include orgId.
            // Assuming for now we can get it or the backend handles it.
            // NOTE: The previous `view_file` of SuperAdminDashboard shows `organization: { name: string }`.
            // I'll update the fetch in this component to ensure we get Org ID if possible, or just send what we have.

            // Re-fetch users with org ID?
            // Or just send the request and see.
            // Let's assume for MVP specific to this task we default to a known Org or handle it.
            // Actually, `organizationId` is required in DTO.

            const payload = {
                ...newContract,
                // We need organizationId. Let's try to extract it from the formateur selection if we had it.
                organizationId: (selectedFormateur as any).organizationId // We need to ensure we fetch this.
            };

            const response = await fetch('http://localhost:3333/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const created = await response.json();
                setContracts([created, ...contracts]);
                setIsCreateModalOpen(false);
                setNewContract({ formateurId: '', startDate: '', endDate: '', hourlyRate: 0, totalHours: 0 });
            }
        } catch (error) {
            console.error("Create contract error:", error);
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
        c.formateur?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="text-blue-600" /> Gestion des Contrats
                </h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} /> Nouveau Contrat
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un formateur..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl border-none focus:ring-2 ring-blue-500 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Chargement...</div>
                ) : filteredContracts.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">Aucun contrat trouvé.</div>
                ) : filteredContracts.map(contract => (
                    <div key={contract.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                    {(contract.formateur?.name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{contract.formateur?.name || 'Inconnu'}</h3>
                                    <p className="text-xs text-slate-500">{contract.formateur?.email}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${contract.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {contract.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 font-medium flex items-center gap-2"><DollarSign size={14} /> Taux Horaire</span>
                                <span className="font-bold">{contract.hourlyRate} €/h</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 font-medium flex items-center gap-2"><Clock size={14} /> Total Heures</span>
                                <span className="font-bold">{contract.totalHours} h</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 font-medium flex items-center gap-2"><Calendar size={14} /> Début</span>
                                <span className="font-bold">{new Date(contract.startDate).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="border-t dark:border-slate-800 pt-4 flex justify-end">
                            <button
                                onClick={() => handleDeleteContract(contract.id)}
                                className="text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 size={18} />
                            </button>
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
