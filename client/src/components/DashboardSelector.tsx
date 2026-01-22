
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
            // B2C Flow
            if (user.acquisition === 'DIRECT' && user.isPaid && !user.hasCompletedDiagnostic) {
                return <Navigate to="/diagnostic-prep" replace />;
            }
            // If direct candidate (no organization) and diagnostic finished, redirect to results/marketplace
            if (!user.organizationId) {
                return <Navigate to="/results" replace />;
            }
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
