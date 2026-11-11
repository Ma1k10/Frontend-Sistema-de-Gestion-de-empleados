// Importaciones de React y de los iconos de lucide-react usados en la interfaz
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Mail,
  User,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
// Servicio que consume la API de solicitudes de empleo del usuario
import * as employeeRequestService from '../../services/employeeRequests';

// Componente que muestra al usuario el estado de sus solicitudes de empleo
const RequestStatus = () => {
  // Lista de solicitudes, estado de carga y mensaje de error
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar mis solicitudes
  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await employeeRequestService.getMyEmployeeRequests();
      
      if (response.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      setError('Error al cargar tus solicitudes de empleo');
    } finally {
      setLoading(false);
    }
  };

  // Efecto que carga las solicitudes una sola vez al montar el componente
  useEffect(() => {
    loadRequests();
  }, []);

  // Obtener color según estado
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

  // Obtener icono según estado
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

  // Pantalla de carga a pantalla completa mientras se obtienen las solicitudes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: título de la página y descripción */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estado de tu Solicitud</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revisa el estado de tu solicitud de empleo y las notificaciones
        </p>
      </div>

      {/* Alerta de error visible solo cuando la carga de solicitudes falla */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Condicional: estado vacío si no hay solicitudes, o lista de tarjetas con cada solicitud */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes solicitudes de empleo</h3>
          <p className="text-sm text-gray-500 mb-6">
            Aún no has enviado ninguna solicitud de empleo. Cuando lo hagas, podrás ver el estado aquí.
          </p>
          {/* El botón redirige a la página de registro para crear una nueva solicitud de empleo */}
          <button
            onClick={() => window.location.href = '/register'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crear Nueva Solicitud
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header de la solicitud: icono de estado, número de solicitud, fecha y badge de estado */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(request.estado)}`}>
                      {getStatusIcon(request.estado)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Solicitud de Empleo
                      </h3>
                      <p className="text-sm text-gray-500">
                        #{request.id} • Enviada el {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.estado)}`}>
                    {getStatusIcon(request.estado)}
                    <span className="ml-1 capitalize">{request.estado}</span>
                  </div>
                </div>
              </div>

              {/* Contenido de la solicitud: datos de la solicitud y panel de estado en dos columnas */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información básica: posición deseada, fecha de envío y mensaje opcional */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Información de la Solicitud</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Posición Deseada</p>
                          <p className="text-gray-900">{request.posicion_deseada}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Fecha de Envío</p>
                          <p className="text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()} a las{' '}
                            {new Date(request.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mensaje adicional enviado por el solicitante (solo si existe) */}
                    {request.mensaje && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Mensaje Adicional</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-700 whitespace-pre-wrap">{request.mensaje}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estado y detalles: panel con color según el estado y datos del revisor */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Estado y Procesamiento</h4>
                    
                    <div className="space-y-3">
                      {/* Solicitud pendiente: aviso de que está siendo revisada */}
                      {request.estado === 'pendiente' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="font-medium text-amber-900">En Revisión</span>
                          </div>
                          <p className="text-sm text-amber-800">
                            Tu solicitud está siendo revisada por el equipo de administración. 
                            Te notificaremos cuando haya una actualización.
                          </p>
                        </div>
                      )}

                      {/* Solicitud aprobada: mensaje de éxito y fecha de revisión si existe */}
                      {request.estado === 'aprobada' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-900">¡Aprobada!</span>
                          </div>
                          <p className="text-sm text-green-800 mb-3">
                            ¡Felicidades! Tu solicitud ha sido aprobada. Ahora eres parte del equipo.
                          </p>
                          
                          {request.fecha_revision && (
                            <p className="text-xs text-green-700">
                              Aprobada el {new Date(request.fecha_revision).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Solicitud rechazada: mensaje, motivo del rechazo y fecha de revisión si existe */}
                      {request.estado === 'rechazada' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-900">Rechazada</span>
                          </div>
                          <p className="text-sm text-red-800 mb-3">
                            Lamentamos informarte que tu solicitud no ha sido aprobada en esta ocasión.
                          </p>
                          
                          {request.motivo_rechazo && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-red-900 mb-1">Motivo:</p>
                              <p className="text-sm text-red-700">{request.motivo_rechazo}</p>
                            </div>
                          )}
                          
                          {request.fecha_revision && (
                            <p className="text-xs text-red-700 mt-2">
                              Revisada el {new Date(request.fecha_revision).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Revisor: muestra quién procesó la solicitud, solo si el dato existe */}
                      {/* Revisor: muestra quién procesó la solicitud, solo si el dato existe */}
                      {request.revisor && (
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Revisado por</p>
                            <p className="text-gray-900">{request.revisor.nombre}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones: mensaje contextual según el estado y botón para recargar las solicitudes */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {request.estado === 'pendiente' 
                        ? 'Te enviaremos una notificación cuando haya novedades sobre tu solicitud.'
                        : 'Gracias por tu interés en formar parte de nuestro equipo.'
                      }
                    </p>
                    
                    {/* Botón que vuelve a llamar loadRequests para refrescar el estado de las solicitudes */}
                    <button
                      onClick={loadRequests}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Actualizar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestStatus;
