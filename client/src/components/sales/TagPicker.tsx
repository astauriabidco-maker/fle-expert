import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface TagOption {
    id: string;
    label: string;
    color: string;
    bg: string;
    border: string;
}

export const TAG_OPTIONS: TagOption[] = [
    { id: 'URGENT', label: 'Urgent', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 'VIP', label: 'VIP', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'FINANCEMENT', label: 'Financement demandé', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'RELANCE', label: 'À relancer', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

interface TagPickerProps {
    selectedTags: string[];
    onToggleTag: (tagId: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const TagPicker: React.FC<TagPickerProps> = ({
    selectedTags,
    onToggleTag,
    isOpen,
    onClose,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[70] overflow-hidden"
                    >
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Tags</span>
                            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <X className="w-3 h-3 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-2">
                            {TAG_OPTIONS.map(tag => {
                                const isSelected = selectedTags.includes(tag.id);
                                return (
                                    <button
                                        key={tag.id}
                                        onClick={() => onToggleTag(tag.id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${isSelected
                                            ? 'bg-slate-100 dark:bg-slate-800 text-white'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isSelected ? tag.bg.replace('/10', '') : 'bg-slate-300 dark:bg-slate-700'}`} />
                                            <span className={`text-sm font-medium ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {tag.label}
                                            </span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TagPicker;
