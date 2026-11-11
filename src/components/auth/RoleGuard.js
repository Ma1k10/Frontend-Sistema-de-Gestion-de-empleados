/**
 * Archivo: RoleGuard.js
 * Descripción: Componente para proteger rutas según el rol del usuario
 * Propósito: Verificar si el usuario tiene el rol requerido para acceder
 * 
 * Funcionalidades:
 * - Muestra mensaje de acceso denegado si no tiene el rol requerido
 * - Permite botón para volver a la página anterior
 * - Se usa en combinación con ProtectedRoute para doble verificación
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const RoleGuard = ({ children, requiredRole }) => {   //Esto lo que hace es crear el componente RoleGuard 
   // dicho component recibe dos parametros: children y requiredRole , RequiredRole consiste en que para determinado rol
   // para poder acceder Indica qué rol necesita tener el usuario para poder acceder., el children es el que encierra el contenido de la página 
  const { user } = useAuth(); // obtiene el usuario actualmente conectado., El contexto devuelve la información guardada después del login.

  if (requiredRole && user?.rol !== requiredRole) { //Esta condición comprueba si el usuario tiene permiso., Requiredrole comprueba si la pagina necesita un rol especifico, Compara el rol del usuario con el rol necesario. 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-lg text-gray-600 mb-8">
            No tienes permisos para acceder a esta página.
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

  return children; // Si el usuario tiene el rol requerido, devuelve el contenido de la página.
};

export default RoleGuard;
