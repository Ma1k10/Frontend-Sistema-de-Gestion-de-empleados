// React y hooks para estado local y efectos al cargar la solicitud
import React, { useState, useEffect } from 'react';
// useParams obtiene el id de la solicitud desde la URL; useNavigate para volver
import { useParams, useNavigate } from 'react-router-dom';
// Iconos lucide-react usados en encabezados, formularios y badges de estado
import { 
  User, 
  Mail, 
  Calendar, 
  Briefcase, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Save,
  AlertTriangle
} from 'lucide-react';
// Servicio directo (fuera de contexto) para obtener y procesar la solicitud
import * as employeeRequestService from '../../services/employeeRequests';

const EmployeeRequestDetail = () => {
  // Id de la solicitud de empleo tomado de la ruta
  const { id } = useParams();
  const navigate = useNavigate();
  // Datos de la solicitud cargada desde el backend
  const [request, setRequest] = useState(null);
  // Controla el spinner de carga inicial
  const [loading, setLoading] = useState(true);
  // Mensaje de error mostrado al administrador
  const [error, setError] = useState('');
  // Indica que una acción (aprobar/rechazar) está en curso
  const [processing, setProcessing] = useState(false);
  // Indica que el servicio está reintentando la petición (timeouts)
  const [retrying, setRetrying] = useState(false);
  // Campos del formulario de procesamiento: posición oficial y motivo de rechazo
  const [formData, setFormData] = useState({
    posicion: '',
    motivo_rechazo: ''
  });

  // Al montar o cambiar el id, descarga la solicitud del backend y
  // precarga la posición deseada en el formulario de aprobación
  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await employeeRequestService.getEmployeeRequestById(id);
      
      if (response.success) {
        setRequest(response.data.request);
        setFormData(prev => ({
          ...prev,
          posicion: response.data.request.posicion_deseada
        }));
      }
    } catch (error) {
      console.error('Error cargando solicitud:', error);
      setError('Error al cargar la solicitud de empleo');
    } finally {
      setLoading(false);
    }
  };

  // Efecto que dispara la carga cada vez que cambia el id de la ruta
  useEffect(() => {
    loadRequest();
  }, [id]);

  // Aprueba la solicitud enviando la posición oficial elegida.
  // Requiere que el campo posición no esté vacío.
  const handleApprove = async () => {
    if (!formData.posicion.trim()) {
      setError('Debe especificar la posición para el empleado');
      return;
    }

    try {
      setProcessing(true);
      setRetrying(false);
      
      // Escuchar mensajes de reintento desde la consola:
      // se intercepta console.warn temporalmente para detectar cuando
      // el servicio reintenta la petición y mostrar "Reintentando..."
      const originalLog = console.warn;
      console.warn = (...args) => {
        if (args[0] && args[0].includes('Reintentando')) {
          setRetrying(true);
        }
        originalLog(...args);
      };
      
      const response = await employeeRequestService.approveEmployeeRequest(id, {
        posicion: formData.posicion
      });
      
      // Restaurar console.warn original para no afectar otros logs
      console.warn = originalLog;

      if (response.success) {
        // Actualizar el estado local sin recargar toda la página
        setRequest(prev => ({
          ...prev,
          estado: 'aprobada',
          fecha_revision: new Date().toISOString()
        }));
        setError('');
      }
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      
      // Mapear errores técnicos a mensajes comprensibles para el usuario:
      // timeouts, sesión expirada, permisos, solicitud inexistente u otro
      if (error.isAborted || error.code === 'ECONNABORTED' || error.message.includes('Request aborted')) {
        setError('La petición tardó demasiado tiempo. Por favor, verifica tu conexión e intenta nuevamente.');
      } else if (error.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para realizar esta acción.');
      } else if (error.response?.status === 404) {
        setError('La solicitud ya no existe o fue eliminada.');
      } else {
        setError('Error al aprobar la solicitud. Por favor, intenta nuevamente.');
      }
    } finally {
      // Liberar estados de procesamiento y reintento al terminar
      setProcessing(false);
      setRetrying(false);
    }
  };

  // Rechazar solicitud
  const handleReject = async () => {
    if (!formData.motivo_rechazo.trim()) {
      setError('Debe especificar un motivo de rechazo');
      return;
    }

    try {
      setProcessing(true);
      setRetrying(false);
      
      // Misma técnica de intercepción de console.warn para detectar reintentos
      const originalLog = console.warn;
      console.warn = (...args) => {
        if (args[0] && args[0].includes('Reintentando')) {
          setRetrying(true);
        }
        originalLog(...args);
      };
      
      const response = await employeeRequestService.rejectEmployeeRequest(id, {
        motivo_rechazo: formData.motivo_rechazo
      });
      
      // Restaurar console.warn original
      console.warn = originalLog;

      if (response.success) {
        // Actualizar estado local reflejando el rechazo y su motivo
        setRequest(prev => ({
          ...prev,
          estado: 'rechazada',
          motivo_rechazo: formData.motivo_rechazo,
          fecha_revision: new Date().toISOString()
        }));
        setError('');
      }
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      
      // Mismos mensajes de error amigables que en la aprobación
      if (error.isAborted || error.code === 'ECONNABORTED' || error.message.includes('Request aborted')) {
        setError('La petición tardó demasiado tiempo. Por favor, verifica tu conexión e intenta nuevamente.');
      } else if (error.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 403) {
        setError('No tienes permisos para realizar esta acción.');
      } else if (error.response?.status === 404) {
        setError('La solicitud ya no existe o fue eliminada.');
      } else {
        setError('Error al rechazar la solicitud. Por favor, intenta nuevamente.');
      }
    } finally {
      // Liberar estados de procesamiento y reintento
      setProcessing(false);
      setRetrying(false);
    }
  };

  // Devuelve clases de color según el estado de la solicitud
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-amber-100 text-amber-800';
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Devuelve el icono lucide correspondiente al estado
  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="w-4 h-4" />;
      case 'aprobada':
        return <CheckCircle className="w-4 h-4" />;
      case 'rechazada':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Vista de carga: spinner a pantalla completa mientras se descarga la solicitud
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si la solicitud no existe (error 404 o id inválido) se muestra
  // un mensaje con botón para volver a notificaciones
  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Solicitud no encontrada</h3>
          <p className="text-gray-500 mb-4">La solicitud que buscas no existe o fue eliminada.</p>
          <button
            onClick={() => navigate('/admin/notifications')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a notificaciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con botón de regreso, título y badge de estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/notifications')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle de Solicitud de Empleo</h1>
            <p className="mt-1 text-sm text-gray-500">
              Revisa y procesa la solicitud de empleo
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.estado)}`}>
          {getStatusIcon(request.estado)}
          <span className="ml-1 capitalize">{request.estado}</span>
        </div>
      </div>

      {/* Alerta de error de validación o de la petición de aprobación/rechazo */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Layout principal: columna de contenido (2/3) + panel lateral (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal: datos del solicitante y panel de procesamiento */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta con los datos del solicitante: nombre, correo, fecha y posición deseada */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información del Solicitante
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <p className="text-gray-900">{request.usuario?.nombre}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{request.usuario?.correo}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posición Deseada</label>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{request.posicion_deseada}</p>
                </div>
              </div>
            </div>
            
            {request.mensaje && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje del Solicitante</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700 whitespace-pre-wrap">{request.mensaje}</p>
                </div>
              </div>
            )}
          </div>

          {/* Solo si la solicitud sigue pendiente se muestran los formularios
              de aprobación (posición oficial) y rechazo (motivo) */}
          {request.estado === 'pendiente' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Procesar Solicitud</h2>
              
              <div className="space-y-4">
                {/* Aprobación */}
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="font-medium text-green-900 mb-3">Aprobar Solicitud</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Posición Oficial *
                      </label>
                      <input
                        type="text"
                        value={formData.posicion}
                        onChange={(e) => setFormData(prev => ({ ...prev, posicion: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ej: Desarrollador Frontend"
                      />
                    </div>
                    
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{processing ? (retrying ? 'Reintentando...' : 'Procesando...') : 'Aprobar Solicitud'}</span>
                    </button>
                  </div>
                </div>

                {/* Rechazo */}
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-medium text-red-900 mb-3">Rechazar Solicitud</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo de Rechazo *
                      </label>
                      <textarea
                        value={formData.motivo_rechazo}
                        onChange={(e) => setFormData(prev => ({ ...prev, motivo_rechazo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={3}
                        placeholder="Explica el motivo por el cual se rechaza la solicitud..."
                      />
                    </div>
                    
                    <button
                      onClick={handleReject}
                      disabled={processing}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{processing ? (retrying ? 'Reintentando...' : 'Procesando...') : 'Rechazar Solicitud'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Si ya fue procesada se muestra la información de revisión:
              fecha, revisor y motivo de rechazo si aplica */}
          {request.estado !== 'pendiente' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Procesamiento</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado Final</label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.estado)}`}>
                    {getStatusIcon(request.estado)}
                    <span className="ml-1 capitalize">{request.estado}</span>
                  </div>
                </div>
                
                {request.fecha_revision && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Revisión</label>
                    <p className="text-gray-900">
                      {new Date(request.fecha_revision).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {request.revisor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revisado por</label>
                    <p className="text-gray-900">{request.revisor.nombre}</p>
                  </div>
                )}
                
                {request.motivo_rechazo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Rechazo</label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800">{request.motivo_rechazo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral: resumen rápido y acciones rápidas */}
        <div className="space-y-6">
          {/* Resumen de la solicitud: id, estado, posición y fecha */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Resumen</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ID de Solicitud</span>
                <span className="text-sm font-medium">#{request.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <span className={`text-sm font-medium capitalize ${request.estado === 'pendiente' ? 'text-amber-600' : request.estado === 'aprobada' ? 'text-green-600' : 'text-red-600'}`}>
                  {request.estado}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Posición</span>
                <span className="text-sm font-medium">{request.posicion_deseada}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fecha</span>
                <span className="text-sm font-medium">
                  {new Date(request.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones rápidas solo para pendientes: aprobar con la posición
              deseada como sugerencia, o volver a notificaciones */}
          {request.estado === 'pendiente' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, posicion: request.posicion_deseada }));
                    handleApprove();
                  }}
                  disabled={processing}
                  className="w-full px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 text-sm font-medium"
                >
                  Aprobar con posición sugerida
                </button>
                
                <button
                  onClick={() => navigate('/admin/notifications')}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Volver a notificaciones
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeRequestDetail;
