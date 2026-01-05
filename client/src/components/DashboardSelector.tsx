
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardSelector: React.FC = () => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role based redirection
    switch (user?.role) {
        case 'SUPER_ADMIN':
            return <Navigate to="/super-admin" replace />;
        case 'ORG_ADMIN':
            return <Navigate to="/of-admin" replace />;
        case 'ADMIN': // Legacy support
            return <Navigate to="/super-admin" replace />;
        case 'COACH':
            return <Navigate to="/coach" replace />;
        case 'SALES':
            return <Navigate to="/sales" replace />;
        case 'CANDIDATE':
            // Check if diagnostic is completed
            if (!user.hasCompletedDiagnostic) {
                return <Navigate to="/diagnostic" replace />;
            }
            return <Navigate to="/app" replace />;
        default:
            return <Navigate to="/app" replace />;
    }
};

export default DashboardSelector;
