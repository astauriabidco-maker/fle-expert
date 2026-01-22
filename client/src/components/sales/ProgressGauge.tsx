import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

interface ProgressGaugeProps {
    current?: number;
    target?: number;
    label?: string;
}

const ProgressGauge: React.FC<ProgressGaugeProps> = ({
    current = 7500,
    target = 10000,
    label = 'Objectif Mensuel'
}) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const isOnTrack = percentage >= 75;
    const circumference = 2 * Math.PI * 70; // radius = 70
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                {label}
            </h3>
            <div className="flex flex-col items-center">
                {/* Circular Progress */}
                <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                        {/* Background circle */}
                        <circle
                            cx="96"
                            cy="96"
                            r="70"
                            stroke="#334155"
                            strokeWidth="12"
                            fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="96"
                            cy="96"
                            r="70"
                            stroke={isOnTrack ? '#10b981' : '#3b82f6'}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-4xl font-black ${isOnTrack ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {percentage}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">complété</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-6 w-full space-y-3">
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-sm text-slate-400">Réalisé</span>
                        <span className="text-lg font-bold text-white">{current.toLocaleString()}€</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-sm text-slate-400">Objectif</span>
                        <span className="text-lg font-bold text-emerald-400">{target.toLocaleString()}€</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-sm text-slate-400">Reste</span>
                        <span className="text-lg font-bold text-amber-400">{(target - current).toLocaleString()}€</span>
                    </div>
                </div>

                {/* Status Badge */}
                {isOnTrack ? (
                    <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-bold">En bonne voie !</span>
                    </div>
                ) : (
                    <div className="mt-4 flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg border border-amber-500/20">
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-bold">Accélérer les efforts</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressGauge;
