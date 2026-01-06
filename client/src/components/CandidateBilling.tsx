
import React from 'react';
import { CreditCard, Download, FileText, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CandidateBillingProps {
    userId?: string;
}

export const CandidateBilling: React.FC<CandidateBillingProps> = ({ userId }) => {
    const { token, organization } = useAuth();
    const [invoices, setInvoices] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchHistory = async () => {
            if (!token || !organization?.id) return;
            try {
                const res = await fetch(`/api/payments/history`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ orgId: organization.id, userId })
                });
                if (res.ok) {
                    setInvoices(await res.json());
                }
            } catch (e) {
                console.error("Error fetching billing:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [token, organization?.id]);

    if (isLoading) return <div className="p-20 text-center animate-pulse text-slate-500">Chargement des données de facturation...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                        <CreditCard className="text-amber-500" />
                    </div>
                    Historique de Facturation
                </h2>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Solde Actuel</p>
                    <p className="text-xl font-black dark:text-white">{organization?.availableCredits || 0} 🪙</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Montant / Crédits</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Statut</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">Aucune transaction trouvée.</td>
                                </tr>
                            ) : invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${inv.type === 'RECHARGE' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            <FileText size={14} />
                                        </div>
                                        {inv.type === 'RECHARGE' ? 'Recharge de crédits' : 'Utilisation'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                                        {inv.type === 'RECHARGE' ? '+' : '-'}{inv.amount} 🪙
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            Complété
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.type === 'RECHARGE' && (
                                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-xs inline-flex items-center gap-1 transition-colors">
                                                <Download size={14} /> Reçu
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap size={120} />
                </div>
                <div className="relative z-10 max-w-lg">
                    <h4 className="text-2xl font-black mb-2">Besoin de plus de crédits ?</h4>
                    <p className="text-indigo-100 mb-6 font-medium">Boostez votre préparation avec nos packs intensifs et accédez à des examens blancs illimités.</p>
                    <button className="bg-white text-indigo-600 font-black px-8 py-3 rounded-2xl shadow-xl shadow-indigo-900/40 hover:-translate-y-1 transition-all">
                        Voir les Offres
                    </button>
                </div>
            </div>
        </div>
    );
};
