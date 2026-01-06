import { useState } from 'react';
import {
    TrendingUp,
    DollarSign,
    Users,
    Clock,
    Search,
    Download
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    Cell
} from 'recharts';

interface BusinessPerformanceProps {
    students: any[];
    organization: any;
}

export const BusinessPerformance: React.FC<BusinessPerformanceProps> = ({ students, organization }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Business Data Analysis
    // In a real app, this would come from a dedicated `/api/analytics/business` endpoint
    const businessData = students.map(student => {
        const hourlyRate = organization?.publicHourlyRate || 45;
        const hoursConsumed = Math.floor(Math.random() * 20) + 5; // Mock: 5-25 hours
        const platformCost = 15; // Fixed cost per student
        const coachCost = hoursConsumed * (hourlyRate * 0.7); // Coach takes 70% (example)

        const totalBilled = hoursConsumed * hourlyRate;
        const totalCost = coachCost + platformCost;
        const margin = totalBilled - totalCost;
        const marginPercent = (margin / totalBilled) * 100;

        return {
            id: student.id,
            name: student.name,
            level: student.currentLevel,
            hoursConsumed,
            totalBilled,
            margin,
            marginPercent,
            progress: Math.floor(Math.random() * 100),
            lastActive: student.lastActivity
        };
    }).sort((a, b) => b.margin - a.margin); // Sort by most profitable

    // KPIs
    const totalRevenue = businessData.reduce((acc, curr) => acc + curr.totalBilled, 0);
    const totalMargin = businessData.reduce((acc, curr) => acc + curr.margin, 0);
    const avgMargin = totalMargin / businessData.length || 0;
    const avgMarginPercent = (avgMargin / (totalRevenue / businessData.length)) * 100 || 0;

    const filteredData = businessData.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    label="Chiffre d'Affaires"
                    value={`${totalRevenue.toLocaleString()} €`}
                    icon={<DollarSign size={20} />}
                    color="blue"
                />
                <MetricCard
                    label="Marge Brute"
                    value={`${totalMargin.toLocaleString()} €`}
                    subValue={`${avgMarginPercent.toFixed(1)}%`}
                    icon={<TrendingUp size={20} />}
                    color={avgMarginPercent > 20 ? "emerald" : "amber"}
                />
                <MetricCard
                    label="Coût Pédagogique"
                    value={`${(totalRevenue - totalMargin).toLocaleString()} €`}
                    icon={<Users size={20} />}
                    color="rose"
                />
                <MetricCard
                    label="Heures Facturées"
                    value={businessData.reduce((acc, curr) => acc + curr.hoursConsumed, 0)}
                    icon={<Clock size={20} />}
                    color="indigo"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profitability Scatter Plot */}
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-6">Rentabilité vs Progression</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" dataKey="progress" name="Progression (%)" unit="%" stroke="#64748B" />
                                <YAxis type="number" dataKey="margin" name="Marge (€)" unit="€" stroke="#64748B" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                                <Scatter name="Étudiants" data={businessData} fill="#3B82F6">
                                    {businessData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.margin > 500 ? '#10B981' : entry.margin > 200 ? '#F59E0B' : '#EF4444'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-6">Top Rentabilité</h3>
                    <div className="space-y-4">
                        {businessData.slice(0, 5).map((student, i) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{student.name}</p>
                                        <p className="text-xs text-slate-400">{student.level}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-400 text-sm">+{student.margin.toFixed(0)}€</p>
                                    <p className="text-xs text-slate-500">{student.marginPercent.toFixed(0)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-white">Détail par Étudiant</h3>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 ring-blue-500 outline-none"
                            />
                        </div>
                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold text-left">
                            <tr>
                                <th className="px-6 py-4">Étudiant</th>
                                <th className="px-6 py-4">Niveau</th>
                                <th className="px-6 py-4 text-center">Heures</th>
                                <th className="px-6 py-4 text-right">Facturé</th>
                                <th className="px-6 py-4 text-right">Marge (€)</th>
                                <th className="px-6 py-4 text-right">Marge (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredData.map(student => (
                                <tr key={student.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-white">{student.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-bold">{student.level}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-300">
                                        {student.hoursConsumed}h
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-white">
                                        {student.totalBilled.toLocaleString()} €
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                                        +{student.margin.toFixed(0)} €
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${student.marginPercent > 50 ? 'bg-emerald-500' : student.marginPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${Math.min(student.marginPercent, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-slate-400 w-8">{student.marginPercent.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, subValue, icon, color }: any) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };

    return (
        <div className={`p-6 rounded-2xl border ${colorClasses[color]}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-slate-900/50`}>{icon}</div>
                {subValue && <span className="text-xs font-bold bg-slate-900/50 px-2 py-1 rounded-full">{subValue}</span>}
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs font-bold opacity-70 mt-1 uppercase tracking-wider">{label}</p>
        </div>
    );
};
