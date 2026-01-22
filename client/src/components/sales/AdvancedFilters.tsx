import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface AdvancedFiltersState {
    objectives: string[];
    lastContact: 'today' | 'week' | 'month' | '30plus' | 'never' | null;
    pipelineAge: '0-7' | '7-30' | '30-90' | '90plus' | null;
    coachId: string | null;
}

interface AdvancedFiltersProps {
    filters: AdvancedFiltersState;
    onFiltersChange: (filters: AdvancedFiltersState) => void;
}

const OBJECTIVES = [
    { value: 'NATURALIZATION', label: 'Naturalisation' },
    { value: 'RESIDENCE_PERMIT', label: 'Titre de séjour' },
    { value: 'EMPLOYMENT', label: 'Emploi' },
    { value: 'STUDIES', label: 'Études' },
    { value: 'OTHER', label: 'Autre' },
];

const LAST_CONTACT_OPTIONS = [
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: '30plus', label: 'Plus de 30 jours' },
    { value: 'never', label: 'Jamais contacté' },
];

const PIPELINE_AGE_OPTIONS = [
    { value: '0-7', label: 'Moins de 7 jours' },
    { value: '7-30', label: '7-30 jours' },
    { value: '30-90', label: '1-3 mois' },
    { value: '90plus', label: 'Plus de 3 mois' },
];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ filters, onFiltersChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<AdvancedFiltersState>(filters);

    const activeFiltersCount = [
        localFilters.objectives.length > 0,
        localFilters.lastContact !== null,
        localFilters.pipelineAge !== null,
        localFilters.coachId !== null,
    ].filter(Boolean).length;

    const handleObjectiveToggle = (objective: string) => {
        const newObjectives = localFilters.objectives.includes(objective)
            ? localFilters.objectives.filter(o => o !== objective)
            : [...localFilters.objectives, objective];
        setLocalFilters({ ...localFilters, objectives: newObjectives });
    };

    const handleApply = () => {
        onFiltersChange(localFilters);
        setIsOpen(false);
    };

    const handleReset = () => {
        const resetFilters: AdvancedFiltersState = {
            objectives: [],
            lastContact: null,
            pipelineAge: null,
            coachId: null,
        };
        setLocalFilters(resetFilters);
        onFiltersChange(resetFilters);
    };

    const removeFilter = (type: keyof AdvancedFiltersState) => {
        const newFilters = { ...filters };
        if (type === 'objectives') {
            newFilters.objectives = [];
        } else {
            newFilters[type] = null;
        }
        onFiltersChange(newFilters);
        setLocalFilters(newFilters);
    };

    return (
        <div className="relative">
            {/* Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isOpen || activeFiltersCount > 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
            >
                <Filter className="w-4 h-4" />
                <span>Filtres Avancés</span>
                {activeFiltersCount > 0 && (
                    <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {activeFiltersCount}
                    </span>
                )}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Active Filters Badges */}
            {activeFiltersCount > 0 && !isOpen && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {filters.objectives.map(obj => (
                        <span
                            key={obj}
                            className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-sm border border-blue-500/20"
                        >
                            {OBJECTIVES.find(o => o.value === obj)?.label}
                            <button onClick={() => removeFilter('objectives')} className="hover:text-blue-300">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {filters.lastContact && (
                        <span className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg text-sm border border-purple-500/20">
                            {LAST_CONTACT_OPTIONS.find(o => o.value === filters.lastContact)?.label}
                            <button onClick={() => removeFilter('lastContact')} className="hover:text-purple-300">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.pipelineAge && (
                        <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-sm border border-emerald-500/20">
                            {PIPELINE_AGE_OPTIONS.find(o => o.value === filters.pipelineAge)?.label}
                            <button onClick={() => removeFilter('pipelineAge')} className="hover:text-emerald-300">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Filters Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-6 space-y-6"
                    >
                        {/* Objectives */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-3">Objectif</h4>
                            <div className="space-y-2">
                                {OBJECTIVES.map(obj => (
                                    <label key={obj.value} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={localFilters.objectives.includes(obj.value)}
                                            onChange={() => handleObjectiveToggle(obj.value)}
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                            {obj.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Last Contact */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-3">Dernier Contact</h4>
                            <div className="space-y-2">
                                {LAST_CONTACT_OPTIONS.map(option => (
                                    <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="lastContact"
                                            checked={localFilters.lastContact === option.value}
                                            onChange={() => setLocalFilters({ ...localFilters, lastContact: option.value as any })}
                                            className="w-4 h-4 border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Pipeline Age */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-3">Ancienneté dans le Pipeline</h4>
                            <div className="space-y-2">
                                {PIPELINE_AGE_OPTIONS.map(option => (
                                    <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="pipelineAge"
                                            checked={localFilters.pipelineAge === option.value}
                                            onChange={() => setLocalFilters({ ...localFilters, pipelineAge: option.value as any })}
                                            className="w-4 h-4 border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-slate-800">
                            <button
                                onClick={handleReset}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Réinitialiser
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-bold"
                            >
                                Appliquer
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdvancedFilters;
