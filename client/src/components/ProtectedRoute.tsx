import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // Assuming react-router-dom is used, usually standard in React apps.
// Note: If react-router-dom is not installed, I need to install it. 
// Assuming it is NOT installed based on package.json viewed earlier (only react, react-dom, recharts, etc).
// I will check package.json again or just install it.
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    redirectPath = '/login'
}) => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User authorized but not for this specific role (e.g. Candidate accessing Admin area)
        return <Navigate to="/" replace />; // Redirect to home or specialized 403 page
    }

    return <Outlet />;
};

export default ProtectedRoute;
