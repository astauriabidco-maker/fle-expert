import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Types
interface User {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ADMIN' | 'COACH' | 'CANDIDATE' | 'SALES';
    organizationId?: string | null;
    currentLevel?: string;
    hasCompletedDiagnostic?: boolean;
    hasVerifiedPrerequisites?: boolean;
    isImpersonated?: boolean;
    objective?: 'RESIDENCY_MULTI_YEAR' | 'RESIDENCY_10_YEAR' | 'NATURALIZATION' | 'CANADA' | 'PROFESSIONAL' | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    targetLevel?: string | null;
    coach?: {
        id: string;
        name: string;
        email: string;
    } | null;
}



interface Organization {
    id: string;
    name: string;
    logoUrl?: string; // Optional logo
    primaryColor?: string; // Optional branding
    availableCredits: number;
}

interface AuthState {
    user: User | null;
    organization: Organization | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isMaintenanceMode: boolean;
}

interface AuthContextType extends AuthState {
    login: (token: string, user: User, organization: Organization) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    const checkMaintenance = async () => {
        try {
            const res = await fetch('http://localhost:3333/status');
            if (res.ok) {
                const data = await res.json();
                setIsMaintenanceMode(data.maintenance);
            }
        } catch (error) {
            console.error("Maintenance check failed:", error);
        }
    };

    useEffect(() => {
        checkMaintenance();
        const interval = setInterval(checkMaintenance, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Check localStorage for persisted session
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        const storedOrg = localStorage.getItem('authOrg');

        if (storedToken && storedUser && storedOrg) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                setOrganization(JSON.parse(storedOrg));
            } catch (error) {
                console.error("Failed to parse stored session", error);
                localStorage.clear();
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User, newOrg: Organization) => {
        setToken(newToken);
        setUser(newUser);
        setOrganization(newOrg);

        // Persist
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('authUser', JSON.stringify(newUser));
        localStorage.setItem('authOrg', JSON.stringify(newOrg));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setOrganization(null);

        // Clear persistence
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('authOrg');
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
    };


    return (
        <AuthContext.Provider value={{
            user,
            organization,
            token,
            isAuthenticated: !!user && !!token,
            isLoading,
            login,
            logout,
            updateUser,
            isMaintenanceMode
        }}>

            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
