import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockData = [
    { month: 'Août', revenue: 8500, target: 10000 },
    { month: 'Sept', revenue: 9200, target: 10000 },
    { month: 'Oct', revenue: 7800, target: 10000 },
    { month: 'Nov', revenue: 11500, target: 10000 },
    { month: 'Déc', revenue: 9800, target: 10000 },
    { month: 'Jan', revenue: 7500, target: 10000 },
];

const RevenueChart: React.FC = () => {
    return (
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Évolution du CA (6 mois)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="CA Réalisé"
                        dot={{ fill: '#3b82f6', r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Objectif"
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
