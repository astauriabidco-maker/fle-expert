
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import {
    Users, X, UserPlus, Search, ArrowUpDown,
    BookOpen, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
    Eye, Download, Mail, ClipboardList, ChevronLeft, ChevronRight,
    Target, Zap, Lock, Award, Calendar, Clock, PenTool, CreditCard,
    Plus, Trash2, CalendarPlus, Globe
} from 'lucide-react';
import CivicContentManager from './CivicContentManager';
import UserMenu from './UserMenu';
import CoachCalendar from './CoachCalendar';
import CoachStatsPanel from './CoachStatsPanel';
import MessagingPanel from './MessagingPanel';
import { FEEDBACK_TEMPLATES } from '../data/feedbackTemplates';

// Types
const API_URL = 'http://localhost:3333';

interface Student {
    id: string;
    name: string;
    email: string;
    currentLevel: string;
    targetLevel: string;
    objective?: string; // NEW
    lastActivity: string;
    stats: {
        averageScore: number;
        totalExams: number;
    };
    tags?: string[];
    skillsBreakdown: Record<string, number>;
}

type SortField = 'name' | 'currentLevel' | 'averageScore' | 'lastActivity' | 'totalExams';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'danger' | 'warning' | 'success';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-white bg-red-900/50 rounded-xl border border-red-500">
                    <h3 className="font-bold text-lg mb-2">Une erreur est survenue</h3>
                    <pre className="text-xs text-left bg-black/50 p-4 rounded overflow-auto max-h-40">
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const CoachDashboard: React.FC = () => {
    const { organization, token } = useAuth();
    const navigate = useNavigate();

    // Data state
    const [students, setStudents] = useState<Student[]>([]);
    const [corrections, setCorrections] = useState<any[]>([]);
    const [proofs, setProofs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);



    // UI state
    const [activeTab, setActiveTab] = useState<'students' | 'corrections' | 'validations' | 'profile' | 'stats' | 'calendar' | 'messages' | 'civic'>('students');
    const [myStats, setMyStats] = useState<any>(null);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [detailedStudent, setDetailedStudent] = useState<any>(null);
    const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<any>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Fetch unread messages
    useEffect(() => {
        const fetchUnread = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/messaging/unread-count`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUnreadMessages(data.unreadCount);
                }
            } catch (e) {
                console.error('Error fetching unread count:', e);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [token]);
    const [availabilityView, setAvailabilityView] = useState<'weekly' | 'calendar'>('weekly');
    const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
    const [newSlot, setNewSlot] = useState({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        isRecurring: false,
        date: new Date().toISOString().split('T')[0]
    });

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        address: '',
        postalCode: '',
        city: '',
        nda: '',
        hourlyRate: '',
        contactPerson: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

    // Initialize profile form when myStats loads
    useEffect(() => {
        if (myStats?.profile) {
            setProfileForm({
                name: myStats.profile.name || '',
                phone: myStats.profile.phone || '',
                address: myStats.profile.address || '',
                postalCode: myStats.profile.postalCode || '',
                city: myStats.profile.city || '',
                nda: myStats.profile.nda || '',
                hourlyRate: myStats.profile.hourlyRate?.toString() || '',
                contactPerson: myStats.profile.contactPerson || ''
            });
        }
    }, [myStats]);

    // Fetch uploaded documents
    const fetchDocuments = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/coach/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUploadedDocs(await res.json());
        } catch (err) { console.error('Fetch docs error:', err); }
    };

    useEffect(() => { fetchDocuments(); }, [token]);

    // Save profile handler
    const handleSaveProfile = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/coach/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...profileForm,
                    hourlyRate: profileForm.hourlyRate ? parseFloat(profileForm.hourlyRate) : null
                })
            });
            if (res.ok) {
                setToast({ type: 'success', message: 'Profil sauvegardé avec succès !' });
                fetchData(); // Refresh stats
            } else {
                setToast({ type: 'error', message: 'Erreur lors de la sauvegarde' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur réseau' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    // Document upload handler
    const handleDocumentUpload = async (file: File, docType: string) => {
        if (!token || !file) return;

        // For now, we'll simulate upload with a placeholder URL
        // In production, you'd upload to S3/Cloud storage first
        const fakeUrl = `/ uploads / ${Date.now()}_${file.name}`;

        try {
            const res = await fetch(`${API_URL}/coach/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: docType,
                    filename: file.name,
                    url: fakeUrl
                })
            });
            if (res.ok) {
                setToast({ type: 'success', message: `${docType} téléchargé!` });
                fetchDocuments();
            } else {
                setToast({ type: 'error', message: 'Erreur upload' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur réseau' });
        }
        setTimeout(() => setToast(null), 3000);
    };

    // List/Kanban & Management state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [studentTags, setStudentTags] = useState<Record<string, string[]>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkFeedback, setBulkFeedback] = useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    // Professional Tools State
    const [profileSubTab, setProfileSubTab] = useState<'identity' | 'availability' | 'billing' | 'signature'>('identity');
    const [availabilities, setAvailabilities] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [signature, setSignature] = useState<string | null>(null);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

    // Initialize studentTags from fetched students
    useEffect(() => {
        if (students.length > 0) {
            const map: any = {};
            students.forEach(s => { map[s.id] = s.tags || []; });
            setStudentTags(map);
        }
    }, [students]);

    const toggleTag = async (studentId: string, tag: string) => {
        const current = studentTags[studentId] || [];
        const next = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];

        setStudentTags(prev => ({ ...prev, [studentId]: next }));

        try {
            await fetch(`${API_URL}/coach/students/${studentId}/tags`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ tags: next })
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDragStart = (e: React.DragEvent, studentId: string) => {
        e.dataTransfer.setData('studentId', studentId);
    };

    const handleDrop = (e: React.DragEvent, targetTag: string) => {
        e.preventDefault();
        const studentId = e.dataTransfer.getData('studentId');
        if (studentId) {
            toggleTag(studentId, targetTag);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const toggleSelect = (studentId: string) => {
        const next = new Set(selectedIds);
        if (next.has(studentId)) next.delete(studentId);
        else next.add(studentId);
        setSelectedIds(next);
    };

    const handleBulkFeedback = async () => {
        if (!token || selectedIds.size === 0) return;
        setSubmitting(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id =>
                fetch(`${API_URL}/coach/students/${id}/actions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ type: 'FEEDBACK', content: bulkFeedback })
                })
            ));
            setBulkFeedback('');
            setIsBulkModalOpen(false);
            setSelectedIds(new Set());
            setToast({ type: 'success', message: 'Feedback envoyé aux étudiants sélectionnés' });
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur lors de l\'envoi' });
        } finally {
            setSubmitting(false);
        }
        setTimeout(() => setToast(null), 3000);
    };

    // Professional Tools Handlers
    const fetchAvailability = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/coach/availability`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // Ensure data is an array (API may return {slots: []} or error object)
            setAvailabilities(Array.isArray(data) ? data : (data?.slots || []));
        } catch (e) { console.error(e); }
    };

    const saveAvailability = async (slots: any[]) => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/coach/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ slots })
            });
            setToast({ type: 'success', message: 'Disponibilités mises à jour' });
            fetchAvailability();
        } catch (e) { setToast({ type: 'error', message: 'Erreur réseau' }); }
        setTimeout(() => setToast(null), 3000);
    };

    const fetchInvoices = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/coach/invoices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // Ensure data is an array (API may return error object)
            setInvoices(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
    };

    const generateInvoice = async (month: number, year: number) => {
        if (!token) return;
        setIsGeneratingInvoice(true);
        try {
            const res = await fetch(`${API_URL}/coach/invoices/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ month, year })
            });
            if (res.ok) {
                setToast({ type: 'success', message: 'Facture générée !' });
                fetchInvoices();
            } else {
                setToast({ type: 'error', message: 'Erreur lors de la génération' });
            }
        } catch (e) { setToast({ type: 'error', message: 'Erreur réseau' }); }
        finally { setIsGeneratingInvoice(false); }
        setTimeout(() => setToast(null), 3000);
    };

    const saveSignature = async (sigData: string) => {
        if (!token) return;
        try {
            await fetch(`${API_URL}/coach/signature`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ signature: sigData })
            });
            setSignature(sigData);
            setToast({ type: 'success', message: 'Signature enregistrée' });
        } catch (e) { setToast({ type: 'error', message: 'Erreur réseau' }); }
        setTimeout(() => setToast(null), 3000);
    };

    // Effect to fetch initial data for profile sub-tabs
    useEffect(() => {
        if (activeTab === 'profile') {
            fetchAvailability();
            fetchInvoices();
        }
    }, [activeTab]);

    // Fetch data
    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [studentsRes, correctionsRes, proofsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/coach/students`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/coach/corrections`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/proofs/org/${organization?.id}?status=PENDING`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/coach/my-stats`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (studentsRes.ok) setStudents(await studentsRes.json());
            if (correctionsRes.ok) setCorrections(await correctionsRes.json());
            if (proofsRes.ok) setProofs(await proofsRes.json());
            if (statsRes.ok) setMyStats(await statsRes.json());
        } catch (error) {
            console.error("Coach Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    // Compute KPIs
    const kpis = useMemo(() => {
        const total = students.length;
        const inDanger = students.filter(s =>
            s.stats.averageScore < 40 ||
            (s.lastActivity && new Date(s.lastActivity).getTime() < Date.now() - 7 * 86400000)
        ).length;
        const avgScore = total > 0
            ? Math.round(students.reduce((acc, s) => acc + (s.stats.averageScore || 0), 0) / total)
            : 0;
        const pendingCorrections = corrections.length;
        const pendingValidations = proofs.length;

        return { total, inDanger, avgScore, pendingCorrections, pendingValidations };
    }, [students, corrections]);

    // Filter and sort students
    const filteredStudents = useMemo(() => {
        let result = [...students];

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q)
            );
        }

        // Level filter
        if (filterLevel !== 'all') {
            result = result.filter(s => s.currentLevel === filterLevel);
        }

        // Status filter
        if (filterStatus === 'danger') {
            result = result.filter(s =>
                s.stats.averageScore < 40 ||
                (s.lastActivity && new Date(s.lastActivity).getTime() < Date.now() - 7 * 86400000)
            );
        } else if (filterStatus === 'warning') {
            result = result.filter(s =>
                s.stats.averageScore >= 40 && s.stats.averageScore < 60
            );
        } else if (filterStatus === 'success') {
            result = result.filter(s => s.stats.averageScore >= 60);
        }

        // Sort
        result.sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortField) {
                case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
                case 'currentLevel': aVal = a.currentLevel; bVal = b.currentLevel; break;
                case 'averageScore': aVal = a.stats.averageScore; bVal = b.stats.averageScore; break;
                case 'totalExams': aVal = a.stats.totalExams; bVal = b.stats.totalExams; break;
                case 'lastActivity': aVal = new Date(a.lastActivity).getTime(); bVal = new Date(b.lastActivity).getTime(); break;
                default: aVal = a.name; bVal = b.name;
            }
            if (typeof aVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return result;
    }, [students, searchQuery, filterLevel, filterStatus, sortField, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / pageSize);
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredStudents.slice(start, start + pageSize);
    }, [filteredStudents, currentPage]);

    // Handlers
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === paginatedStudents.length && paginatedStudents.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedStudents.map(s => s.id)));
        }
    };


    const handleSubmitCorrection = async (sessionId: string, grade: number) => {
        try {
            const res = await fetch(`${API_URL}/coach/corrections/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ humanGrade: grade })
            });
            if (res.ok) {
                setCorrections(corrections.filter(c => c.id !== sessionId));
                setIsCorrectionModalOpen(null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDetailedStudent = async (studentId: string) => {
        if (!token || !organization) return;
        try {
            const res = await fetch(`${API_URL}/analytics/student/${studentId}/org/${organization.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setDetailedStudent(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (selectedStudent) {
            fetchDetailedStudent(selectedStudent.id);
        } else {
            setDetailedStudent(null);
        }
    }, [selectedStudent]);

    const handleAssignStudent = async (email: string) => {
        try {
            const res = await fetch(`${API_URL}/coach/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                setIsAssignModalOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.message || 'Erreur');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const exportCSV = () => {
        const headers = ['Nom', 'Email', 'Niveau', 'Score Moyen', 'Examens', 'Dernière Activité'];
        const rows = filteredStudents.map(s => [
            s.name, s.email, s.currentLevel, s.stats.averageScore, s.stats.totalExams,
            s.lastActivity ? new Date(s.lastActivity).toLocaleDateString('fr-FR') : '-'
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cohorte_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };



    const handleAddSlot = async () => {
        const next = [...availabilities, { ...newSlot, id: Math.random().toString(36).substr(2, 9) }];
        saveAvailability(next);
        setIsAddSlotModalOpen(false);
    };

    const handleValidateProof = async (proofId: string, status: 'VALIDATED' | 'REJECTED', xpBonus: number = 20, customFeedback?: string) => {
        try {
            const res = await fetch(`${API_URL}/proofs/${proofId}/validate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    xpAwarded: status === 'VALIDATED' ? xpBonus : 0,
                    feedback: customFeedback || (status === 'VALIDATED' ? 'Preuve validée par le coach.' : 'Preuve refusée.')
                })
            });
            if (res.ok) {
                setProofs(proofs.filter(p => p.id !== proofId));
                setToast({ type: 'success', message: `Preuve ${status === 'VALIDATED' ? 'validée' : 'rejetée'}` });
            }
        } catch (e) {
            setToast({ type: 'error', message: "Erreur de validation" });
        }
        setTimeout(() => setToast(null), 3000);
    }

    if (loading) return <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">Chargement...</div>;

    return (
        <div className="min-h-screen bg-[#0F172A] p-4 md:p-6 font-sans text-white">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1E293B]/50 p-4 md:p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Espace Pédagogique
                        </h1>
                        <p className="text-slate-400 font-medium mt-1">{organization?.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <button onClick={() => setIsAssignModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
                            <UserPlus size={16} /> Ajouter
                        </button>
                        <button onClick={() => navigate('/content-lab')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
                            <BookOpen size={16} /> Content Lab
                        </button>
                        <UserMenu />
                    </div>
                </header>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <KPICard label="Étudiants" value={kpis.total} icon={<Users size={20} />} color="blue" />
                    <KPICard label="En difficulté" value={kpis.inDanger} icon={<AlertTriangle size={20} />} color="rose" onClick={() => setFilterStatus('danger')} />
                    <KPICard label="Score moyen" value={`${kpis.avgScore} % `} icon={<TrendingUp size={20} />} color="emerald" />
                    <KPICard label="Corrections" value={kpis.pendingCorrections} icon={<CheckCircle2 size={20} />} color="amber" onClick={() => setActiveTab('corrections')} badge />
                    <KPICard label="Validations" value={kpis.pendingValidations} icon={<Award size={20} />} color="indigo" onClick={() => setActiveTab('validations')} badge={kpis.pendingValidations > 0} />
                    <KPICard label="Feedbacks" value={myStats?.stats?.feedbacksSent || 0} icon={<Mail size={20} />} color="purple" />
                    <KPICard label="Modules Assignés" value={myStats?.stats?.assignmentsMade || 0} icon={<ClipboardList size={20} />} color="indigo" />
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2">
                    <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} label={`Étudiants(${students.length})`} />
                    <TabButton active={activeTab === 'corrections'} onClick={() => setActiveTab('corrections')} label={`Corrections(${corrections.length})`} badge={corrections.length > 0} />
                    <TabButton active={activeTab === 'validations'} onClick={() => setActiveTab('validations')} label={`Validations(${proofs.length})`} badge={proofs.length > 0} />
                    <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="Statistiques" />
                    <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} label="Calendrier" />
                    <TabButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} label="Messages" badge={unreadMessages > 0} />
                    <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Mon Profil" icon={PenTool} />
                    <TabButton active={activeTab === 'civic'} onClick={() => setActiveTab('civic')} label="Citoyenneté" icon={Globe} />
                </div>

                {activeTab === 'students' ? (
                    <div className="bg-[#1E293B]/50 rounded-2xl border border-slate-800 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-center">
                            <div className="relative flex-1 w-full">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom ou email..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 ring-emerald-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap items-center">
                                <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Liste
                                    </button>
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'} `}
                                    >
                                        Kanban
                                    </button>
                                </div>

                                {selectedIds.size > 0 && (
                                    <button
                                        onClick={() => setIsBulkModalOpen(true)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                                    >
                                        <Mail size={14} /> Feedback ({selectedIds.size})
                                    </button>
                                )}

                                <select
                                    value={filterLevel}
                                    onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }}
                                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold"
                                >
                                    <option value="all">Tous niveaux</option>
                                    <option value="A1">A1</option>
                                    <option value="A2">A2</option>
                                    <option value="B1">B1</option>
                                    <option value="B2">B2</option>
                                    <option value="C1">C1</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value as FilterStatus); setCurrentPage(1); }}
                                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold"
                                >
                                    <option value="all">Tous statuts</option>
                                    <option value="danger">🔴 Inactif/Danger</option>
                                    <option value="warning">🟡 Attention</option>
                                    <option value="success">🟢 Succès</option>
                                </select>
                                <button onClick={exportCSV} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2" title="Exporter en CSV">
                                    <Download size={16} />
                                </button>
                                <button onClick={() => setIsAssignModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <UserPlus size={16} /> Ajouter
                                </button>
                            </div>
                        </div>

                        {viewMode === 'list' ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="p-4 w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                                                    />
                                                </th>
                                                <th className="p-4 text-left cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                                                    <span className="flex items-center gap-1">Nom <ArrowUpDown size={14} /></span>
                                                </th>
                                                <th className="p-4 text-left">Tags & Alertes</th>
                                                <th className="p-4 text-left cursor-pointer hover:text-white" onClick={() => handleSort('currentLevel')}>
                                                    <span className="flex items-center gap-1">Niveau <ArrowUpDown size={14} /></span>
                                                </th>
                                                <th className="p-4 text-left cursor-pointer hover:text-white" onClick={() => handleSort('averageScore')}>
                                                    <span className="flex items-center gap-1">Score <ArrowUpDown size={14} /></span>
                                                </th>
                                                <th className="p-4 text-left cursor-pointer hover:text-white" onClick={() => handleSort('lastActivity')}>
                                                    <span className="flex items-center gap-1">Activité <ArrowUpDown size={14} /></span>
                                                </th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {paginatedStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-12 text-center text-slate-500">
                                                        {students.length === 0 ? 'Aucun étudiant assigné' : 'Aucun résultat pour ces filtres'}
                                                    </td>
                                                </tr>
                                            ) : paginatedStudents.map((s: any) => {
                                                const isInactive = s.lastActivity && new Date(s.lastActivity).getTime() < Date.now() - 7 * 86400000;
                                                const isStruggling = s.stats.averageScore < 40;
                                                const tags = studentTags[s.id] || [];

                                                return (
                                                    <tr key={s.id} className={`hover: bg-slate-800/30 transition -colors ${selectedIds.has(s.id) ? 'bg-emerald-500/5' : ''} `}>
                                                        <td className="p-4 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(s.id)}
                                                                onChange={() => toggleSelect(s.id)}
                                                                className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <p className="font-bold text-white">{s.name}</p>
                                                            <p className="text-xs text-slate-500">{s.email}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-wrap gap-1 items-center">
                                                                {isInactive && <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">Inactif</span>}
                                                                {isStruggling && <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">Difficulté</span>}
                                                                {tags.map(tag => (
                                                                    <span key={tag} className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const tag = prompt("Entrez un tag (ex: Priorité, Prêt):");
                                                                        if (tag) toggleTag(s.id, tag);
                                                                    }}
                                                                    className="text-slate-500 hover:text-emerald-400 p-0.5"
                                                                >
                                                                    <Zap size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-bold">
                                                                {s.currentLevel}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${s.stats.averageScore >= 60 ? 'bg-emerald-500' : s.stats.averageScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'} `}
                                                                        style={{ width: `${s.stats.averageScore}% ` }}
                                                                    />
                                                                </div>
                                                                <span className="font-bold">{s.stats.averageScore}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-slate-400 text-xs">
                                                            {s.lastActivity ? new Date(s.lastActivity).toLocaleDateString('fr-FR') : '-'}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => { setSelectedStudent(s); fetchDetailedStudent(s.id); }}
                                                                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center justify-end gap-1 ml-auto"
                                                            >
                                                                Suivi <Eye size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                                        <span className="text-sm text-slate-400">
                                            {filteredStudents.length} résultats • Page {currentPage}/{totalPages}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-900/40">
                                {['À contacter', 'En suivi', 'Autonome', 'Prêt examen'].map(column => {
                                    const columnStudents = filteredStudents.filter(s => {
                                        const tags = (studentTags as any)[s.id] || [];
                                        if (column === 'À contacter') return tags.length === 0 || tags.includes('À contacter');
                                        return tags.includes(column);
                                    });

                                    return (
                                        <div
                                            key={column}
                                            className="flex flex-col gap-4"
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, column)}
                                        >
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em]">{column}</h4>
                                                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">{columnStudents.length}</span>
                                            </div>
                                            <div className="flex-1 space-y-4 min-h-[400px]">
                                                {columnStudents.map(s => (
                                                    <div
                                                        key={s.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, s.id)}
                                                        onClick={() => { setSelectedStudent(s); fetchDetailedStudent(s.id); }}
                                                        className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 cursor-pointer transition-all hover:translate-y-[-4px] shadow-xl group"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <p className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">{s.name}</p>
                                                                <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{s.email}</p>
                                                            </div>
                                                            <span className="bg-slate-900 text-slate-300 px-2 py-1 rounded text-[10px] font-black">{s.currentLevel}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ${s.stats.averageScore >= 60 ? 'bg-emerald-500' : s.stats.averageScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'} `}
                                                                    style={{ width: `${s.stats.averageScore}% ` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400">{s.stats.averageScore}%</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {s.stats.averageScore < 40 && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Alerte</span>}
                                                            {((studentTags as any)[s.id] || []).filter((t: string) => t !== column).map((tag: string) => (
                                                                <span key={tag} className="bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-bold">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'corrections' ? (
                    <div className="space-y-4">
                        {corrections.length === 0 ? (
                            <div className="p-20 text-center text-slate-500 italic bg-[#1E293B]/30 rounded-2xl border border-slate-800">
                                Aucune correction en attente. Bon travail !
                            </div>
                        ) : corrections.map(correction => (
                            <CorrectionCard key={correction.id} correction={correction} onReview={() => setIsCorrectionModalOpen(correction)} />
                        ))}
                    </div>
                ) : activeTab === 'stats' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CoachStatsPanel
                            stats={{
                                totalStudents: students.length,
                                activeStudents: students.filter(s => s.lastActivity.includes('2026')).length,
                                averageScore: Math.round(students.reduce((acc, s) => acc + s.stats.averageScore, 0) / (students.length || 1)),
                                scoreEvolution: 5.2,
                                totalSessions: 124,
                                hoursThisMonth: 12,
                                feedbacksSent: 45,
                                successRate: 88
                            }}
                            performanceHistory={[
                                { month: 'Oct', score: 65 },
                                { month: 'Nov', score: 72 },
                                { month: 'Déc', score: 78 },
                                { month: 'Jan', score: 82 },
                            ]}
                            weeklyActivity={[
                                { day: 'Lun', sessions: 2, corrections: 3 },
                                { day: 'Mar', sessions: 4, corrections: 1 },
                                { day: 'Mer', sessions: 3, corrections: 5 },
                                { day: 'Jeu', sessions: 5, corrections: 2 },
                                { day: 'Ven', sessions: 2, corrections: 4 },
                            ]}
                            levelDistribution={[
                                { level: 'A1', count: students.filter(s => s.currentLevel === 'A1').length },
                                { level: 'A2', count: students.filter(s => s.currentLevel === 'A2').length },
                                { level: 'B1', count: students.filter(s => s.currentLevel === 'B1').length },
                                { level: 'B2', count: students.filter(s => s.currentLevel === 'B2').length },
                            ]}
                        />
                    </div>
                ) : activeTab === 'calendar' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CoachCalendar
                            events={[
                                { id: '1', date: new Date(), startTime: '10:00', endTime: '11:00', type: 'session', title: 'Cours Oral B2', studentName: 'Candidat Test 1' },
                                { id: '2', date: new Date(), startTime: '14:00', endTime: '15:30', type: 'coaching', title: 'Préparation TCF', studentName: 'Candidat Test 2' },
                                { id: '3', date: new Date(new Date().setDate(new Date().getDate() + 1)), startTime: '09:00', endTime: '10:30', type: 'exam', title: 'Examen Blanc CE' },
                            ]}
                            availabilities={availabilities}
                        />
                    </div>
                ) : activeTab === 'messages' ? (
                    <div className="h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <MessagingPanel />
                    </div>
                ) : activeTab === 'validations' ? (
                    <ValidationsTab proofs={proofs} handleValidateProof={handleValidateProof} />
                ) : activeTab === 'profile' ? (
                    <div className="space-y-6">
                        {/* Toast Notification */}
                        {toast && (
                            <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl font-bold shadow-lg ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'} `}>
                                {toast.message}
                            </div>
                        )}

                        {/* Profile Sub-navigation */}
                        <div className="flex flex-wrap gap-2 mb-6 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800 self-start">
                            {[
                                { id: 'identity', label: 'Identité', icon: Award },
                                { id: 'availability', label: 'Calendrier', icon: Clock },
                                { id: 'signature', label: 'Signature', icon: PenTool },
                                { id: 'billing', label: 'Facturation', icon: CreditCard }
                            ].map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setProfileSubTab(sub.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${profileSubTab === sub.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'} `}
                                >
                                    <sub.icon size={16} /> {sub.label}
                                </button>
                            ))}
                        </div>

                        {profileSubTab === 'identity' ? (
                            <div className="space-y-6">
                                {/* Identity Section - Editable */}
                                <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/30 p-8 rounded-2xl border border-indigo-500/30">
                                    <h3 className="font-black text-lg text-white flex items-center gap-2 mb-6">
                                        <Award className="text-indigo-400" size={20} /> Informations d'Identité
                                    </h3>
                                    <div className="flex flex-col md:flex-row items-start gap-6">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-3xl shadow-lg shrink-0">
                                            {profileForm.name?.charAt(0)?.toUpperCase() || 'F'}
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nom complet</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Prénom Nom"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                        value={profileForm.name}
                                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email</label>
                                                    <input
                                                        type="email"
                                                        placeholder="email@exemple.com"
                                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                                                        value={myStats?.profile?.email || ''}
                                                        disabled
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Award size={12} /> {myStats?.profile?.role || 'COACH'}
                                                </span>
                                                <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Users size={12} /> {myStats?.profile?.organization}
                                                </span>
                                                <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Calendar size={12} /> Inscrit le {myStats?.profile?.createdAt ? new Date(myStats.profile.createdAt).toLocaleDateString('fr-FR') : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Administrative Info Form */}
                                <div className="bg-[#1E293B]/50 p-6 rounded-2xl border border-slate-800">
                                    <h3 className="font-black text-lg text-white flex items-center gap-2 mb-6">
                                        <ClipboardList className="text-purple-400" size={20} /> Informations Administratives
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">NDA</label>
                                            <input
                                                type="text"
                                                placeholder="Numéro Déclaration Activité"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                value={profileForm.nda}
                                                onChange={(e) => setProfileForm({ ...profileForm, nda: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Coût horaire (€)</label>
                                            <input
                                                type="number"
                                                placeholder="30.00"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                value={profileForm.hourlyRate}
                                                onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Téléphone</label>
                                            <input
                                                type="tel"
                                                placeholder="+33 6 XX XX XX XX"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                value={profileForm.phone}
                                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Contact associé</label>
                                            <input
                                                type="text"
                                                placeholder="Nom du contact"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                value={profileForm.contactPerson}
                                                onChange={(e) => setProfileForm({ ...profileForm, contactPerson: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Adresse</label>
                                            <input
                                                type="text"
                                                placeholder="Rue, numéro..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                value={profileForm.address}
                                                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Code postal</label>
                                            <input
                                                type="text"
                                                placeholder="75001"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                value={profileForm.postalCode}
                                                onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ville</label>
                                            <input
                                                type="text"
                                                placeholder="Paris"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-indigo-500 focus:outline-none"
                                                value={profileForm.city}
                                                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="mt-6 w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                    </button>
                                </div>

                                {/* Documents Upload Section */}
                                <div className="bg-[#1E293B]/50 p-6 rounded-2xl border border-slate-800">
                                    <h3 className="font-black text-lg text-white flex items-center gap-2 mb-6">
                                        <Download className="text-amber-400" size={20} /> Pièces Jointes
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { type: 'CV', label: 'CV' },
                                            { type: 'DIPLOMA', label: 'Diplôme' },
                                            { type: 'VIGILANCE', label: 'Attestation vigilance' },
                                            { type: 'NDA_DOC', label: 'NDA Document' },
                                            { type: 'KBIS', label: 'KBIS' },
                                            { type: 'CONTRACT', label: 'Contrat sous-traitance' }
                                        ].map(doc => {
                                            const existingDoc = uploadedDocs.find(d => d.type === doc.type);
                                            return (
                                                <div key={doc.type} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-bold text-white text-sm">{doc.label}</p>
                                                        {existingDoc && <CheckCircle2 className="text-emerald-400" size={16} />}
                                                    </div>
                                                    {existingDoc ? (
                                                        <p className="text-xs text-emerald-400 truncate">{existingDoc.filename}</p>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-500">PDF, JPG ou PNG</p>
                                                    )}
                                                    <label className="cursor-pointer mt-2 inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                                                        {existingDoc ? 'Remplacer' : 'Charger'}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleDocumentUpload(file, doc.type);
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : profileSubTab === 'availability' ? (
                            <div className="bg-[#1E293B]/50 p-8 rounded-2xl border border-slate-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-lg text-white flex items-center gap-2">
                                        <Clock className="text-teal-400" size={20} /> Mes Disponibilités
                                    </h3>
                                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                                        <button
                                            onClick={() => setAvailabilityView('weekly')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${(!availabilityView || availabilityView === 'weekly') ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Hebdomadaire
                                        </button>
                                        <button
                                            onClick={() => setAvailabilityView('calendar')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${availabilityView === 'calendar' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Exceptions
                                        </button>
                                    </div>
                                </div>

                                {(!availabilityView || availabilityView === 'weekly') ? (
                                    <div className="space-y-6">
                                        <p className="text-sm text-slate-400">
                                            Définissez vos créneaux récurrents. Ces horaires seront appliqués chaque semaine par défaut.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, idx) => {
                                                const daySlots = (availabilities || []).filter(a => a.dayOfWeek === idx && a.isRecurring);
                                                return (
                                                    <div key={day} className="space-y-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                                                        <p className="text-center font-black text-xs text-slate-500 uppercase">{day}</p>
                                                        <div className="space-y-2">
                                                            {daySlots.map(slot => (
                                                                <div key={slot.id} className="relative group">
                                                                    <div className="w-full p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-[10px] font-bold text-teal-300 text-center">
                                                                        {slot.startTime} - {slot.endTime}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const next = availabilities.filter(a => a.id !== slot.id);
                                                                            saveAvailability(next);
                                                                        }}
                                                                        className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => {
                                                                    // Simplified: add a 9-12 slot for this day
                                                                    const next = [...availabilities, { dayOfWeek: idx, startTime: '09:00', endTime: '12:00', isRecurring: true }];
                                                                    saveAvailability(next);
                                                                }}
                                                                className="w-full p-2 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center justify-center"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-slate-400">
                                                Gérez vos dates spécifiques (congés, créneaux ponctuels, etc.)
                                            </p>
                                            <button
                                                onClick={() => setIsAddSlotModalOpen(true)}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2"
                                            >
                                                <CalendarPlus size={16} /> Ajouter une date
                                            </button>
                                        </div>

                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {(availabilities || []).filter(a => !a.isRecurring && a.date).map(slot => (
                                                <div key={slot.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                                                            <Calendar size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">
                                                                {new Date(slot.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                {slot.startTime} - {slot.endTime}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const next = availabilities.filter(a => a.id !== slot.id);
                                                            saveAvailability(next);
                                                        }}
                                                        className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(availabilities || []).filter(a => !a.isRecurring && a.date).length === 0 && (
                                                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 italic text-sm">
                                                    Aucune exception enregistrée.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : profileSubTab === 'signature' ? (
                            <div className="bg-[#1E293B]/50 p-8 rounded-2xl border border-slate-800 text-center">
                                <h3 className="font-black text-lg text-white flex items-center gap-2 mb-6 justify-center">
                                    <PenTool className="text-rose-400" size={20} /> Signature Électronique
                                </h3>
                                <div className="max-w-md mx-auto aspect-video bg-white rounded-xl border-2 border-slate-700 flex items-center justify-center relative overflow-hidden">
                                    {signature ? (
                                        <img src={signature} alt="Signature" className="max-h-full" />
                                    ) : (
                                        <p className="text-slate-400 italic text-sm">Zone de signature</p>
                                    )}
                                </div>
                                <div className="mt-6 flex justify-center gap-4">
                                    <button
                                        onClick={() => {
                                            // Mock drawing: generate a simple data URL
                                            const mockSig = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
                                            saveSignature(mockSig);
                                        }}
                                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2 rounded-xl transition-all"
                                    >
                                        Générer Signature Auto
                                    </button>
                                    <button
                                        onClick={() => setSignature(null)}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-2 rounded-xl border border-slate-700 transition-all"
                                    >
                                        Effacer
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-4 uppercase font-black tracking-widest">Utilisée pour signer vos factures et les certificats étudiants</p>
                            </div>
                        ) : profileSubTab === 'billing' ? (
                            <div className="bg-[#1E293B]/50 p-8 rounded-2xl border border-slate-800">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="font-black text-lg text-white flex items-center gap-2">
                                        <CreditCard className="text-amber-400" size={20} /> Dashboard de Facturation
                                    </h3>
                                    <button
                                        onClick={() => generateInvoice(new Date().getMonth() + 1, new Date().getFullYear())}
                                        disabled={isGeneratingInvoice}
                                        className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-black px-6 py-2 rounded-xl shadow-lg transition-all"
                                    >
                                        {isGeneratingInvoice ? 'Génération...' : 'Générer Facture ce mois'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                                        <p className="text-xs font-black text-slate-500 uppercase mb-2">Taux Horaire</p>
                                        <p className="text-2xl font-black text-white">{profileForm.hourlyRate || 0} €/h</p>
                                    </div>
                                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                                        <p className="text-xs font-black text-slate-500 uppercase mb-2">Factures en attente</p>
                                        <p className="text-2xl font-black text-white">{invoices.filter(i => i.status === 'DRAFT').length}</p>
                                    </div>
                                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                                        <p className="text-xs font-black text-slate-500 uppercase mb-2">Total encaissé</p>
                                        <p className="text-2xl font-black text-emerald-400">{invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + i.amount, 0)} €</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-800/50 border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <th className="px-6 py-4">N° Facture</th>
                                                <th className="px-6 py-4">Période</th>
                                                <th className="px-6 py-4">Heures</th>
                                                <th className="px-6 py-4">Montant</th>
                                                <th className="px-6 py-4">Statut</th>
                                                <th className="px-6 py-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {invoices.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-sm">Aucune facture générée pour le moment.</td>
                                                </tr>
                                            ) : invoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-white text-sm">{inv.invoiceNumber}</td>
                                                    <td className="px-6 py-4 text-slate-400 text-sm">{new Date(inv.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                                                    <td className="px-6 py-4 text-slate-300 text-sm">{inv.hoursCount} h</td>
                                                    <td className="px-6 py-4 font-black text-white">{inv.amount} €</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'} `}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1 transition-colors">
                                                            <Download size={14} /> PDF
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : activeTab === 'civic' ? (
                    <div className="bg-[#1E293B]/50 rounded-2xl border border-slate-800 p-6">
                        <CivicContentManager />
                    </div>
                ) : null}
            </div>

            {/* Modals */}
            {selectedStudent && (
                <ErrorBoundary>
                    <StudentDetailModal
                        student={selectedStudent}
                        detailedStudent={detailedStudent}
                        onClose={() => setSelectedStudent(null)}
                        onActionCreated={() => fetchDetailedStudent(selectedStudent.id)}
                    />
                </ErrorBoundary>
            )}
            {isCorrectionModalOpen && <CorrectionModal correction={isCorrectionModalOpen} onClose={() => setIsCorrectionModalOpen(null)} onSubmit={handleSubmitCorrection} />}
            {isAssignModalOpen && <AssignStudentModal onClose={() => setIsAssignModalOpen(false)} onSubmit={handleAssignStudent} />}
            {isBulkModalOpen && (
                <BulkFeedbackModal
                    selectedCount={selectedIds.size}
                    feedback={bulkFeedback}
                    setFeedback={setBulkFeedback}
                    onClose={() => setIsBulkModalOpen(false)}
                    onSubmit={handleBulkFeedback}
                    submitting={submitting}
                />
            )}
            {isAddSlotModalOpen && (
                <AddSlotModal
                    slot={newSlot}
                    setSlot={setNewSlot}
                    onClose={() => setIsAddSlotModalOpen(false)}
                    onSubmit={handleAddSlot}
                />
            )}
        </div>
    );
};

const AddSlotModal = ({ slot, setSlot, onClose, onSubmit }: any) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] w-full max-w-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-teal-900/20">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <CalendarPlus className="text-teal-400" size={20} /> Ajouter une disponibilité
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Heure Début</label>
                            <input
                                type="time"
                                value={slot.startTime}
                                onChange={e => setSlot({ ...slot, startTime: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 ring-teal-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Heure Fin</label>
                            <input
                                type="time"
                                value={slot.endTime}
                                onChange={e => setSlot({ ...slot, endTime: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 ring-teal-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                            <div>
                                <p className="text-sm font-bold text-white">Récurrent</p>
                                <p className="text-[10px] text-slate-500">Répéter chaque semaine</p>
                            </div>
                            <button
                                onClick={() => setSlot({ ...slot, isRecurring: !slot.isRecurring })}
                                className={`w-12 h-6 rounded-full transition-all relative ${slot.isRecurring ? 'bg-teal-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${slot.isRecurring ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {slot.isRecurring ? (
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Jour de la semaine</label>
                                <select
                                    value={slot.dayOfWeek}
                                    onChange={e => setSlot({ ...slot, dayOfWeek: parseInt(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 ring-teal-500 outline-none appearance-none"
                                >
                                    {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((d, i) => (
                                        <option key={i} value={i}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Date précise</label>
                                <input
                                    type="date"
                                    value={slot.date}
                                    onChange={e => setSlot({ ...slot, date: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 ring-teal-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onSubmit}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
                    >
                        Enregistrer le créneau <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const KPICard = ({ label, value, icon, color, onClick, badge }: any) => (
    <button
        onClick={onClick}
        className={`bg-[#1E293B]/50 border border-slate-800 p-4 rounded-xl text-left transition-all hover:scale-[1.02] ${onClick ? 'cursor-pointer' : 'cursor-default'} `}
    >
        <div className="flex items-center justify-between mb-2">
            <span className={`text-${color}-500`}>{icon}</span>
            {badge && value > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
        </div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
    </button>
);

const TabButton = ({ active, onClick, label, badge, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${active ? 'bg-emerald-600 text-white' : 'bg-[#1E293B] text-slate-400 hover:text-white'} `}
    >
        {Icon && <Icon size={16} />}
        {label}
        {badge && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
    </button>
);

const CorrectionCard = ({ correction, onReview }: any) => (
    <div className="bg-[#1E293B] border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
            <h4 className="font-bold text-white">Session #{correction.id.substring(0, 8)}</h4>
            <p className="text-sm text-slate-400">{correction.user?.name || 'Inconnu'}</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <div className="text-xl font-black text-emerald-400">{correction.score || '-'}</div>
                <div className="text-[10px] text-slate-500">Score IA</div>
            </div>
            <button onClick={onReview} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
                Double-Check
            </button>
        </div>
    </div>
);

const StudentDetailModal = ({ student, detailedStudent, onClose, onActionCreated }: any) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'pedagogical' | 'parcours' | 'examens'>('stats');
    const [feedback, setFeedback] = useState('');
    const [topic, setTopic] = useState('Grammaire');
    const [submitting, setSubmitting] = useState(false);
    const { token } = useAuth();

    // Exam history state
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [learningPath, setLearningPath] = useState<any>(null);

    // Fetch sessions when 'examens' tab is selected
    useEffect(() => {
        if (activeTab === 'examens' && student?.id && token) {
            setLoadingSessions(true);
            fetch(`${API_URL}/coach/students/${student.id}/sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setSessions(Array.isArray(data) ? data : []))
                .catch(err => console.error(err))
                .finally(() => setLoadingSessions(false));
        }
    }, [activeTab, student?.id, token]);

    // Fetch learning path when 'parcours' tab is selected
    useEffect(() => {
        if (activeTab === 'parcours' && student?.id && token && !learningPath) {
            fetch(`${API_URL}/coach/students/${student.id}/learning-path`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setLearningPath(data))
                .catch(err => console.error(err));
        }
    }, [activeTab, student?.id, token, learningPath]);

    // Fetch session detail
    const fetchSessionDetail = async (sessionId: string) => {
        if (!token || !student?.id) return;
        try {
            const res = await fetch(`${API_URL}/coach/students/${student.id}/sessions/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSelectedSession(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const isLoading = !detailedStudent;

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-[#1E293B] p-8 rounded-2xl border border-slate-800 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-white font-bold">Chargement des détails...</p>
                </div>
            </div>
        );
    }

    const data = detailedStudent; // No fallback to partial student to avoid crashes
    const skills = data.levelGauge || {};

    // Adapt charts data depending on available keys
    const chartData = skills.CO !== undefined ? [
        { subject: 'CO', A: skills.CO || 0 },
        { subject: 'CE', A: skills.CE || 0 },
        { subject: 'EO', A: skills.EO || 0 },
        { subject: 'EE', A: skills.EE || 0 },
    ] : [];

    const handleSubmitAction = async (type: 'FEEDBACK' | 'ASSIGNMENT') => {
        if (!token) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/coach/students/${student.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    type,
                    content: type === 'FEEDBACK' ? feedback : topic
                })
            });
            if (res.ok) {
                if (type === 'FEEDBACK') setFeedback('');
                onActionCreated(); // Trigger refresh
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadCertificate = async () => {
        console.log('[PDF Download] diagnosticSession:', data?.diagnosticSession);
        if (!token) {
            alert("Session expirée. Veuillez vous reconnecter.");
            return;
        }
        if (!data?.diagnosticSession?.id) {
            alert("Aucune session de diagnostic complète trouvée pour cet étudiant.");
            return;
        }
        try {
            const url = `${API_URL}/certificate/diagnostic/${data.diagnosticSession.id}`;
            console.log('[PDF Download] Fetching:', url);
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('[PDF Download] Response status:', res.status);
            if (res.ok) {
                const blob = await res.blob();
                const objUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objUrl;
                a.download = `attestation-${student.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(objUrl);
            } else {
                const errorText = await res.text();
                console.error('[PDF Download] Error:', errorText);
                alert(`Erreur ${res.status}: ${errorText || "Impossible de télécharger l'attestation."}`);
            }
        } catch (error) {
            console.error('[PDF Download] Exception:', error);
            alert("Erreur réseau. Vérifiez votre connexion ou le serveur.");
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1E293B] w-full max-w-4xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xl">
                            {student.name?.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">{student.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Mail size={14} /> {student.email}
                                <span className="w-1 h-1 rounded-full bg-slate-600 mx-1" />
                                <span className="font-bold text-slate-300">{student.currentLevel}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="text-slate-500 hover:text-white" />
                    </button>
                </div>

                {/* Local Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'stats' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Analyse
                    </button>
                    <button
                        onClick={() => setActiveTab('examens')}
                        className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'examens' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Examens ({sessions.length || student?.examSessions?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('pedagogical')}
                        className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'pedagogical' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Suivi
                    </button>
                    <button
                        onClick={() => setActiveTab('parcours')}
                        className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'parcours' ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Parcours
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {activeTab === 'stats' ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="h-[280px] bg-slate-900/50 rounded-2xl border border-slate-800/50 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={chartData}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                                            <Radar dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Objectif</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">
                                                {detailedStudent?.objective === 'NATURALIZATION' ? '🇫🇷' :
                                                    detailedStudent?.objective === 'RESIDENCY_10_YEAR' ? '🪪' :
                                                        detailedStudent?.objective === 'CANADA_IMMIGRATION' ? '🇨🇦' : '🆔'}
                                            </span>
                                            <div>
                                                <p className="text-sm font-bold text-white leading-tight">
                                                    {detailedStudent?.objective === 'NATURALIZATION' ? 'Nationalité' :
                                                        detailedStudent?.objective === 'RESIDENCY_10_YEAR' ? 'Résidence (10 ans)' :
                                                            detailedStudent?.objective === 'CANADA_IMMIGRATION' ? 'Canada' : 'Séjour Pluriannuel'}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500">Cible {detailedStudent?.targetLevel || 'B2'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/50">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Progression</p>
                                        <div className="flex items-end gap-2">
                                            <p className={`text-2xl font-black ${data.progression >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {data.progression > 0 ? '+' : ''}{data.progression}%
                                            </p>
                                            {data.progression !== 0 && (data.progression > 0 ? <TrendingUp size={20} className="text-emerald-500 mb-1" /> : <TrendingDown size={20} className="text-rose-500 mb-1" />)}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/50">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">XP Cumulée</p>
                                        <p className="text-2xl font-black text-amber-400">{data.xp} pts</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/50">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Dernier Score</p>
                                        <p className="text-2xl font-black text-white">{data.lastScore || 0}%</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/50">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Série Max</p>
                                        <p className="text-2xl font-black text-orange-400">{data.streakMax}j</p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-black text-white flex items-center gap-2">
                                            <Target className="text-emerald-400" size={20} />
                                            Résultats du Diagnostic
                                        </h4>
                                        <button
                                            onClick={handleDownloadCertificate}
                                            disabled={!data?.diagnosticSession?.id}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${data?.diagnosticSession?.id
                                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                }`}
                                            title={!data?.diagnosticSession?.id ? "Aucune session de diagnostic complète" : "Télécharger l'attestation PDF"}
                                        >
                                            <Download size={14} /> Attestation PDF
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-500" /> Points Forts
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.strengths?.map((s: string) => (
                                            <span key={s} className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                                {s}
                                            </span>
                                        )) || <span className="text-xs text-slate-500 italic">Analyse en cours...</span>}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                        <TrendingDown size={16} className="text-rose-500" /> Axes de Travail
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.weaknesses?.map((w: string) => (
                                            <span key={w} className="bg-rose-500/10 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-500/20">
                                                {w}
                                            </span>
                                        )) || <span className="text-xs text-slate-500 italic">Analyse en cours...</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'examens' ? (
                        <div className="space-y-4">
                            {/* Session detail view */}
                            {selectedSession ? (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setSelectedSession(null)}
                                        className="text-sm text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                                    >
                                        ← Retour à la liste
                                    </button>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-black text-white text-lg">{selectedSession.type}</h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedSession.score >= 60 ? 'bg-emerald-500/20 text-emerald-400' : selectedSession.score >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                Score: {selectedSession.score}%
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-4">
                                            {selectedSession.correctAnswers}/{selectedSession.totalQuestions} réponses correctes
                                        </p>
                                        <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                                            {selectedSession.questions?.map((q: any, idx: number) => (
                                                <div key={q.id} className={`p-4 rounded-xl border ${q.isCorrect ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/30'}`}>
                                                    <div className="flex items-start gap-3">
                                                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${q.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                            {q.isCorrect ? '✓' : '✗'}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-white mb-2">Q{idx + 1}. {q.text}</p>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <span className="text-slate-500">Réponse donnée:</span>
                                                                    <span className={`ml-2 font-bold ${q.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                        {q.userAnswer || '-'}
                                                                    </span>
                                                                </div>
                                                                {!q.isCorrect && (
                                                                    <div>
                                                                        <span className="text-slate-500">Bonne réponse:</span>
                                                                        <span className="ml-2 font-bold text-emerald-400">{q.correctAnswer}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Session list */
                                <>
                                    {loadingSessions ? (
                                        <div className="text-center py-12">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                            <p className="text-slate-400 mt-4">Chargement des sessions...</p>
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-bold">Aucune session d'examen</p>
                                            <p className="text-sm">Cet étudiant n'a pas encore passé d'examen.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {sessions.map(session => (
                                                <div key={session.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {session.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white">{session.type || 'Examen'}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {new Date(session.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                {session.duration && ` • ${session.duration} min`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className={`text-lg font-black ${(session.humanGrade || session.score || 0) >= 60 ? 'text-emerald-400' : (session.humanGrade || session.score || 0) >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                                {session.humanGrade || session.score || 0}%
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-bold">
                                                                {session.humanGrade ? 'Note coach' : 'Score IA'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => fetchSessionDetail(session.id)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                                                        >
                                                            Voir détails
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : activeTab === 'pedagogical' ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Action Form */}
                            <div className="space-y-6">
                                <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 space-y-4">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        <Mail size={18} className="text-indigo-400" /> Laisser un Feedback
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                            {FEEDBACK_TEMPLATES.slice(0, 6).map(tpl => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={() => setFeedback(tpl.text)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all"
                                                    title={tpl.text}
                                                >
                                                    <span>{tpl.icon}</span> {tpl.title}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Encouragements, conseils méthodologiques..."
                                            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm focus:ring-2 ring-indigo-500 focus:outline-none text-white resize-none"
                                        />
                                    </div>
                                    <button
                                        disabled={!feedback || submitting}
                                        onClick={() => handleSubmitAction('FEEDBACK')}
                                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                                    >
                                        Envoyer le Feedback
                                    </button>
                                </div>

                                <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 space-y-4">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        <ClipboardList size={18} className="text-emerald-400" /> Assigner un Module
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Grammaire', 'Lexique', 'Compréhension Orale', 'Compréhension Écrite', 'Expression Orale', 'Expression Écrite'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTopic(t)}
                                                className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all ${topic === t ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        disabled={submitting}
                                        onClick={() => handleSubmitAction('ASSIGNMENT')}
                                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                                    >
                                        Assigner le Module
                                    </button>
                                </div>
                            </div>

                            {/* Activities Timeline */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-white flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className="text-amber-400" /> Historique du Suivi
                                </h4>
                                <div className="space-y-3">
                                    {data.pedagogicalActions?.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 italic text-sm border-2 border-dashed border-slate-800 rounded-2xl">
                                            Aucune action pédagogique enregistrée.
                                        </div>
                                    ) : data.pedagogicalActions?.map((action: any) => (
                                        <div key={action.id} className="relative pl-6 pb-4 border-l border-slate-800 last:pb-0">
                                            <div className={`absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full ${action.type === 'FEEDBACK' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                                            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${action.type === 'FEEDBACK' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {action.type === 'FEEDBACK' ? 'Message' : 'Assignation'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">{new Date(action.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed italic">
                                                    {action.type === 'ASSIGNMENT' ? `Module de pratique : ${action.content}` : `« ${action.content} »`}
                                                </p>
                                                <div className="mt-2 text-[10px] text-slate-500 font-medium">
                                                    Par {action.coach?.name || 'Coach'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Diagnostic Section */}
                            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-black text-white text-lg flex items-center gap-3">
                                        <Target className="text-amber-400" /> Test de Positionnement
                                    </h4>
                                    {data.diagnosticSession && (
                                        <span className="text-xs text-slate-500">
                                            Complété le {new Date(data.diagnosticSession.createdAt).toLocaleDateString('fr-FR')}
                                        </span>
                                    )}
                                </div>

                                {data.diagnosticSession ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Score Initial</p>
                                            <p className="text-3xl font-black text-white">{data.diagnosticSession.score} <span className="text-sm text-slate-600">/ 999</span></p>
                                        </div>
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Niveau Estimé</p>
                                            <p className="text-3xl font-black text-amber-400">{data.diagnosticSession.estimatedLevel}</p>
                                        </div>
                                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Score Confiance IA</p>
                                            <p className="text-3xl font-black text-emerald-400">{data.learningPath?.confidence}%</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-500 italic text-sm">
                                        Diagnostic non complété ou données indisponibles.
                                    </div>
                                )}
                            </div>

                            {/* Hours Progress Section */}
                            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/30">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-black text-white text-lg flex items-center gap-3">
                                        <BookOpen className="text-indigo-400" /> Progression Horaire
                                    </h4>
                                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold">
                                        {data.learningPath?.currentLevel || 'A1'} → {data.learningPath?.targetLevel || 'B2'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Heures Suggérées</p>
                                        <p className="text-2xl font-black text-indigo-400">{data.learningPath?.suggestedHours || 0}h</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Selon norme CECRL</p>
                                    </div>
                                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Heures Validées</p>
                                        <p className="text-2xl font-black text-emerald-400">{data.learningPath?.validatedHours || 0}h</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Sessions + études</p>
                                    </div>
                                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Heures Restantes</p>
                                        <p className="text-2xl font-black text-amber-400">{data.learningPath?.hoursRemaining || 0}h</p>
                                        <p className="text-[10px] text-slate-500 mt-1">Pour atteindre l'objectif</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold">Progression globale</span>
                                        <span className="text-white font-black">{data.learningPath?.progressPercent || 0}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
                                            style={{ width: `${data.learningPath?.progressPercent || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Roadmap Session */}
                            <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                                <h4 className="font-black text-white text-lg flex items-center gap-3 mb-6">
                                    <TrendingUp className="text-emerald-400" /> Plan d'Apprentissage IA
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {data.learningPath?.roadmap?.map((module: any, idx: number) => (
                                        <div key={module.id} className={`p-4 rounded-xl border transition-all ${module.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                            module.status === 'current' ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/50' :
                                                'bg-slate-950/50 border-slate-800 opacity-60'
                                            }`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${module.status === 'completed' ? 'bg-emerald-500 text-white' :
                                                    module.status === 'current' ? 'bg-indigo-500 text-white' :
                                                        'bg-slate-800 text-slate-500'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                {module.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> :
                                                    module.status === 'current' ? <Zap size={16} className="text-indigo-500" /> :
                                                        <Lock size={16} className="text-slate-600" />}
                                            </div>
                                            <h5 className="font-bold text-sm text-white mb-1 leading-tight">{module.title}</h5>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{module.topic}</p>

                                            {module.status !== 'locked' && (
                                                <div className="mt-3">
                                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${module.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                            style={{ width: `${module.progress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-right mt-1 font-bold text-slate-400">{module.progress}%</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CorrectionModal = ({ correction, onSubmit, onClose }: any) => {
    const [grade, setGrade] = useState(correction.score || 0);
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1E293B] w-full max-w-md rounded-2xl border border-slate-800 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Validation Note IA</h3>
                    <button onClick={onClose}><X className="text-slate-500 hover:text-white" /></button>
                </div>
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-slate-900 p-4 rounded-xl text-center opacity-50">
                        <div className="text-2xl font-black text-slate-500">{correction.score || '-'}</div>
                        <div className="text-xs text-slate-600">Note IA</div>
                    </div>
                    <div className="flex-1 bg-emerald-900/20 p-4 rounded-xl text-center border border-emerald-500/30">
                        <input type="number" className="bg-transparent w-full text-2xl font-black text-emerald-400 text-center focus:outline-none" value={grade} onChange={e => setGrade(Number(e.target.value))} />
                        <div className="text-xs text-emerald-600">Votre Note</div>
                    </div>
                </div>
                <button onClick={() => onSubmit(correction.id, grade)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">
                    Valider
                </button>
            </div>
        </div>
    );
};

const AssignStudentModal = ({ onClose, onSubmit }: any) => {
    const [email, setEmail] = useState('');
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E293B] w-full max-w-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                    <h3 className="text-xl font-black text-white">Ajouter un étudiant</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-5">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Invitation</p>
                        <p className="text-sm text-slate-300">Entrez l'email du candidat pour l'associer à votre espace de suivi.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Email du candidat</label>
                        <input
                            type="email"
                            placeholder="candidat@exemple.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-4 text-white focus:ring-2 ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => onSubmit(email)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                        Envoyer l'invitation <UserPlus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const BulkFeedbackModal = ({ selectedCount, feedback, setFeedback, onClose, onSubmit, submitting }: any) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#1E293B] w-full max-w-lg rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-indigo-900/20">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Mail className="text-indigo-400" /> Feedback Groupé
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                    <X size={20} />
                </button>
            </div>
            <div className="p-6 space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Impact</p>
                    <p className="text-sm text-white font-medium">Ce message sera envoyé individuellement à <span className="text-indigo-400 font-black">{selectedCount} étudiants</span>.</p>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-widest">Votre Message</label>
                    <textarea
                        rows={6}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Ex: Excellent travail sur le dernier module ! Continuez ainsi..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 ring-indigo-500 outline-none resize-none text-sm leading-relaxed"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={submitting || !feedback.trim()}
                        className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? 'Envoi...' : 'Envoyer Maintenant'} <Target size={18} />
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Final helper component for validations
const ValidationsTab = ({ proofs, handleValidateProof }: any) => {
    const [search, setSearch] = useState('');
    const [selectedProof, setSelectedProof] = useState<any>(null);
    const [feedback, setFeedback] = useState('');

    const filtered = (proofs || []).filter((p: any) => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.user?.name.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Award className="text-indigo-500" size={32} />
                        Validation des Preuves
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Vérifiez les compétences acquises par vos étudiants.</p>
                </div>

                <div className="w-full md:w-64">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Chercher un étudiant..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:ring-2 ring-indigo-500 outline-none transition-all text-white"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-32 bg-slate-900/30 rounded-[3rem] border-2 border-slate-800 border-dashed">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400">Aucune preuve en attente</h3>
                    <p className="text-slate-600 mt-2">Revenez plus tard quand vos étudiants auront soumis leurs travaux.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filtered.map((proof: any) => (
                        <div key={proof.id} className="bg-[#1E293B]/80 backdrop-blur-xl rounded-[2rem] border border-slate-800 p-8 hover:border-indigo-500/30 transition-all group overflow-hidden relative">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors capitalize">{proof.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-lg">{proof.type}</span>
                                            <span className="text-[10px] text-slate-500 font-bold">•</span>
                                            <span className="text-[10px] text-slate-500 font-bold">{new Date(proof.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">{proof.description}</p>

                            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl mb-6 border border-slate-800/50">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                    {proof.user?.name?.[0] || 'U'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-white">{proof.user?.name}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{proof.user?.currentLevel}</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                                    <Zap className="text-amber-500" size={12} />
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">+20 XP</span>
                                </div>
                            </div>

                            {selectedProof?.id === proof.id ? (
                                <div className="space-y-4 pt-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                                    <textarea
                                        placeholder="Note pour l'étudiant..."
                                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white resize-none h-24 focus:ring-2 ring-indigo-500 outline-none"
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
                                            <CheckCircle2 size={18} /> Valider
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleValidateProof(proof.id, 'REJECTED', 0, feedback);
                                                setSelectedProof(null);
                                                setFeedback('');
                                            }}
                                            className="flex-1 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <X size={18} /> Rejeter
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
                                            Pièce jointe
                                        </a>
                                    )}
                                    <button
                                        onClick={() => setSelectedProof(proof)}
                                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        Examiner <ArrowUpDown size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoachDashboard;
