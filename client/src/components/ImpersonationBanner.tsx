import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function ImpersonationBanner() {
    const { user, logout } = useAuth();

    if (!user?.isImpersonated) return null;

    const handleStopImpersonation = () => {
        logout();
        window.location.assign('/login');
    };

    return (
        <div className="bg-amber-600 text-white px-4 py-2 sticky top-0 z-[9999] flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-1.5 rounded-lg animate-pulse">
                    <AlertTriangle size={18} className="text-white" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="font-bold text-sm tracking-wide">MODE impersonnation ACTIF</span>
                    <span className="hidden md:block w-px h-3 bg-white/30" />
                    <span className="text-sm opacity-90">
                        Vous agissez en tant que <span className="font-black underline italic decoration-amber-100/50">{user.name}</span> ({user.role})
                    </span>
                </div>
            </div>

            <button
                onClick={handleStopImpersonation}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/20 active:scale-95"
            >
                <LogOut size={14} />
                Quitter et revenir
            </button>
        </div>
    );
}
