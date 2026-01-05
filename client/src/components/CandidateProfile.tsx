
import { useState, useEffect } from 'react';
import {
    User as UserIcon,
    Mail,
    Target,
    Save,
    Settings,
    Bell,
    Shield,
    Globe,
    Phone,
    MapPin,
    Hash,
    Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';


export default function CandidateProfile() {
    const { user, token, updateUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        objective: '',
        targetLevel: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                postalCode: user.postalCode || '',
                objective: user.objective || 'PROFESSIONAL',
                targetLevel: user.targetLevel || 'B2'
            });
        }
    }, [user]);

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const objectives = [
        { id: 'RESIDENCY_MULTI_YEAR', label: 'Carte de séjour pluriannuelle (A2)' },
        { id: 'RESIDENCY_10_YEAR', label: 'Carte de résident 10 ans (B1)' },
        { id: 'NATURALIZATION', label: 'Nationalité française (B2)' },
        { id: 'CANADA', label: 'Canada / Québec (B2+)' },
        { id: 'PROFESSIONAL', label: 'Professionnel / Autre' }
    ];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Erreur lors de la sauvegarde');

            const data = await res.json();
            updateUser(data.user);
            toast.success('Profil mis à jour avec succès');
        } catch (error) {
            console.error(error);
            toast.error('Impossible de mettre à jour le profil');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header / Profile Info */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-500/20">
                        {user?.name?.[0] || 'U'}
                    </div>
                </div>

                <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic">{user?.name}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                            <Mail size={12} /> {user?.email}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
                            <Shield size={12} /> Compte Candidat
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 active:scale-95 uppercase tracking-widest text-xs"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form Settings */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight italic">
                            <Settings className="text-indigo-600" /> Informations Personnelles
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Nom Complet</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 ring-indigo-500 outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 ring-indigo-500 outline-none transition-all font-bold"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Adresse</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 ring-indigo-500 outline-none transition-all font-bold"
                                        placeholder="123 rue de Rivoli"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Code Postal</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 ring-indigo-500 outline-none transition-all font-bold"
                                        placeholder="75001"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Ville</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 ring-indigo-500 outline-none transition-all font-bold"
                                        placeholder="Paris"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Objectif Actuel</label>
                                <div className="relative">
                                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" size={18} />
                                    <select
                                        value={formData.objective}
                                        onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl text-slate-900 dark:text-white focus:ring-2 ring-indigo-500 outline-none transition-all appearance-none cursor-pointer font-black text-sm"
                                    >
                                        {objectives.map(obj => (
                                            <option key={obj.id} value={obj.id}>{obj.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Niveau Cible (Auto)</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={formData.targetLevel}
                                        onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:ring-2 ring-indigo-500 outline-none transition-all appearance-none cursor-pointer font-bold"
                                    >
                                        {levels.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Mini Settings */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Préférences</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bell size={18} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Push Notifications</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Globe size={18} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Newsletter FLE</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Shield size={100} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-lg font-black mb-2 italic">Sécurité FLE Expert</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed mb-6 font-medium">Vos données sont chiffrées de bout en bout et conformes RGPD.</p>
                            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">Politique de confidentialité</button>
                        </div>
                    </div>

                    <button className="w-full py-4 text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl border border-transparent hover:border-rose-100 transition-all flex items-center justify-center gap-2">
                        Supprimer mon compte
                    </button>
                </div>
            </div>
        </div>
    );
}

