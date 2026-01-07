import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Calendar, Mail, Building2, Clock } from 'lucide-react';

interface CoachData {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    lastActivityDate: string | null;
    organization: { name: string } | null;
    _count: { students: number };
}

export default function GlobalCoaches() {
    const [coaches, setCoaches] = useState<CoachData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            fetchCoaches();
        }
    }, [token]);

    const fetchCoaches = async () => {
        try {
            const res = await fetch('http://localhost:3333/admin/oversight/coaches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCoaches(data);
            }
        } catch (error) {
            console.error("Fetch coaches error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCoaches = coaches.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Suivi des Formateurs</h2>
                    <p className="text-slate-400">Vue d'ensemble de l'activité des {coaches.length} formateurs de la plateforme.</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                        {coaches.reduce((acc, c) => acc + c._count.students, 0)}
                    </div>
                    <div className="text-xs uppercase font-black text-slate-500 tracking-wider">Élèves Totaux</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Chercher par nom ou organisation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 ring-blue-500/50 outline-none transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-800/30">
                            <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Nom / Contact</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Organisation</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Activité</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Élèves</th>
                            <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="p-12"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : filteredCoaches.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-500 font-bold text-lg">Aucun formateur trouvé</td>
                            </tr>
                        ) : filteredCoaches.map((coach) => (
                            <tr key={coach.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                            {coach.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-base">{coach.name}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Mail size={12} /> {coach.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                                        <Building2 size={16} className="text-slate-500" />
                                        {coach.organization?.name || 'Indépendant'}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                                            <Clock size={14} />
                                            Dernière act. : {coach.lastActivityDate ? new Date(coach.lastActivityDate).toLocaleDateString() : 'Jamais'}
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-bold uppercase">Membre depuis le {new Date(coach.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center justify-center">
                                        <div className="bg-slate-800 text-blue-400 font-black px-4 py-1.5 rounded-full text-sm border border-slate-700">
                                            {coach._count.students}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <button
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-all border border-blue-600/20"
                                        onClick={() => {
                                            // Handle redirection or modal
                                            alert(`Redirection vers l'agenda de ${coach.name}`);
                                        }}
                                    >
                                        <Calendar size={14} /> Agenda
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
