import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Verificamos si existe un indicador de sesión y el token en sessionStorage
    const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';
    const hasToken = !!sessionStorage.getItem('token');

    if (!isAuthenticated || !hasToken) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
