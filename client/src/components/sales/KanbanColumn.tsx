import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import CandidateCard from './CandidateCard';
import type { Candidate } from './CandidateCard';

export interface ColumnConfig {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

interface KanbanColumnProps {
    column: ColumnConfig;
    candidates: Candidate[];
    onGenerateLink: (id: string) => void;
    onCardClick?: (id: string) => void;
    onQuickNote?: (candidate: Candidate) => void;
    onTagToggle?: (candidateId: string, tags: string[]) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, candidates, onGenerateLink, onCardClick, onQuickNote, onTagToggle }) => {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div className="flex flex-col min-w-[300px] max-w-[320px] h-full">
            {/* Column Header */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl border-b ${column.bgColor} ${column.borderColor}`}>
                <div className="flex items-center gap-2">
                    <span className={column.color}>{column.icon}</span>
                    <h3 className="font-bold text-white text-sm">{column.title}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${column.bgColor} ${column.color} border ${column.borderColor}`}>
                    {candidates.length}
                </span>
            </div>

            {/* Column Content */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-3 space-y-3 overflow-y-auto rounded-b-xl border border-t-0 transition-colors ${isOver ? 'bg-slate-800/50 border-blue-500/50' : 'bg-slate-900/30 border-slate-800'
                    }`}
                style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
                <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {candidates.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-slate-600 text-sm italic">
                            Aucun candidat
                        </div>
                    ) : (
                        candidates.map(candidate => (
                            <CandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                onGenerateLink={onGenerateLink}
                                onCardClick={onCardClick}
                                onQuickNote={onQuickNote}
                                onTagToggle={onTagToggle}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default KanbanColumn;
