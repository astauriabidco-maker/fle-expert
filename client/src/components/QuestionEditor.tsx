import React, { useState, useEffect } from 'react';
import { CheckCircle2, Mic, Cpu, Clock, BarChart3, Upload } from 'lucide-react';

interface QuestionEditorProps {
    question?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export default function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
    const isEditing = !!question;
    const [activeTab, setActiveTab] = useState('general'); // general, content, media, ai

    const [formData, setFormData] = useState({
        level: question?.level || 'B1',
        topic: question?.topic || 'Grammaire',
        skill: question?.skill || 'READING',
        questionText: question?.questionText || '',
        content: question?.content || '',
        explanation: question?.explanation || '',
        correctAnswer: question?.correctAnswer || '',
        options: question?.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : ['', '', '', ''],
        // New Fields
        difficulty: question?.difficulty || 50,
        estimatedTime: question?.estimatedTime || 60,
        aiPrompt: question?.aiPrompt || '',
        mediaId: question?.mediaId || ''
    });

    useEffect(() => {
        // Mock fetch media library (in real implementation, swap with API call)
        // fetch('/api/media').then(...)
    }, []);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    // Tab Renderers
    const renderGeneralTab = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Niveau CECRL</label>
                    <select
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold dark:text-white"
                        value={formData.level}
                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                    >
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compétence</label>
                    <select
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold dark:text-white"
                        value={formData.skill}
                        onChange={e => setFormData({ ...formData, skill: e.target.value })}
                    >
                        <option value="READING">Compréhension Écrite</option>
                        <option value="LISTENING">Compréhension Orale</option>
                        <option value="WRITING">Expression Écrite</option>
                        <option value="SPEAKING">Expression Orale</option>
                        <option value="GRAMMAR">Grammaire & Lexique</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thématique</label>
                <input
                    type="text"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold dark:text-white"
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="Ex: Vie Quotidienne, Travail..."
                />
            </div>
        </div>
    );

    const renderContentTab = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Énoncé de la question</label>
                <textarea
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-medium dark:text-white min-h-[100px]"
                    placeholder="Posez votre question ici..."
                    value={formData.questionText}
                    onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Options de réponse (QCM)</label>
                <div className="grid gap-3">
                    {formData.options.map((opt: string, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                                className={`p-3 rounded-xl transition-colors ${formData.correctAnswer === opt && opt !== '' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500'}`}
                            >
                                <CheckCircle2 size={18} />
                            </button>
                            <input
                                type="text"
                                className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 ring-indigo-500 text-sm font-medium dark:text-white"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                value={opt}
                                onChange={e => handleOptionChange(i, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Explication / Feedback</label>
                <textarea
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-medium dark:text-white"
                    placeholder="Expliquez la bonne réponse..."
                    value={formData.explanation}
                    onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                />
            </div>
        </div>
    );

    const renderMediaTab = () => (
        <div className="space-y-8 text-center py-12">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                <Mic size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ajouter un Média</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Glissez-déposez un fichier audio (MP3) ou une image pour illustrer cette question.</p>

            <button type="button" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
                <Upload size={20} /> Importer un fichier
            </button>
            <p className="text-xs text-slate-400 mt-2">Maximum 5 Mo</p>
        </div>
    );

    const renderAiTab = () => (
        <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h4 className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 mb-2">
                    <Cpu size={18} /> Configuration de l'IA
                </h4>
                <p className="text-sm text-indigo-600/80 dark:text-indigo-400">
                    Ces paramètres aident l'algorithme à mieux intégrer cette question dans les parcours adaptatifs.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={14} /> Difficulté (1-100)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold dark:text-white"
                        value={formData.difficulty}
                        onChange={e => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} /> Temps Esti. (sec)
                    </label>
                    <input
                        type="number"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-bold dark:text-white"
                        value={formData.estimatedTime}
                        onChange={e => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prompt IA de Correction</label>
                <textarea
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-indigo-500 font-mono text-sm dark:text-white h-32"
                    placeholder="Instructions spécifiques pour l'IA (ex: L'utilisateur DOIT utiliser le subjonctif...)"
                    value={formData.aiPrompt}
                    onChange={e => setFormData({ ...formData, aiPrompt: e.target.value })}
                />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 pt-6 gap-6">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Général
                </button>
                <button
                    onClick={() => setActiveTab('content')}
                    className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'content' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Contenu & Réponses
                </button>
                <button
                    onClick={() => setActiveTab('media')}
                    className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'media' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Mic size={16} /> Médias
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Cpu size={16} /> Paramètres IA
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'content' && renderContentTab()}
                {activeTab === 'media' && renderMediaTab()}
                {activeTab === 'ai' && renderAiTab()}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-4">
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl transition-colors text-slate-600 hover:bg-slate-200">Annuler</button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    {isEditing ? 'Mettre à jour' : 'Enregistrer la question'}
                </button>
            </div>
        </div>
    );
}
