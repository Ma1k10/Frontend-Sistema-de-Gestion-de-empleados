import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

// Componente de la página de error 404 (Página No Encontrada).
// Se muestra cuando el usuario navega a una ruta que no existe en la aplicación.
// Ofrece enlaces para ir al dashboard o volver a la página anterior.
const NotFound = () => {
  // Renderizado del mensaje de error centrado con opciones de navegación
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Encabezado con el código de error 404 y el mensaje descriptivo */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-200">
            <span className="text-4xl font-bold text-gray-600">404</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Página No Encontrada
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            La página que estás buscando no existe o ha sido movida.
          </p>
        </div>
        
        {/* Botones de acción: enlace al dashboard y botón para volver atrás */}
        <div className="mt-8 space-y-4">
          {/* Enlace de navegación a la página principal del sistema */}
          <Link
            to="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </Link>
          
          {/* Botón que usa el historial del navegador para regresar a la página anterior */}
          <button
            onClick={() => window.history.back()}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver Atrás
          </button>
        </div>
        
        {/* Pie de página con una nota de ayuda para el usuario */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Si crees que esto es un error, por favor contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
