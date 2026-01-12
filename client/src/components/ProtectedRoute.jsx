import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const ProtectedRoute = ({ children }) => {
    const { user, isLoading, isAuthenticated } = useDynamicContext();
    const [waitingForAuth, setWaitingForAuth] = useState(true);

    // Wait a bit for authentication state to settle after redirect
    useEffect(() => {
        if (!isLoading) {
            // Give Dynamic Labs a moment to fully load user state
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
    // Handle undefined isAuthenticated from Dynamic Labs SDK (same as App.jsx)
    const isUserAuthenticated = isAuthenticated === true || (user && isAuthenticated !== false);
    
    if (!isUserAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
