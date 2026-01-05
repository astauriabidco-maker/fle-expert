
import React from 'react';
import { CreditCard, Download, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const CandidateBilling = () => {
    const { user } = useAuth();

    // Mock data for billing history (since backend might not have it fully exposed yet)
    // In a real scenario, fetch from /api/payments/history
    const invoices = [
        { id: 'INV-001', date: '2025-12-15', item: 'Pack Starter (1000 Crédits)', amount: 100.00, status: 'PAID' },
        { id: 'INV-002', date: '2026-01-02', item: 'Pack Pro (5000 Crédits)', amount: 450.00, status: 'PAID' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    <CreditCard className="text-amber-500" /> Mes Factures & Paiements
                </h2>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Libellé</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Montant</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {new Date(inv.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400" />
                                        {inv.item}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                                        {inv.amount.toFixed(2)} €
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            Payé
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-xs inline-flex items-center gap-1 transition-colors">
                                            <Download size={14} /> Télécharger
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <FileText size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Besoin d'aide ?</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">Pour toute question concernant votre facturation, contactez support@preptef.com</p>
                </div>
            </div>
        </div>
    );
};
