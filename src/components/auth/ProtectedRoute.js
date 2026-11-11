/**
 * Archivo: ProtectedRoute.js
 * Descripción: Componente para proteger rutas que requieren autenticación
 * Propósito: Verificar si el usuario está autenticado antes de permitir acceso
 * 
 * Funcionalidades:
 * - Redirige al login si no está autenticado
 * - Verifica roles específicos (admin, empleado)
 * - Muestra loading mientras verifica autenticación
 * - Guarda la ubicación original para redirigir después del login
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login pero guardar la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.rol !== requiredRole) {
    // Si se requiere un rol específico y el usuario no lo tiene
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-lg text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Rol requerido: {requiredRole} | Tu rol: {user?.rol || 'No definido'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
