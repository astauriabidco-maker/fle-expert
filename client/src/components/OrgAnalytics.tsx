import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Award, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1'];

const OrgAnalytics: React.FC = () => {
    const { organization } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`http://localhost:3333/analytics/org/${organization?.id}`);
                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };

        if (organization?.id) {
            fetchStats();
        }
    }, [organization]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const levelData = stats?.distribution || [];

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/coach')}
                            className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Centre</h1>
                            <p className="text-slate-500 font-medium">Performance globale du centre : {organization?.name}</p>
                        </div>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KPICard title="Élèves Actifs" value={stats?.activeStudents || 0} icon={<Users size={20} className="text-blue-600" />} color="bg-blue-100" />
                    <KPICard title="Score Moyen" value={`${stats?.avgScore || 0}`} icon={<TrendingUp size={20} className="text-emerald-600" />} color="bg-emerald-100" />
                    <KPICard title="Examens Blancs" value={stats?.totalExams || 0} icon={<Award size={20} className="text-indigo-600" />} color="bg-indigo-100" />
                    <KPICard title="Crédits Restants" value={organization?.availableCredits || 0} icon={<AlertTriangle size={20} className="text-amber-600" />} color="bg-amber-100" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CHART : LEVEL DISTRIBUTION */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-xl">
                                <TrendingUp size={20} className="text-slate-600" />
                            </div>
                            Répartition par niveau (CECRL)
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={levelData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none' }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                                        {levelData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* LIST : READY FOR TEF */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <Award size={20} className="text-emerald-600" />
                            </div>
                            Candidats "Prêts pour le TEF"
                        </h3>
                        <div className="space-y-4">
                            {stats?.topPerformers && stats.topPerformers.length > 0 ? (
                                stats.topPerformers.map((performer: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">
                                                {performer.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{performer.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">Score : {performer.score}/699</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${performer.level === 'B2' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            NIVEAU {performer.level}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-slate-400 font-medium">Aucun résultat récent pour l'instant.</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full mt-6 py-4 rounded-2xl bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                            Voir tous les résultats
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-lg hover:shadow-slate-100 transition-all active:scale-[0.98]">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
            </div>
            <div className={`p-4 ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
                {icon}
            </div>
        </div>
    );
}

export default OrgAnalytics;
