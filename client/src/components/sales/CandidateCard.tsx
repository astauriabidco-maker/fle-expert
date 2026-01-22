import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Mail, Calendar, Share2, GripVertical, MessageSquare, Tag as TagIcon } from 'lucide-react';
import TagPicker, { TAG_OPTIONS } from './TagPicker';

export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone?: string;
    level: string;
    targetLevel: string;
    objective?: string;
    pipelineStatus: string;
    lastActivity: string;
    hasDiagnostic: boolean;
    createdAt: string;
    tags?: string; // Stringified JSON array
}

interface CandidateCardProps {
    candidate: Candidate;
    onGenerateLink: (id: string) => void;
    onCardClick?: (id: string) => void;
    onQuickNote?: (candidate: Candidate) => void;
    onTagToggle?: (candidateId: string, tags: string[]) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
    candidate,
    onGenerateLink,
    onCardClick,
    onQuickNote,
    onTagToggle,
}) => {
    const [isTagPickerOpen, setIsTagPickerOpen] = React.useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: candidate.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const currentTags: string[] = React.useMemo(() => {
        try {
            return candidate.tags ? JSON.parse(candidate.tags) : [];
        } catch (e) {
            return [];
        }
    }, [candidate.tags]);

    const handleToggleTag = (tagId: string) => {
        const newTags = currentTags.includes(tagId)
            ? currentTags.filter(t => t !== tagId)
            : [...currentTags, tagId];
        onTagToggle?.(candidate.id, newTags);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => onCardClick?.(candidate.id)}
            className={`bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 cursor-pointer transition-all hover:border-slate-600 group relative ${isDragging ? 'opacity-50 shadow-2xl scale-105 z-50' : ''
                }`}
        >
            {/* Drag Handle + Header */}
            <div className="flex items-start gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="mt-1 p-1 text-slate-600 hover:text-slate-400 cursor-grab"
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Tags Display */}
                    {currentTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {currentTags.map(tagId => {
                                const tag = TAG_OPTIONS.find(t => t.id === tagId);
                                if (!tag) return null;
                                return (
                                    <span
                                        key={tagId}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${tag.bg} ${tag.color} ${tag.border}`}
                                    >
                                        {tag.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {candidate.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">{candidate.name || 'Sans nom'}</h4>
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {candidate.email}
                            </p>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {candidate.targetLevel && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 font-bold">
                                {candidate.targetLevel}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md">
                            <Calendar className="w-3 h-3" />
                            {formatDate(candidate.lastActivity)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions (visible on hover) */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onQuickNote?.(candidate); }}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    title="Note Rapide"
                >
                    <MessageSquare size={14} />
                </button>
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsTagPickerOpen(!isTagPickerOpen); }}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${isTagPickerOpen ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border-slate-700'}`}
                        title="Tags"
                    >
                        <TagIcon size={14} />
                    </button>
                    <TagPicker
                        isOpen={isTagPickerOpen}
                        onClose={() => setIsTagPickerOpen(false)}
                        selectedTags={currentTags}
                        onToggleTag={handleToggleTag}
                    />
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onGenerateLink(candidate.id); }}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20 uppercase tracking-tighter"
                >
                    <Share2 className="w-3 h-3" />
                    Lien Diag
                </button>
            </div>
        </div>
    );
};

export default CandidateCard;
