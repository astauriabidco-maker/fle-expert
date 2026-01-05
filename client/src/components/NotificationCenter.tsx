import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Trophy, Globe, Info, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    title: string;
    content: string;
    type: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

export const NotificationCenter: React.FC = () => {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [notifsRes, countRes] = await Promise.all([
                fetch('http://localhost:3333/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:3333/notifications/unread-count', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (notifsRes.ok) setNotifications(await notifsRes.json());
            if (countRes.ok) setUnreadCount((await countRes.json()));
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            // Refresh every 2 minutes
            const interval = setInterval(fetchNotifications, 120000);
            return () => clearInterval(interval);
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:3333/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'achievement': return <Trophy className="text-amber-500" size={18} />;
            case 'civic': return <Globe className="text-blue-500" size={18} />;
            case 'success': return <CheckCircle2 className="text-emerald-500" size={18} />;
            default: return <Info className="text-indigo-500" size={18} />;
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-white"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0F172A] shadow-lg animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                <Bell size={16} className="text-blue-500" />
                                Notifications
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {isLoading && notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-xs text-slate-500 font-medium">Chargement...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <Bell size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">Aucune notification</p>
                                    <p className="text-xs text-slate-400 mt-1">Vous êtes à jour !</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                            onClick={() => !notif.read && markAsRead(notif.id)}
                                        >
                                            <div className="flex gap-4">
                                                <div className="mt-1 shrink-0">
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm font-bold ${notif.read ? 'text-slate-700 dark:text-slate-200' : 'text-blue-600 dark:text-blue-400'}`}>
                                                            {notif.title}
                                                        </p>
                                                        {!notif.read && (
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-lg shadow-blue-500/20" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                        {notif.content}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                                                            {new Date(notif.createdAt).toLocaleDateString()} &bull; {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {notif.link && (
                                                            <a
                                                                href={notif.link}
                                                                className="text-[10px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 uppercase group/link"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Voir <ExternalLink size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
                                <button
                                    onClick={() => {
                                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                        setUnreadCount(0);
                                        // TODO: Multi-mark on backend
                                    }}
                                    className="text-[10px] font-black text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors"
                                >
                                    Tout marquer comme lu
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
