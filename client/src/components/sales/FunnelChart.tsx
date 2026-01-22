import React from 'react';
import { Users, Send, FileText, CheckCircle } from 'lucide-react';

interface FunnelChartProps {
    data?: {
        prospects: number;
        diagnostics: number;
        devis: number;
        signes: number;
    };
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
    const funnelData = data || {
        prospects: 120,
        diagnostics: 85,
        devis: 45,
        signes: 22,
    };

    const stages = [
        { label: 'Prospects', value: funnelData.prospects, icon: Users, color: 'from-blue-500 to-blue-600', width: 100 },
        { label: 'Diagnostics', value: funnelData.diagnostics, icon: Send, color: 'from-indigo-500 to-indigo-600', width: 75 },
        { label: 'Devis', value: funnelData.devis, icon: FileText, color: 'from-purple-500 to-purple-600', width: 50 },
        { label: 'Signés', value: funnelData.signes, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', width: 25 },
    ];

    const getConversionRate = (current: number, previous: number) => {
        return previous > 0 ? Math.round((current / previous) * 100) : 0;
    };

    return (
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6">Funnel de Conversion</h3>
            <div className="space-y-4">
                {stages.map((stage, index) => {
                    const Icon = stage.icon;
                    const conversionRate = index > 0 ? getConversionRate(stage.value, stages[index - 1].value) : 100;

                    return (
                        <div key={stage.label} className="relative">
                            <div
                                className={`bg-gradient-to-r ${stage.color} rounded-xl p-4 transition-all hover:scale-[1.02]`}
                                style={{ width: `${stage.width}%` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5 text-white" />
                                        <span className="font-bold text-white">{stage.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-white">{stage.value}</div>
                                        {index > 0 && (
                                            <div className="text-xs text-white/80">{conversionRate}%</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Taux global</div>
                    <div className="text-lg font-bold text-emerald-400">
                        {getConversionRate(funnelData.signes, funnelData.prospects)}%
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Diag → Devis</div>
                    <div className="text-lg font-bold text-purple-400">
                        {getConversionRate(funnelData.devis, funnelData.diagnostics)}%
                    </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Devis → Signé</div>
                    <div className="text-lg font-bold text-blue-400">
                        {getConversionRate(funnelData.signes, funnelData.devis)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FunnelChart;
