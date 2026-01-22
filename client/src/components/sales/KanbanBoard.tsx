import React, { useState } from 'react';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { UserPlus, Send, CheckCircle, FileText, GraduationCap } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import type { ColumnConfig } from './KanbanColumn';
import CandidateCard from './CandidateCard';
import type { Candidate } from './CandidateCard';
import CandidateDetailPanel from './CandidateDetailPanel';
import { useAuth } from '../../contexts/AuthContext';

const COLUMNS: ColumnConfig[] = [
    {
        id: 'NOUVEAU',
        title: 'Nouveau',
        icon: <UserPlus className="w-4 h-4" />,
        color: 'text-slate-400',
        bgColor: 'bg-slate-800/50',
        borderColor: 'border-slate-700',
    },
    {
        id: 'DIAGNOSTIC_ENVOYE',
        title: 'Diag. Envoyé',
        icon: <Send className="w-4 h-4" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
    },
    {
        id: 'DIAGNOSTIC_TERMINE',
        title: 'Diag. Terminé',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
    },
    {
        id: 'DEVIS_ENVOYE',
        title: 'Devis Envoyé',
        icon: <FileText className="w-4 h-4" />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
    },
    {
        id: 'INSCRIT',
        title: 'Inscrit',
        icon: <GraduationCap className="w-4 h-4" />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
    },
];

interface KanbanBoardProps {
    candidates: Candidate[];
    onCandidatesChange: (candidates: Candidate[]) => void;
    onGenerateLink: (id: string) => void;
    onQuickNote?: (candidate: Candidate) => void;
    onTagToggle?: (candidateId: string, tags: string[]) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ candidates, onCandidatesChange, onGenerateLink, onQuickNote, onTagToggle }) => {
    const { token } = useAuth();
    const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    const getCandidatesForColumn = (columnId: string) => {
        return candidates.filter(c => c.pipelineStatus === columnId);
    };

    const handleCardClick = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        setSelectedCandidate(candidate || null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const candidate = candidates.find(c => c.id === active.id);
        setActiveCandidate(candidate || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the active candidate
        const activeCandidate = candidates.find(c => c.id === activeId);
        if (!activeCandidate) return;

        // Check if dropping on a column or another card
        const overColumn = COLUMNS.find(col => col.id === overId);
        const overCandidate = candidates.find(c => c.id === overId);

        let newStatus = activeCandidate.pipelineStatus;

        if (overColumn) {
            newStatus = overColumn.id;
        } else if (overCandidate) {
            newStatus = overCandidate.pipelineStatus;
        }

        if (newStatus !== activeCandidate.pipelineStatus) {
            // Update candidate status optimistically
            const updatedCandidates = candidates.map(c =>
                c.id === activeId ? { ...c, pipelineStatus: newStatus } : c
            );
            onCandidatesChange(updatedCandidates);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveCandidate(null);

        if (!over) return;

        const activeId = active.id as string;
        const candidate = candidates.find(c => c.id === activeId);

        if (candidate) {
            // Persist to backend
            try {
                await fetch(`http://localhost:3333/sales/candidates/${activeId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: candidate.pipelineStatus })
                });
            } catch (error) {
                console.error('Failed to update candidate status:', error);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 px-1">
                {COLUMNS.map(column => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        candidates={getCandidatesForColumn(column.id)}
                        onGenerateLink={onGenerateLink}
                        onCardClick={handleCardClick}
                        onQuickNote={onQuickNote}
                        onTagToggle={onTagToggle}
                    />
                ))}
            </div>

            {/* Drag Overlay for smooth animation */}
            <DragOverlay>
                {activeCandidate ? (
                    <div className="opacity-80 rotate-3">
                        <CandidateCard
                            candidate={activeCandidate}
                            onGenerateLink={() => { }}
                            onQuickNote={onQuickNote}
                            onTagToggle={onTagToggle}
                        />
                    </div>
                ) : null}
            </DragOverlay>

            {/* Candidate Detail Panel */}
            <CandidateDetailPanel
                candidate={selectedCandidate}
                isOpen={!!selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
                onGenerateLink={onGenerateLink}
            />
        </DndContext>
    );
};

export default KanbanBoard;
