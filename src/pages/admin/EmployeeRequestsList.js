// React y hooks para estado y memoización de datos derivados
import React, { useState, useMemo } from 'react';
// Contexto que provee las solicitudes de empleo y las acciones aprobar/rechazar
import { useEmployeeRequests } from '../../contexts/EmployeeRequestsContext';
// Contexto de notificaciones para mostrar feedback al administrador
import { useNotifications } from '../../contexts/NotificationsContext';
// Iconos de lucide-react usados en tarjetas, filtros, tabla y estados
import { 
  Users, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

const EmployeeRequestsList = () => {
  const { 
    employeeRequests, 
    loading, 
    error, 
    approveRequest, 
    rejectRequest
  } = useEmployeeRequests();
  // Función para emitir notificaciones toast al usuario
  const { addNotification } = useNotifications();
  
  // Texto de búsqueda que filtra por nombre, correo o posición
  const [searchTerm, setSearchTerm] = useState('');
  // Estado de filtro: 'all', 'pending', 'approved' o 'rejected'
  const [filterStatus, setFilterStatus] = useState('all');
  // Id de la solicitud que se está procesando (para deshabilitar botones)
  const [processingId, setProcessingId] = useState(null);
  // Posición elegida por solicitud para asignarla al crear el empleado
  const [selectedPositions, setSelectedPositions] = useState({});

  // Filtrar solicitudes por término de búsqueda y estado seleccionado.
  // Se memoiza para no recalcular en cada render.
  const filteredRequests = useMemo(() => {
    return employeeRequests.filter(request => {
      // Filtrar por término de búsqueda
      const matchesSearch = searchTerm === '' || 
        request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.position.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtrar por estado
      const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [employeeRequests, searchTerm, filterStatus]);

  // Conteo de solicitudes por estado para las tarjetas de estadísticas
  const stats = useMemo(() => {
    const total = employeeRequests.length;
    const pending = employeeRequests.filter(req => req.status === 'pending').length;
    const approved = employeeRequests.filter(req => req.status === 'approved').length;
    const rejected = employeeRequests.filter(req => req.status === 'rejected').length;

    return { total, pending, approved, rejected };
  }, [employeeRequests]);

  // Manejar aprobación
  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    
    try {
      const posicion = selectedPositions[requestId] || 'operador';
      const result = await approveRequest(requestId, posicion);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Solicitud Aprobada',
          message: 'El solicitante ha sido agregado como empleado exitosamente.',
        });
        
        // Refrescar lista de empleados (esto se implementará después)
        // Se emite un evento personalizado para que otras vistas se actualicen
        window.dispatchEvent(new CustomEvent('employeeListUpdated'));
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error al Aprobar',
        message: error,
      });
    } finally {
      // Siempre se libera el estado de procesamiento al terminar
      setProcessingId(null);
    }
  };

  // Guarda la posición seleccionada para una solicitud concreta
  // en el estado selectedPositions (objeto { [requestId]: posicion })
  const handlePositionChange = (requestId, position) => {
    setSelectedPositions(prev => ({
      ...prev,
      [requestId]: position
    }));
  };

  // Manejar rechazo
  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    
    try {
      const result = await rejectRequest(requestId);
      
      if (result.success) {
        // Notifica al administrador que la solicitud fue rechazada
        addNotification({
          type: 'warning',
          title: 'Solicitud Rechazada',
          message: 'La solicitud de empleo ha sido rechazada.',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error al Rechazar',
        message: error,
      });
    } finally {
      // Libera el bloqueo de la solicitud procesada
      setProcessingId(null);
    }
  };

  // Devuelve las clases Tailwind de color según el estado de la solicitud
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Devuelve el icono lucide correspondiente a cada estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Devuelve el texto en español del estado para mostrar en la UI
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Desconocido';
    }
  };

  // Mientras carga por primera vez (sin datos previos) se muestra un spinner
  if (loading && employeeRequests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes de empleo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado de la página */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Empleo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona las solicitudes de empleo enviadas por usuarios
        </p>
      </div>

      {/* Cuatro tarjetas de estadísticas: total, pendientes, aprobadas y rechazadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-600">Aprobadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              <p className="text-sm text-gray-600">Rechazadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros: campo de búsqueda y selector de estado */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar solicitudes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerta de error del contexto si la carga o una acción falló */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Lista de solicitudes filtradas: tarjetas con datos, estado y acciones */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredRequests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {/* Cada tarjeta muestra los datos de una solicitud */}
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  {/* Datos de contacto, departamento, posición y fechas de la solicitud */}
                  {/* Request Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{getStatusText(request.status)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{request.email}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{request.phone || 'No especificado'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{request.department || 'No especificado'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{request.position}</span>
                      </div>
                    </div>

                    {request.created_at && (
                      <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Solicitado: {new Date(request.created_at).toLocaleString()}</span>
                      </div>
                    )}

                    {request.reviewed_at && (
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Revisado: {new Date(request.reviewed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones solo para solicitudes pendientes: selector de posición
                      y botones aceptar/rechazar que se bloquean al procesar */}
                  {request.status === 'pending' && (
                    <div className="flex flex-col space-y-2 ml-4">
                      {/* Selector de posición */}
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-gray-700">Posición para empleado:</label>
                        <select
                          value={selectedPositions[request.id] || ''}
                          onChange={(e) => handlePositionChange(request.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">Seleccionar posición...</option>
                          <option value="cajero">Cajero</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="gerente">Gerente</option>
                          <option value="administrativo">Administrativo</option>
                          <option value="tecnico">Técnico</option>
                          <option value="operador">Operador</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 min-w-[120px]"
                      >
                        {processingId === request.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Aceptar</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {processingId === request.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Rechazar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Estado vacío con mensaje según haya filtros activos o no */
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'No se encontraron solicitudes' 
                : 'No hay solicitudes de empleo'
              }
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las solicitudes de empleo aparecerán aquí cuando los usuarios las envíen'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeRequestsList;