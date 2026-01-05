import React from 'react';
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle2, Star, Target, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface CoachStatsProps {
    stats: {
        totalStudents: number;
        activeStudents: number;
        averageScore: number;
        scoreEvolution: number; // % change
        totalSessions: number;
        hoursThisMonth: number;
        feedbacksSent: number;
        successRate: number;
    };
    weeklyActivity?: Array<{ day: string; sessions: number; corrections: number }>;
    levelDistribution?: Array<{ level: string; count: number }>;
    performanceHistory?: Array<{ month: string; score: number }>;
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

export const CoachStatsPanel: React.FC<CoachStatsProps> = ({
    stats,
    weeklyActivity = [],
    levelDistribution = [],
    performanceHistory = []
}) => {
    return (
        <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Étudiants actifs"
                    value={stats.activeStudents}
                    total={stats.totalStudents}
                    icon={<Users size={20} />}
                    color="indigo"
                />
                <StatCard
                    label="Score moyen"
                    value={`${stats.averageScore}%`}
                    trend={stats.scoreEvolution}
                    icon={<Target size={20} />}
                    color="emerald"
                />
                <StatCard
                    label="Heures ce mois"
                    value={stats.hoursThisMonth}
                    suffix="h"
                    icon={<Clock size={20} />}
                    color="amber"
                />
                <StatCard
                    label="Taux de réussite"
                    value={`${stats.successRate}%`}
                    icon={<CheckCircle2 size={20} />}
                    color="purple"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Evolution Chart */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Évolution des scores
                    </h4>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceHistory}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#64748B" fontSize={10} />
                                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E293B',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366F1"
                                    strokeWidth={2}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Weekly Activity Chart */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Activité hebdomadaire
                    </h4>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyActivity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="day" stroke="#64748B" fontSize={10} />
                                <YAxis stroke="#64748B" fontSize={10} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E293B',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Bar dataKey="sessions" fill="#10B981" radius={[4, 4, 0, 0]} name="Sessions" />
                                <Bar dataKey="corrections" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Corrections" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Level Distribution */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Répartition par niveau
                    </h4>
                    <div className="h-[180px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={levelDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    dataKey="count"
                                    nameKey="level"
                                    label={({ level, percent }: any) => `${level} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {levelDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E293B',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Actions rapides
                    </h4>
                    <div className="space-y-3">
                        <QuickActionButton icon={<Zap size={16} />} label="Envoyer rappel aux inactifs" color="amber" />
                        <QuickActionButton icon={<Star size={16} />} label="Féliciter les meilleurs" color="emerald" />
                        <QuickActionButton icon={<Target size={16} />} label="Planifier session groupe" color="indigo" />
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Activité récente
                    </h4>
                    <div className="space-y-3">
                        <ActivityItem
                            text="Candidat Test 3 a terminé un examen"
                            time="Il y a 2h"
                            type="exam"
                        />
                        <ActivityItem
                            text="Nouvelle correction en attente"
                            time="Il y a 4h"
                            type="correction"
                        />
                        <ActivityItem
                            text="Candidat Test 7 a atteint le niveau B1"
                            time="Hier"
                            type="level"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const StatCard = ({ label, value, total, trend, suffix = '', icon, color }: any) => {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    };

    return (
        <div className={`rounded-2xl border p-4 ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="opacity-70">{icon}</span>
                {trend !== undefined && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-white">
                {value}{suffix}
                {total && <span className="text-sm font-normal text-slate-400">/{total}</span>}
            </p>
            <p className="text-xs font-medium opacity-60 mt-1">{label}</p>
        </div>
    );
};

const QuickActionButton = ({ icon, label, color }: any) => {
    const colorClasses: Record<string, string> = {
        amber: 'hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400',
        emerald: 'hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400',
        indigo: 'hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400',
    };

    return (
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 transition-all ${colorClasses[color]}`}>
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
};

const ActivityItem = ({ text, time, type }: any) => {
    const typeColors: Record<string, string> = {
        exam: 'bg-amber-500',
        correction: 'bg-rose-500',
        level: 'bg-emerald-500',
    };

    return (
        <div className="flex items-start gap-3">
            <span className={`w-2 h-2 rounded-full ${typeColors[type]} mt-2`}></span>
            <div>
                <p className="text-sm text-slate-300">{text}</p>
                <p className="text-xs text-slate-500">{time}</p>
            </div>
        </div>
    );
};

export default CoachStatsPanel;
