import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const getRoleHome = (role) => {
    if (role === 'employer') {
        return '/contract-factory';
    }
    if (role === 'employee') {
        return '/job-search';
    }
    return '/';
};

const getStoredRole = (user) => {
    return (
        localStorage.getItem('persistedUserRole') ||
        localStorage.getItem('userRole') ||
        localStorage.getItem('pendingRole') ||
        user?.metadata?.role ||
        ''
    );
};

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const [waitingForAuth, setWaitingForAuth] = useState(true);

    // Wait a bit for authentication state to settle after redirect
    useEffect(() => {
        if (!isLoading) {
            // Give auth provider a moment to fully load user state
            const timer = setTimeout(() => {
                setWaitingForAuth(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isAuthenticated, user]);

    if (isLoading || waitingForAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Check both isAuthenticated and user to be safe
    // Handle undefined isAuthenticated from auth SDK (same as App.jsx)
    const isUserAuthenticated = isAuthenticated === true || (user && isAuthenticated !== false);
    
    if (!isUserAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole) {
        const currentRole = getStoredRole(user);

        if (!currentRole) {
            return <Navigate to="/user-profile" replace />;
        }

        if (currentRole !== requiredRole) {
            return <Navigate to={getRoleHome(currentRole)} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
