import React, { useState, useEffect } from 'react';

import {
    Users,
    ClipboardList,
    TrendingUp,
    DollarSign,
    Search,
    Mail,
    CheckCircle2,
    X,
    Loader2,
    Copy,
    Share2,
    LayoutDashboard,
    LogOut,
    Settings as SettingsIcon,
    MoreHorizontal,
    Sparkles,
    Kanban,
    List,
    MessageSquare,
    Tag as TagIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import QuickAddSlideOver from './sales/QuickAddSlideOver';
import KanbanBoard from './sales/KanbanBoard';
import TasksBanner from './sales/TasksBanner';
import CreateTaskModal from './sales/CreateTaskModal';
import RevenueChart from './sales/RevenueChart';
import FunnelChart from './sales/FunnelChart';
import ProgressGauge from './sales/ProgressGauge';
import TeamRanking from './sales/TeamRanking';
import AdvancedFilters from './sales/AdvancedFilters';
import type { AdvancedFiltersState } from './sales/AdvancedFilters';
import QuickNoteModal from './sales/QuickNoteModal';
import TagPicker, { TAG_OPTIONS } from './sales/TagPicker';


const SalesDashboard: React.FC = () => {
    const { organization, token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState<any>(null);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [quickNoteCandidate, setQuickNoteCandidate] = useState<any>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
        objectives: [],
        lastContact: null,
        pipelineAge: null,
        coachId: null,
    });
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [statsRes, candidatesRes] = await Promise.all([
                fetch('http://localhost:3333/sales/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3333/sales/candidates', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (candidatesRes.ok) setCandidates(await candidatesRes.json());
        } catch (error) {
            console.error("Sales Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.pipelineStatus === statusFilter;

        // Advanced Filters
        let matchesAdvanced = true;

        // Objective
        if (advancedFilters.objectives.length > 0) {
            if (!advancedFilters.objectives.includes(c.objective)) matchesAdvanced = false;
        }

        // Last Contact
        if (matchesAdvanced && advancedFilters.lastContact) {
            const lastActivity = c.lastActivity ? new Date(c.lastActivity) : null;
            const now = new Date();
            const daysSince = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : 999;

            switch (advancedFilters.lastContact) {
                case 'today':
                    if (daysSince !== 0) matchesAdvanced = false;
                    break;
                case 'week':
                    if (daysSince > 7) matchesAdvanced = false;
                    break;
                case 'month':
                    if (daysSince > 30) matchesAdvanced = false;
                    break;
                case '30plus':
                    if (daysSince <= 30) matchesAdvanced = false;
                    break;
                case 'never':
                    if (lastActivity !== null) matchesAdvanced = false;
                    break;
            }
        }

        // Pipeline Age
        if (matchesAdvanced && advancedFilters.pipelineAge) {
            const createdAt = new Date(c.createdAt);
            const now = new Date();
            const daysInPipeline = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

            switch (advancedFilters.pipelineAge) {
                case '0-7':
                    if (daysInPipeline > 7) matchesAdvanced = false;
                    break;
                case '7-30':
                    if (daysInPipeline <= 7 || daysInPipeline > 30) matchesAdvanced = false;
                    break;
                case '30-90':
                    if (daysInPipeline <= 30 || daysInPipeline > 90) matchesAdvanced = false;
                    break;
                case '90plus':
                    if (daysInPipeline <= 90) matchesAdvanced = false;
                    break;
            }
        }

        // Coach
        if (matchesAdvanced && advancedFilters.coachId) {
            if (c.coachId !== advancedFilters.coachId) matchesAdvanced = false;
        }

        return matchesSearch && matchesStatus && matchesAdvanced;
    });

    const handleGenerateLink = async (candidateId: string) => {
        try {
            const res = await fetch('http://localhost:3333/sales/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ candidateId })
            });
            if (res.ok) {
                const data = await res.json();
                setIsLinkModalOpen({ link: data.link });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTagToggle = async (candidateId: string, tags: string[]) => {
        try {
            const res = await fetch(`http://localhost:3333/sales/candidates/${candidateId}/tags`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tags })
            });
            if (res.ok) {
                setCandidates(prev => prev.map(c =>
                    c.id === candidateId ? { ...c, tags: JSON.stringify(tags) } : c
                ));
            }
        } catch (error) {
            console.error('Failed to update tags:', error);
        }
    };

    const handleQuickNoteSuccess = () => {
        fetchData();
    };


    const [activeTab, setActiveTab] = useState('pipeline');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout } = useAuth();

    const menuItems = [
        { id: 'pipeline', label: 'Pipeline', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
    ];

    return (
        <div className="flex h-screen bg-[#0F172A] overflow-hidden text-slate-200">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="bg-[#1E293B]/50 backdrop-blur-xl border-r border-slate-800 flex flex-col relative z-30"
            >
                {/* Brand Logo */}
                <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                        <Users className="text-white w-6 h-6" />
                    </div>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="ml-4 overflow-hidden"
                        >
                            <h2 className="font-black text-white leading-tight truncate">Sales Hub</h2>
                            <p className="text-sm text-slate-500 font-medium">Espace Commercial</p>
                        </motion.div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all group relative ${activeTab === item.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                            {isSidebarOpen && (
                                <span className="ml-4 font-bold text-sm">{item.label}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800/50 space-y-2">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors text-slate-400"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="ml-4">Déconnexion</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] overflow-y-auto h-screen relative p-6">
                <div className="max-w-[1600px] mx-auto space-y-8 w-full">

                    {activeTab === 'pipeline' && (
                        <div className="space-y-8">
                            {/* Header */}
                            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1E293B]/50 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-xl">
                                <div>
                                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                        Espace Commercial
                                    </h1>
                                    <p className="text-slate-400 font-medium mt-1">
                                        {organization?.name} • Votre Pipeline de Vente
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsQuickAddOpen(true)}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Sparkles size={20} />
                                        Ajout Rapide
                                    </button>
                                </div>
                            </header>

                            {/* Tasks Banner */}
                            <TasksBanner onCreateTask={() => setIsCreateTaskOpen(true)} />

                            {/* View Toggle + Stats Grid */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                    <StatCard icon={<Users className="text-blue-400" />} label="Prospects" value={stats?.activeLeads || 0} loading={loading} />
                                    <StatCard icon={<ClipboardList className="text-amber-400" />} label="Devis" value={stats?.pendingQuotes || 0} loading={loading} />
                                    <StatCard icon={<TrendingUp className="text-emerald-400" />} label="Conversion" value={stats?.conversionRate || '0%'} loading={loading} />
                                    <StatCard icon={<DollarSign className="text-indigo-400" />} label="C.A Mensuel" value={stats?.monthlyRevenue || '0€'} loading={loading} />
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        className={`p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                        title="Vue Kanban"
                                    >
                                        <Kanban className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                        title="Vue Liste"
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Filters Bar */}
                            <div className="bg-[#1E293B]/50 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un nom, email..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                        value={searchQuery}
                                        onChange={(e: any) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="w-full md:w-48 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:ring-2 ring-blue-500"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">Tous les statuts</option>
                                    <option value="PROSPECT">Prospects</option>
                                    <option value="DIAGNOSTIC_FAIT">Diagnostic Fait</option>
                                    <option value="DEVIS_EN_COURS">Devis en cours</option>
                                    <option value="INSCRIT">Inscrits</option>
                                </select>

                                <AdvancedFilters
                                    filters={advancedFilters}
                                    onFiltersChange={setAdvancedFilters}
                                />
                            </div>

                            {/* Kanban or List View */}
                            {viewMode === 'kanban' ? (
                                <KanbanBoard
                                    candidates={filteredCandidates}
                                    onCandidatesChange={setCandidates}
                                    onGenerateLink={handleGenerateLink}
                                    onQuickNote={setQuickNoteCandidate}
                                    onTagToggle={handleTagToggle}
                                />
                            ) : (
                                <CandidatesTable
                                    loading={loading}
                                    candidates={filteredCandidates}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    statusFilter={statusFilter}
                                    setStatusFilter={setStatusFilter}
                                    handleGenerateLink={handleGenerateLink}
                                    onQuickNote={setQuickNoteCandidate}
                                    onTagToggle={handleTagToggle}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-8">
                            <header className="bg-[#1E293B]/50 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-xl">
                                <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                                    Analytics & Performance
                                </h1>
                                <p className="text-slate-400 font-medium mt-1">
                                    Visualisez vos performances commerciales
                                </p>
                            </header>

                            {/* Analytics Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Revenue Chart - Full width on mobile, half on desktop */}
                                <div className="lg:col-span-2">
                                    <RevenueChart />
                                </div>

                                {/* Funnel Chart */}
                                <FunnelChart />

                                {/* Progress Gauge */}
                                <ProgressGauge />

                                {/* Team Ranking - Full width */}
                                <div className="lg:col-span-2">
                                    <TeamRanking />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <div className="space-y-8">
                            <header className="bg-[#1E293B]/50 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-xl">
                                <h1 className="text-3xl font-black text-white">Clients</h1>
                                <p className="text-slate-400">Liste complète de vos contacts</p>
                            </header>
                            <CandidatesTable
                                loading={loading}
                                candidates={filteredCandidates}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                handleGenerateLink={handleGenerateLink}
                                onQuickNote={setQuickNoteCandidate}
                                onTagToggle={handleTagToggle}
                            />
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <header className="bg-[#1E293B]/50 p-6 rounded-[2rem] border border-slate-800 backdrop-blur-xl">
                                <h1 className="text-3xl font-black text-white">Paramètres</h1>
                                <p className="text-slate-400">Configuration de votre compte</p>
                            </header>
                            <div className="bg-[#1E293B]/50 p-8 rounded-[2rem] border border-slate-800">
                                <p className="text-slate-400">Paramètres du profil commercial (à venir).</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Modals */}
                <QuickAddSlideOver
                    isOpen={isQuickAddOpen}
                    onClose={() => setIsQuickAddOpen(false)}
                    onSuccess={fetchData}
                />

                <CreateTaskModal
                    isOpen={isCreateTaskOpen}
                    onClose={() => setIsCreateTaskOpen(false)}
                    onSuccess={fetchData}
                />

                <AnimatePresence>
                    {isLinkModalOpen && (
                        <LinkModal
                            isOpen={!!isLinkModalOpen}
                            onClose={() => setIsLinkModalOpen(null)}
                            link={isLinkModalOpen?.link}
                        />
                    )}
                </AnimatePresence>

                <QuickNoteModal
                    candidateId={quickNoteCandidate?.id}
                    candidateName={quickNoteCandidate?.name}
                    isOpen={!!quickNoteCandidate}
                    onClose={() => setQuickNoteCandidate(null)}
                    onSuccess={handleQuickNoteSuccess}
                />
            </main>
        </div>
    );
};

// Sub-components

function StatCard({ icon, label, value, loading }: any) {
    return (
        <div className="bg-[#1E293B]/50 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 flex items-center gap-5 hover:border-slate-700 transition-colors group">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
                ) : (
                    <p className="text-2xl font-black text-white">{value}</p>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'PROSPECT': 'bg-slate-800 text-slate-400 border-slate-700',
        'DIAGNOSTIC_FAIT': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'DEVIS_EN_COURS': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        'INSCRIT': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    };
    const labels: any = {
        'PROSPECT': 'Nouveau',
        'DIAGNOSTIC_FAIT': 'Diag. Terminé',
        'DEVIS_EN_COURS': 'Offre Envoyée',
        'INSCRIT': 'Inscrit'
    };

    return (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles['PROSPECT']}`}>
            {labels[status] || status}
        </span>
    );
}

function LinkModal({ isOpen, onClose, link }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="p-8 bg-emerald-500/10 border-b border-emerald-500/20 text-center">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Lien Généré !</h3>
                    <p className="text-emerald-400 font-medium">Le candidat peut commencer son diagnostic.</p>
                </div>
                <div className="p-8">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Lien unique de test</label>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={link}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm font-mono"
                        />
                        <button
                            onClick={() => { navigator.clipboard.writeText(link); alert('Copié !'); onClose(); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-xl transition-colors"
                        >
                            <Copy size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        Ce lien redirige vers la création de compte et le test de positionnement.
                    </p>
                </div>
            </div>
        </div>
    );
}



function CandidatesTable({ loading, candidates, handleGenerateLink, onQuickNote, onTagToggle }: any) {
    return (
        <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users size={24} className="text-slate-400" />
                    Gestion des Candidats
                </h2>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1E293B] text-slate-400 text-xs font-bold uppercase tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="p-6">Candidat</th>
                            <th className="p-6">Statut</th>
                            <th className="p-6">Tags</th>
                            <th className="p-6">Dernière Activité</th>
                            <th className="p-6">Analyse</th>
                            <th className="p-6 text-right">Actions Rapides</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="p-20 text-center text-slate-500"><Loader2 className="animate-spin mx-auto mb-2" /> Chargement...</td></tr>
                        ) : candidates.length === 0 ? (
                            <tr><td colSpan={6} className="p-20 text-center text-slate-500 italic">Aucun candidat trouvé. Ajoutez-en un !</td></tr>
                        ) : candidates.map((c: any) => {
                            let tags: string[] = [];
                            try {
                                tags = c.tags ? JSON.parse(c.tags) : [];
                            } catch (e) { }

                            return (
                                <tr key={c.id} className="group hover:bg-slate-800/30 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700">
                                                {c.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-base">{c.name}</div>
                                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                    <Mail size={10} /> {c.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <StatusBadge status={c.pipelineStatus} />
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {tags.map(tagId => {
                                                const tag = TAG_OPTIONS.find(t => t.id === tagId);
                                                if (!tag) return null;
                                                return (
                                                    <span
                                                        key={tagId}
                                                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${tag.bg} ${tag.color} ${tag.border}`}
                                                    >
                                                        {tag.label}
                                                    </span>
                                                );
                                            })}
                                            {tags.length === 0 && <span className="text-slate-600 italic text-[10px]">Aucun tag</span>}
                                        </div>
                                    </td>
                                    <td className="p-6 text-slate-400 font-medium">
                                        {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : 'Jamais'}
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 border border-slate-700">
                                            {c.level || '?'} → {c.targetLevel || 'B2'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => onQuickNote(c)}
                                                className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                                                title="Note Rapide"
                                            >
                                                <MessageSquare size={18} />
                                            </button>

                                            <div className="relative tag-picker-container">
                                                <TagButton
                                                    candidate={c}
                                                    selectedTags={tags}
                                                    onToggleTag={onTagToggle}
                                                />
                                            </div>

                                            <button
                                                onClick={() => handleGenerateLink(c.id)}
                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border border-blue-500/20 tooltip"
                                                title="Envoyer Test"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TagButton({ candidate, selectedTags, onToggleTag }: any) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-lg transition-colors border ${isOpen ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border-slate-700'}`}
                title="Tags"
            >
                <TagIcon size={18} />
            </button>
            <TagPicker
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                selectedTags={selectedTags}
                onToggleTag={(tagId: string) => onToggleTag(candidate.id, selectedTags.includes(tagId) ? selectedTags.filter((t: string) => t !== tagId) : [...selectedTags, tagId])}
            />
        </div>
    );
}

export default SalesDashboard;
