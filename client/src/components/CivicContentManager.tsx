import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Book,
    HelpCircle,
    Save,
    X,
    Layout,
    CheckCircle2,
    PlusCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CivicLesson {
    id: string;
    title: string;
    content: string;
    videoId?: string;
    keyPoints: string[];
}

interface CivicQuestion {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    isOfficial: boolean;
}

interface CivicModule {
    id: string;
    title: string;
    topic: string;
    lessons: CivicLesson[];
    questions: CivicQuestion[];
}

export default function CivicContentManager() {
    const [modules, setModules] = useState<CivicModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'modules' | 'questions'>('modules');
    const [editingModule, setEditingModule] = useState<CivicModule | null>(null);
    const [editingLesson, setEditingLesson] = useState<{ moduleId: string, lesson: Partial<CivicLesson> } | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<{ moduleId?: string, question: Partial<CivicQuestion> } | null>(null);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3333/civic/modules');
            const data = await res.json();
            const parsed = data.map((m: any) => ({
                ...m,
                lessons: m.lessons.map((l: any) => ({
                    ...l,
                    keyPoints: l.keyPoints ? JSON.parse(l.keyPoints) : []
                })),
                questions: m.questions.map((q: any) => ({
                    ...q,
                    options: JSON.parse(q.options)
                }))
            }));
            setModules(parsed);
        } catch (err) {
            console.error('Error fetching modules:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingModule?.id ? 'PUT' : 'POST';
        const url = editingModule?.id
            ? `http://localhost:3333/civic/modules/${editingModule.id}`
            : 'http://localhost:3333/civic/modules';

        try {
            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editingModule)
            });
            setEditingModule(null);
            fetchModules();
        } catch (err) {
            console.error('Error saving module:', err);
        }
    };

    const handleDeleteModule = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) return;
        try {
            await fetch(`http://localhost:3333/civic/modules/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchModules();
        } catch (err) {
            console.error('Error deleting module:', err);
        }
    };

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLesson) return;
        const method = editingLesson.lesson.id ? 'PUT' : 'POST';
        const url = editingLesson.lesson.id
            ? `http://localhost:3333/civic/lessons/${editingLesson.lesson.id}`
            : `http://localhost:3333/civic/modules/${editingLesson.moduleId}/lessons`;

        try {
            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editingLesson.lesson)
            });
            setEditingLesson(null);
            fetchModules();
        } catch (err) {
            console.error('Error saving lesson:', err);
        }
    };

    const handleDeleteLesson = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) return;
        try {
            await fetch(`http://localhost:3333/civic/lessons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchModules();
        } catch (err) {
            console.error('Error deleting lesson:', err);
        }
    };

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingQuestion) return;
        const method = editingQuestion.question.id ? 'PUT' : 'POST';
        const url = editingQuestion.question.id
            ? `http://localhost:3333/civic/questions/${editingQuestion.question.id}`
            : `http://localhost:3333/civic/questions`;

        const payload = {
            ...editingQuestion.question,
            moduleId: editingQuestion.moduleId // If null, it's a general official question
        };

        try {
            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            setEditingQuestion(null);
            fetchModules();
        } catch (err) {
            console.error('Error saving question:', err);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) return;
        try {
            await fetch(`http://localhost:3333/civic/questions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            fetchModules();
        } catch (err) {
            console.error('Error deleting question:', err);
        }
    };

    if (isLoading) return <div>Chargement...</div>;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                        Gestionnaire Parcours Citoyen
                    </h1>
                    <p className="text-slate-500 font-medium">Configurez les modules, leçons et questions de l'examen civique 2026.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'modules' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Modules & Leçons
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'questions' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Banque de Questions
                    </button>
                </div>
            </div>

            {activeTab === 'modules' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Module List */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <Layout size={24} className="text-indigo-600" />
                                Vos Modules
                            </h2>
                            <button
                                onClick={() => setEditingModule({ id: '', title: '', topic: '', lessons: [], questions: [] })}
                                className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {modules.map(module => (
                                <div key={module.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <div className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{module.title}</h3>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">{module.topic}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingModule(module)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteModule(module.id)}
                                                className="p-2 text-red-200 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Book size={12} />
                                                {module.lessons.length} Leçons
                                            </h4>
                                            <button
                                                onClick={() => setEditingLesson({ moduleId: module.id, lesson: { title: '', content: '', keyPoints: [] } })}
                                                className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                                            >
                                                + Ajouter une leçon
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {module.lessons.map(lesson => (
                                                <div key={lesson.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lesson.title}</span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingLesson({ moduleId: module.id, lesson })} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor Panes */}
                    <div className="lg:sticky lg:top-8 h-fit">
                        {editingModule && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Editer le Module</h3>
                                    <button onClick={() => setEditingModule(null)} className="p-2 text-slate-400"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleSaveModule} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Titre du Module</label>
                                        <input
                                            value={editingModule.title}
                                            onChange={e => setEditingModule({ ...editingModule, title: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold"
                                            placeholder="Ex: L'Histoire de France"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sous-titre / Thème</label>
                                        <input
                                            value={editingModule.topic}
                                            onChange={e => setEditingModule({ ...editingModule, topic: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold"
                                            placeholder="Ex: Dates et événements clés"
                                        />
                                    </div>
                                    <button type="submit" className="w-full p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
                                        <Save size={18} /> ENREGISTRER LE MODULE
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {editingLesson && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6"
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Editer la Leçon</h3>
                                    <button onClick={() => setEditingLesson(null)} className="p-2 text-slate-400"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleSaveLesson} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Titre de la leçon</label>
                                        <input
                                            value={editingLesson.lesson.title}
                                            onChange={e => setEditingLesson({ ...editingLesson, lesson: { ...editingLesson.lesson, title: e.target.value } })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Content</label>
                                        <textarea
                                            value={editingLesson.lesson.content}
                                            onChange={e => setEditingLesson({ ...editingLesson, lesson: { ...editingLesson.lesson, content: e.target.value } })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-sm h-32"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Points Clés (un par ligne)</label>
                                        <textarea
                                            value={editingLesson.lesson.keyPoints?.join('\n')}
                                            onChange={e => setEditingLesson({ ...editingLesson, lesson: { ...editingLesson.lesson, keyPoints: e.target.value.split('\n').filter(p => p.trim() !== '') } })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-sm h-24"
                                            placeholder="Ex:\nPoint 1\nPoint 2"
                                        />
                                    </div>
                                    <button type="submit" className="w-full p-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2">
                                        <Save size={18} /> ENREGISTRER LA LEÇON
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'questions' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <HelpCircle size={24} className="text-indigo-600" />
                            Banque de Questions
                        </h2>
                        <button
                            onClick={() => setEditingQuestion({ question: { text: '', options: ['', '', ''], correctAnswer: 0, isOfficial: true } })}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center gap-2"
                        >
                            <PlusCircle size={20} /> Nouvelle Question
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.flatMap(m => m.questions.map(q => ({ ...q, moduleTitle: m.title }))).map(question => (
                            <div key={question.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative group shadow-sm">
                                <span className={`absolute top-4 right-4 text-[8px] font-black uppercase px-2 py-1 rounded-full ${question.isOfficial ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {question.isOfficial ? 'Officiel' : 'Entraînement'}
                                </span>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-60">{(question as any).moduleTitle}</p>
                                    <p className="font-black text-slate-900 dark:text-white leading-tight">{question.text}</p>
                                    <div className="space-y-1">
                                        {question.options.map((opt, i) => (
                                            <div key={i} className={`text-xs font-bold p-2 rounded-xl flex items-center gap-2 ${i === question.correctAnswer ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'text-slate-500'}`}>
                                                {i === question.correctAnswer && <CheckCircle2 size={12} />}
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingQuestion({ question })}
                                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuestion(question.id)}
                                            className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {editingQuestion && (
                        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-slate-900 w-full max-w-xl p-8 rounded-[3rem] shadow-2xl relative overflow-hidden"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Configurator Question</h3>
                                    <button onClick={() => setEditingQuestion(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveQuestion} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Intitulé de la question</label>
                                        <textarea
                                            value={editingQuestion.question.text}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, question: { ...editingQuestion.question, text: e.target.value } })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold h-24"
                                            placeholder="Quelle est la question ?"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Options de réponse (Cochez la bonne)</label>
                                        {editingQuestion.question.options?.map((opt, i) => (
                                            <div key={i} className="flex gap-3">
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={editingQuestion.question.correctAnswer === i}
                                                    onChange={() => setEditingQuestion({ ...editingQuestion, question: { ...editingQuestion.question, correctAnswer: i } })}
                                                    className="mt-4 ring-indigo-500 text-indigo-600"
                                                />
                                                <input
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...(editingQuestion.question.options || [])];
                                                        newOpts[i] = e.target.value;
                                                        setEditingQuestion({ ...editingQuestion, question: { ...editingQuestion.question, options: newOpts } });
                                                    }}
                                                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm"
                                                    placeholder={`Option ${i + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Explication (Affichée après réponse)</label>
                                        <textarea
                                            value={editingQuestion.question.explanation}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, question: { ...editingQuestion.question, explanation: e.target.value } })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium text-sm h-20"
                                            placeholder="Pourquoi est-ce la bonne réponse ?"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                        <input
                                            type="checkbox"
                                            checked={editingQuestion.question.isOfficial}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, question: { ...editingQuestion.question, isOfficial: e.target.checked } })}
                                            className="rounded text-indigo-600"
                                        />
                                        <span className="text-xs font-black uppercase text-slate-600">Inclure dans le simulateur d'examen blanc</span>
                                    </div>

                                    <button type="submit" className="w-full p-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl hover:scale-[1.02] transition-all">
                                        SAUVEGARDER LA QUESTION
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
