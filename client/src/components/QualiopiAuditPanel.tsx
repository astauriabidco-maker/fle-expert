import { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Search,
    CheckCircle2,
    AlertCircle,
    Users,
    CheckCircle,
    Clock,
    Printer
} from 'lucide-react';

interface AuditStudent {
    id: string;
    name: string;
    email: string;
    hasVerifiedPrerequisites: boolean;
    prerequisitesProofUrl?: string;
    createdAt: string;
    currentLevel: string;
    targetLevel: string;
    objective: string;
}

interface QualiopiAuditPanelProps {
    orgId: string;
    token: string;
}

export default function QualiopiAuditPanel({ orgId, token }: QualiopiAuditPanelProps) {
    const [students, setStudents] = useState<AuditStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

    useEffect(() => {
        fetchAuditData();
    }, [orgId, token]);

    const fetchAuditData = async () => {
        try {
            const res = await fetch(`http://localhost:3333/analytics/qualiopi/${orgId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setStudents(await res.json());
            }
        } catch (err) {
            console.error('Audit fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = (s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = filter === 'all' ||
            (filter === 'verified' && s.hasVerifiedPrerequisites) ||
            (filter === 'pending' && !s.hasVerifiedPrerequisites);
        return matchesSearch && matchesFilter;
    });

    const getObjectiveLabel = (obj?: string) => {
        const mapping: Record<string, string> = {
            'NATURALIZATION': 'Naturalisation Française',
            'RESIDENCY_10_YEAR': 'Carte de Résident (10 ans)',
            'RESIDENCY_MULTI_YEAR': 'Titre pluriannuel (2-4 ans)',
            'CANADA': 'Immigration Canada / Québec',
            'PROFESSIONAL': 'Usage Professionnel'
        };
        return (obj && mapping[obj]) || obj || 'Positionnement Standard';
    };

    const exportComplianceReport = (student: AuditStudent) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const date = new Date().toLocaleDateString('fr-FR');
        const content = `
            <html>
            <head>
                <title>Rapport de Conformité Qualiopi - ${student.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px; }
                    .h1 { color: #1e3a8a; margin: 0; }
                    .section { margin-bottom: 30px; }
                    .label { font-weight: bold; color: #666; font-size: 0.9em; text-transform: uppercase; }
                    .value { font-size: 1.1em; color: #111; margin-top: 5px; }
                    .status { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: bold; margin-top: 10px; }
                    .status-valid { background: #dcfce7; color: #166534; }
                    .status-pending { background: #fef9c3; color: #854d0e; }
                    .footer { margin-top: 60px; font-size: 0.8em; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                    .proof-box { border: 1px dashed #ccc; padding: 20px; background: #f9fafb; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="h1">Rapport de Conformité Qualiopi</h1>
                        <p>Preuve de positionnement et vérification des prérequis</p>
                    </div>
                </div>

                <div class="section">
                    <h3>Informations Candidat</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <p class="label">Nom Complet</p>
                            <p class="value">${student.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="label">Email</p>
                            <p class="value">${student.email}</p>
                        </div>
                        <div>
                            <p class="label">Objectif Pédagogique</p>
                            <p class="value">${getObjectiveLabel(student.objective)}</p>
                        </div>
                        <div>
                            <p class="label">Date d'inscription</p>
                            <p class="value">${new Date(student.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h3>Vérification des Prérequis (Indicateur 1 & 8)</h3>
                    <div class="status ${student.hasVerifiedPrerequisites ? 'status-valid' : 'status-pending'}">
                        ${student.hasVerifiedPrerequisites ? '✓ PRÉREQUIS VALIDÉS' : '⚠ EN ATTENTE DE VALIDATION'}
                    </div>
                    ${student.hasVerifiedPrerequisites ? `
                        <p style="margin-top: 15px">Le candidat a attesté avoir pris connaissance des prérequis pédagogiques nécessaires pour la formation visée (${student.targetLevel || 'B1-B2'}). Cette vérification a été effectuée de manière digitale avec horodatage sécurisé.</p>
                    ` : `
                        <p style="margin-top: 15px">Le candidat n'a pas encore validé l'étape de vérification des prérequis.</p>
                    `}
                </div>

                <div class="section">
                    <h3>Preuve Numérique</h3>
                    <div class="proof-box">
                        <p class="label">ID de Traçabilité</p>
                        <p>${student.id.toUpperCase()}</p>
                        <p class="label">Empreinte Horodatée</p>
                        <p>${date} ${new Date().toLocaleTimeString('fr-FR')}</p>
                    </div>
                </div>

                <div class="footer">
                    <p>Document généré par FLE Expert - Module Audit Qualiopi. Fait foi de preuve de positionnement initial.</p>
                </div>
                <script>window.onload = () => { window.print(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShieldCheck className="text-blue-500" size={32} />
                        Audit de Conformité Qualiopi
                    </h2>
                    <p className="text-slate-400 mt-1 font-medium italic">Gestion des preuves de positionnement et prérequis pédagogiques</p>
                </div>
                <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Taux de Conformité</p>
                        <p className="text-xl font-black text-white">
                            {students.length > 0 ? Math.round((students.filter(s => s.hasVerifiedPrerequisites).length / students.length) * 100) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1E293B]/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase">Total Candidats</p>
                        <p className="text-2xl font-black text-white">{students.length}</p>
                    </div>
                </div>
                <div className="bg-emerald-600/10 p-6 rounded-3xl border border-emerald-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-emerald-500/50 uppercase">Conformes</p>
                        <p className="text-2xl font-black text-white">{students.filter(s => s.hasVerifiedPrerequisites).length}</p>
                    </div>
                </div>
                <div className="bg-amber-600/10 p-6 rounded-3xl border border-amber-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-amber-500/50 uppercase">En Attente</p>
                        <p className="text-2xl font-black text-white">{students.filter(s => !s.hasVerifiedPrerequisites).length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1E293B]/30 p-4 rounded-2xl border border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un candidat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('verified')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filter === 'verified' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Vérifiés
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Attente
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1E293B]/50 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800 bg-[#1e293b]/50">
                                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Candidat</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status Prérequis</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Preuve d'Audit</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredStudents.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-lg shadow-blue-500/10">
                                                {s.name?.charAt(0) || s.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white leading-tight">{s.name || 'Candidat FLE'}</p>
                                                <p className="text-xs text-slate-500 font-medium">{s.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {s.hasVerifiedPrerequisites ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full uppercase border border-emerald-500/20">
                                                <CheckCircle2 size={12} />
                                                Vérifié
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full uppercase border border-amber-500/20">
                                                <AlertCircle size={12} />
                                                En attente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[10px] font-black text-slate-500 uppercase italic whitespace-nowrap">Empreinte Horodatée :</p>
                                            <p className="text-[10px] font-mono text-blue-400/70 truncate w-32">{s.id.toUpperCase()}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => exportComplianceReport(s)}
                                            className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-700 flex items-center gap-2 text-xs font-black uppercase ml-auto"
                                        >
                                            <Printer size={16} />
                                            Rapport PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && !loading && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-600">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">Aucun candidat ne correspond</h3>
                    </div>
                )}
            </div>

            {/* Information Card */}
            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
                <AlertCircle className="text-blue-400 shrink-0" size={24} />
                <div>
                    <h4 className="font-black text-blue-400 uppercase text-xs mb-1 text-[10px]">Indicateur Qualiopi (Réglementaire)</h4>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                        Ce tableau de bord centralise les preuves de vérification des prérequis et de positionnement initial, nécessaires pour satisfaire aux critères Qualiopi lors de vos audits.
                    </p>
                </div>
            </div>
        </div>
    );
}
