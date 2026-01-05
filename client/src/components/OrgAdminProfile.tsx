import { useState, useEffect } from 'react';
import {
    User as UserIcon,
    Mail,
    Building2,
    Save,
    Settings,
    Bell,
    Shield,
    Globe,
    Phone,
    MapPin,
    Hash,
    Loader2,
    Key,
    Palette
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function OrgAdminProfile() {
    const { user, organization, token, updateUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'personal' | 'organization'>('personal');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        postalCode: ''
    });

    const [orgFormData, setOrgFormData] = useState({
        name: '',
        nda: '',
        hourlyRate: '',
        contactPerson: '',
        primaryColor: '#3B82F6'
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: (user as any).phone || '',
                address: (user as any).address || '',
                city: (user as any).city || '',
                postalCode: (user as any).postalCode || ''
            });
        }
        if (organization) {
            setOrgFormData({
                name: organization.name || '',
                nda: (organization as any).nda || '',
                hourlyRate: (organization as any).publicHourlyRate?.toString() || '',
                contactPerson: (organization as any).contactPerson || '',
                primaryColor: (organization as any).primaryColor || '#3B82F6'
            });
        }
    }, [user, organization]);

    const handleSavePersonal = async () => {
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

    const handleSaveOrganization = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/organizations/${organization?.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: orgFormData.name,
                    nda: orgFormData.nda,
                    publicHourlyRate: parseFloat(orgFormData.hourlyRate) || 0,
                    contactPerson: orgFormData.contactPerson,
                    primaryColor: orgFormData.primaryColor
                })
            });

            if (!res.ok) throw new Error('Erreur lors de la sauvegarde');

            toast.success('Organisation mise à jour avec succès');
        } catch (error) {
            console.error(error);
            toast.error('Impossible de mettre à jour l\'organisation');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header / Profile Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-[2rem] p-8 md:p-10 border border-slate-700/50 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="relative group">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/20">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center border-4 border-slate-800">
                        <Shield size={14} className="text-white" />
                    </div>
                </div>

                <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-black text-white mb-2">{user?.name}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
                            <Mail size={12} /> {user?.email}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">
                            <Building2 size={12} /> Admin OF
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-800/30 p-1.5 rounded-xl">
                <button
                    onClick={() => setActiveSection('personal')}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm transition-all ${activeSection === 'personal'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <UserIcon size={16} className="inline mr-2" />
                    Profil Personnel
                </button>
                <button
                    onClick={() => setActiveSection('organization')}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-sm transition-all ${activeSection === 'organization'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                >
                    <Building2 size={16} className="inline mr-2" />
                    Organisation
                </button>
            </div>

            {/* Personal Info Section */}
            {activeSection === 'personal' && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-[2rem] p-8 md:p-10 border border-slate-700/50">
                    <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                        <Settings className="text-blue-500" /> Informations Personnelles
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nom Complet</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Adresse</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="123 rue de Rivoli"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Code Postal</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.postalCode}
                                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="75001"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Ville</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="Paris"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSavePersonal}
                            disabled={isSaving}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            )}

            {/* Organization Section */}
            {activeSection === 'organization' && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-[2rem] p-8 md:p-10 border border-slate-700/50">
                    <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                        <Building2 className="text-blue-500" /> Informations de l'Organisation
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Nom de l'Organisme</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={orgFormData.name}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">N° Déclaration d'Activité (NDA)</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={orgFormData.nda}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, nda: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="11 75 123456 75"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Taux Horaire Public (€)</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="number"
                                    value={orgFormData.hourlyRate}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, hourlyRate: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="65"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Contact Principal</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={orgFormData.contactPerson}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, contactPerson: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium"
                                    placeholder="Jean Dupont"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Couleur de Marque</label>
                            <div className="relative flex items-center gap-4">
                                <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="color"
                                    value={orgFormData.primaryColor}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, primaryColor: e.target.value })}
                                    className="w-16 h-14 rounded-xl cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={orgFormData.primaryColor}
                                    onChange={(e) => setOrgFormData({ ...orgFormData, primaryColor: e.target.value })}
                                    className="flex-1 pl-4 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 ring-blue-500 outline-none transition-all font-medium font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSaveOrganization}
                            disabled={isSaving}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Préférences</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-slate-500" />
                                <span className="text-sm font-medium text-slate-300">Notifications Email</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe size={18} className="text-slate-500" />
                                <span className="text-sm font-medium text-slate-300">Rapports Hebdomadaires</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Shield size={80} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-lg font-black mb-2">Sécurité Avancée</h4>
                        <p className="text-xs text-blue-200 leading-relaxed mb-4">
                            Toutes les données de votre organisme sont chiffrées et conformes au RGPD.
                        </p>
                        <button className="text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors">
                            Politique de confidentialité →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
