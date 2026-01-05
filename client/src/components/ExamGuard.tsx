import React, { useEffect, useState } from 'react';

export const ExamGuard: React.FC<{ children: React.ReactNode; onWarningsUpdate?: (count: number) => void }> = ({ children, onWarningsUpdate }) => {
    const [warnings, setWarnings] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (!isLocked) return;

        // 1. Détection du changement d'onglet (Visibility API)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings((prev) => {
                    const newVal = prev + 1;
                    if (onWarningsUpdate) onWarningsUpdate(newVal);
                    return newVal;
                });
                alert("Attention : Le changement d'onglet est interdit pendant l'examen !");
            }
        };

        // 2. Blocage du clic droit (anti-copier/coller)
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();

        // 3. Détection de la sortie du mode plein écran
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                alert("Vous devez rester en mode plein écran pour valider l'examen.");
                // Optionally force back or count warning
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [isLocked, onWarningsUpdate]);

    const enterFullScreen = () => {
        document.documentElement.requestFullscreen().catch(err => {
            console.error("Error attempting to enable fullscreen:", err);
        });
        setIsLocked(true);
    };

    if (!isLocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 dark:bg-slate-950 p-6 text-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-800 transition-colors">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Mode Examen Sécurisé</h2>
                    <div className="mb-6 space-y-3 text-left">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                            <span>📱</span>
                            <p>Le mode plein écran est obligatoire.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-300">
                            <span>🚫</span>
                            <p>Changer d'onglet ou quitter la fenêtre génère un avertissement.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                            <span>⚠️</span>
                            <p>3 avertissements = Session marquée comme suspecte.</p>
                        </div>
                    </div>

                    <button
                        onClick={enterFullScreen}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Démarrer l'Examen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className={`px-4 py-2 rounded-full text-sm font-bold border shadow-lg flex items-center gap-2 ${warnings === 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    warnings < 3 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-red-100 text-red-800 border-red-200 animate-pulse'
                    }`}>
                    <span className="text-lg">{warnings < 3 ? '🛡️' : '🚨'}</span>
                    <span>Avertissements : {warnings} / 3</span>
                </div>
            </div>
            {children}
        </div>
    );
};
