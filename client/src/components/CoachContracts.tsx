import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Calendar, Clock, Banknote, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CoachContracts() {
    const { user, token } = useAuth();
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            if (!user?.id || !token) return;
            try {
                const res = await fetch(`http://localhost:3333/contracts/user/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setContracts(await res.json());
                }
            } catch (err) {
                console.error("Error fetching coach contracts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, [user?.id, token]);

    if (loading) {
        return <div className="py-20 text-center text-slate-400">Chargement de vos contrats...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <FileText className="text-blue-600" size={24} /> Mes Contrats de Prestation
                </h2>
            </div>

            {contracts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 border border-slate-100 dark:border-slate-800 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <ShieldCheck size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Vous n'avez aucun contrat actif pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contracts.map((contract) => (
                        <motion.div
                            key={contract.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FileText size={80} />
                            </div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest mb-2 inline-block">
                                        {contract.status === 'ACTIVE' ? 'Contrat Actif' : 'Terminé'}
                                    </span>
                                    <h3 className="text-xl font-bold dark:text-white">{contract.organization?.name}</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{contract.hourlyRate}€</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Taux horaire</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Calendar size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Période</span>
                                    </div>
                                    <div className="text-xs font-bold dark:text-slate-200">
                                        {new Date(contract.startDate).toLocaleDateString()} - {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Indéfini'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Clock size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Volume</span>
                                    </div>
                                    <div className="text-xs font-bold dark:text-slate-200">
                                        {contract.totalHours} heures prévues
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t dark:border-slate-800">
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                    <Banknote size={18} /> Valeur estimée : {(contract.hourlyRate * contract.totalHours).toLocaleString()}€
                                </div>
                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                    <AlertCircle size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
