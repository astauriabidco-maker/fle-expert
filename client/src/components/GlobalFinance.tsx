import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    CreditCard,
    DollarSign,
    Download,
    Search,
    TrendingUp,
    FileText,
    Building2
} from 'lucide-react';

const API_URL = 'http://localhost:3333/admin';

export default function GlobalFinance() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<'transactions' | 'invoices'>('transactions');
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [stats, setStats] = useState({ revenue: 0, pending: 0, totalCredits: 0 });

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            if (activeTab === 'transactions') {
                const res = await fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setTransactions(data);
                    // Calc stats
                    const totalCredits = data.reduce((acc: number, t: any) => acc + (t.amount > 0 ? t.amount : 0), 0);
                    setStats(s => ({ ...s, totalCredits }));
                }
            } else {
                const res = await fetch(`${API_URL}/invoices`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    setInvoices(data);
                    // Calc stats
                    const revenue = data.reduce((acc: number, i: any) => acc + (i.amount || 0), 0);
                    const pending = data.filter((i: any) => i.status === 'DRAFT' || i.status === 'PENDING').length;
                    setStats(s => ({ ...s, revenue, pending }));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = (activeTab === 'transactions' ? transactions : invoices).filter((item: any) => {
        const q = searchQuery.toLowerCase();
        if (activeTab === 'transactions') {
            return item.organization?.name?.toLowerCase().includes(q) || item.type?.toLowerCase().includes(q);
        } else {
            return item.coach?.name?.toLowerCase().includes(q) || item.invoiceNumber?.toLowerCase().includes(q);
        }
    });

    const handleExportCSV = () => {
        if (!filteredData.length) return;

        let headers: string[] = [];
        let rows: string[][] = [];
        let filename = '';

        if (activeTab === 'transactions') {
            headers = ['Date', 'Organisation', 'Type', 'Montant'];
            rows = filteredData.map((t: any) => [
                new Date(t.createdAt).toLocaleDateString('fr-FR'),
                t.organization?.name || 'Inconnu',
                t.type,
                `${t.amount}`
            ]);
            filename = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            headers = ['Date', 'Numéro', 'Formateur', 'Email', 'Heures', 'Statut', 'Montant'];
            rows = filteredData.map((i: any) => [
                new Date(i.createdAt).toLocaleDateString('fr-FR'),
                i.invoiceNumber,
                i.coach?.name || 'Inconnu',
                i.coach?.email || '',
                `${i.hoursCount}`,
                i.status,
                `${i.amount}`
            ]);
            filename = `factures_export_${new Date().toISOString().split('T')[0]}.csv`;
        }

        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Total Crédits Distribués</p>
                        <p className="text-2xl font-black text-white">{stats.totalCredits.toLocaleString()} 🪙</p>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Volume Facturé</p>
                        <p className="text-2xl font-black text-white">{stats.revenue.toLocaleString()} €</p>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase">Factures en Attente</p>
                        <p className="text-2xl font-black text-white">{stats.pending}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'transactions' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <CreditCard size={16} /> Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'invoices' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <FileText size={16} /> Factures Formateurs
                    </button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder={activeTab === 'transactions' ? "Rechercher une organisation..." : "Rechercher un formateur..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 ring-blue-500/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                        title="Exporter en CSV"
                    >
                        <Download size={16} /> <span className="hidden md:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800">
                        <tr>
                            {activeTab === 'transactions' ? (
                                <>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Organisation</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4 text-right">Montant</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Numéro</th>
                                    <th className="p-4">Formateur</th>
                                    <th className="p-4">Heures</th>
                                    <th className="p-4">Statut</th>
                                    <th className="p-4 text-right">Montant</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">Chargement...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucune donnée trouvée.</td></tr>
                        ) : filteredData.map((item: any, i: number) => (
                            <tr key={item.id || i} className="hover:bg-slate-800/50 transition-colors">
                                {activeTab === 'transactions' ? (
                                    <>
                                        <td className="p-4 text-slate-500 font-mono text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-white flex items-center gap-2">
                                            <Building2 size={16} className="text-slate-500" />
                                            {item.organization?.name || 'Inconnu'}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-slate-800 px-2 py-1 rounded text-xs font-bold border border-slate-700">{item.type}</span>
                                        </td>
                                        <td className={`p-4 text-right font-mono font-bold ${item.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {item.amount > 0 ? '+' : ''}{item.amount} 🪙
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 text-slate-500 font-mono text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-mono text-xs text-slate-400">{item.invoiceNumber}</td>
                                        <td className="p-4 font-bold text-white">{item.coach?.name}</td>
                                        <td className="p-4 text-slate-400">{item.hoursCount}h</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${item.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                                                item.status === 'SENT' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-white">
                                            {item.amount.toFixed(2)} €
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
