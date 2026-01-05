import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface QuestionEditorProps {
    question?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export default function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
    const isEditing = !!question;
    const [formData, setFormData] = useState({
        level: question?.level || 'B1',
        topic: question?.topic || 'Grammaire',
        questionText: question?.questionText || '',
        content: question?.content || '',
        explanation: question?.explanation || '',
        correctAnswer: question?.correctAnswer || '',
        options: question?.options ? (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) : ['', '', '', '']
    });

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Niveau</label>
                    <select
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-primary transition-all text-sm font-bold dark:text-white"
                        value={formData.level}
                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                    >
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sujet</label>
                    <input
                        type="text"
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-primary transition-all text-sm font-bold dark:text-white"
                        value={formData.topic}
                        onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Énoncé de la question</label>
                <textarea
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-primary transition-all text-sm font-bold dark:text-white min-h-[100px]"
                    placeholder="Ex: Quel est le participe passé du verbe..."
                    value={formData.questionText}
                    onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Options de réponse</label>
                <div className="grid grid-cols-1 gap-3">
                    {formData.options.map((opt: string, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                                className={`p-3 rounded-xl transition-colors ${formData.correctAnswer === opt && opt !== '' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                            >
                                <CheckCircle2 size={18} />
                            </button>
                            <input
                                type="text"
                                className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 ring-primary transition-all text-sm font-medium dark:text-white"
                                placeholder={`Option ${i + 1}`}
                                value={opt}
                                onChange={e => handleOptionChange(i, e.target.value)}
                                required
                            />
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 ml-1">Cliquez sur l'icône pour définir la bonne réponse</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Explication (Optionnel)</label>
                <textarea
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-primary transition-all text-sm font-medium dark:text-white"
                    placeholder="Pourquoi cette réponse est correcte ?"
                    value={formData.explanation}
                    onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                />
            </div>

            <div className="pt-6 flex gap-4">
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl transition-colors">Annuler</button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-all"
                >
                    {isEditing ? 'Mettre à jour' : 'Enregistrer la question'}
                </button>
            </div>
        </div>
    );
}
