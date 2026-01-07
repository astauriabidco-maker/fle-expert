import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Building2,
    ShieldCheck,
    CreditCard,
    Trash2,
    MoreHorizontal,
    CheckCircle2,
    Ban,
    Search,
    Settings,
    X,
    Lock as LockIcon,
    UserPlus,
    Users,
    Plus,
    Edit2,
    Save,
    Zap,
    BarChart3,
    AlertCircle,
    ArrowUpRight,
    Filter,
    LayoutDashboard,
    LogOut,
    History,
    TrendingUp,
    Database,
    Cpu,
    Download,
    Eye,
    BookOpen,
    Trophy,
    Award,
    PenTool,
    Mic,
    Flame,
    Megaphone,
    Send,
    Briefcase,
    FlaskConical,
    Landmark,
    Calendar,
    DollarSign,
    Activity
} from 'lucide-react';
import GlobalAgenda from './GlobalAgenda';
import GlobalFinance from './GlobalFinance';
import GlobalCoaches from './GlobalCoaches';
import GlobalParcours from './GlobalParcours';
import GlobalHealthDashboard from './GlobalHealthDashboard';
import ClassroomManagement from './ClassroomManagement';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts';

interface Organization {
    id: string;
    name: string;
    slug: string;
    status: string;
    credits: number;
    creditsBalance: number;
    monthlyQuota: number;
    questionCount: number;
    logoUrl?: string;
    primaryColor?: string;
    createdAt: string;
    admin?: {
        name: string;
        email: string;
    };
    _count?: {
        users: number;
    };
}

interface PlatformUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    organization: {
        name: string;
    };
}

interface ExamSession {
    id: string;
    createdAt: string;
    status: string;
    score: number | null;
    estimatedLevel: string | null;
    user: { name: string, email: string };
    organization: { name: string };
    aiCostUsd?: number;
    correlationScore?: number;
}

// ... other interfaces remain same ...
interface Stats {
    totalUsers: number;
    totalOrgs: number;
    totalRevenue: number;
    monthlyExams: number;
    aiTokensUsed: number;
    totalAiCost: number;
    completionRate: number;
}

interface AiMonitoringData {
    avgCorrelation: number;
    evaluatedSessions: number;
    recentLogs: any[];
}

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    payload: string | null;
    createdAt: string;
    user: { name: string, email: string } | null;
    organization: { name: string } | null;
}

import ContractManagement from './ContractManagement';
import NotificationCenter from './NotificationCenter';


type TabType = 'dashboard' | 'orgs' | 'users' | 'ai' | 'logs' | 'contracts' | 'library' | 'settings' | 'agenda' | 'finance' | 'coaches' | 'parcours' | 'health';

export default function SuperAdminDashboard() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [sessions, setSessions] = useState<ExamSession[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [aiData, setAiData] = useState<AiMonitoringData | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState({ maintenance_mode: false, ai_unit_cost: 0.015 });

    const fetchSettings = async () => {
        try {
            const res = await fetch('http://localhost:3333/admin/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSettings(await res.json());
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    const updateSetting = async (key: string, value: any, type: string) => {
        try {
            const res = await fetch(`http://localhost:3333/admin/settings/${key}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ value, type })
            });
            if (res.ok) {
                setSettings(prev => ({ ...prev, [key]: value }));
            }
        } catch (error) {
            console.error("Error updating setting:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            console.log("SuperAdminDashboard mounting", { token: !!token });
            setIsLoading(true);
            try {
                const [statsRes, orgsRes, usersRes, sessionsRes, aiRes, logsRes] = await Promise.all([
                    fetch('http://localhost:3333/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:3333/admin/organizations', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:3333/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:3333/admin/sessions', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:3333/admin/ai-monitoring', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:3333/admin/audit-logs', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (orgsRes.ok) setOrgs(await orgsRes.json());
                if (usersRes.ok) setUsers(await usersRes.json());
                if (sessionsRes.ok) setSessions(await sessionsRes.json());
                if (aiRes.ok) setAiData(await aiRes.json());
                if (logsRes.ok) setAuditLogs(await logsRes.json());
            } catch (error) {
                console.error("Dashboard error:", error);
                // alert("Erreur de connexion au serveur. Vérifiez que le backend est accessible.");
            } finally {
                // Assuming fetchAuditLogs is meant to be setAuditLogs, which is already done above.
                // If there's a separate fetchAuditLogs function, it should be defined.
                // For now, I'll add fetchSettings as requested.
                fetchSettings();
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const handleExportData = async () => {
        try {
            const response = await fetch('http://localhost:3333/admin/export-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gdpr-export-${new Date().toISOString().split('T')[0]}.json`; // Assuming JSON from service
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            console.error("Export error:", error);
        }
    };


    const menuItems = [
        { id: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
        { id: 'health', label: 'Santé Plateforme', icon: Activity },
        { id: 'parcours', label: 'Suivi Parcours', icon: TrendingUp },
        { id: 'coaches', label: 'Suivi Formateurs', icon: Users },
        { id: 'agenda', label: 'Agenda Global', icon: Calendar },
        { id: 'finance', label: 'Finance', icon: DollarSign },
        { id: 'orgs', label: 'Organismes', icon: Building2 },
        { id: 'users', label: 'Utilisateurs', icon: ShieldCheck },
        { id: 'contracts', label: 'Contrats', icon: History },
        { id: 'library', label: 'Bibliothèque Globale', icon: BookOpen },
        { id: 'ai', label: 'Observatoire IA', icon: Cpu },
        { id: 'logs', label: 'Audit Logs', icon: Database },
        { id: 'content-lab', label: 'Content Lab', icon: FlaskConical },
        { id: 'civic-admin', label: 'Parcours Citoyen', icon: Landmark },
        { id: 'settings', label: 'Configuration', icon: Settings },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium">Chargement du centre de contrôle...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white flex">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="bg-[#1E293B] border-r border-slate-800 flex flex-col sticky top-0 h-screen z-30"
            >
                <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap border-b border-slate-800/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    {isSidebarOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight">SuperAdmin</span>
                            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold">Infrastruture Manager</span>
                        </motion.div>
                    )}
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => ['content-lab', 'civic-admin'].includes(item.id) ? navigate(`/${item.id}`) : setActiveTab(item.id as TabType)}
                            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative ${activeTab === item.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'group-hover:text-blue-400'}`} />
                            {isSidebarOpen && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-4 font-medium">
                                    {item.label}
                                </motion.span>
                            )}
                            {!isSidebarOpen && activeTab === item.id && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full h-10 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors text-slate-400"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={logout}
                        className="w-full mt-2 flex items-center px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="ml-4">Déconnexion</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] overflow-y-auto h-screen">
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0F172A]/80 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            {menuItems.find(m => m.id === activeTab)?.label}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6 text-slate-400">
                        <button onClick={handleExportData} className="flex items-center gap-2 hover:text-white transition-colors" title="Export GDPR">
                            <Download className="w-5 h-5" />
                            <span className="text-sm font-medium hidden md:block">Export Data</span>
                        </button>
                        {settings.maintenance_mode ? (
                            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/50">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-amber-400">Maintenance Active</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium">Platform Online</span>
                            </div>
                        )}
                        <NotificationCenter />
                        <Settings className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />

                    </div>
                </header>

                <div className="p-8 pb-16">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'dashboard' && <DashboardOverview stats={stats} sessions={sessions} />}
                            {activeTab === 'health' && <GlobalHealthDashboard />}
                            {activeTab === 'parcours' && <GlobalParcours />}
                            {activeTab === 'coaches' && <GlobalCoaches />}
                            {activeTab === 'agenda' && <GlobalAgenda />}
                            {activeTab === 'finance' && <GlobalFinance />}
                            {activeTab === 'orgs' && <OrgManagement
                                orgs={orgs}
                                setOrgs={setOrgs}
                                token={token}
                                isLoading={isLoading}
                            />}
                            {activeTab === 'users' && <UserManagement
                                users={users}
                                setUsers={setUsers}
                                token={token}
                                isLoading={isLoading}
                            />}
                            {activeTab === 'ai' && <AiMonitoring aiData={aiData} sessions={sessions} />}
                            {activeTab === 'logs' && <AuditLogs logs={auditLogs} />}
                            {activeTab === 'contracts' && <ContractManagement />}
                            {activeTab === 'library' && <GlobalLibrary token={token} />}
                            {activeTab === 'settings' && <SystemSettings
                                settings={settings}
                                updateSetting={updateSetting}
                                handleExportData={handleExportData}
                                token={token}
                            />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Existing Modals and Helper Components will be integrated here or as sub-components */}
        </div>
    );
}

// Sub-components

function DashboardOverview({ stats, sessions }: { stats: Stats | null, sessions: ExamSession[] }) {
    if (!stats) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-[2.5rem] animate-pulse" />
            ))}
        </div>
    );

    // Prepare data for the chart (grouped by date)
    const chartData = sessions.reduce((acc: any[], session) => {
        const date = new Date(session.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const existing = acc.find(d => d.date === date);
        if (existing) {
            existing.count += 1;
            existing.avgScore = ((existing.avgScore * (existing.count - 1)) + (session.score || 0)) / existing.count;
        } else {
            acc.push({ date, count: 1, avgScore: session.score || 0 });
        }
        return acc;
    }, []).slice(-7).reverse(); // Last 7 days

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Chiffre d'Affaires"
                    value={`${stats.totalRevenue.toLocaleString()} €`}
                    sub="+12.5% vs mois dernier"
                    icon={<CreditCard className="text-emerald-500" />}
                    trend="up"
                />
                <KPICard
                    label="Consommation IA"
                    value={`${stats.aiTokensUsed.toLocaleString()} tkn`}
                    sub="Google Gemini 1.5 Flash"
                    icon={<Zap className="text-amber-500" />}
                    trend="down"
                />
                <KPICard
                    label="Examens ce mois"
                    value={stats.monthlyExams}
                    sub="Objectif : 2500"
                    icon={<BarChart3 className="text-blue-500" />}
                    trend="up"
                />
                <KPICard
                    label="Organismes Actifs"
                    value={stats.totalOrgs}
                    sub="Taux de rétention : 98%"
                    icon={<Building2 className="text-indigo-500" />}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Volume de Sessions (7 jours)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        Qualité Moyenne (Score)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="avgScore" fill="#10b981" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.avgScore > 75 ? '#10b981' : entry.avgScore > 50 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrgManagement({ orgs, setOrgs, token, isLoading }: any) {
    const [localSearch, setLocalSearch] = useState('');

    // Org Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [orgSettings, setOrgSettings] = useState<any | null>(null);
    const [orgModalTab, setOrgModalTab] = useState<'settings' | 'classrooms'>('settings');
    const [isCreditModalOpen, setIsCreditModalOpen] = useState<{ id: string, name: string } | null>(null);
    const [creditAmount, setCreditAmount] = useState(1000);
    const [newOrg, setNewOrg] = useState({ name: '', slug: '', adminEmail: '', initialCredits: 500, monthlyQuota: 1000 });
    const [orgTransactions, setOrgTransactions] = useState<{ orgName: string, data: any[] } | null>(null);

    const filteredOrgs = orgs.filter((o: any) =>
        o.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        o.slug.toLowerCase().includes(localSearch.toLowerCase())
    );

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3333/admin/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newOrg)
            });
            if (response.ok) {
                const { org } = await response.json();
                setOrgs([org, ...orgs]);
                setIsCreateModalOpen(false);
                setNewOrg({ name: '', slug: '', adminEmail: '', initialCredits: 500, monthlyQuota: 1000 });
            }
        } catch (error) {
            console.error("Create org error:", error);
        }
    };

    const toggleOrgStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            const response = await fetch(`http://localhost:3333/admin/organizations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setOrgs(orgs.map((o: any) => o.id === id ? { ...o, status: newStatus as any } : o));
            }
        } catch (error) {
            console.error("Status update error:", error);
        }
    };

    const handleAddCredits = async () => {
        if (!isCreditModalOpen) return;
        try {
            const response = await fetch(`http://localhost:3333/admin/organizations/${isCreditModalOpen.id}/credits`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount: creditAmount })
            });
            if (response.ok) {
                setOrgs(orgs.map((o: any) => o.id === isCreditModalOpen.id ? { ...o, creditsBalance: o.creditsBalance + creditAmount } : o));
                setIsCreditModalOpen(null);
                setCreditAmount(1000);
            }
        } catch (error) {
            console.error("Credit update error:", error);
        }
    };

    const handleUpdateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgSettings) return;
        try {
            const response = await fetch(`http://localhost:3333/admin/organizations/${orgSettings.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: orgSettings.name,
                    logoUrl: orgSettings.logoUrl,
                    primaryColor: orgSettings.primaryColor,
                    monthlyQuota: orgSettings.monthlyQuota
                })
            });
            if (response.ok) {
                const updated = await response.json();
                setOrgs(orgs.map((o: any) => o.id === orgSettings.id ? { ...o, ...updated } : o));
                setOrgSettings(null);
            }
        } catch (err) {
            console.error("Org update error:", err);
        }
    };

    const handleDeleteOrg = async (id: string) => {
        if (!window.confirm("DANGER : Cette action supprimera l'organisme et TOUS ses utilisateurs/données. IRRÉVERSIBLE. Continuer ?")) return;
        const confirmSlug = window.prompt(`Pour confirmer, tapez le slug de l'organisme à supprimer`);
        const org = orgs.find((o: any) => o.id === id);
        if (confirmSlug !== org?.slug) {
            alert("Slug incorrect. Suppression annulée.");
            return;
        }
        try {
            const response = await fetch(`http://localhost:3333/admin/organizations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setOrgs(orgs.filter((o: any) => o.id !== id));
            }
        } catch (error) {
            console.error("Delete org error:", error);
        }
    };

    const handleResetPassword = async (orgId: string, orgName: string) => {
        const newPassword = window.prompt(`Réinitialiser le mot de passe admin pour "${orgName}".\nEntrez le nouveau mot de passe :`);
        if (!newPassword) return;
        try {
            const response = await fetch(`http://localhost:3333/admin/organizations/${orgId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: newPassword })
            });
            if (response.ok) {
                const data = await response.json();
                alert(`Mot de passe réinitialisé avec succès pour l'admin (${data.email}).`);
            } else {
                alert("Erreur lors de la réinitialisation.");
            }
        } catch (error) {
            console.error("Reset password error:", error);
            alert("Erreur technique lors de la réinitialisation.");
        }
    };


    const openOrgTransactions = async (orgId: string, orgName: string) => {
        console.log("Opening transactions for:", orgName);
        try {
            const response = await fetch(`http://localhost:3333/admin/organizations/${orgId}/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrgTransactions({ orgName: orgName || 'Organisme', data });
            }
        } catch (error) {
            console.error("Transactions fetch error:", error);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un centre..."
                        className="w-full pl-11 pr-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 ring-blue-500 transition-all text-sm font-medium text-white placeholder-slate-500"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                >
                    <UserPlus size={18} />
                    Nouvel Organisme
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#1E293B]/50">
                <table className="w-full text-left">
                    <thead className="bg-[#1E293B] text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <tr>
                            <th className="p-6">Organisme</th>
                            <th className="p-6">Apprenants</th>
                            <th className="p-6">Examens / Questions</th>
                            <th className="p-6">Solde Crédits</th>
                            <th className="p-6">Statut</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {isLoading ? (
                            <SkeletonRows columns={5} />
                        ) : filteredOrgs.length === 0 ? (
                            <EmptyState message="Aucun organisme trouvé." />
                        ) : filteredOrgs.map((org: any) => (
                            <tr key={org.id} className="group hover:bg-slate-800/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                            {(org.name || '?')[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-base">{org.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">/{org.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-slate-300">{org._count?.users || 0} inscrits</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Créé le {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-white tracking-widest">{org._count?.examSessions || 0} sessions</span>
                                        <span className="text-[10px] text-slate-500 uppercase">Bibliothèque: {org._count?.questions || 0} questions</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="inline-flex items-center px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg font-mono font-bold text-sm border border-blue-500/20">
                                        {(org.creditsBalance || 0).toLocaleString()} 🪙
                                    </span>
                                </td>
                                <td className="p-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${org.status === 'ACTIVE'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {org.status === 'ACTIVE' ? 'ACTIF' : 'SUSPENDU'}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setIsCreditModalOpen({ id: org.id, name: org.name })} className="p-2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 rounded-lg transition-colors" title="Ajouter Crédits"><CreditCard size={18} /></button>
                                        <button onClick={() => openOrgTransactions(org.id, org.name)} className="p-2 hover:bg-purple-500/10 text-slate-400 hover:text-purple-500 rounded-lg transition-colors" title="Historique"><History size={18} /></button>
                                        <button onClick={() => toggleOrgStatus(org.id, org.status)} className={`p-2 hover:bg-slate-700 rounded-lg transition-colors ${org.status === 'ACTIVE' ? 'text-rose-400' : 'text-emerald-400'}`} title={org.status === 'ACTIVE' ? "Suspendre" : "Activer"}>{org.status === 'ACTIVE' ? <Ban size={18} /> : <CheckCircle2 size={18} />}</button>
                                        <button onClick={() => setOrgSettings({ id: org.id, name: org.name, logoUrl: org.logoUrl, primaryColor: org.primaryColor, monthlyQuota: org.monthlyQuota || 1000 })} className="p-2 hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded-lg transition-colors" title="Paramètres"><Settings size={18} /></button>
                                        <button onClick={() => handleDeleteOrg(org.id)} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Supprimer"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Org Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Créer un nouvel organisme">
                <form onSubmit={handleCreateOrg} className="space-y-4">
                    <FormInput label="Nom de l'organisme" value={newOrg.name} onChange={(e: any) => setNewOrg({ ...newOrg, name: e.target.value })} required />
                    <FormInput label="Slug (identifiant)" value={newOrg.slug} onChange={(e: any) => setNewOrg({ ...newOrg, slug: e.target.value })} required />
                    <FormInput label="Email Admin" type="email" value={newOrg.adminEmail} onChange={(e: any) => setNewOrg({ ...newOrg, adminEmail: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Crédits Initiaux" type="number" value={newOrg.initialCredits} onChange={(e: any) => setNewOrg({ ...newOrg, initialCredits: parseInt(e.target.value) })} />
                        <FormInput label="Quota Mensuel" type="number" value={newOrg.monthlyQuota} onChange={(e: any) => setNewOrg({ ...newOrg, monthlyQuota: parseInt(e.target.value) })} />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Annuler</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Créer</button>
                    </div>
                </form>
            </Modal>

            {/* Settings Org Modal */}
            <Modal isOpen={!!orgSettings} onClose={() => setOrgSettings(null)} title={orgSettings?.name || "Détails Organisme"}>
                {orgSettings && (
                    <div className="space-y-6">
                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-slate-800 pb-2 mb-4">
                            <button
                                onClick={() => setOrgModalTab('settings')}
                                className={`px-4 py-2 font-bold rounded-xl transition-all ${orgModalTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <Settings size={16} className="inline mr-2" /> Paramètres
                            </button>
                            <button
                                onClick={() => setOrgModalTab('classrooms')}
                                className={`px-4 py-2 font-bold rounded-xl transition-all ${orgModalTab === 'classrooms' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <BookOpen size={16} className="inline mr-2" /> Salles de Classe
                            </button>
                        </div>

                        {orgModalTab === 'settings' ? (
                            <form onSubmit={handleUpdateOrg} className="space-y-4">
                                <FormInput label="Nom" value={orgSettings.name} onChange={(e: any) => setOrgSettings({ ...orgSettings, name: e.target.value })} />
                                <FormInput label="Logo URL" value={orgSettings.logoUrl || ''} onChange={(e: any) => setOrgSettings({ ...orgSettings, logoUrl: e.target.value })} />
                                <FormInput label="Couleur Primaire (Hex)" value={orgSettings.primaryColor || ''} onChange={(e: any) => setOrgSettings({ ...orgSettings, primaryColor: e.target.value })} />
                                <FormInput label="Quota Mensuel" type="number" value={orgSettings.monthlyQuota} onChange={(e: any) => setOrgSettings({ ...orgSettings, monthlyQuota: parseInt(e.target.value) })} />
                                <div className="pt-4 border-t border-slate-800">
                                    <button type="button" onClick={() => handleResetPassword(orgSettings.id, orgSettings.name)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center gap-2 mb-4">
                                        <LockIcon size={16} /> Réinitialiser mot de passe admin
                                    </button>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setOrgSettings(null)} className="px-4 py-2 text-slate-400 hover:text-white">Fermer</button>
                                    <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Sauvegarder</button>
                                </div>
                            </form>
                        ) : (
                            <div className="min-h-[400px]">
                                <ClassroomManagement organization={orgSettings} token={token} />
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Credit Modal */}
            <Modal isOpen={!!isCreditModalOpen} onClose={() => setIsCreditModalOpen(null)} title="Ajouter des crédits">
                <div className="space-y-6">
                    <p className="text-slate-400">Ajouter des crédits test pour <strong>{isCreditModalOpen?.name}</strong>.</p>
                    <div className="flex gap-2">
                        {[100, 500, 1000, 5000].map(amt => (
                            <button key={amt} onClick={() => setCreditAmount(amt)} className={`px-4 py-2 rounded-lg border ${creditAmount === amt ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-slate-700 text-slate-400'}`}>{amt}</button>
                        ))}
                    </div>
                    <FormInput label="Montant personnalisé" type="number" value={creditAmount} onChange={(e: any) => setCreditAmount(parseInt(e.target.value))} />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsCreditModalOpen(null)} className="px-4 py-2 text-slate-400 hover:text-white">Annuler</button>
                        <button onClick={handleAddCredits} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2"><CreditCard size={18} /> Ajouter</button>
                    </div>
                </div>
            </Modal>

            {/* Transactions Modal */}
            <Modal isOpen={!!orgTransactions} onClose={() => setOrgTransactions(null)} title={`Historique : ${orgTransactions?.orgName}`}>
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-500 font-bold border-b border-slate-800">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                            {orgTransactions?.data && orgTransactions.data.length > 0 ? orgTransactions.data.map((tx: any, i: number) => (
                                <tr key={i}>
                                    <td className="p-3">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}</td>
                                    <td className="p-3">{tx.type}</td>
                                    <td className="p-3 font-mono">{tx.amount > 0 ? '+' : ''}{tx.amount}</td>
                                </tr>
                            )) : <tr><td colSpan={3} className="p-4 text-center text-slate-500">Aucune transaction.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
}

function UserManagement({ users, setUsers, token, isLoading }: any) {
    const { login } = useAuth(); // Access auth context to swap session
    const [localSearch, setLocalSearch] = useState('');
    const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
    const [userEditForm, setUserEditForm] = useState({ name: '', email: '', role: '' });
    const [viewingUserProfile, setViewingUserProfile] = useState<any | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    const filteredUsers = users.filter((u: any) =>
        (u.name?.toLowerCase() || '').includes(localSearch.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(localSearch.toLowerCase())
    );

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const response = await fetch(`http://localhost:3333/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(userEditForm)
            });
            if (response.ok) {
                setUsers(users.map((u: any) => u.id === editingUser.id ? { ...u, ...userEditForm } : u));
                setEditingUser(null);
            }
        } catch (error) {
            console.error("Update user error:", error);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm("Attention : Cette action supprimera définitivement l'utilisateur et tout son historique. Continuer ?")) return;
        try {
            const response = await fetch(`http://localhost:3333/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsers(users.filter((u: any) => u.id !== id));
            }
        } catch (error) {
            console.error("Delete user error:", error);
        }
    };

    const openEditUserModal = (user: PlatformUser) => {
        setEditingUser(user);
        setUserEditForm({ name: user.name || '', email: user.email, role: user.role });
    };

    const openCandidateProfile = async (userId: string) => {
        setIsProfileLoading(true);
        setViewingUserProfile({}); // Non-null to open modal

        try {
            const url = `http://localhost:3333/admin/users/${userId}/profile`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const profile = await response.json();
                setViewingUserProfile(profile);
            } else {
                setViewingUserProfile(null);
                alert("Erreur lors de la récupération du profil.");
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
            setViewingUserProfile(null);
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handleImpersonate = async (userId: string, userName: string) => {
        if (!window.confirm(`Voulez-vous vraiment vous connecter en tant que "${userName}" ?\n\nVous devrez vous déconnecter pour revenir au Super Admin.`)) return;

        try {
            const response = await fetch(`http://localhost:3333/admin/users/${userId}/impersonate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Inject new session (God Mode activation)
                login(data.access_token, data.user, data.organization);
                // Force reload to ensure all guards/routes update immediately
                window.location.assign('/');
            } else {
                alert("Erreur lors de l'impersonnation.");
            }
        } catch (error) {
            console.error("Impersonation error:", error);
            alert("Erreur technique.");
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        className="w-full pl-11 pr-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 ring-blue-500 transition-all text-sm font-medium text-white placeholder-slate-500"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="p-6">Utilisateur</th>
                                <th className="p-8">Rôle</th>
                                <th className="p-8">Organisation</th>
                                <th className="p-8">Date d'inscription</th>
                                <th className="p-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800/50">
                            {isLoading ? (
                                <SkeletonRows columns={5} />
                            ) : filteredUsers.length === 0 ? (
                                <EmptyState message="Aucun utilisateur trouvé." />
                            ) : filteredUsers.map((user: any) => (
                                <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">
                                                {((user.name || user.email) || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{user.name || 'Utilisateur'}</div>
                                                <div className="text-sm text-slate-400 font-medium">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-8">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : user.role === 'COACH' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-8 font-medium text-slate-600 dark:text-slate-300">
                                        {user.organization?.name || '--'}
                                    </td>
                                    <td className="p-8 text-sm text-slate-400 font-medium">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-8 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleImpersonate(user.id, user.name || user.email)}
                                                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                                                title="Se connecter en tant que (God Mode)"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => openCandidateProfile(user.id)}
                                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                title="Voir Parcours/Profil"
                                            >
                                                <TrendingUp size={18} />
                                            </button>
                                            <button
                                                onClick={() => openEditUserModal(user)}
                                                className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Supprimer l'utilisateur"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Modifier Utilisateur">
                <form onSubmit={handleUpdateUser} className="space-y-4">
                    <FormInput label="Nom" value={userEditForm.name} onChange={(e: any) => setUserEditForm({ ...userEditForm, name: e.target.value })} />
                    <FormInput label="Email" type="email" value={userEditForm.email} onChange={(e: any) => setUserEditForm({ ...userEditForm, email: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Rôle</label>
                        <select
                            value={userEditForm.role}
                            onChange={(e) => setUserEditForm({ ...userEditForm, role: e.target.value })}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="CANDIDATE">Candidat</option>
                            <option value="COACH">Formateur</option>
                            <option value="ORG_ADMIN">Admin d'Organisme</option>
                            <option value="SALES">Commercial</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-400 hover:text-white">Annuler</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Sauvegarder</button>
                    </div>
                </form>
            </Modal>

            {/* User Profile Modal */}
            <Modal isOpen={!!viewingUserProfile} onClose={() => setViewingUserProfile(null)} title="Profil Utilisateur">
                {isProfileLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Récupération du profil...</p>
                    </div>
                ) : viewingUserProfile?.id ? (
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
                                {((viewingUserProfile.name || viewingUserProfile.email) || '?')[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{viewingUserProfile.name}</h3>
                                <p className="text-slate-500 font-medium mb-3">{viewingUserProfile.email}</p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 uppercase tracking-wider">
                                        {viewingUserProfile.role}
                                    </span>
                                    {viewingUserProfile.organization && (
                                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 uppercase tracking-wider">
                                            {viewingUserProfile.organization.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Score Moyen</p>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                        {viewingUserProfile.stats?.averageScore || '-'} <span className="text-xs text-slate-400 font-medium">/ 699</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    <Award size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sessions</p>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                                        {viewingUserProfile.stats?.totalExams || 0}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gamification & Skills Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Gamification Card */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" /> Progression & Série
                                </h4>

                                <div className="space-y-4">
                                    {/* XP */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-bold text-slate-500">Expérience (XP)</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{viewingUserProfile.gamification?.xp || 0} XP</p>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000"
                                                style={{ width: `${Math.min(100, ((viewingUserProfile.gamification?.xp || 0) / 1000) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Streak */}
                                    <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                        <div className={`p-2 rounded-full ${viewingUserProfile.gamification?.streak > 0 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <Flame size={20} className={viewingUserProfile.gamification?.streak > 0 ? 'fill-current' : ''} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase">Série Actuelle</p>
                                            <p className="text-xl font-black text-orange-900 dark:text-orange-300">{viewingUserProfile.gamification?.streak || 0} Jours</p>
                                        </div>
                                    </div>

                                    {/* Badges Preview */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Derniers Badges</p>
                                        <div className="flex gap-2">
                                            {viewingUserProfile.gamification?.badges?.slice(0, 4).map((ub: any) => (
                                                <div key={ub.id} className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm" style={{ backgroundColor: `${ub.badge.color}10`, borderColor: `${ub.badge.color}30`, color: ub.badge.color }}>
                                                    {ub.badge.icon === 'Zap' && <Zap size={16} />}
                                                    {ub.badge.icon === 'Mic' && <Mic size={16} />}
                                                    {ub.badge.icon === 'Flame' && <Flame size={16} />}
                                                    {ub.badge.icon === 'PenTool' && <PenTool size={16} />}
                                                </div>
                                            ))}
                                            {(!viewingUserProfile.gamification?.badges || viewingUserProfile.gamification.badges.length === 0) && (
                                                <p className="text-xs text-slate-400 italic">Aucun badge débloqué</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Radar */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                    Profil Compétences
                                </h4>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                            { subject: 'CO', A: viewingUserProfile.stats?.breakdown?.CO || 0 },
                                            { subject: 'CE', A: viewingUserProfile.stats?.breakdown?.CE || 0 },
                                            { subject: 'EO', A: viewingUserProfile.stats?.breakdown?.EO || 0 },
                                            { subject: 'EE', A: viewingUserProfile.stats?.breakdown?.EE || 0 },
                                            { subject: 'LU', A: (viewingUserProfile.stats?.breakdown?.CE || 0) * 0.9 },
                                        ]}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 699]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Compétences"
                                                dataKey="A"
                                                stroke="#4f46e5"
                                                strokeWidth={2}
                                                fill="#4f46e5"
                                                fillOpacity={0.3}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Coach Info */}
                            {viewingUserProfile.coach && (
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Coach Assigné</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
                                            {viewingUserProfile.coach.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{viewingUserProfile.coach.name}</p>
                                            <p className="text-xs text-slate-500">{viewingUserProfile.coach.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Prerequisites Status */}
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Objectif & Prérequis</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black text-slate-400 uppercase pl-2">Objectif</span>
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pr-2">{viewingUserProfile.objective || 'Non spécifié'}</span>
                                    </div>
                                    <div className={`flex justify-between items-center p-2 rounded-xl border ${viewingUserProfile.prerequisites?.verified ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                        <div className="flex items-center gap-2 pl-2">
                                            {viewingUserProfile.prerequisites?.verified ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">Dossier</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest pr-2">{viewingUserProfile.prerequisites?.verified ? 'Vérifié' : 'À Vérifier'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio / Offline Proofs */}
                        {viewingUserProfile.portfolio && viewingUserProfile.portfolio.length > 0 && (
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-slate-400">
                                    <PenTool size={16} /> Portfolio / Journal de Bord
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {viewingUserProfile.portfolio.map((proof: any) => (
                                        <div key={proof.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:shadow-md transition-all">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">{proof.title}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-black uppercase tracking-widest">{proof.type}</span>
                                                <span className="text-[9px] text-slate-400">{new Date(proof.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <History size={18} className="text-slate-400" />
                                Activité Récente
                            </h4>
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                {viewingUserProfile.examSessions?.slice(0, 3).map((s: any) => (
                                    <div key={s.id} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">Session d'examen</div>
                                            <div className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold ${s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {s.score || s.status}
                                        </div>
                                    </div>
                                ))}
                                {viewingUserProfile.activityLogs?.slice(0, 3).map((log: any) => (
                                    <div key={log.id} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">{log.action}</div>
                                            <div className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono">LOG</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pedagogical Actions */}
                        {viewingUserProfile.pedagogicalActions && viewingUserProfile.pedagogicalActions.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <BookOpen size={18} className="text-indigo-500" />
                                    Suivi Pédagogique
                                </h4>
                                <div className="space-y-4 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/30">
                                    {viewingUserProfile.pedagogicalActions.map((action: any) => (
                                        <div key={action.id} className="relative pl-6">
                                            <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-indigo-500 border-4 border-white dark:border-slate-900" />
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{action.type}</span>
                                                    <span className="text-xs text-slate-400">{new Date(action.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{action.content}"</p>
                                                <div className="mt-2 text-xs text-slate-400 font-medium">— {action.coach?.name || 'Coach'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400">Erreur de chargement.</div>
                )}
            </Modal>
        </div>
    );
}

function AiMonitoring({ aiData, sessions }: any) {
    if (!aiData) return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Corrélation AI/Humain</p>
                    <div className="text-4xl font-black text-white mb-2">{aiData.avgCorrelation ? (aiData.avgCorrelation * 100).toFixed(1) : '--'}%</div>
                    <div className="text-xs text-emerald-400 font-bold">Précision élevée</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Sessions Évaluées</p>
                    <div className="text-4xl font-black text-white mb-2">{aiData.evaluatedSessions}</div>
                    <div className="text-xs text-blue-400 font-bold">Sessions totales</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Coût d'Inférence Moyen</p>
                    <div className="text-4xl font-black text-white mb-2">0.04 $</div>
                    <div className="text-xs text-amber-500 font-bold">Par examen complet</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 px-2">
                    <Cpu className="w-5 h-5 text-purple-500" />
                    Dernières analyses algorithmiques
                </h3>
                <table className="w-full text-left">
                    <thead className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                        <tr>
                            <th className="px-4 py-3">Session ID</th>
                            <th className="px-4 py-3">Candidat</th>
                            <th className="px-4 py-3">Score IA</th>
                            <th className="px-4 py-3">Score Humain</th>
                            <th className="px-4 py-3">Delta</th>
                            <th className="px-4 py-3 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {sessions.slice(0, 10).map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-800/50">
                                <td className="px-4 py-4 font-mono text-xs text-slate-500">{s.id.slice(0, 8)}...</td>
                                <td className="px-4 py-4 font-bold text-white">{s.user.name}</td>
                                <td className="px-4 py-4 text-purple-400 font-bold">{s.score || '-'}%</td>
                                <td className="px-4 py-4 text-slate-300">{s.humanGrade || '-'}%</td>
                                <td className="px-4 py-4">
                                    {(s.score && s.humanGrade) ? (
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${Math.abs(s.score - s.humanGrade) > 10 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {Math.abs(s.score - s.humanGrade)}% diff
                                        </span>
                                    ) : '--'}
                                </td>
                                <td className="px-4 py-4 text-right text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AuditLogs({ logs }: any) {
    return (
        <div className="max-w-[1600px] mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Database className="w-6 h-6 text-slate-400" />
                Journal d'Audit du Système
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Utilisateur</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Entité</th>
                            <th className="p-4">Détails</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                        {logs && logs.length > 0 ? logs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-800/50">
                                <td className="p-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-white">{log.user?.name || 'Système'}</div>
                                    <div className="text-xs text-slate-500 bg-slate-800 inline-block px-1 rounded">{log.user?.email || 'SYSTEM'}</div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/20">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs font-mono text-slate-400">{log.entityType}</span>
                                    <span className="block text-xs text-slate-500">#{log.entityId}</span>
                                </td>
                                <td className="p-4">
                                    <code className="text-xs text-slate-500 bg-slate-950 p-1 rounded block max-w-xs truncate">
                                        {log.payload ? JSON.stringify(JSON.parse(log.payload), null, 2) : '-'}
                                    </code>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">Aucun log d'audit disponible.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// Sub-components

function KPICard({ label, value, sub, icon, trend }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-colors">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <AlertCircle size={14} />}
                        {trend === 'up' ? '+8%' : '-2%'}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight mb-2">{value}</p>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{sub}</p>
            </div>
        </div>
    );
}

import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
            >
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 transition-colors">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

function FormInput({ label, type = "text", placeholder, value, onChange }: any) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 ring-primary transition-all text-sm font-bold dark:text-white"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    );
}

function SkeletonRows({ columns }: { columns: number }) {
    return (
        <>
            {[1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                    {[...Array(columns)].map((_, j) => (
                        <td key={j} className="p-8">
                            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function SystemSettings({ settings, updateSetting, handleExportData, token }: { settings: any, updateSetting: (k: string, v: any, t: string) => void, handleExportData: () => void, token: string | null }) {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <Database className="text-blue-500" />
                    Données & Conformité
                </h3>
                <div className="space-y-6">
                    <div
                        className="flex items-center justify-between p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
                        onClick={handleExportData}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <Download size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">Exportation RGPD Complète</h4>
                                <p className="text-sm text-slate-400">Générer un fichier JSON contenant l'intégralité des données de la plateforme.</p>
                            </div>
                        </div>
                        <ArrowUpRight className="text-slate-500 group-hover:text-blue-400 transition-all" />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <Settings className="text-amber-500" />
                    Configuration de la Plateforme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Coût unitaire IA ($)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-mono font-bold text-white">$</span>
                            <input
                                type="number"
                                step="0.001"
                                value={settings.ai_unit_cost}
                                onChange={(e) => updateSetting('ai_unit_cost', e.target.value, 'number')}
                                className="bg-transparent text-2xl font-mono font-bold text-white border-none focus:ring-0 p-0 w-full"
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex items-center justify-between">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Mode maintenance</label>
                            <p className="text-xs text-slate-400 mt-1">Bloque l'accès aux candidats pour maintenance.</p>
                        </div>
                        <button
                            onClick={() => updateSetting('maintenance_mode', !settings.maintenance_mode, 'boolean')}
                            className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenance_mode ? 'bg-amber-500' : 'bg-slate-700'}`}
                        >
                            <motion.div
                                animate={{ x: settings.maintenance_mode ? 28 : 4 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <GlobalNotificationForm token={token} />
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <tr>
            <td colSpan={10} className="p-20 text-center">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Filter className="w-12 h-12 opacity-20" />
                    <p className="font-bold">{message}</p>
                </div>
            </td>
        </tr>
    );
}

function GlobalNotificationForm({ token }: { token: string | null }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('info');
    const [targetType, setTargetType] = useState<'platform' | 'organization' | 'role'>('platform');
    const [targetId, setTargetId] = useState('');
    const [organizations, setOrganizations] = useState<{ id: string, name: string }[]>([]);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (token) {
            fetch('http://localhost:3333/admin/organizations', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(r => r.ok ? r.json() : [])
                .then(data => setOrganizations(data));
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;

        setIsSending(true);
        try {
            const url = 'http://localhost:3333/admin/notifications/global';
            const payload: any = { title, content, type };
            if (targetType === 'organization' && targetId) {
                payload.organizationId = targetId;
            }
            if (targetType === 'role' && targetId) {
                payload.targetRole = targetId;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Notification envoyée avec succès !");
                setTitle('');
                setContent('');
                setTargetId('');
                setTargetType('platform');
            } else {
                alert("Erreur lors de l'envoi.");
            }
        } catch (error) {
            console.error("Global notification error:", error);
            alert("Erreur de connexion.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Megaphone className="text-emerald-500" />
                Message Flash Global
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Titre du message</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ex: Maintenance prévue..."
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Type d'alerte</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
                        >
                            <option value="info">Information (Bleu)</option>
                            <option value="warning">Avertissement (Orange)</option>
                            <option value="success">Succès (Vert)</option>
                            <option value="error">Urgent (Rouge)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Cible</label>
                        <select
                            value={targetType}
                            onChange={(e) => { setTargetType(e.target.value as any); setTargetId(''); }}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
                        >
                            <option value="platform">🌐 Toute la plateforme</option>
                            <option value="organization">🏢 Une organisation</option>
                            <option value="role">👤 Un rôle</option>
                        </select>
                    </div>
                </div>
                {targetType === 'organization' && (
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Sélectionner l'organisation</label>
                        <select
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
                        >
                            <option value="">-- Choisir --</option>
                            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                )}
                {targetType === 'role' && (
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Sélectionner le rôle</label>
                        <select
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
                        >
                            <option value="">-- Choisir --</option>
                            <option value="ORG_ADMIN">Admin CFA</option>
                            <option value="COACH">Formateur</option>
                            <option value="CANDIDATE">Apprenant</option>
                        </select>
                    </div>
                )}
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Contenu du message</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        placeholder="Décrivez l'annonce ici..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSending || !title || !content}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all group"
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        )}
                        Diffuser le message
                    </button>
                </div>
            </form>
        </div>
    );
}

function GlobalLibrary({ token }: { token: string | null }) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'drafts' | 'published' | 'referentiels'>('drafts');
    const [filters, setFilters] = useState({ search: '', level: '', topic: '' });
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    // Topics/Sectors state
    const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
    const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
    const [newTopicName, setNewTopicName] = useState('');
    const [newSectorName, setNewSectorName] = useState('');

    const [formData, setFormData] = useState({
        level: 'B1',
        topic: 'Quotidien',
        text: '',
        options: ['', '', '', ''],
        correct: '',
        explanation: ''
    });

    const fetchQuestions = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const query = new URLSearchParams(filters);
            const res = await fetch(`http://localhost:3333/content-lab/questions?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReferentiels = async () => {
        if (!token) return;
        try {
            const [topicsRes, sectorsRes] = await Promise.all([
                fetch('http://localhost:3333/content-lab/topics', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3333/content-lab/sectors', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (topicsRes.ok) setTopics(await topicsRes.json());
            if (sectorsRes.ok) setSectors(await sectorsRes.json());
        } catch (e) { console.error(e); }
    };

    const handleAddTopic = async () => {
        if (!token || !newTopicName.trim()) return;
        await fetch('http://localhost:3333/content-lab/topics', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newTopicName.trim() })
        });
        setNewTopicName('');
        fetchReferentiels();
    };

    const handleDeleteTopic = async (id: string) => {
        if (!token || !confirm('Supprimer cette thématique ?')) return;
        await fetch(`http://localhost:3333/content-lab/topics/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchReferentiels();
    };

    const handleAddSector = async () => {
        if (!token || !newSectorName.trim()) return;
        await fetch('http://localhost:3333/content-lab/sectors', {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newSectorName.trim() })
        });
        setNewSectorName('');
        fetchReferentiels();
    };

    const handleDeleteSector = async (id: string) => {
        if (!token || !confirm('Supprimer ce secteur ?')) return;
        await fetch(`http://localhost:3333/content-lab/sectors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchReferentiels();
    };

    useEffect(() => {
        fetchQuestions();
        fetchReferentiels();
    }, [token, filters.level]);

    const handleOpenEditor = (question?: any) => {
        if (question) {
            setEditingQuestion(question);
            let opts = [];
            try { opts = JSON.parse(question.options); } catch { opts = [] }
            setFormData({
                level: question.level,
                topic: question.topic,
                text: question.questionText || question.content,
                options: opts.length === 4 ? opts : ['', '', '', ''],
                correct: question.correctAnswer,
                explanation: question.explanation || ''
            });
        } else {
            setEditingQuestion(null);
            setFormData({
                level: 'B1',
                topic: 'Quotidien',
                text: '',
                options: ['', '', '', ''],
                correct: '',
                explanation: ''
            });
        }
        setIsEditorOpen(true);
    };

    const handleSave = async () => {
        if (!token) return;
        setSaving(true);
        try {
            const payload = {
                level: formData.level,
                topic: formData.topic,
                questionText: formData.text,
                content: formData.text,
                options: JSON.stringify(formData.options),
                correctAnswer: formData.correct,
                explanation: formData.explanation
            };
            const url = editingQuestion
                ? `http://localhost:3333/content-lab/questions/${editingQuestion.id}`
                : `http://localhost:3333/content-lab/questions`;
            const res = await fetch(url, {
                method: editingQuestion ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsEditorOpen(false);
                fetchQuestions();
            }
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!token || !confirm('Supprimer cette question ?')) return;
        try {
            await fetch(`http://localhost:3333/content-lab/questions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchQuestions();
        } catch (e) { console.error(e); }
    };

    const handleValidate = async (id: string) => {
        if (!token) return;
        try {
            await fetch(`http://localhost:3333/content-lab/questions/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: true })
            });
            fetchQuestions();
        } catch (e) { console.error(e); }
    };

    const filteredQuestions = questions.filter(q => viewMode === 'drafts' ? !q.isActive : q.isActive);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Bibliothèque Globale</h2>
                    <p className="text-slate-500 text-sm">Gérez le contenu pédagogique de toutes les organisations.</p>
                </div>
                <button
                    onClick={() => handleOpenEditor()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} /> Nouvelle Question Platform
                </button>
            </div>

            <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-800 flex gap-4 mb-6 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher (question, thème, école)..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                        className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-4 py-2 rounded-lg outline-none focus:ring-2 ring-blue-500 text-white"
                    />
                </div>
                <select
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none"
                >
                    <option value="">Tous Niveaux</option>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors" onClick={fetchQuestions}>
                    <Filter size={20} className="text-slate-400" />
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setViewMode('drafts')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'drafts' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                    📄 Brouillons ({questions.filter(q => !q.isActive).length})
                </button>
                <button
                    onClick={() => setViewMode('published')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'published' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                    ✅ Publiées ({questions.filter(q => q.isActive).length})
                </button>
                <button
                    onClick={() => setViewMode('referentiels')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${viewMode === 'referentiels' ? 'bg-violet-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                    📚 Référentiels
                </button>
            </div>

            {viewMode === 'referentiels' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* TOPICS */}
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-800">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white"><BookOpen size={20} className="text-blue-400" /> Thématiques</h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                placeholder="Nouvelle thématique..."
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                            />
                            <button onClick={handleAddTopic} className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg text-white"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {topics.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                                    <span className="text-slate-300 text-sm">{t.name}</span>
                                    <button onClick={() => handleDeleteTopic(t.id)} className="text-rose-400 hover:text-rose-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            {topics.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Aucune thématique.</p>}
                        </div>
                    </div>
                    {/* SECTORS */}
                    <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-800">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white"><Briefcase size={20} className="text-emerald-400" /> Secteurs</h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newSectorName}
                                onChange={(e) => setNewSectorName(e.target.value)}
                                placeholder="Nouveau secteur..."
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSector()}
                            />
                            <button onClick={handleAddSector} className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded-lg text-white"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {sectors.map(s => (
                                <div key={s.id} className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                                    <span className="text-slate-300 text-sm">{s.name}</span>
                                    <button onClick={() => handleDeleteSector(s.id)} className="text-rose-400 hover:text-rose-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            {sectors.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Aucun secteur.</p>}
                        </div>
                    </div>
                </div>
            ) : loading ? (
                <div className="text-center py-20 text-slate-500">Chargement de la bibliothèque...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuestions.map((q) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#1E293B] rounded-2xl p-6 border border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!q.isActive && (
                                    <button onClick={() => handleValidate(q.id)} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all" title="Valider">
                                        <CheckCircle2 size={16} />
                                    </button>
                                )}
                                <button onClick={() => handleOpenEditor(q)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(q.id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${q.level.startsWith('A') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                    q.level.startsWith('B') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    }`}>
                                    {q.level}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                    {q.topic}
                                </span>
                                {q.organization && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {q.organization.name}
                                    </span>
                                )}
                            </div>

                            <h3 className="font-bold text-slate-100 mb-4 line-clamp-3 leading-relaxed">
                                {q.questionText || q.content}
                            </h3>

                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-auto">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                <span className="truncate">{q.correctAnswer}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isEditorOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1E293B] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-800"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1E293B]">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        {editingQuestion ? <Edit2 size={18} className="text-blue-500" /> : <Plus size={18} className="text-blue-500" />}
                                    </div>
                                    {editingQuestion ? 'Modérer la question' : 'Création Platform'}
                                </h2>
                                <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                                <div className="flex-1 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Niveau</label>
                                            <select
                                                value={formData.level}
                                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-blue-500"
                                            >
                                                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Thème</label>
                                            <input
                                                type="text"
                                                value={formData.topic}
                                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Énoncé</label>
                                        <textarea
                                            value={formData.text}
                                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                            className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-blue-500 resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Options</label>
                                        <div className="space-y-3">
                                            {formData.options.map((opt, idx) => (
                                                <div key={idx} className="flex gap-3 items-center">
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...formData.options];
                                                            newOpts[idx] = e.target.value;
                                                            setFormData({ ...formData, options: newOpts });
                                                        }}
                                                        className={`flex-1 bg-slate-900 border px-4 py-3 rounded-xl outline-none transition-all ${formData.correct === opt && opt !== '' ? 'border-emerald-500 bg-emerald-500/5 text-white' : 'border-slate-800 text-slate-400 focus:border-blue-500'}`}
                                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                                    />
                                                    <button
                                                        onClick={() => setFormData({ ...formData, correct: opt })}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.correct === opt && opt !== '' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 hover:text-emerald-500'}`}
                                                    >
                                                        <CheckCircle2 size={20} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-1/3 space-y-4 hidden lg:block">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Eye size={14} /> Aperçu
                                    </h3>
                                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col h-full">
                                        <div className="flex gap-2 mb-4">
                                            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">{formData.level}</span>
                                        </div>
                                        <p className="font-bold text-slate-100 mb-6 leading-relaxed">
                                            {formData.text || "..."}
                                        </p>
                                        <div className="space-y-2">
                                            {formData.options.map((opt, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl text-xs border ${formData.correct === opt && opt !== '' ? 'border-emerald-500 bg-emerald-500/5 text-white' : 'border-slate-800 text-slate-500'}`}>
                                                    {opt || "..."}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-800 bg-[#1E293B] flex justify-end gap-3">
                                <button onClick={() => setIsEditorOpen(false)} className="px-6 py-3 text-slate-400 font-bold hover:text-white transition-colors">Annuler</button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !formData.text || !formData.correct}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {saving ? 'Synchronisation...' : <><Save size={20} /> Valider la Modération</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
