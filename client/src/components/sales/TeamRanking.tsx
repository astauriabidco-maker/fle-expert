import React from 'react';
import { Trophy, TrendingUp, Award } from 'lucide-react';

interface SalesRep {
    id: string;
    name: string;
    deals: number;
    revenue: number;
}

interface TeamRankingProps {
    salesReps?: SalesRep[];
}

const TeamRanking: React.FC<TeamRankingProps> = ({ salesReps }) => {
    const mockData: SalesRep[] = salesReps || [
        { id: '1', name: 'Marie Dubois', deals: 15, revenue: 45000 },
        { id: '2', name: 'Jean Martin', deals: 12, revenue: 38000 },
        { id: '3', name: 'Sophie Bernard', deals: 10, revenue: 32000 },
        { id: '4', name: 'Pierre Durand', deals: 8, revenue: 25000 },
        { id: '5', name: 'Claire Petit', deals: 6, revenue: 18000 },
    ];

    const getRankBadge = (index: number) => {
        const badges = [
            { icon: Trophy, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
            { icon: Award, color: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
            { icon: Award, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
        ];

        if (index < 3) {
            const Badge = badges[index];
            const Icon = Badge.icon;
            return (
                <div className={`w-8 h-8 rounded-lg ${Badge.color} border flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                </div>
            );
        }

        return (
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center text-sm font-bold">
                {index + 1}
            </div>
        );
    };

    return (
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Classement de l'Équipe
            </h3>
            <div className="space-y-3">
                {mockData.map((rep, index) => (
                    <div
                        key={rep.id}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] ${index < 3
                            ? 'bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700'
                            : 'bg-slate-800/50'
                            }`}
                    >
                        {/* Rank Badge */}
                        {getRankBadge(index)}

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {rep.name[0]}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">{rep.name}</h4>
                            <p className="text-xs text-slate-500">{rep.deals} deals signés</p>
                        </div>

                        {/* Revenue */}
                        <div className="text-right">
                            <div className="text-lg font-black text-emerald-400">
                                {rep.revenue.toLocaleString()}€
                            </div>
                            <div className="text-xs text-slate-500">CA généré</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Total Deals</div>
                    <div className="text-2xl font-bold text-white">
                        {mockData.reduce((sum, rep) => sum + rep.deals, 0)}
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">CA Total</div>
                    <div className="text-2xl font-bold text-emerald-400">
                        {mockData.reduce((sum, rep) => sum + rep.revenue, 0).toLocaleString()}€
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamRanking;
