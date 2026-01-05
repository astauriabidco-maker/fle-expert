import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, Building2, CreditCard, Search } from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    slug: string;
    creditsBalance: number;
    status: string; // e.g., 'ACTIVE'
}

interface Stats {
    totalUsers: number;
    totalOrgs: number;
    totalRevenue: number;
}

export default function SuperAdminPanel() {
    const { token } = useAuth();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalOrgs: 0, totalRevenue: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // État pour le formulaire de création d'organisation
    const [newOrg, setNewOrg] = useState({ name: '', slug: '', adminEmail: '', initialCredits: 500 });

    // Dummy data for now since backend API isn't fully ready/connected in frontend logic yet, 
    // but keeping structure for API call
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const [statsRes, orgsRes] = await Promise.all([
                    fetch('http://localhost:3333/admin/stats', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:3333/admin/organizations', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (orgsRes.ok) setOrgs(await orgsRes.json());
            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3333/admin/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newOrg)
            });

            if (!response.ok) throw new Error("Erreur de création");

            const { org } = await response.json();
            setOrgs([org, ...orgs]);
            setIsModalOpen(false);
            setNewOrg({ name: '', slug: '', adminEmail: '', initialCredits: 500 });
        } catch (error) {
            console.error("Failed to create org:", error);
            alert("Erreur lors de la création de l'organisation.");
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
            {/* HEADER & STATS */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Console Super-Admin</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} /> Nouvel Organisme
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatCard icon={<Building2 />} label="Organismes" value={stats.totalOrgs} color="text-blue-600" />
                <StatCard icon={<Users />} label="Candidats Totaux" value={stats.totalUsers} color="text-green-600" />
                <StatCard icon={<CreditCard />} label="Chiffre d'Affaires" value={`${stats.totalRevenue} €`} color="text-purple-600" />
            </div>

            {/* LISTE DES ORGANISMES */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
                    <h2 className="font-semibold dark:text-white">Organismes de Formation Partenaires</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input type="text" placeholder="Rechercher un centre..." className="pl-10 pr-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md text-sm outline-none focus:ring-2 ring-blue-500" />
                    </div>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 text-sm uppercase">
                        <tr>
                            <th className="p-4 font-medium">Nom / Slug</th>
                            <th className="p-4 font-medium">Solde Crédits</th>
                            <th className="p-4 font-medium">Statut</th>
                            <th className="p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Chargement...</td></tr>
                        ) : orgs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Aucun organisme trouvé.</td></tr>
                        ) : orgs.map(org => (
                            <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold dark:text-white">{org.name}</div>
                                    <div className="text-xs text-gray-400 dark:text-slate-500">slug: {org.slug}</div>
                                </td>
                                <td className="p-4 font-mono text-blue-700 dark:text-blue-400">{org.creditsBalance.toLocaleString()} 🪙</td>
                                <td className="p-4"><span className="bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold">ACTIF</span></td>
                                <td className="p-4"><button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Gérer</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODALE DE CRÉATION (Simplifiée) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleCreateOrg} className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-bold mb-6 dark:text-white">Ajouter un Centre</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nom de l'OF" className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-blue-500" required
                                value={newOrg.name}
                                onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} />
                            <input type="text" placeholder="Slug (ex: alliance-paris)" className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-blue-500" required
                                value={newOrg.slug}
                                onChange={e => setNewOrg({ ...newOrg, slug: e.target.value })} />
                            <input type="email" placeholder="Email de l'admin centre" className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-blue-500" required
                                value={newOrg.adminEmail}
                                onChange={e => setNewOrg({ ...newOrg, adminEmail: e.target.value })} />
                            <input type="number" placeholder="Crédits initiaux" className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:ring-2 ring-blue-500" required
                                value={newOrg.initialCredits}
                                onChange={e => setNewOrg({ ...newOrg, initialCredits: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border dark:border-slate-700 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
                            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all">Créer</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
            <div className={`p-3 rounded-full bg-gray-50 dark:bg-slate-800 ${color}`}>{icon}</div>
            <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
                <p className="text-2xl font-bold dark:text-white">{value}</p>
            </div>
        </div>
    );
}
