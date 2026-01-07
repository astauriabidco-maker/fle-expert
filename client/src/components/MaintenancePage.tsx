
import { Settings, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background Animations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse decoration-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full text-center relative z-10"
            >
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="w-24 h-24 bg-gradient-to-tr from-amber-500 to-amber-200 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/20"
                        >
                            <Settings className="w-12 h-12 text-slate-900" />
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 border-4 border-[#0F172A] rounded-full flex items-center justify-center text-amber-500"
                        >
                            <Clock className="w-5 h-5" />
                        </motion.div>
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                    Maintenance en <span className="text-amber-500">cours</span>
                </h1>

                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    Nous mettons à jour la plateforme pour vous offrir une meilleure expérience.
                    L'accès est temporairement restreint. Nous revenons très vite !
                </p>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-xl mb-8 flex items-start gap-4 text-left">
                    <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-white mb-1">Status du système</h4>
                        <p className="text-sm text-slate-400">
                            Les serveurs sont en cours d'optimisation. Vos données sont en sécurité et votre progression est sauvegardée.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Mise à jour planifiée en cours
                </div>
            </motion.div>
        </div>
    );
}
