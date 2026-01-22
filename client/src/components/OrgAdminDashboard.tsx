import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StudentDetailModal } from './StudentDetailModal'; // Import
import {
    Users,
    Mail,
    History,
    CheckCircle2,
    Search,
    Eye,
    EyeOff,
    Ban,
    AlertCircle,
    ClipboardList,
    LogOut,
    Sparkles,
    Loader2,
    CheckCircle,
    XCircle,
    FileText,
    ShieldCheck,
    Settings as SettingsIcon,
    LayoutDashboard,
    GraduationCap,
    Library,
    Zap,
    ArrowRight,
    X,
    MoreHorizontal,
    TrendingUp,
    ArrowUpRight,
    Globe,
    MessageCircle,
    Calendar,
    BarChart3,
    Target,
    Award,
    CreditCard,
    Plus,
    Check,
    Edit2,
    Trash2,
    Bell,
    BookOpen
} from 'lucide-react';
import CivicContentManager from './CivicContentManager';
import QualiopiAuditPanel from './QualiopiAuditPanel';
import NotificationCenter from './NotificationCenter';
import OrgAdminProfile from './OrgAdminProfile';
import { motion, AnimatePresence } from 'framer-motion';

// Coach & Candidate components for multi-role access
import MessagingPanel from './MessagingPanel';
import CoachCalendar from './CoachCalendar';
import CoachStatsPanel from './CoachStatsPanel';
import PersonalizedPath from './PersonalizedPath';
import { Portfolio } from './Portfolio';
import CivicPath from './CivicPath';
import { CandidateBilling } from './CandidateBilling';
import { BusinessPerformance } from './BusinessPerformance';
import ClassroomManagement from './ClassroomManagement';
import CoachSessionsManager from './CoachSessionsManager';
import ContentLabPage from './ContentLabPage';

import {
    ResponsiveContainer,
    BarChart as ReBarChart,
    Bar as ReBar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

type TabType = 'dashboard' | 'equipe' | 'cohorte' | 'salles' | 'bibliotheque' | 'performance' | 'validations' | 'propositions' | 'rapports' | 'parametres' | 'admin' | 'civic' | 'audit' | 'profil' | 'messages' | 'coach-calendar' | 'coach-stats' | 'mypath' | 'myportfolio' | 'mycivic' | 'mybilling' | 'business' | 'sessions' | 'content-lab';

export default function OrgAdminDashboard() {
    const { organization, token, logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // Impersonation state
    const [impersonatedUserId, setImpersonatedUserId] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [proofs, setProofs] = useState<any[]>([]); // New state
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ provider: 'openai', apiKey: '', model: 'gpt-4o' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // New state for modal
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [generating, setGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [genConfig, setGenConfig] = useState({ topic: 'Grammaire', level: 'B1', count: 5, sector: 'Général' });
    const [sectors, setSectors] = useState(['Général', 'Médico-Social', 'BTP', 'Restauration', 'Tourisme', 'Informatique', 'Nettoyage']);
    const [newSector, setNewSector] = useState('');

    const filteredStudents = students.filter(s =>
    (s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        fetchDashboardData();
    }, [organization?.id, token]);

    const fetchDashboardData = async () => {
        if (!organization?.id || !token) return;
        setLoading(true);
        try {
            const [studentsRes, statsRes, questionsRes, settingsRes, proofsRes] = await Promise.all([
                fetch(`http://localhost:3333/analytics/students/${organization.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3333/analytics/org/${organization.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3333/analytics/questions/${organization.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3333/analytics/org/${organization.id}/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3333/proofs/org/${organization.id}?status=PENDING`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (studentsRes.ok) setStudents(await studentsRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
            if (questionsRes.ok) setQuestions(await questionsRes.json());
            if (settingsRes.ok) {
                const s = await settingsRes.json();
                if (s && s.provider) setSettings(s); // Pre-fill
            }
            if (proofsRes.ok) setProofs(await proofsRes.json());

            const [membersRes, transRes, proposalsRes] = await Promise.all([
                fetch(`http://localhost:3333/admin/users?orgId=${organization.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3333/admin/organizations/${organization.id}/transactions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:3333/proposals/org/${organization.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (membersRes.ok) {
                const allUsers = await membersRes.json();
                setTeamMembers(allUsers.filter((u: any) => u.role !== 'CANDIDATE'));
            }
            if (transRes.ok) setTransactions(await transRes.json());
            if (proposalsRes.ok) setProposals(await proposalsRes.json());

        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setMessage(null);
        try {
            const response = await fetch('http://localhost:3333/invitations/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail, orgId: organization?.id })
            });

            if (!response.ok) throw new Error("Erreur");
            setMessage({ type: 'success', text: "Invitation envoyée avec succès !" });
            setInviteEmail('');
        } catch (err) {
            setMessage({ type: 'error', text: "Impossible d'envoyer l'invitation." });
        } finally {
            setInviteLoading(false);
        }
    };

    const toggleQuestion = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`http://localhost:3333/analytics/questions/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (response.ok) {
                setQuestions(questions.map(q => q.id === id ? { ...q, isActive: !currentStatus } : q));
            }
        } catch (err) {
            console.error("Toggle Error:", err);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await fetch(`http://localhost:3333/analytics/org/${organization?.id}/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: "Paramètres IA sauvegardés !" });
            } else {
                setMessage({ type: 'error', text: "Erreur sauvegarde" });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Erreur réseau" });
        } finally {
            setSavingSettings(false);
        }
    }

    const handleValidateProof = async (proofId: string, status: 'VALIDATED' | 'REJECTED', xpBonus: number = 20, customFeedback?: string) => {
        try {
            const res = await fetch(`http://localhost:3333/proofs/${proofId}/validate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    xpAwarded: status === 'VALIDATED' ? xpBonus : 0,
                    feedback: customFeedback || (status === 'VALIDATED' ? 'Validé par le tuteur.' : 'Preuve refusée.')
                })
            });
            if (res.ok) {
                setProofs(proofs.filter(p => p.id !== proofId));
                setMessage({ type: 'success', text: `Preuve ${status === 'VALIDATED' ? 'validée' : 'rejetée'}` });
            }
        } catch (e) {
            setMessage({ type: 'error', text: "Erreur de validation" });
        }
    }

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('http://localhost:3333/content-lab/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orgId: organization?.id,
                    topic: genConfig.topic,
                    level: genConfig.level,
                    count: genConfig.count,
                    sector: genConfig.sector
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessage({ type: 'success', text: data.message });
                setShowGenModal(false);
                fetchDashboardData();
            } else {
                setMessage({ type: 'error', text: "Erreur lors de la génération." });
            }
        } catch (err) {
            console.error("Generation error", err);
            setMessage({ type: 'error', text: "Erreur technique." });
        } finally {
            setGenerating(false);
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'equipe', label: 'Gestion d\'Équipe', icon: Users },
        { id: 'cohorte', label: 'Candidats', icon: GraduationCap },
        { id: 'salles', label: 'Salles de Classe', icon: BookOpen },
        { id: 'bibliotheque', label: 'Bibliothèque', icon: Library },
        { id: 'civic', label: 'Gestion Citoyenneté', icon: Globe },
        { id: 'validations', label: 'Validations', icon: CheckCircle2, count: proofs.length },
        { id: 'sessions', label: 'Gestion Sessions', icon: Calendar },
        { id: 'propositions', label: 'Devis & Plans', icon: FileText },
        { id: 'business', label: 'Rentabilité & Business', icon: TrendingUp },
        { id: 'rapports', label: 'Rapports & Factures', icon: History },
        { id: 'audit', label: 'Audit Qualiopi', icon: ShieldCheck },
        // Separator - Coach Tools
        { id: 'separator-coach', label: '── Outils Coach ──', icon: null, separator: true },
        { id: 'messages', label: 'Messagerie', icon: MessageCircle },
        { id: 'coach-calendar', label: 'Calendrier', icon: Calendar },
        { id: 'coach-stats', label: 'Stats Coaching', icon: BarChart3 },
        // Separator - Learner Mode
        { id: 'separator-learner', label: '── Mode Apprenant ──', icon: null, separator: true },
        { id: 'mypath', label: 'Mon Parcours', icon: Target },
        { id: 'myportfolio', label: 'Mon Portfolio', icon: Award },
        { id: 'mycivic', label: 'Citoyenneté', icon: Globe },
        { id: 'mybilling', label: 'Facturation', icon: CreditCard },
        // Separator - Settings
        { id: 'separator-settings', label: '──────', icon: null, separator: true },
        { id: 'profil', label: 'Mon Profil', icon: Users },
        { id: 'parametres', label: 'Configuration', icon: SettingsIcon },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium">Chargement de votre espace...</p>
                </div>
            </div>
        );
    }

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
                        {organization?.logoUrl ? (
                            <img src={organization.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                        ) : (
                            <ShieldCheck className="text-white w-6 h-6" />
                        )}
                    </div>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="ml-4 overflow-hidden"
                        >
                            <h2 className="font-black text-white leading-tight truncate">{organization?.name}</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Espace Admin</p>
                        </motion.div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item: any) => (
                        item.separator ? (
                            <div key={item.id} className={`py-2 ${isSidebarOpen ? '' : 'hidden'}`}>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">{item.label}</span>
                            </div>
                        ) : (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all group relative ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                            >
                                {item.icon && <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />}
                                {isSidebarOpen && (
                                    <span className="ml-4 font-bold text-sm">{item.label}</span>
                                )}
                                {item.count > 0 && (
                                    <span className={`absolute ${isSidebarOpen ? 'right-4' : 'right-2 top-2'} min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-black border-2 border-[#1E293B]`}>
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        )
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] overflow-y-auto h-screen relative">
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0F172A]/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            {menuItems.find(m => m.id === activeTab)?.label}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Solde IA</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-blue-400">{(organization?.availableCredits ?? 0).toLocaleString()}</span>
                                <span className="text-sm">🪙</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowRechargeModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                        >
                            <Zap size={14} className="fill-current" />
                            Recharger
                        </button>

                        <button
                            onClick={() => setActiveTab('content-lab')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 ml-4"
                        >
                            <Library size={14} className="fill-current" />
                            Content Lab
                        </button>

                        <NotificationCenter />
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">

                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-xs font-bold text-white">{user?.name}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Administrateur</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/20 border-2 border-slate-800">
                                {user?.name?.[0] || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'dashboard' && <DashboardHome students={students} proofs={proofs} stats={stats} user={user} organization={organization} setActiveTab={setActiveTab} />}
                            {activeTab === 'equipe' && <TeamManagement teamMembers={teamMembers} token={token} organization={organization} />}
                            {activeTab === 'cohorte' && (
                                <Cohorte
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    filteredStudents={filteredStudents}
                                    token={token}
                                    proposals={proposals}
                                    setProposals={setProposals}
                                    setActiveTab={setActiveTab}
                                    setMessage={setMessage}
                                    setSelectedStudent={setSelectedStudent}
                                    handleInvite={handleInvite}
                                    inviteEmail={inviteEmail}
                                    setInviteEmail={setInviteEmail}
                                    inviteLoading={inviteLoading}
                                    message={message}
                                    stats={stats}
                                    loading={loading}
                                    teamMembers={teamMembers}
                                />
                            )}
                            {activeTab === 'salles' && (
                                <ClassroomManagement organization={organization} token={token} />
                            )}
                            {activeTab === 'bibliotheque' && (
                                <Bibliotheque
                                    questions={questions}
                                    toggleQuestion={toggleQuestion}
                                    setShowGenModal={setShowGenModal}
                                />
                            )}
                            {activeTab === 'performance' && (
                                <PerformanceAudit
                                    stats={stats}
                                />
                            )}
                            {activeTab === 'validations' && (
                                <Validations
                                    proofs={proofs}
                                    handleValidateProof={handleValidateProof}
                                />
                            )}
                            {activeTab === 'propositions' && (
                                <Proposals
                                    proposals={proposals}
                                    setProposals={setProposals}
                                    token={token}
                                />
                            )}
                            {activeTab === 'equipe' && <TeamManagement organization={organization} token={token} />}
                            {activeTab === 'rapports' && <ReportsBilling organization={organization} token={token} transactions={transactions} />}
                            {activeTab === 'civic' && <CivicContentManager />}
                            {activeTab === 'audit' && <QualiopiAuditPanel orgId={organization?.id || ''} token={token || ''} />}
                            {activeTab === 'profil' && <OrgAdminProfile />}

                            {/* Coach Tools */}
                            {activeTab === 'messages' && <MessagingPanel />}
                            {activeTab === 'coach-calendar' && <CoachCalendar />}
                            {activeTab === 'coach-stats' && <CoachStatsPanel stats={{
                                totalStudents: students.length,
                                activeStudents: students.filter((s: any) => s.lastActivity && new Date(s.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
                                averageScore: 0,
                                scoreEvolution: 0,
                                totalSessions: 0,
                                hoursThisMonth: 0,
                                feedbacksSent: 0,
                                successRate: 0
                            }} />}

                            {activeTab === 'business' && <BusinessPerformance students={students} organization={organization} />}

                            {/* Learner Mode Selector */}
                            {(activeTab === 'mypath' || activeTab === 'myportfolio' || activeTab === 'mycivic' || activeTab === 'mybilling') && (
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Eye size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Mode "Voir en tant que"</p>
                                            <p className="text-xs text-slate-400">Visualisez l'interface comme un de vos étudiants</p>
                                        </div>
                                    </div>
                                    <select
                                        value={impersonatedUserId}
                                        onChange={(e) => setImpersonatedUserId(e.target.value)}
                                        className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 ring-blue-500 outline-none w-64"
                                    >
                                        <option value="">-- Moi-même (Admin) --</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.currentLevel})</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Learner Mode */}
                            {activeTab === 'mypath' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                            <Target size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white">Mon Parcours Personnel</h2>
                                            <p className="text-sm text-slate-400">Suivez votre propre progression FLE</p>
                                        </div>
                                    </div>
                                    <PersonalizedPath userId={impersonatedUserId || undefined} />
                                </div>
                            )}
                            {activeTab === 'myportfolio' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                            <Award size={20} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white">Mon Portfolio</h2>
                                            <p className="text-sm text-slate-400">Vos preuves d'apprentissage</p>
                                        </div>
                                    </div>
                                    <Portfolio organizationId={organization?.id || ''} userId={impersonatedUserId || user?.id || ''} token={token || ''} />
                                </div>
                            )}
                            {activeTab === 'mycivic' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                            <Globe size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white">Parcours Citoyenneté</h2>
                                            <p className="text-sm text-slate-400">Préparez-vous aux tests de citoyenneté</p>
                                        </div>
                                    </div>
                                    <CivicPath />
                                </div>
                            )}
                            {activeTab === 'mybilling' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                            <CreditCard size={20} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white">Ma Facturation</h2>
                                            <p className="text-sm text-slate-400">Gérez vos crédits et paiements</p>
                                        </div>
                                    </div>
                                    <CandidateBilling userId={impersonatedUserId || undefined} />
                                </div>
                            )}

                            {activeTab === 'parametres' && (
                                <Settings
                                    settings={settings}
                                    setSettings={setSettings}
                                    savingSettings={savingSettings}
                                    handleSaveSettings={handleSaveSettings}
                                />
                            )}
                            {activeTab === 'content-lab' && <ContentLabPage />}
                            {activeTab === 'sessions' && (
                                <div className="bg-[#1E293B]/50 rounded-3xl border border-slate-800 p-8 shadow-sm">
                                    <CoachSessionsManager onToast={(type, text) => {
                                        setMessage({ type, text });
                                        setTimeout(() => setMessage(null), 3000);
                                    }} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <StudentDetailModal
                student={selectedStudent}
                onClose={() => setSelectedStudent(null)}
            />

            {/* AI Gen Modal */}
            <AnimatePresence>
                {showGenModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Générateur IA</h3>
                                    <p className="text-sm text-slate-500 font-medium">Créez des exercices sur mesure</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Sujet</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold outline-none focus:ring-2 ring-violet-500"
                                        value={genConfig.topic}
                                        onChange={e => setGenConfig({ ...genConfig, topic: e.target.value })}
                                    >
                                        <optgroup label="📘 Compétences Linguistiques">
                                            <option value="Grammaire">Grammaire</option>
                                            <option value="Conjugaison">Conjugaison</option>
                                            <option value="Vocabulaire">Vocabulaire</option>
                                            <option value="Orthographe">Orthographe</option>
                                            <option value="Phonétique">Phonétique & Prononciation</option>
                                        </optgroup>
                                        <optgroup label="📝 Épreuves TEF/TCF">
                                            <option value="Compréhension Écrite">Compréhension Écrite</option>
                                            <option value="Compréhension Orale">Compréhension Orale</option>
                                            <option value="Expression Écrite">Expression Écrite</option>
                                            <option value="Expression Orale">Expression Orale</option>
                                        </optgroup>
                                        <optgroup label="🏛️ Questions Civiques 2026">
                                            <option value="Valeurs de la République">Valeurs de la République</option>
                                            <option value="Institutions Françaises">Institutions Françaises</option>
                                            <option value="Histoire de France">Histoire de France</option>
                                            <option value="Géographie de France">Géographie de France</option>
                                            <option value="Vie en France">Vie Quotidienne en France</option>
                                            <option value="Droits et Devoirs">Droits et Devoirs du Citoyen</option>
                                            <option value="Laïcité">Laïcité & Liberté Religieuse</option>
                                            <option value="Égalité Femmes-Hommes">Égalité Femmes-Hommes</option>
                                        </optgroup>
                                        <optgroup label="🌍 Thématiques Générales">
                                            <option value="Vie Quotidienne">Vie Quotidienne</option>
                                            <option value="Monde Professionnel">Monde Professionnel</option>
                                            <option value="Voyages et Transport">Voyages & Transport</option>
                                            <option value="Santé et Bien-être">Santé & Bien-être</option>
                                            <option value="Environnement">Environnement & Écologie</option>
                                            <option value="Culture Francophone">Culture Francophone</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Secteur Professionnel</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold outline-none focus:ring-2 ring-violet-500 text-slate-900 dark:text-white"
                                            value={genConfig.sector || 'Général'}
                                            onChange={e => setGenConfig({ ...genConfig, sector: e.target.value })}
                                        >
                                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                                            <option value="custom">➕ Créer un secteur...</option>
                                        </select>
                                    </div>
                                    {genConfig.sector === 'custom' && (
                                        <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                                            <input
                                                type="text"
                                                placeholder="Secteur (ex: Agriculture)"
                                                value={newSector}
                                                onChange={(e) => setNewSector(e.target.value)}
                                                className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (newSector) {
                                                        setSectors([...sectors, newSector]);
                                                        setGenConfig({ ...genConfig, sector: newSector });
                                                        setNewSector('');
                                                    }
                                                }}
                                                className="px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors"
                                            >
                                                Ajouter
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Niveau</label>
                                        <select
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold outline-none focus:ring-2 ring-violet-500"
                                            value={genConfig.level}
                                            onChange={e => setGenConfig({ ...genConfig, level: e.target.value })}
                                        >
                                            <option value="A1">A1</option>
                                            <option value="A2">A2</option>
                                            <option value="B1">B1</option>
                                            <option value="B2">B2</option>
                                            <option value="C1">C1</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Quantité</label>
                                        <select
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold outline-none focus:ring-2 ring-violet-500"
                                            value={genConfig.count}
                                            onChange={e => setGenConfig({ ...genConfig, count: Number(e.target.value) })}
                                        >
                                            <option value={5}>5 questions</option>
                                            <option value={10}>10 questions</option>
                                            <option value={20}>20 questions</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowGenModal(false)}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="flex-[2] py-4 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : 'Générer'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showRechargeModal && (
                <RechargeModal
                    onClose={() => setShowRechargeModal(false)}
                    organization={organization}
                />
            )}
        </div >
    );
}

// --- Sub-components (Tabs) ---

function DashboardHome({ students = [], proofs = [], stats, setActiveTab, organization }: any) {
    const levelData = [
        { level: 'A1', count: 12 },
        { level: 'A2', count: 25 },
        { level: 'B1', count: 42 },
        { level: 'B2', count: 18 },
        { level: 'C1', count: 8 },
        { level: 'C2', count: 3 },
    ];

    const consumptionPercentage = Math.round(((organization?.usedCredits || 0) / (organization?.totalQuota || 1000)) * 100);
    const isLowQuota = consumptionPercentage > 85;

    return (
        <div className="space-y-8">
            {/* Low Quota Alert */}
            {isLowQuota && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-500"
                >
                    <AlertCircle size={24} />
                    <div className="flex-1">
                        <p className="font-bold text-sm">Alerte Quota Faible</p>
                        <p className="text-xs opacity-80">Il ne vous reste que {100 - consumptionPercentage}% de vos crédits tests. Pensez à recharger.</p>
                    </div>
                    <button onClick={() => setActiveTab('rapports')} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-black uppercase">Recharger</button>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1E293B]/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Consommation Tests</p>
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none" stroke="#3B82F6" strokeWidth="10"
                                    strokeDasharray={`${consumptionPercentage * 2.83} 283`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">{consumptionPercentage}%</span>
                        </div>
                        <div>
                            <p className="text-xl font-black text-white">{organization?.usedCredits || 0}</p>
                            <p className="text-[10px] font-bold text-slate-500 lowercase tracking-tighter">sur {organization?.totalQuota || 1000} tests</p>
                        </div>
                    </div>
                </div>
                <StatCard label="Taux Réussite B1" value={stats?.passRate || 0} unit="%" icon={<CheckCircle2 className="text-emerald-500" />} />
                <StatCard label="Inscriptions (30j)" value={students?.length || 0} unit="candidats" icon={<Users className="text-blue-500" />} />
                <StatCard label="Validations" value={proofs?.length || 0} unit="en attente" icon={<AlertCircle className="text-amber-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#1E293B]/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800">
                    <h3 className="text-lg font-bold mb-8">Répartition des Niveaux</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={levelData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="level" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                />
                                <ReBar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {levelData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 2 ? '#3B82F6' : '#1e293b'} stroke={index === 2 ? '#3B82F6' : '#64748b'} strokeWidth={1} />
                                    ))}
                                </ReBar>
                            </ReBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 flex flex-col">
                    <h3 className="text-lg font-bold mb-6">Actions Rapides</h3>
                    <div className="space-y-4 flex-1">
                        <QuickAction
                            onClick={() => setActiveTab('equipe')}
                            icon={<Users className="text-blue-400" />}
                            title="Gérer mon équipe"
                            desc="Invitez formateurs & commerciaux"
                        />
                        <QuickAction
                            onClick={() => setActiveTab('cohorte')}
                            icon={<GraduationCap className="text-emerald-400" />}
                            title="Suivi Cohortes"
                            desc="Assignez vos candidats"
                        />
                        <QuickAction
                            onClick={() => setActiveTab('rapports')}
                            icon={<History className="text-amber-400" />}
                            title="Rapports & Factures"
                            desc="Exports et historique d'achats"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickAction({ icon, title, desc, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700 group text-left"
        >
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                {icon}
            </div>
            <div>
                <p className="font-bold text-sm text-white">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </button>
    );
}

function RechargeModal({ onClose, organization }: any) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-[#1E293B] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-slate-800"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-10 border-b border-slate-800 bg-gradient-to-r from-blue-600/20 to-transparent">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                <Zap size={32} className="fill-current" />
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Recharger {organization?.name}</h2>
                        <p className="text-slate-400">Autonomisez votre organisme avec des crédits de génération. Solde actuel: 🪙 {organization?.availableCredits ?? 0}</p>
                    </div>
                    <div className="p-10 grid grid-cols-2 gap-6">
                        <CreditPack title="Découverte" credits={50} price={49} />
                        <CreditPack title="Croissance" credits={200} price={149} popular />
                        <CreditPack title="Pro" credits={500} price={299} />
                        <CreditPack title="Entreprise" credits={1500} price={749} />
                    </div>
                    <div className="p-10 bg-black/20 flex justify-end gap-4">
                        <button onClick={onClose} className="px-8 py-4 font-bold text-slate-500 hover:text-white transition-colors">Annuler</button>
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Payer par Carte</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function CreditPack({ title, credits, price, popular }: any) {
    return (
        <div className={`p-6 rounded-3xl border-2 transition-all relative group cursor-pointer ${popular ? 'border-blue-600 bg-blue-600/5' : 'border-slate-800 hover:border-slate-700 bg-slate-800/20'}`}>
            {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Plus Populaire</span>}
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-black text-white">{credits}</span>
                <span className="text-slate-400 font-bold">🪙</span>
            </div>
            <div className="text-xl font-bold text-blue-400">{price}€</div>
        </div>
    );
}

function Settings({ settings, setSettings, savingSettings, handleSaveSettings }: any) {
    return (
        <div className="max-w-2xl mx-auto py-10 space-y-8">
            {/* AI Configuration */}
            <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-10 border-b border-slate-800 bg-gradient-to-r from-slate-800/50 to-transparent text-white">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
                        <SettingsIcon size={32} />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Configuration de l'IA</h2>
                    <p className="text-slate-400 font-medium">Spécifiez votre propre clé API pour un usage sans limites.</p>
                </div>
                <div className="p-10">
                    <form onSubmit={handleSaveSettings} className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest">Fournisseur d'IA</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, provider: 'openai' })}
                                    className={`p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${settings.provider === 'openai' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 hover:border-slate-700 text-slate-400'}`}
                                >
                                    OpenAI (GPT-4)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, provider: 'gemini' })}
                                    className={`p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${settings.provider === 'gemini' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 hover:border-slate-700 text-slate-400'}`}
                                >
                                    Google Gemini
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest">Clé API (Secrète)</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    className="w-full p-4 pl-12 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-sm text-white outline-none focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-700"
                                    placeholder="sk-..."
                                    value={settings.apiKey}
                                    onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
                                />
                                <div className="absolute left-4 top-4 text-slate-600">
                                    <ShieldCheck size={18} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={savingSettings}
                            className="w-full py-4 bg-white text-[#0F172A] font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {savingSettings ? <Loader2 className="animate-spin" /> : 'Sauvegarder Configuration'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Health Thresholds */}
            <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-10 border-b border-slate-800 bg-gradient-to-r from-amber-800/20 to-transparent text-white">
                    <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-400 mb-6 border border-amber-500/20">
                        <Bell size={32} />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Seuils d'Alerte Santé</h2>
                    <p className="text-slate-400 font-medium">Personnalisez les seuils de détection pour votre centre.</p>
                </div>
                <div className="p-10">
                    <form onSubmit={handleSaveSettings} className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest">Jours d'inactivité (Churn)</label>
                            <input
                                type="number"
                                className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 ring-amber-500/50 transition-all"
                                value={settings.churnDays || 14}
                                onChange={e => setSettings({ ...settings, churnDays: parseInt(e.target.value) || 14 })}
                            />
                            <p className="text-[10px] text-slate-500">Nombre de jours sans activité avant qu'un élève soit considéré "à risque".</p>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest">Saturation Coach (élèves max)</label>
                            <input
                                type="number"
                                className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 ring-amber-500/50 transition-all"
                                value={settings.coachSaturation || 15}
                                onChange={e => setSettings({ ...settings, coachSaturation: parseInt(e.target.value) || 15 })}
                            />
                            <p className="text-[10px] text-slate-500">Nombre maximum d'élèves par coach avant alerte.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-slate-500 tracking-widest">Seuil Crédit Critique (%)</label>
                            <input
                                type="number"
                                step="1"
                                className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white outline-none focus:ring-2 ring-amber-500/50 transition-all"
                                value={(settings.creditThreshold || 0.1) * 100}
                                onChange={e => setSettings({ ...settings, creditThreshold: (parseFloat(e.target.value) || 10) / 100 })}
                            />
                            <p className="text-[10px] text-slate-500">Pourcentage du quota mensuel en dessous duquel votre centre est "critique".</p>
                        </div>

                        <button
                            type="submit"
                            disabled={savingSettings}
                            className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {savingSettings ? <Loader2 className="animate-spin" /> : 'Sauvegarder Seuils'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, unit, icon }: any) {
    return (
        <div className="bg-[#1E293B]/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 shadow-sm group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/10 transition-colors">
                {icon}
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{value}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{unit}</span>
            </div>
        </div>
    );
}
// --- Appending Missing Sub-components ---

// --- Appending Missing Sub-components ---

function Cohorte({ searchQuery, setSearchQuery, filteredStudents, token, proposals, setProposals, setActiveTab, setMessage, setSelectedStudent, handleInvite, inviteEmail, setInviteEmail, inviteLoading, teamMembers }: any) {
    const salesMembers = teamMembers?.filter((m: any) => m.role === 'SALES') || [];
    const coachMembers = teamMembers?.filter((m: any) => m.role === 'COACH') || [];
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Table */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
                        <h2 className="font-bold flex items-center gap-2 text-lg text-white shrink-0">
                            <Users className="text-blue-500" size={20} /> Candidats inscrits
                        </h2>
                        <div className="flex-1 flex gap-3 max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="pl-10 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 ring-blue-500/20 outline-none w-full text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select className="bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-400 focus:ring-2 ring-blue-500/20 outline-none">
                                <option value="">Tous les commerciaux</option>
                                {salesMembers.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-800/30">
                                    <th className="px-6 py-4">Élève</th>
                                    <th className="px-6 py-4">Niveau IA</th>
                                    <th className="px-6 py-4">Commercial</th>
                                    <th className="px-6 py-4">Formateur</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredStudents.map((student: any) => (
                                    <tr key={student.id} className="group hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400">
                                                    {student.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-white">{student.name || 'Anonyme'}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-lg">
                                                {student.currentLevel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-slate-400 font-bold">---</td>
                                        <td className="px-6 py-5">
                                            <select
                                                className="bg-slate-800 border border-slate-700 rounded-lg text-[10px] px-2 py-1 text-slate-300 outline-none focus:ring-1 ring-blue-500"
                                                defaultValue=""
                                            >
                                                <option value="">Non assigné</option>
                                                {coachMembers.map((m: any) => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={async () => {
                                                        const targetLevel = prompt('Niveau cible (A2, B1, B2, C1, C2) ?', 'B2');
                                                        if (targetLevel) {
                                                            try {
                                                                const res = await fetch('http://localhost:3333/proposals/generate', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        'Authorization': `Bearer ${token}`
                                                                    },
                                                                    body: JSON.stringify({ userId: student.id, targetLevel })
                                                                });
                                                                if (res.ok) {
                                                                    const newProp = await res.json();
                                                                    setProposals([newProp, ...proposals]);
                                                                    setActiveTab('propositions');
                                                                    setMessage({ type: 'success', text: "Proposition générée !" });
                                                                }
                                                            } catch (e) {
                                                                setMessage({ type: 'error', text: "Erreur de génération" });
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                                                    title="Générer Devis/Plan"
                                                >
                                                    <Sparkles size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Invitation */}
            <div className="space-y-8">
                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group border border-slate-800">
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <Mail size={20} className="text-blue-400" /> Invitation Rapide
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 font-medium">Ajoutez un nouvel élève instantanément.</p>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <input
                            type="email"
                            placeholder="email@etudiant.fr"
                            className="w-full px-5 py-4 bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all font-medium text-white placeholder:text-slate-600"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                        />
                        <button
                            disabled={inviteLoading}
                            className="w-full py-4 bg-blue-600 font-black rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                        >
                            {inviteLoading ? "Envoi..." : "Envoyer l'accès"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Validations({ proofs, handleValidateProof }: any) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [selectedProof, setSelectedProof] = useState<any>(null);
    const [feedback, setFeedback] = useState('');

    const filtered = proofs.filter((p: any) => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.user?.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'ALL' || p.type === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShieldCheck className="text-blue-500" size={32} />
                        Centre de Validation
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Vérifiez et approuvez les preuves d'apprentissage de vos candidats.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-400 outline-none focus:ring-2 ring-blue-500"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    >
                        <option value="ALL">Tous types</option>
                        <option value="PRACTICE">Entraînement</option>
                        <option value="HOMEWORK">Devoirs</option>
                        <option value="EXTERNAL">Externe</option>
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-32 bg-slate-900/30 rounded-[3rem] border-2 border-slate-800 border-dashed">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Tout est à jour !</h3>
                    <p className="text-slate-600 mt-2">Aucune preuve en attente de validation pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filtered.map((proof: any) => (
                        <motion.div
                            key={proof.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#1E293B]/50 backdrop-blur-xl rounded-[2rem] border border-slate-800 p-8 hover:border-blue-500/30 transition-all group overflow-hidden relative"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-white group-hover:text-blue-400 transition-colors capitalize">{proof.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-lg">{proof.type}</span>
                                            <span className="text-[10px] text-slate-500 font-bold">•</span>
                                            <span className="text-[10px] text-slate-500 font-bold">{new Date(proof.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">{proof.description}</p>

                            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl mb-6">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                    {proof.user?.name?.[0] || 'U'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-white">{proof.user?.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Candidat {proof.user?.currentLevel}</p>
                                </div>
                                <Zap className="text-amber-500" size={16} />
                                <span className="text-xs font-black text-amber-500">+20 XP</span>
                            </div>

                            {selectedProof?.id === proof.id ? (
                                <div className="space-y-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                                    <textarea
                                        placeholder="Votre feedback (optionnel)..."
                                        className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white resize-none h-24 focus:ring-2 ring-blue-500 outline-none"
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                handleValidateProof(proof.id, 'VALIDATED', 20, feedback);
                                                setSelectedProof(null);
                                                setFeedback('');
                                            }}
                                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Valider
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleValidateProof(proof.id, 'REJECTED', 0, feedback);
                                                setSelectedProof(null);
                                                setFeedback('');
                                            }}
                                            className="flex-1 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> Rejeter
                                        </button>
                                        <button
                                            onClick={() => setSelectedProof(null)}
                                            className="p-3 text-slate-500 hover:text-white transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    {proof.proofUrl && (
                                        <a
                                            href={proof.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center text-sm transition-all"
                                        >
                                            Voir la pièce
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setSelectedProof(proof)}
                                        className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        Traiter la demande <ArrowRight size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Proposals({ proposals, token }: any) {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black text-white">Préconisations Heures & Devis</h2>
            <div className="grid gap-6">
                {proposals.map((p: any) => (
                    <div key={p.id} className="p-8 bg-[#1E293B]/50 backdrop-blur-xl rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-lg text-white">{p.user?.name}</span>
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-full uppercase">
                                    {p.baseLevel} → {p.targetLevel}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">{p.estimatedHours}h de formation • {p.totalCost.toFixed(2)}€</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <a href={`http://localhost:3333/proposals/${p.id}/devis?token=${token}`} className="px-5 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors flex items-center gap-2" target="_blank" rel="noopener noreferrer"><FileText size={16} /> Devis</a>
                            <button className="p-3 text-slate-600 hover:text-red-500 transition-colors"><XCircle size={20} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
function Bibliotheque({ questions, toggleQuestion, setShowGenModal }: any) {
    const [view, setView] = useState<'active' | 'pending'>('active');

    const displayedQuestions = questions.filter((q: any) =>
        view === 'active' ? q.isActive : !q.isActive
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 border-b dark:border-slate-100/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-xl font-black mb-2 text-white">Bibliothèque du Centre</h2>
                        <p className="text-slate-500 text-sm">Gérez et validez le contenu pédagogique.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                        >
                            <Plus size={18} />
                            Ajouter
                        </button>
                        <button
                            onClick={() => setShowGenModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
                        >
                            <Sparkles size={18} className="text-yellow-300" />
                            Générer IA
                        </button>
                    </div>
                </div>

                <div className="flex gap-6 border-b border-slate-800/50">
                    <button
                        onClick={() => setView('active')}
                        className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${view === 'active' ? 'text-blue-400 border-blue-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        <span className="mr-2">📚</span>Questions Publiées ({questions.filter((q: any) => q.isActive).length})
                    </button>
                    <button
                        onClick={() => setView('pending')}
                        className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${view === 'pending' ? 'text-amber-400 border-amber-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                    >
                        <span className="mr-2">⚠️</span>À Valider ({questions.filter((q: any) => !q.isActive).length})
                    </button>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedQuestions.map((q: any) => (
                        <div key={q.id} className={`p-6 rounded-3xl border transition-all ${q.isActive ? 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 shadow-sm' : 'bg-amber-500/5 border-amber-500/20'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${q.isActive ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {q.topic}
                                    {q.sector && q.sector !== 'Général' && (
                                        <span className={`ml-2 pl-2 border-l ${q.isActive ? 'text-violet-400 border-blue-500/20' : 'text-amber-200 border-amber-500/20'}`}>
                                            {q.sector}
                                        </span>
                                    )}
                                </span>
                                <div className="flex gap-1">
                                    {view === 'pending' ? (
                                        <>
                                            <button onClick={() => toggleQuestion(q.id, false)} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Valider">
                                                <Check size={16} />
                                            </button>
                                            <button className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors" title="Rejeter">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-2 rounded-xl bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Éditer">
                                                <Edit2 size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => toggleQuestion(q.id, true)}
                                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                                            title="Masquer / Retirer"
                                        >
                                            <EyeOff size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h4 className="font-bold text-sm mb-2 text-white line-clamp-3">{q.questionText}</h4>
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-500 uppercase">
                                <ShieldCheck size={12} /> Niveau: {q.level}
                            </div>
                        </div>
                    ))}
                    {displayedQuestions.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-700">
                                <Library size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">
                                {view === 'active' ? "Aucun exercice publié." : "Aucun brouillon en attente."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PerformanceAudit({ stats }: any) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Score Moyen" value={stats?.avgScore || 0} unit="pts" icon={<TrendingUp className="text-blue-500" />} />
                <StatCard label="Sessions IA" value={stats?.totalExams || 0} unit="finies" icon={<ClipboardList className="text-indigo-500" />} />
                <StatCard label="Élèves Actifs" value={stats?.activeStudents || 0} unit="inscrits" icon={<Users className="text-emerald-500" />} />
            </div>

            <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 overflow-hidden p-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
                    <Ban className="text-rose-500" size={24} /> Points de blocage (Audit IA)
                </h3>
                <div className="space-y-6">
                    {stats?.blockingPoints?.map((bp: any, i: number) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-3xl group hover:border-blue-500/50 border border-transparent transition-all">
                            <div className="w-12 h-12 bg-rose-500/10 flex items-center justify-center text-rose-500 font-black text-xl rounded-2xl">
                                #{i + 1}
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-bold text-white">{bp.topic}</div>
                                <div className="text-sm text-slate-500 font-medium">{bp.count} erreurs critiques détectées cette semaine</div>
                            </div>
                            <button className="flex items-center gap-2 px-5 py-3 bg-slate-800 rounded-2xl font-bold text-sm text-white hover:bg-slate-700 transition-colors">
                                Détails <ArrowUpRight size={16} />
                            </button>
                        </div>
                    ))}
                    {(!stats?.blockingPoints || stats.blockingPoints.length === 0) && (
                        <div className="py-20 text-center text-slate-500">
                            <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500 opacity-20" />
                            <p className="font-medium">Aucun point de blocage majeur détecté.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TeamManagement({ organization: _organization, token: _token, teamMembers }: any) {
    // const [members] = useState<any[]>([...]) - Removed hardcoded state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('COACH');

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h2 className="text-2xl font-black text-white">Gestion de l'Équipe</h2>
                <div className="flex flex-wrap gap-4">
                    <input
                        type="email"
                        placeholder="email@membre.fr"
                        className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                    />
                    <select
                        className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm"
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                    >
                        <option value="COACH">Formateur / Coach</option>
                        <option value="SALES">Commercial</option>
                    </select>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                        <Mail size={16} /> Inviter
                    </button>
                </div>
            </div>

            <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-800/30">
                                <th className="px-6 py-4">Membre</th>
                                <th className="px-6 py-4">Rôle</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {teamMembers?.map((member: any) => (
                                <tr key={member.id} className="group hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-slate-700 transition-colors">
                                                {member.name?.[0] || 'M'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${member.role === 'COACH' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'}`}>
                                            {member.role === 'COACH' ? 'Formateur' : 'Commercial'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`flex items-center gap-2 text-xs font-bold ${member.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            {member.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className={`p-2 rounded-lg transition-colors ${member.status === 'ACTIVE' ? 'text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}>
                                            {member.status === 'ACTIVE' ? <Ban size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ReportsBilling({ organization: _organization, token: _token, transactions }: any) {
    // const history = [...] - Removed hardcoded

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h2 className="text-2xl font-black text-white">Rapports & Facturation</h2>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors">
                        <FileText size={16} /> Rapport (PDF)
                    </button>
                    <button className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors">
                        <History size={16} /> Excel Export
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                        <Zap size={16} /> Recharger
                    </button>
                </div>
            </div>

            <div className="bg-[#1E293B]/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 bg-slate-800/10">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <History size={20} className="text-slate-500" /> Historique des Achats
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-800/30">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Transaction</th>
                                <th className="px-6 py-4 text-center">Crédits</th>
                                <th className="px-6 py-4 text-center">Montant</th>
                                <th className="px-6 py-4 text-right">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {transactions?.map((h: any) => (
                                <tr key={h.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-5 text-sm text-white font-medium">{new Date(h.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-tight">Achat de crédits tests IA</div>
                                        <div className="text-[10px] text-slate-600 font-medium">Référence: #TRX-{h.id}0923</div>
                                    </td>
                                    <td className="px-6 py-5 text-center text-blue-400 font-black">+{h.amount}</td>
                                    <td className="px-6 py-5 text-center text-white font-black">{h.cost}€</td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-500/20">Payé</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
