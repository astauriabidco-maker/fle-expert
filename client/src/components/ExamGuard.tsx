import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, Shield, ShieldOff, Lock, Eye, Keyboard, Copy, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ViolationType {
    type: 'TAB_CHANGE' | 'RIGHT_CLICK' | 'FULLSCREEN_EXIT' | 'KEYBOARD_SHORTCUT' | 'COPY_PASTE' | 'DEVTOOLS' | 'WINDOW_BLUR';
    timestamp: Date;
    details?: string;
}

interface ExamGuardProps {
    children: React.ReactNode;
    onWarningsUpdate?: (count: number) => void;
    onTerminate?: () => void;
    sessionId?: string;
    token?: string;
}

export const ExamGuard: React.FC<ExamGuardProps> = ({
    children,
    onWarningsUpdate,
    onTerminate,
    sessionId,
    token
}) => {
    const [warnings, setWarnings] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [violations, setViolations] = useState<ViolationType[]>([]);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [lastViolationMessage, setLastViolationMessage] = useState<string | null>(null);
    const devToolsCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const MAX_WARNINGS = 5;
    const CRITICAL_WARNINGS = 3;

    // Log violation to backend (optional)
    const logViolation = useCallback(async (type: ViolationType['type'], details?: string) => {
        if (sessionId && token) {
            try {
                await fetch(`http://localhost:3333/exam/${sessionId}/violation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type, details, timestamp: new Date().toISOString() })
                });
            } catch (err) {
                console.error('Failed to log violation:', err);
            }
        }
    }, [sessionId, token]);

    // Add warning with violation tracking
    const addWarning = useCallback((type: ViolationType['type'], message: string, details?: string) => {
        setViolations(prev => [...prev, { type, timestamp: new Date(), details }]);
        setWarnings(prev => {
            const newCount = prev + 1;
            if (onWarningsUpdate) onWarningsUpdate(newCount);

            // Show violation message briefly
            setLastViolationMessage(message);
            setTimeout(() => setLastViolationMessage(null), 3000);

            // Log to backend
            logViolation(type, details);

            // Check for termination
            if (newCount >= MAX_WARNINGS) {
                setShowTerminateModal(true);
            }

            return newCount;
        });
    }, [onWarningsUpdate, logViolation]);

    // Handle forced termination
    const handleTerminate = useCallback(() => {
        setShowTerminateModal(false);
        if (onTerminate) {
            onTerminate();
        } else {
            // Fallback: reload page
            window.location.href = '/';
        }
    }, [onTerminate]);

    useEffect(() => {
        if (!isLocked) return;

        // 1. Tab Change Detection (Visibility API)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                addWarning('TAB_CHANGE', "Changement d'onglet détecté !");
            }
        };

        // 2. Right-click blocking
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            addWarning('RIGHT_CLICK', "Clic droit interdit !");
        };

        // 3. Fullscreen exit detection
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                addWarning('FULLSCREEN_EXIT', "Sortie du mode plein écran !");
                // Try to re-enter fullscreen
                document.documentElement.requestFullscreen().catch(() => { });
            }
        };

        // 4. Keyboard shortcut blocking
        const handleKeyDown = (e: KeyboardEvent) => {
            const blockedCombinations = [
                { ctrl: true, key: 'c' },   // Copy
                { ctrl: true, key: 'v' },   // Paste
                { ctrl: true, key: 'a' },   // Select all
                { ctrl: true, key: 'x' },   // Cut
                { ctrl: true, key: 'p' },   // Print
                { ctrl: true, key: 's' },   // Save
                { ctrl: true, key: 'u' },   // View source
                { ctrl: true, shift: true, key: 'i' }, // DevTools
                { ctrl: true, shift: true, key: 'j' }, // DevTools Console
                { ctrl: true, shift: true, key: 'c' }, // DevTools Inspect
                { key: 'F12' },             // DevTools
            ];

            const isBlocked = blockedCombinations.some(combo => {
                const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true;
                const shiftMatch = combo.shift ? e.shiftKey : !combo.shift || !e.shiftKey;
                const keyMatch = e.key.toLowerCase() === combo.key?.toLowerCase() || e.key === combo.key;
                return ctrlMatch && shiftMatch && keyMatch;
            });

            if (isBlocked) {
                e.preventDefault();
                e.stopPropagation();
                addWarning('KEYBOARD_SHORTCUT', "Raccourci clavier interdit !", e.key);
                return false;
            }
        };

        // 5. Copy/Cut/Paste event prevention
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            addWarning('COPY_PASTE', "Copier/Coller interdit !");
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            addWarning('COPY_PASTE', "Couper interdit !");
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            addWarning('COPY_PASTE', "Coller interdit !");
        };

        // 6. Window blur detection
        const handleWindowBlur = () => {
            // Only trigger if not a visibility change (avoid double counting)
            if (!document.hidden) {
                addWarning('WINDOW_BLUR', "Focus perdu sur la fenêtre !");
            }
        };

        // 7. DevTools detection (size-based heuristic)
        const checkDevTools = () => {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if (widthThreshold || heightThreshold) {
                addWarning('DEVTOOLS', "DevTools détecté !");
            }
        };

        // Add all event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('paste', handlePaste);
        window.addEventListener('blur', handleWindowBlur);

        // Start DevTools check interval
        devToolsCheckRef.current = setInterval(checkDevTools, 1000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('paste', handlePaste);
            window.removeEventListener('blur', handleWindowBlur);
            if (devToolsCheckRef.current) clearInterval(devToolsCheckRef.current);
        };
    }, [isLocked, addWarning]);

    const enterFullScreen = () => {
        document.documentElement.requestFullscreen().catch(err => {
            console.error("Error attempting to enable fullscreen:", err);
        });
        setIsLocked(true);
    };

    // Pre-exam instructions screen
    if (!isLocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 dark:bg-slate-950 p-6 text-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-800 transition-colors">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-lg w-full">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Mode Examen Sécurisé</h2>
                    <p className="text-slate-500 mb-6">Pour garantir l'intégrité de l'examen, plusieurs mesures de sécurité seront actives.</p>

                    <div className="mb-6 space-y-3 text-left">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                            <Monitor className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Mode plein écran obligatoire pendant tout l'examen.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-800 dark:text-red-300">
                            <Eye className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Changement d'onglet ou de fenêtre = avertissement immédiat.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-300">
                            <Keyboard className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Raccourcis clavier (Ctrl+C, F12...) bloqués.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                            <Copy className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Copier/Coller désactivé.</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-sm text-rose-800 dark:text-rose-300">
                            <ShieldOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p><strong>5 avertissements = Examen terminé automatiquement.</strong></p>
                        </div>
                    </div>

                    <button
                        onClick={enterFullScreen}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        <Lock className="w-5 h-5" />
                        J'accepte et je démarre l'examen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full select-none">
            {/* Warning Badge */}
            <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className={`px-4 py-2 rounded-full text-sm font-bold border shadow-lg flex items-center gap-2 ${warnings === 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    warnings < CRITICAL_WARNINGS ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-red-100 text-red-800 border-red-200 animate-pulse'
                    }`}>
                    <span className="text-lg">{warnings < CRITICAL_WARNINGS ? '🛡️' : '🚨'}</span>
                    <span>Avertissements : {warnings} / {MAX_WARNINGS}</span>
                </div>
            </div>

            {/* Violation Toast */}
            <AnimatePresence>
                {lastViolationMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold">
                            <AlertTriangle className="w-5 h-5" />
                            {lastViolationMessage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {children}

            {/* Termination Modal */}
            <AnimatePresence>
                {showTerminateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-200 dark:border-red-800"
                        >
                            <div className="text-center">
                                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldOff className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-red-600 mb-4">Examen Terminé</h3>
                                <p className="text-slate-500 mb-6">
                                    Vous avez atteint le nombre maximum d'avertissements ({MAX_WARNINGS}).
                                    Votre session a été marquée comme suspecte et sera examinée par un administrateur.
                                </p>

                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-left">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Violations détectées :</h4>
                                    <ul className="text-sm text-slate-500 space-y-1">
                                        {violations.slice(-5).map((v, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                {v.type.replace(/_/g, ' ')} {v.details && `(${v.details})`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={handleTerminate}
                                    className="w-full py-3 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                >
                                    Quitter
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
