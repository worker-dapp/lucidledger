import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useDynamicContext();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
