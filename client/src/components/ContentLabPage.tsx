import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Edit2, Trash2, Filter,
    CheckCircle2, Save, X, Eye
} from 'lucide-react';

interface Question {
    id: string;
    level: string;
    topic: string;
    text: string;     // mapped from questionText
    options: string;  // JSON string
    correct: string;  // mapped from correctAnswer
    explanation: string;
}

export default function ContentLabPage() {
    const { token } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', level: '', topic: '' });

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        level: 'B1',
        topic: 'Quotidien',
        text: '',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: 'Option A',
        explanation: ''
    });

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters);
            const res = await fetch(`http://localhost:3333/content-lab/questions?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map backend fields to frontend interface
                setQuestions(data.map((q: any) => ({
                    id: q.id,
                    level: q.level,
                    topic: q.topic,
                    text: q.questionText || q.content, // Fallback
                    options: q.options,
                    correct: q.correctAnswer,
                    explanation: q.explanation
                })));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [token, filters.level]); // Reload on filter change

    const handleOpenEditor = (question?: Question) => {
        if (question) {
            setEditingQuestion(question);
            let opts = [];
            try { opts = JSON.parse(question.options); } catch { opts = [] }

            setFormData({
                level: question.level,
                topic: question.topic,
                text: question.text,
                options: opts.length === 4 ? opts : ['A', 'B', 'C', 'D'],
                correct: question.correct,
                explanation: question.explanation || ''
            });
        } else {
            setEditingQuestion(null); // Create mode
            setFormData({
                level: 'B1',
                topic: 'Quotidien',
                text: '',
                options: ['', '', '', ''],
                correct: '',
                explanation: ''
            });
        }
        setIsEditorOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                level: formData.level,
                topic: formData.topic,
                questionText: formData.text,
                content: formData.text, // redundancy for safety
                options: JSON.stringify(formData.options),
                correctAnswer: formData.correct,
                explanation: formData.explanation
            };

            const url = editingQuestion
                ? `http://localhost:3333/content-lab/questions/${editingQuestion.id}`
                : `http://localhost:3333/content-lab/questions`;

            const method = editingQuestion ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsEditorOpen(false);
                fetchQuestions();
            } else {
                alert('Erreur lors de la sauvegarde');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;
        try {
            await fetch(`http://localhost:3333/content-lab/questions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchQuestions();
        } catch (e) { console.error(e) }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Content Lab</h1>
                    <p className="text-slate-500">Créez et gérez votre banque de questions pédagogiques.</p>
                </div>
                <button
                    onClick={() => handleOpenEditor()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    <Plus size={20} /> Nouvelle Question
                </button>
            </header>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-4 mb-6 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                        className="w-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 ring-indigo-500"
                    />
                </div>
                <select
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                    className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg outline-none"
                >
                    <option value="">Tous Niveaux</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                </select>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700" onClick={fetchQuestions}>
                    <Filter size={20} className="text-slate-500" />
                </div>
            </div>

            {/* Questions Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Chargement...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {questions.map((q) => (
                        <motion.div
                            key={q.id}
                            layoutId={q.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEditor(q)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(q.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${q.level === 'A1' || q.level === 'A2' ? 'bg-emerald-100 text-emerald-700' :
                                    q.level === 'B1' || q.level === 'B2' ? 'bg-amber-100 text-amber-700' :
                                        'bg-rose-100 text-rose-700'
                                    }`}>
                                    {q.level}
                                </span>
                                <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    {q.topic}
                                </span>
                            </div>

                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 line-clamp-3">
                                {q.text}
                            </h3>

                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                <span className="truncate max-w-[200px]">{q.correct}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Editor Modal */}
            <AnimatePresence>
                {isEditorOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    {editingQuestion ? <Edit2 size={20} /> : <Plus size={20} />}
                                    {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
                                </h2>
                                <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex gap-8">
                                {/* Left: Form */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <label className="block text-sm font-bold text-slate-500 mb-1">Niveau</label>
                                            <select
                                                value={formData.level}
                                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 outline-none focus:ring-2 ring-indigo-500"
                                            >
                                                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-slate-500 mb-1">Thème</label>
                                            <input
                                                type="text"
                                                value={formData.topic}
                                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 outline-none focus:ring-2 ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-1">Énoncé de la question</label>
                                        <textarea
                                            value={formData.text}
                                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                            className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 ring-indigo-500 resize-none"
                                            placeholder="Quelle est la capitale de la France ?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-3">Options de réponse</label>
                                        <div className="space-y-3">
                                            {formData.options.map((opt, idx) => (
                                                <div key={idx} className="flex gap-3 items-center">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...formData.options];
                                                            newOpts[idx] = e.target.value;
                                                            setFormData({ ...formData, options: newOpts });
                                                        }}
                                                        className={`flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg outline-none border transition-colors ${formData.correct === opt && opt !== '' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-transparent focus:border-indigo-500'
                                                            }`}
                                                        placeholder={`Option ${idx + 1}`}
                                                    />
                                                    <button
                                                        onClick={() => setFormData({ ...formData, correct: opt })}
                                                        title="Marquer comme correcte"
                                                        className={`p-2 rounded-full transition-colors ${formData.correct === opt && opt !== '' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-emerald-500'}`}
                                                    >
                                                        <CheckCircle2 size={20} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-1">Explication (Feedback)</label>
                                        <textarea
                                            value={formData.explanation}
                                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                            className="w-full h-20 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 ring-indigo-500 resize-none text-sm"
                                            placeholder="Expliquez pourquoi la réponse est correcte..."
                                        />
                                    </div>
                                </div>

                                {/* Right: Preview */}
                                <div className="w-1/3 border-l border-slate-200 dark:border-slate-800 pl-8 hidden md:block">
                                    <div className="sticky top-0">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Eye size={14} /> Prévisualisation
                                        </h3>

                                        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                            <div className="flex gap-2 mb-4">
                                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{formData.level}</span>
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{formData.topic}</span>
                                            </div>
                                            <p className="font-bold text-slate-800 dark:text-white mb-6">
                                                {formData.text || "Votre question apparaîtra ici..."}
                                            </p>
                                            <div className="space-y-2">
                                                {formData.options.map((opt, idx) => (
                                                    <div key={idx} className={`p-3 rounded-lg text-sm border ${formData.correct === opt && opt !== ''
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                                                        : 'border-slate-100 text-slate-500'
                                                        }`}>
                                                        {String.fromCharCode(65 + idx)}. {opt || "..."}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsEditorOpen(false)}
                                    className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !formData.text || !formData.correct}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Sauvegarde...' : <><Save size={20} /> Enregistrer la question</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
