import { useState, useEffect } from 'react';
import {
    BookOpen,
    Plus,
    Users,
    User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClassroomManagement({ organization, token }: any) {
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassroom, setNewClassroom] = useState({ name: '', level: 'A1', capacity: 15, program: 'STANDARD', coachId: '' });
    const [coaches, setCoaches] = useState<any[]>([]);

    useEffect(() => {
        fetchClassrooms();
        fetchCoaches();
    }, [organization?.id]);

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3333/classrooms/org/${organization?.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setClassrooms(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch classrooms", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoaches = async () => {
        try {
            const res = await fetch(`http://localhost:3333/admin/users?role=COACH&orgId=${organization?.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setCoaches(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreate = async () => {
        try {
            const res = await fetch('http://localhost:3333/classrooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...newClassroom, organizationId: organization?.id })
            });

            if (res.ok) {
                setShowCreateModal(false);
                fetchClassrooms();
                setNewClassroom({ name: '', level: 'A1', capacity: 15, program: 'STANDARD', coachId: '' });
            }
        } catch (e) {
            console.error("Create error", e);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Actions */}
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                            <BookOpen size={24} />
                        </div>
                        Gestion des Salles
                    </h2>
                    <p className="text-slate-400 mt-1">Créez des cohortes par niveau pour optimiser l'apprentissage.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Nouvelle Salle
                </button>
            </div>

            {/* Classroom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-slate-500 col-span-full text-center py-20">Chargement des salles...</p>
                ) : classrooms.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                        <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-500">Aucune salle créée</h3>
                        <p className="text-slate-600 mb-6">Commencez par créer votre première salle de classe.</p>
                    </div>
                ) : (
                    classrooms.map(classroom => (
                        <div key={classroom.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-colors group">
                            <div className="p-6 border-b border-slate-800 group-hover:border-indigo-500/20 transition-colors bg-gradient-to-br from-slate-800/50 to-transparent">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                                        {classroom.level}
                                    </div>
                                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Users size={14} />
                                        {classroom._count?.students || 0} / {classroom.capacity}
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-white mb-1">{classroom.name}</h3>
                                <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                                    <User size={14} className="text-slate-600" />
                                    {classroom.coach?.name || 'Aucun formateur'}
                                </p>
                            </div>

                            {/* Students Preview (Mini list) */}
                            <div className="p-6 bg-slate-950/30">
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Étudiants inscrits</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {classroom.students && classroom.students.length > 0 ? (
                                        classroom.students.map((s: any) => (
                                            <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    {s.name[0]}
                                                </div>
                                                <span className="text-sm font-medium text-slate-300 truncate">{s.name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-600 italic">Aucun étudiant assigné.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-black text-white mb-6">Nouvelle Salle</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nom de la salle</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 ring-indigo-500 outline-none font-bold"
                                        placeholder="Ex: A1 - Groupe Matin"
                                        value={newClassroom.name}
                                        onChange={e => setNewClassroom({ ...newClassroom, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Niveau</label>
                                        <select
                                            className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 ring-indigo-500 outline-none font-bold"
                                            value={newClassroom.level}
                                            onChange={e => setNewClassroom({ ...newClassroom, level: e.target.value })}
                                        >
                                            {['A1', 'A2', 'B1', 'B2', 'C1'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Capacité</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 ring-indigo-500 outline-none font-bold"
                                            value={newClassroom.capacity}
                                            onChange={e => setNewClassroom({ ...newClassroom, capacity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Formateur Responsable</label>
                                    <select
                                        className="w-full bg-slate-800 border-none rounded-xl p-3 text-white focus:ring-2 ring-indigo-500 outline-none font-bold"
                                        value={newClassroom.coachId}
                                        onChange={e => setNewClassroom({ ...newClassroom, coachId: e.target.value })}
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={handleCreate}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-4 transition-colors"
                                >
                                    Créer la Salle
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
