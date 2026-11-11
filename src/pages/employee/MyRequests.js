// Importaciones de React
import React, { useState, useEffect, useMemo } from 'react';
// Hook de react-router-dom para navegar a la página de crear solicitud
import { useNavigate } from 'react-router-dom';
// Contexto de solicitudes de horario: provee las solicitudes del empleado y su carga
import { useScheduleRequests } from '../../contexts/ScheduleRequestsContext';
// Estilos específicos de la página "Mis Solicitudes"
import './MyRequests.css';

// Componente que lista las solicitudes de cambio de horario del empleado con filtros y estadísticas
const MyRequests = () => {
  // Solicitudes, estado de carga/error y función para recargar las solicitudes propias
  const { scheduleRequests, loading, error, fetchMyScheduleRequests } = useScheduleRequests();
  // Término de búsqueda por fecha y filtro por estado de la solicitud
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  // Cargar solicitudes al montar
  useEffect(() => {
    fetchMyScheduleRequests();
  }, []); // Array vacío para que se ejecute solo una vez

  // Filtrar solicitudes del empleado actual
  const myRequests = useMemo(() => {
    // Aquí filtraríamos solo las solicitudes del empleado logueado
    // Por ahora mostramos todas las solicitudes como ejemplo
    return scheduleRequests.filter(request => {
      const date = request.fecha_solicitada || '';
      
      // Búsqueda
      const matchesSearch = searchTerm === '' || 
        date.includes(searchTerm);

      // Filtro por estado
      const matchesStatus = filterStatus === 'all' || 
        request.estado === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [scheduleRequests, searchTerm, filterStatus]);

  // Estadísticas: cuenta solicitudes por estado para las tarjetas resumen
  const stats = useMemo(() => {
    const total = myRequests.length;
    const pending = myRequests.filter(req => req.estado === 'pendiente').length;
    const approved = myRequests.filter(req => req.estado === 'aprobada').length;
    const rejected = myRequests.filter(req => req.estado === 'rechazada').length;

    return { total, pending, approved, rejected };
  }, [myRequests]);

  // Devuelve la clase CSS del estado (pending/approved/rejected) para el badge de la tabla
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'pending';
      case 'aprobada':
        return 'approved';
      case 'rechazada':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  // Devuelve el texto en español que se muestra para cada estado de solicitud
  const getStatusText = (status) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      default:
        return status;
    }
  };

  // Devuelve el emoji/icono que representa visualmente cada estado de solicitud
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente':
        return '⏳';
      case 'aprobada':
        return '✅';
      case 'rechazada':
        return '❌';
      default:
        return '📋';
    }
  };
  // Mientras carga la primera vez, se muestra un spinner en lugar del contenido
  if (loading && scheduleRequests.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="my-requests">
        {/* Header: título de la página y botón para crear una nueva solicitud */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Mis Solicitudes</h1>
            <p className="page-subtitle">Gestiona tus solicitudes de cambio de horario</p>
          </div>
          {/* Botón que navega a la página de creación de solicitudes de cambio */}
          <button 
            onClick={() => navigate('/employee/create-request')}
            className="btn btn-primary"
          >
            <span className="btn-icon">+</span>
            Nueva Solicitud
          </button>
        </div>

        {/* Stats Cards: resumen de solicitudes totales, pendientes, aprobadas y rechazadas */}
        <div className="stats-grid">
          {/* Tarjeta: total de solicitudes */}
          <div className="stat-card">
            <div className="stat-icon total">
              <span>📋</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.total}</p>
              <p className="stat-label">Total Solicitudes</p>
            </div>
          </div>

          {/* Tarjeta: solicitudes pendientes de revisión */}
          <div className="stat-card">
            <div className="stat-icon pending">
              <span>⏳</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.pending}</p>
              <p className="stat-label">Pendientes</p>
            </div>
          </div>

          {/* Tarjeta: solicitudes aprobadas */}
          <div className="stat-card">
            <div className="stat-icon approved">
              <span>✅</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.approved}</p>
              <p className="stat-label">Aprobadas</p>
            </div>
          </div>

          {/* Tarjeta: solicitudes rechazadas */}
          <div className="stat-card">
            <div className="stat-icon rejected">
              <span>❌</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.rejected}</p>
              <p className="stat-label">Rechazadas</p>
            </div>
          </div>
        </div>

        {/* Filters: búsqueda por fecha solicitada y filtro por estado de la solicitud */}
        <div className="filters-section">
          <div className="filters-grid">
            {/* Search */}
            <div className="filter-group">
              <label className="filter-label">Buscar</label>
              <div className="search-input">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar solicitudes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-field"
                />
              </div>
            </div>

            {/* Status Filter: el select controla filterStatus para filtrar por pendiente/aprobada/rechazada */}
            <div className="filter-group">
              <label className="filter-label">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobada">Aprobadas</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error: alerta visible solo cuando el contexto reporta un error */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Requests Table: muestra la tabla de solicitudes o un estado vacío si no hay resultados */}
        <div className="requests-table">
          {myRequests.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha Solicitada</th>
                    <th>Horario Actual</th>
                    <th>Nuevo Horario</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="date-info">
                          <span className="date-number">
                            {request.fecha_solicitada ? new Date(request.fecha_solicitada).getDate() : 'N/A'}
                          </span>
                          <span className="date-month">
                            {request.fecha_solicitada ? new Date(request.fecha_solicitada).toLocaleDateString('es-ES', { month: 'short' }) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="time-range current">
                          <span className="time-label">Actual:</span>
                          <div className="time-values">
                            {request.hora_actual_inicio && request.hora_actual_fin
                              ? `${request.hora_actual_inicio} - ${request.hora_actual_fin}`
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="time-range new">
                          <span className="time-label">Nuevo:</span>
                          <div className="time-values">
                            {request.nueva_hora_inicio && request.nueva_hora_fin
                              ? `${request.nueva_hora_inicio} - ${request.nueva_hora_fin}`
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </td>
                      <td>
                        {/* Motivo truncado a 50 caracteres con tooltip completo; muestra "Sin motivo" si está vacío */}
                        <div className="motivo">
                          {request.motivo ? (
                            <span className="motivo-text" title={request.motivo}>
                              {request.motivo.length > 50 
                                ? `${request.motivo.substring(0, 50)}...`
                                : request.motivo
                              }
                            </span>
                          ) : (
                            <span className="no-motivo">Sin motivo</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {/* Badge de estado: combina color, icono y texto según el estado de la solicitud */}
                        <span className={`status ${getStatusColor(request.estado)}`}>
                          <span className="status-icon">{getStatusIcon(request.estado)}</span>
                          {getStatusText(request.estado)}
                        </span>
                      </td>
                      <td>
                        {/* Columna de acciones: solo muestra texto informativo del estado, sin botones */}
                        <div className="actions">
                          {request.estado === 'pendiente' && (
                            <span className="pending-text">En revisión</span>
                          )}
                          {request.estado === 'aprobada' && (
                            <span className="approved-text">✅ Aprobada</span>
                          )}
                          {request.estado === 'rechazada' && (
                            <span className="rejected-text">❌ Rechazada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Estado vacío: el mensaje cambia según haya filtros activos o no haya solicitudes
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>
                {searchTerm || filterStatus !== 'all'
                  ? 'No se encontraron solicitudes' 
                  : 'No tienes solicitudes'
                }
              </h3>
              <p>
                {searchTerm || filterStatus !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primera solicitud usando el botón superior'
                }
              </p>
            </div>
          )}
        </div>
      </div>
  );
};

export default MyRequests;
