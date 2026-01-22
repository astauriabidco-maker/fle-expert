import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    ChevronDown,
    ChevronUp,
    Check,
    Clock,
    Phone,
    Mail,
    FileText,
    AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Task {
    id: string;
    type: string;
    title: string;
    description?: string;
    dueDate: string;
    completed: boolean;
    candidate?: {
        id: string;
        name: string;
        email: string;
    };
}

interface TasksBannerProps {
    onCreateTask: () => void;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
    CALL: <Phone className="w-4 h-4" />,
    EMAIL: <Mail className="w-4 h-4" />,
    QUOTE: <FileText className="w-4 h-4" />,
    FOLLOW_UP: <AlertCircle className="w-4 h-4" />,
};

const TASK_COLORS: Record<string, string> = {
    CALL: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    EMAIL: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    QUOTE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    FOLLOW_UP: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const TasksBanner: React.FC<TasksBannerProps> = ({ onCreateTask }) => {
    const { token } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:3333/tasks/today', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        // Refresh every 5 minutes
        const interval = setInterval(fetchTasks, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [token]);

    const handleCompleteTask = async (taskId: string) => {
        try {
            const res = await fetch(`http://localhost:3333/tasks/${taskId}/complete`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== taskId));
            }
        } catch (error) {
            console.error('Failed to complete task:', error);
        }
    };

    if (loading) return null;
    if (tasks.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Tâches du jour</h3>
                        <p className="text-sm text-blue-300">
                            {tasks.length} tâche{tasks.length > 1 ? 's' : ''} à faire
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-blue-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-blue-400" />
                    )}
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 space-y-2">
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 flex items-center gap-3"
                                >
                                    <div className={`p-2 rounded-lg border ${TASK_COLORS[task.type] || TASK_COLORS.FOLLOW_UP}`}>
                                        {TASK_ICONS[task.type] || TASK_ICONS.FOLLOW_UP}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium text-sm truncate">{task.title}</h4>
                                        {task.candidate && (
                                            <p className="text-xs text-slate-400 truncate">
                                                {task.candidate.name}
                                            </p>
                                        )}
                                        {task.description && (
                                            <p className="text-xs text-slate-500 truncate mt-1">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(task.dueDate).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <button
                                            onClick={() => handleCompleteTask(task.id)}
                                            className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                            title="Marquer comme fait"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TasksBanner;
