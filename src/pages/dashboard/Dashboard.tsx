// Importaciones de React y de los contextos globales de la aplicación
import React, { useEffect } from 'react';
// Contextos: autenticación del usuario, notificaciones, empleados, horarios y solicitudes
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useEmployees } from '../../contexts/EmployeesContext';
import { useSchedules } from '../../contexts/SchedulesContext';
import { useScheduleRequests } from '../../contexts/ScheduleRequestsContext';
import { useEmployeeRequests } from '../../contexts/EmployeeRequestsContext';
// Iconos de lucide-react usados en las tarjetas de estadísticas y acciones
import { 
  Users, 
  Calendar, 
  Bell, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Componente principal del panel de control del administrador
const Dashboard = () => {
  // Datos del usuario autenticado y función para cerrar sesión
  const { user, logout } = useAuth();
  // Datos y acciones relacionadas con notificaciones
  const {  
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead 
  } = useNotifications();
  // Lista de empleados y función para cargarlos
  const { employees, fetchEmployees } = useEmployees();
  // Lista de horarios y función para cargarlos
  const { schedules, fetchSchedules } = useSchedules();
  // Solicitudes de cambio de horario con funciones para aprobar/rechazar
  const { 
    requests: scheduleRequests, 
    fetchRequests: fetchScheduleRequests,
    approveRequest: approveScheduleRequest,
    rejectRequest: rejectScheduleRequest
  } = useScheduleRequests(); // Contexto de solicitudes de horario
  // Solicitudes de empleo enviadas por usuarios (contexto de EmployeeRequests)
  const { 
    requests: employeeRequests, 
    fetchRequests: fetchEmployeeRequests,
    approveRequest: approveEmployeeRequest,
    rejectRequest: rejectEmployeeRequest
  } = useEmployeeRequests();

  // Registro de depuración: muestra las solicitudes de empleados recibidas del contexto
  console.log('Employee requests from context:', employeeRequests);

  useEffect(() => {
    // Cargar todos los datos al montar el componente de forma secuencial
    const loadDashboardData = async () => {
      try {
        // Esperar un poco antes de empezar para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (typeof fetchNotifications === 'function') {
          await fetchNotifications();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (typeof fetchEmployees === 'function') {
          await fetchEmployees();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (typeof fetchSchedules === 'function') {
          await fetchSchedules();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (typeof fetchScheduleRequests === 'function') {
          await fetchScheduleRequests();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (typeof fetchEmployeeRequests === 'function') {
          await fetchEmployeeRequests();
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, []); // Eliminamos las dependencias para que solo se ejecute una vez

  // Handler para cerrar sesión del usuario actual
  const handleLogout = () => {
    logout();
  };

  // Aprueba una solicitud de empleo del empleado y refresca las notificaciones
  const handleApproveEmployee = async (id: number) => {
    try {
      await approveEmployeeRequest(id);
      fetchNotifications(); // Actualizar notificaciones
    } catch (error) {
      console.error('Error approving employee request:', error);
    }
  };

  // Rechaza una solicitud de empleo con un motivo por defecto y refresca notificaciones
  const handleRejectEmployee = async (id: number) => {
    try {
      await rejectEmployeeRequest(id, 'No cumple con los requisitos');
      fetchNotifications(); // Actualizar notificaciones
    } catch (error) {
      console.error('Error rejecting employee request:', error);
    }
  };

  // Aprueba una solicitud de cambio de horario y refresca las notificaciones
  const handleApproveSchedule = async (id: number) => {
    try {
      await approveScheduleRequest(id);
      fetchNotifications(); // Actualizar notificaciones
    } catch (error) {
      console.error('Error approving schedule request:', error);
    }
  };

  // Rechaza una solicitud de cambio de horario con un motivo por defecto y refresca notificaciones
  const handleRejectSchedule = async (id: number) => {
    try {
      await rejectScheduleRequest(id, 'No se puede aprobar en este momento');
      fetchNotifications(); // Actualizar notificaciones
    } catch (error) {
      console.error('Error rejecting schedule request:', error);
    }
  };

  // Se filtran solo las solicitudes en estado "pendiente" para mostrarlas en el dashboard;
  // se usa Array.isArray como guarda por si el contexto devuelve algo inesperado
  const pendingEmployeeRequests = Array.isArray(employeeRequests) ? employeeRequests.filter(r => r.estado === 'pendiente') : [];
  const pendingScheduleRequests = Array.isArray(scheduleRequests) ? scheduleRequests.filter(r => r.estado === 'pendiente') : [];

  // Debug logging: imprime en consola los datos de solicitudes para diagnosticar problemas
  console.log('employeeRequests:', employeeRequests, typeof employeeRequests);
  console.log('scheduleRequests:', scheduleRequests, typeof scheduleRequests);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sistema de Gestión de Horarios
              </h1>
              <p className="text-gray-600">
                Bienvenido, {user?.nombre}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-500" />
                {/* Badge rojo que muestra el número de notificaciones no leídas */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">
                Rol: {user?.rol}
              </span>
              {/* Botón que invoca handleLogout para cerrar la sesión del administrador */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards: resumen numérico de empleados, horarios y solicitudes pendientes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Tarjeta: total de empleados registrados */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{(employees || []).length}</p>
              </div>
            </div>
          </div>
          
          {/* Tarjeta: total de horarios configurados */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Horarios</p>
                <p className="text-2xl font-bold text-gray-900">{(schedules || []).length}</p>
              </div>
            </div>
          </div>
          
          {/* Tarjeta: solicitudes de cambio de horario pendientes de aprobar */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Solicitudes de Horario</p>
                <p className="text-2xl font-bold text-gray-900">{pendingScheduleRequests.length}</p>
              </div>
            </div>
          </div>
          
          {/* Tarjeta: solicitudes de empleo pendientes de aprobar */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Solicitudes de Empleado</p>
                <p className="text-2xl font-bold text-gray-900">{pendingEmployeeRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones Recientes</h2>
            <div className="space-y-3">
              {/* Muestra solo las 3 notificaciones más recientes; se filtran elementos nulos
                  antes de mapear para evitar errores de renderizado */}
              {(notifications || []).filter(n => n && typeof n === 'object').slice(0, 3).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border ${
                    notification.leida ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{notification.titulo}</p>
                      <p className="text-sm text-gray-600">{notification.mensaje}</p>
                    </div>
                    {/* Las notificaciones no leídas se resaltan en azul y ofrecen botón para marcarlas */}
                    {!notification.leida && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions: botones de acceso rápido a las secciones principales del sistema */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm">Gestionar Empleados</span>
              </button>
              <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                <Calendar className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm">Administrar Horarios</span>
              </button>
              <button className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100">
                <Clock className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm">Ver Solicitudes</span>
              </button>
              <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm">Ver Reportes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pending Requests: paneles laterales con solicitudes pendientes de revisión */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Requests: solicitudes de empleo con botones de aprobar/rechazar */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes de Empleado Pendientes</h2>
            <div className="space-y-3">
              {/* Se muestran máximo 3 solicitudes; cada una incluye botones que llaman a los handlers de aprobación/rechazo */}
              {pendingEmployeeRequests && Array.isArray(pendingEmployeeRequests) ? pendingEmployeeRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{request.usuario?.nombre || 'Usuario desconocido'}</p>
                      <p className="text-sm text-gray-600">{request.posicion_deseada}</p>
                      <p className="text-xs text-gray-500">{request.usuario?.correo}</p>
                      {/* Mensaje opcional enviado por el solicitante al pedir el empleo */}
                      {request.mensaje && (
                        <p className="text-sm text-gray-600 mt-1">{request.mensaje}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {/* Botón verde: aprueba la solicitud llamando a handleApproveEmployee */}
                      <button
                        onClick={() => handleApproveEmployee(request.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Aprobar"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      {/* Botón rojo: rechaza la solicitud llamando a handleRejectEmployee */}
                      <button
                        onClick={() => handleRejectEmployee(request.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Rechazar"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : null}
              {pendingEmployeeRequests.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay solicitudes pendientes</p>
              )}
            </div>
          </div>

          {/* Schedule Requests: solicitudes de cambio de horario con botones de aprobar/rechazar */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes de Horario Pendientes</h2>
            <div className="space-y-3">
              {/* Se muestran máximo 3 solicitudes; el tipo se capitaliza para mejorar su presentación */}
              {pendingScheduleRequests && Array.isArray(pendingScheduleRequests) ? pendingScheduleRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.tipo_solicitud.charAt(0).toUpperCase() + request.tipo_solicitud.slice(1)}
                      </p>
                      <p className="text-sm text-gray-600">Fecha: {request.fecha_solicitada}</p>
                      <p className="text-sm text-gray-500">{request.motivo}</p>
                    </div>
                    <div className="flex space-x-2">
                      {/* Botón verde: aprueba la solicitud de horario llamando a handleApproveSchedule */}
                      <button
                        onClick={() => handleApproveSchedule(request.id)}
                        className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      {/* Botón rojo: rechaza la solicitud de horario llamando a handleRejectSchedule */}
                      <button
                        onClick={() => handleRejectSchedule(request.id)}
                        className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : null}
              {pendingScheduleRequests.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay solicitudes pendientes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
