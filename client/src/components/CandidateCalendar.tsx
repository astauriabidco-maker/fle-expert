import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Video,
    MapPin,
    GraduationCap,
    Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CandidateCalendar = () => {

    // Mock data for candidate events
    const events = [
        {
            id: '1',
            title: 'Cours de Conversation B2',
            time: '14:00 - 15:30',
            date: new Date(new Date().setDate(new Date().getDate() + 1)),
            type: 'CLASS',
            expert: 'Sarah L.',
            location: 'Zoom'
        },
        {
            id: '2',
            title: 'Examen Blanc TCF',
            time: '09:00 - 11:30',
            date: new Date(new Date().setDate(new Date().getDate() + 3)),
            type: 'EXAM',
            expert: 'Plateforme AI',
            location: 'Mode Sécurisé'
        },
    ];

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <CalendarIcon className="text-indigo-600" size={32} />
                        Mon Emploi du Temps
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Ne manquez aucune session importante.</p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft size={20} /></button>
                    <span className="font-black text-slate-900 dark:text-white px-4">Janvier 2026</span>
                    <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Calendar Grid */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {days.map(day => (
                            <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {Array.from({ length: 31 }).map((_, i) => (
                            <div
                                key={i}
                                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all group cursor-pointer relative
                                    ${(i + 1) === new Date().getDate()
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                            >
                                <span className={`text-sm font-black ${(i + 1) === new Date().getDate() ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                                    {i + 1}
                                </span>
                                {(i + 1) === 15 || (i + 1) === 18 ? (
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Events Column */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">À Venir cette semaine</h3>

                    <div className="space-y-4">
                        {events.map((event) => (
                            <motion.div
                                key={event.id}
                                whileHover={{ x: 5 }}
                                className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group"
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${event.type === 'CLASS' ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-xl ${event.type === 'CLASS' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {event.type === 'CLASS' ? <Video size={18} /> : <Zap size={18} />}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{event.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                </div>

                                <h4 className="font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">
                                    {event.title}
                                </h4>
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase">
                                        <Clock size={12} /> {event.time}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase">
                                        <GraduationCap size={12} /> {event.expert}
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-2 text-xs text-indigo-500 font-black">
                                            <MapPin size={12} /> {event.location}
                                        </div>
                                    )}
                                </div>

                                <button className="mt-6 w-full py-3 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                    Détails de la session
                                </button>
                            </motion.div>
                        ))}

                        {events.length === 0 && (
                            <div className="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-400 italic">Aucune session programmée</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Video size={120} />
                        </div>
                        <h4 className="text-xl font-black mb-2">Besoin d'aide ?</h4>
                        <p className="text-xs text-indigo-100 mb-6 font-medium">Réservez une session de coaching 1-on-1 pour débloquer votre progression.</p>
                        <button className="bg-white text-indigo-600 font-black text-[10px] uppercase px-4 py-2 rounded-lg shadow-lg">Prendre RDV</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
