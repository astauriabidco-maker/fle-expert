import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    Trophy,
    MapPin,
    Star,
    ArrowRight,
    MessageCircle,
    Calendar,
    Sparkles,
    CheckCircle2,
    Building2,
    Coins
} from 'lucide-react';

const DirectCandidateResults: React.FC = () => {
    const { user } = useAuth();

    const partnerSchools = [
        {
            id: '1',
            name: 'Alliance Française Paris',
            rating: 4.9,
            reviews: 1250,
            distance: '2.4 km',
            address: '101 Boulevard Raspail, 75006 Paris',
            specialty: 'Préparation TEF/TCF Intensive',
            nextSession: '15 Octobre',
            price: 'À partir de 450€'
        },
        {
            id: '2',
            name: 'Accord École de Langue',
            rating: 4.7,
            reviews: 840,
            distance: '4.1 km',
            address: '14 Boulevard Poissonnière, 75009 Paris',
            specialty: 'Français Professionnel',
            nextSession: '2 Octobre',
            price: 'À partir de 380€'
        },
        {
            id: '3',
            name: 'Langue Onze Paris',
            rating: 4.8,
            reviews: 620,
            distance: '5.8 km',
            address: '10 Rue de Malte, 75011 Paris',
            specialty: 'Immersion & Culture',
            nextSession: '10 Octobre',
            price: 'À partir de 520€'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header / Results Card */}
            <div className="bg-slate-900 text-white pt-16 pb-32 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                                <Sparkles size={14} />
                                Diagnostic IA Terminé
                            </div>
                            <h1 className="text-4xl font-black mb-4 leading-tight">Bravo {user?.name} !</h1>
                            <p className="text-slate-400 text-lg font-medium max-w-xl">
                                Votre niveau a été évalué avec précision. Voici votre profil linguistique actuel et nos recommandations pour atteindre votre objectif.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] flex items-center gap-6">
                            <div className="w-24 h-24 bg-indigo-500 rounded-3xl flex items-center justify-center text-5xl font-black shadow-2xl shadow-indigo-500/20">
                                B1
                            </div>
                            <div>
                                <div className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-1">Niveau Estimé</div>
                                <div className="text-2xl font-black">Intermédiaire</div>
                                <div className="text-sm font-bold text-slate-400">Score IA: 452 pts</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations Grid */}
            <div className="max-w-4xl mx-auto px-4 -mt-16">
                {/* Stats / Gap Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: 'Objectif', val: 'B2', sub: 'Nationalité', icon: <Trophy className="text-amber-500" /> },
                        { label: 'Progression', val: '+120h', sub: 'Temps estimé', icon: <Calendar className="text-blue-500" /> },
                        { label: 'Points Forts', val: 'Oral', sub: 'Compréhension', icon: <CheckCircle2 className="text-emerald-500" /> }
                    ].map((s, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                {s.icon}
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                                <div className="text-xl font-black text-slate-900">{s.val}</div>
                                <div className="text-xs font-bold text-slate-500">{s.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Building2 className="text-indigo-600" />
                        Écoles Partenaires Recommandées
                    </h2>
                    <button className="text-sm font-bold text-indigo-600 hover:underline">Voir tout →</button>
                </div>

                {/* Schools List */}
                <div className="space-y-6">
                    {partnerSchools.map((school) => (
                        <div key={school.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-200/20 transition-all overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/3 bg-slate-100 h-48 md:h-auto relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                        <Building2 size={80} />
                                    </div>
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                                        <Star size={14} className="fill-amber-400 text-amber-400" />
                                        <span className="text-xs font-black text-slate-900">{school.rating}</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-8">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{school.name}</h3>
                                            <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">{school.specialty}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-slate-900">{school.price}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Par Parcours</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 mb-6 mt-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <MapPin size={14} />
                                            {school.distance} • {school.address}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                            <Calendar size={14} />
                                            Prochaine session : {school.nextSession}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2">
                                            Contacter l'école <ArrowRight size={18} />
                                        </button>
                                        <button className="w-14 h-14 border-2 border-slate-100 rounded-2x flex items-center justify-center text-slate-400 hover:border-indigo-100 hover:text-indigo-600 hover:bg-indigo-50 transition">
                                            <MessageCircle size={22} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Refund Code / Incentive Section */}
                {user?.refundCode && (
                    <div className="mt-12 bg-white rounded-[2.5rem] border-2 border-dashed border-indigo-200 p-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Coins size={32} />
                        </div>
                        <h2 className="text-2xl font-black mb-2">Diagnostic Remboursé ! 🎁</h2>
                        <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                            Présentez ce code lors de votre inscription dans l'un de nos centres partenaires pour déduire les <span className="text-indigo-600 font-black">9,90€</span> de vos frais.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <div className="bg-slate-50 border border-slate-200 px-8 py-4 rounded-2xl font-mono text-2xl font-black tracking-widest text-slate-900 select-all">
                                {user.refundCode}
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(user.refundCode!)}
                                className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-lg active:scale-95"
                            >
                                Copier le code
                            </button>
                        </div>
                    </div>
                )}

                {/* Call to Action */}
                <div className="mt-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Sparkles size={160} />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Besoin d'un accompagnement sur mesure ?</h2>
                    <p className="text-indigo-100 text-lg font-medium mb-8 max-w-2xl mx-auto">
                        Inscrivez-vous dans l'un de nos centres partenaires pour bénéficier d'un accès premium à la plateforme et d'un suivi personnalisé par nos coachs.
                    </p>
                    <button className="bg-white text-indigo-900 font-black px-10 py-5 rounded-2xl hover:bg-indigo-50 transition shadow-2xl active:scale-95 text-lg">
                        Prendre un RDV Conseil Gratuit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DirectCandidateResults;
