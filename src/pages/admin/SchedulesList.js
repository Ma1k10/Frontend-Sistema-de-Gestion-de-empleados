// React y hooks para estado local, efectos y memoización
import React, { useState, useEffect, useMemo } from 'react';
// useNavigate para ir a crear/editar horarios
import { useNavigate } from 'react-router-dom';
// Contexto con la lista de horarios y acciones (fetch, delete, export PDF)
import { useSchedules } from '../../contexts/SchedulesContext';
// Contexto de empleados, usado para el filtro por empleado
import { useEmployees } from '../../contexts/EmployeesContext';
// Guardia de rol: solo administradores acceden a esta página
import RoleGuard from '../../components/auth/RoleGuard';
// Estilos propios de la lista de horarios
import './SchedulesList.css';

const SchedulesList = () => {
  // Desestructura del contexto de horarios: datos, carga, error y acciones
  const { 
    schedules, 
    loading, 
    error, 
    fetchSchedules, 
    deleteSchedule,
    exportToPDF 
  } = useSchedules();
  // Empleados disponibles para el filtro desplegable
  const { employees } = useEmployees();
  
  // Texto de búsqueda por nombre, correo o fecha
  const [searchTerm, setSearchTerm] = useState('');
  // Filtro por empleado ('all' o el id del empleado)
  const [filterEmployee, setFilterEmployee] = useState('all');
  // Rango de fechas para filtrar (fecha inicio y fin, pueden ser vacías)
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  // Controla la visibilidad del modal de confirmación de borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Horario seleccionado que se desea eliminar
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  // Controla la visibilidad del modal de exportación a PDF
  const [showExportModal, setShowExportModal] = useState(false);
  const navigate = useNavigate();

  // Al montar el componente se descargan los horarios del backend
  useEffect(() => {
    fetchSchedules();
  }, []);

  // Filtra los horarios aplicando tres criterios combinados:
  // búsqueda de texto, empleado seleccionado y rango de fechas.
  // Se memoiza para recalcular solo cuando cambian los filtros o la lista.
  const filteredSchedules = useMemo(() => {
    if (!Array.isArray(schedules)) {
      return [];
    }
    return schedules.filter(schedule => {
      const employeeName = schedule.empleado?.usuario?.nombre || '';
      const employeeEmail = schedule.empleado?.usuario?.correo || '';
      const date = schedule.fecha || '';
      
      // Búsqueda
      const matchesSearch = searchTerm === '' || 
        employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        date.includes(searchTerm);

      // Filtro por empleado
      const matchesEmployee = filterEmployee === 'all' || 
        schedule.id_empleado === parseInt(filterEmployee);

      // Filtro por rango de fechas: soporta inicio, fin, ambos o ninguno
      let matchesDateRange = true;
      if (filterDateRange.start && filterDateRange.end) {
        const scheduleDate = new Date(date);
        const startDate = new Date(filterDateRange.start);
        const endDate = new Date(filterDateRange.end);
        matchesDateRange = scheduleDate >= startDate && scheduleDate <= endDate;
      } else if (filterDateRange.start) {
        const scheduleDate = new Date(date);
        const startDate = new Date(filterDateRange.start);
        matchesDateRange = scheduleDate >= startDate;
      } else if (filterDateRange.end) {
        const scheduleDate = new Date(date);
        const endDate = new Date(filterDateRange.end);
        matchesDateRange = scheduleDate <= endDate;
      }

      return matchesSearch && matchesEmployee && matchesDateRange;
    });
  }, [schedules, searchTerm, filterEmployee, filterDateRange]);

  // Estadísticas: total de horarios y cuántos caen dentro de la semana actual.
  // Nota: 'active' se devuelve en el estado inicial pero no se usa en el JSX.
  const stats = useMemo(() => {
    if (!Array.isArray(schedules)) {
      return { total: 0, thisWeek: 0, active: 0 };
    }
    const total = schedules.length;
    const thisWeek = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.fecha);
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    }).length;

    return { total, thisWeek };
  }, [schedules]);

  // Navega a la ruta de edición del horario seleccionado
  const handleEdit = (schedule) => {
    navigate(`/admin/schedules/${schedule.id}/edit`);
  };

  // Prepara el modal de confirmación guardando el horario a eliminar
  const handleDelete = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  // Ejecuta la eliminación real vía contexto y cierra el modal
  const confirmDelete = async () => {
    if (scheduleToDelete) {
      try {
        await deleteSchedule(scheduleToDelete.id);
        setShowDeleteModal(false);
        setScheduleToDelete(null);
      } catch (error) {
        console.error('Error al eliminar horario:', error);
      }
    }
  };

  // Cancela la eliminación y limpia el estado del modal
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setScheduleToDelete(null);
  };

  // Exporta a PDF combinando los filtros activos de la vista.
  // Los valores 'all'/vacíos se envían como undefined para no filtrar.
  const handleExport = async (filters = {}) => {
    try {
      const exportFilters = {
        ...filters,
        id_empleado: filterEmployee !== 'all' ? filterEmployee : undefined,
        fecha_inicio: filterDateRange.start || undefined,
        fecha_fin: filterDateRange.end || undefined
      };
      
      await exportToPDF(exportFilters, 'Reporte de Horarios');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  // Reinicia todos los filtros a sus valores por defecto
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmployee('all');
    setFilterDateRange({ start: '', end: '' });
  };
  // Mientras carga (o si schedules aún no es un array) se muestra un spinner
  if (loading || !Array.isArray(schedules)) {
    return (
      <RoleGuard requiredRole="admin">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando horarios...</p>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="admin">
      <div className="schedules-list">
        {/* Encabezado con título y acciones: exportar PDF y crear horario */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Gestión de Horarios</h1>
            <p className="page-subtitle">Administra los horarios de los empleados</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary"
            >
              <span className="btn-icon">📄</span>
              Exportar PDF
            </button>
            <button 
              onClick={() => navigate('/admin/schedules/new')}
              className="btn btn-primary"
            >
              <span className="btn-icon">+</span>
              Nuevo Horario
            </button>
          </div>
        </div>

        {/* Tarjetas de estadísticas: total de horarios y horarios de esta semana */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <span>📅</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.total}</p>
              <p className="stat-label">Total Horarios</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon week">
              <span>📆</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.thisWeek}</p>
              <p className="stat-label">Esta Semana</p>
            </div>
          </div>
        </div>

        {/* Panel de filtros: búsqueda, empleado, rango de fechas y botón limpiar */}
        <div className="filters-section">
          <div className="filters-grid">
            {/* Search */}
            <div className="filter-group">
              <label className="filter-label">Buscar</label>
              <div className="search-input">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar horarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-field"
                />
              </div>
            </div>

            {/* Employee Filter */}
            <div className="filter-group">
              <label className="filter-label">Empleado</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos los empleados</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.usuario?.nombre || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="filter-group">
              <label className="filter-label">Fecha Inicio</label>
              <input
                type="date"
                value={filterDateRange.start}
                onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Fecha Fin</label>
              <input
                type="date"
                value={filterDateRange.end}
                onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Alerta de error del contexto si la carga falló */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tabla de horarios filtrados o mensaje de estado vacío */}
        <div className="schedules-table">
          {filteredSchedules.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Cada fila muestra un horario: empleado, fecha, horario y acciones */}
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {schedule.empleado?.usuario?.nombre?.charAt(0).toUpperCase() || 'E'}
                          </div>
                          <div>
                            <div className="employee-name">
                              {schedule.empleado?.usuario?.nombre || 'Sin nombre'}
                            </div>
                            <div className="employee-email">
                              {schedule.empleado?.usuario?.correo || 'Sin correo'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="date">
                          {schedule.fecha 
                            ? new Date(schedule.fecha).toLocaleDateString()
                            : 'Sin fecha'
                          }
                        </span>
                      </td>
                      <td>
                        <div className="time-range">
                          <span className="time-start">
                            {schedule.hora_inicio || 'N/A'}
                          </span>
                          <span className="time-separator">-</span>
                          <span className="time-end">
                            {schedule.hora_fin || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="status active">
                          Activo
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="btn btn-sm btn-secondary"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(schedule)}
                            className="btn btn-sm btn-danger"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Estado vacío: mensaje distinto si hay filtros activos o no */
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>
                {searchTerm || filterEmployee !== 'all' || filterDateRange.start || filterDateRange.end
                  ? 'No se encontraron horarios' 
                  : 'No hay horarios'
                }
              </h3>
              <p>
                {searchTerm || filterEmployee !== 'all' || filterDateRange.start || filterDateRange.end
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primer horario usando el botón superior'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación de horario */}
        {showDeleteModal && scheduleToDelete && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Confirmar Eliminación</h3>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar el horario:</p>
                <div className="modal-schedule-info">
                  <p><strong>Empleado:</strong> {scheduleToDelete.empleado?.usuario?.nombre}</p>
                  <p><strong>Fecha:</strong> {new Date(scheduleToDelete.fecha).toLocaleDateString()}</p>
                  <p><strong>Horario:</strong> {scheduleToDelete.hora_inicio} - {scheduleToDelete.hora_fin}</p>
                </div>
                <p className="modal-warning">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  onClick={cancelDelete}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de exportación a PDF: permite elegir entre todos los horarios
            o solo los que cumplen los filtros actuales */}
        {showExportModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Exportar a PDF</h3>
              </div>
              <div className="modal-body">
                <p>Selecciona los criterios de exportación:</p>
                <div className="export-options">
                  <label className="export-option">
                    <input
                      type="radio"
                      name="exportType"
                      defaultChecked
                      onChange={() => {}}
                    />
                    <span>Exportar todos los horarios</span>
                  </label>
                  <label className="export-option">
                    <input
                      type="radio"
                      name="exportType"
                      onChange={() => {}}
                    />
                    <span>Exportar con filtros actuales</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleExport()}
                  className="btn btn-primary"
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default SchedulesList;
