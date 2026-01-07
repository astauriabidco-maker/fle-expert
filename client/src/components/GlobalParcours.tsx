import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, GraduationCap, Building2, Zap, BarChart3, TrendingUp, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentData {
    id: string;
    name: string;
    email: string;
    currentLevel: string;
    xp: number;
    createdAt: string;
    organization: { name: string; id: string } | null;
    coach: { name: string } | null;
}

export default function GlobalParcours() {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            fetchStudents();
        }
    }, [token]);

    const fetchStudents = async () => {
        try {
            const res = await fetch('http://localhost:3333/admin/oversight/parcours', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Fetch candidates error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter ? s.currentLevel === levelFilter : true;
        return matchesSearch && matchesLevel;
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-4 shadow-xl">
                    <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Activité Globale</p>
                        <p className="text-2xl font-black text-white">{students.length} Parcours</p>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-4 shadow-xl">
                    <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
                        <Zap size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Points d'Effort (XP)</p>
                        <p className="text-2xl font-black text-white">{students.reduce((acc, s) => acc + (s.xp || 0), 0).toLocaleString()} ⚡</p>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-4 shadow-xl">
                    <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
                        <BarChart3 size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Niveau Médian</p>
                        <p className="text-2xl font-black text-white">B1</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher un apprenant ou OF..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 ring-blue-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Filter className="text-slate-500" size={20} />
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white rounded-2xl px-6 py-3 font-bold text-sm outline-none focus:ring-2 ring-blue-500/50 cursor-pointer appearance-none"
                    >
                        <option value="">Tous les niveaux</option>
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            </div>

            {/* Main List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-500 font-bold animate-pulse">Chargement des parcours...</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500 font-bold">Aucun parcours ne correspond à votre recherche.</div>
                ) : filteredStudents.map((student) => (
                    <div key={student.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all group overflow-hidden relative shadow-lg">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-all"></div>

                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${student.currentLevel.startsWith('B') ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                                    student.currentLevel.startsWith('C') ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' :
                                        'bg-blue-500/20 text-blue-500 border border-blue-500/20'
                                    }`}>
                                    {student.currentLevel}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-white text-lg tracking-tight">{student.name}</h4>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Building2 size={12} className="text-slate-600" />
                                            {student.organization?.name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <GraduationCap size={12} className="text-slate-600" />
                                            Mentor: {student.coach?.name || 'En attente'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-1">XP Accumulée</span>
                                <div className="text-xl font-mono font-black text-emerald-400">{student.xp?.toLocaleString() || 0} <span className="text-[10px] text-emerald-600">PTS</span></div>
                            </div>
                        </div>

                        {/* Mini Progress Bar (derived from XP relative to level) */}
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1">
                                <span>Progression globale</span>
                                <span>{Math.min(100, Math.floor((student.xp || 0) / 50))}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.floor((student.xp || 0) / 50))}%` }}
                                    className={`h-full rounded-full ${(student.xp || 0) > 4000 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                        'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                        }`}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
