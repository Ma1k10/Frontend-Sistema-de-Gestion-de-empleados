/**
 * Archivo: EmployeeProfile.js
 * Descripción: Página de perfil del empleado
 * Propósito: Mostrar información personal y horarios del empleado
 * 
 * Funcionalidades:
 * - Ver información personal del empleado
 * - Ver sus horarios asignados
 * - Navegación por pestañas (perfil/horarios)
 * - Solo accesible para rol de empleado
 */

import React, { useState, useEffect } from 'react';
// Contexto de autenticación: provee los datos del usuario logueado
import { useAuth } from '../../contexts/AuthContext';
// Contexto de horarios: provee los horarios del empleado y su función de carga
import { useSchedules } from '../../contexts/SchedulesContext';

// Componente del panel del empleado con pestañas para ver su perfil y sus horarios
const EmployeeProfile = () => {
  const { user } = useAuth();
  // Horarios del empleado, estado de carga y función para solicitarlos al backend
  const { mySchedules, fetchMySchedules, loading } = useSchedules();
  // Pestaña activa: 'profile' (datos personales) o 'schedules' (tabla de horarios)
  const [activeTab, setActiveTab] = useState('profile');

  // Carga los horarios del empleado cuando hay un usuario autenticado
  useEffect(() => {
    if (user) {
      fetchMySchedules();
    }
  }, [user, fetchMySchedules]);

  // Renderiza el panel de información personal del empleado (solo lectura)
  const renderProfileInfo = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mi Perfil</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo
          </label>
          <div className="p-3 bg-gray-50 rounded-md">
            {user?.nombre || 'No disponible'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <div className="p-3 bg-gray-50 rounded-md">
            {user?.correo || 'No disponible'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rol
          </label>
          <div className="p-3 bg-gray-50 rounded-md capitalize">
            {user?.rol || 'No disponible'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <div className="p-3 bg-gray-50 rounded-md">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              user?.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {user?.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Registro
          </label>
          <div className="p-3 bg-gray-50 rounded-md">
            {user?.created_at 
              ? new Date(user.created_at).toLocaleDateString('es-ES')
              : 'No disponible'
            }
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Última Actualización
          </label>
          <div className="p-3 bg-gray-50 rounded-md">
            {user?.updated_at 
              ? new Date(user.updated_at).toLocaleDateString('es-ES')
              : 'No disponible'
            }
          </div>
        </div>
      </div>
    </div>
  );

  // Renderiza el panel de horarios: tabla con estado de carga y estado vacío
  const renderMySchedules = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mis Horarios</h2>
      
      {/* Condicional: spinner mientras carga, mensaje si no hay horarios, o tabla con los datos */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando horarios...</p>
        </div>
      ) : mySchedules.length === 0 ? (
        // Estado vacío: se muestra cuando el empleado no tiene horarios asignados
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No tienes horarios asignados</p>
        </div>
      ) : (
        // Tabla de horarios: cada fila muestra id, fecha, horas y estado activo/inactivo
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mySchedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{schedule.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.fecha ? new Date(schedule.fecha).toLocaleDateString('es-ES') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.hora_inicio || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.hora_fin || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      schedule.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {schedule.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Encabezado del panel */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Empleado</h1>
        <p className="mt-2 text-gray-600">Gestiona tu perfil y consulta tus horarios</p>
      </div>

      {/* Tabs: botones que cambian activeTab para alternar entre perfil y horarios */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mi Perfil
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
          
          </button>
        </nav>
      </div>

      {/* Tab Content: renderiza el panel correspondiente a la pestaña activa */}
      
      <div>
        {activeTab === 'profile' && renderProfileInfo()}
        {activeTab === 'schedules' && renderMySchedules()}
      </div>
    </div>
  );
};

export default EmployeeProfile;
