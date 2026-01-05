import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Shield, Settings } from 'lucide-react';

export const UserMenu: React.FC = () => {
    const { user, organization, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            // Optional: call backend to invalidate session
            await fetch('http://localhost:3333/auth/logout', {
                method: 'POST',
                credentials: 'include',
            }).catch(() => { }); // Ignore errors if endpoint doesn't exist
        } finally {
            logout();
            navigate('/login');
        }
    };

    if (!isAuthenticated || !user) {
        return null;
    }

    const getRoleBadge = (role: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-500' },
            ORG_ADMIN: { label: 'Admin OF', color: 'bg-blue-500' },
            COACH: { label: 'Coach', color: 'bg-teal-500' },
            SALES: { label: 'Commercial', color: 'bg-amber-500' },
            CANDIDATE: { label: 'Candidat', color: 'bg-indigo-500' },
        };
        return badges[role] || { label: role, color: 'bg-slate-500' };
    };

    const badge = getRoleBadge(user.role);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
            >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-white truncate max-w-[120px]">{user.name}</p>
                    <p className="text-xs text-white/60">{organization?.name || 'Organisation'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white ${badge.color}`}>
                                <Shield size={12} />
                                {badge.label}
                            </span>
                            {organization && (
                                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                    {organization.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                // Navigate to profile based on role
                                if (user.role === 'COACH') navigate('/coach');
                                else if (user.role === 'CANDIDATE') navigate('/app');
                                else navigate('/dashboard');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                            <User size={18} className="text-slate-400" />
                            <span className="font-medium">Mon Profil</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                alert('Paramètres en cours de développement');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                            <Settings size={18} className="text-slate-400" />
                            <span className="font-medium">Paramètres</span>
                        </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left group"
                        >
                            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                            <span className="font-bold">Se déconnecter</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
