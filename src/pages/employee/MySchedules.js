// Importaciones de React y del router para navegación
import React, { useState, useEffect, useMemo, useRef } from 'react';
// Hook de react-router-dom para navegar a otras páginas (ej. crear solicitud)
import { useNavigate } from 'react-router-dom';
// Contexto de horarios: provee los horarios del empleado logueado y su carga
import { useSchedules } from '../../contexts/SchedulesContext';
// Componente que restringe el acceso según el rol del usuario
import RoleGuard from '../../components/auth/RoleGuard';
// Estilos específicos de la página "Mis Horarios"
import './MySchedules.css';

// Componente que muestra al empleado su calendario de trabajo con filtros y estadísticas
const MySchedules = () => {
  // Datos y funciones del contexto de horarios
  const { mySchedules, loading, error, fetchMySchedules } = useSchedules();
  const navigate = useNavigate();
  // Término de búsqueda por fecha y filtros de período (semana/mes)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const hasLoaded = useRef(false);
  
  // Cargar horarios al montar (solo una vez)
  useEffect(() => {
    console.log('MySchedules - Cargando horarios...');
    fetchMySchedules();
  }, []); // Sin dependencias para evitar ciclos

  // Debug: Mostrar datos recibidos
  useEffect(() => {
    console.log('MySchedules - mySchedules:', mySchedules);
    console.log('MySchedules - loading:', loading);
    console.log('MySchedules - error:', error);
  }, [mySchedules, loading, error]);

  // Filtrar horarios del empleado actual
  const filteredSchedules = useMemo(() => {
    return mySchedules.filter(schedule => {
      const date = schedule.fecha || '';
      
      // Búsqueda
      const matchesSearch = searchTerm === '' || 
        date.includes(searchTerm);

      // Filtro por semana/mes
      let matchesDate = true;
      if (filterWeek === 'current') {
        const scheduleDate = new Date(date);
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        matchesDate = scheduleDate >= weekStart && scheduleDate <= weekEnd;
      } else if (filterMonth === 'current') {
        const scheduleDate = new Date(date);
        const today = new Date();
        matchesDate = scheduleDate.getMonth() === today.getMonth() && 
                   scheduleDate.getFullYear() === today.getFullYear();
      }

      return matchesSearch && matchesDate;
    });
  }, [mySchedules, searchTerm, filterWeek, filterMonth]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = filteredSchedules.length;
    const thisWeek = filteredSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.fecha);
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    }).length;

    // Suma las horas de cada horario calculando la diferencia entre hora_fin y hora_inicio;
    // se usan fechas ficticias (2000-01-01) para poder restar horas como objetos Date
    const totalHours = filteredSchedules.reduce((total, schedule) => {
      if (schedule.hora_inicio && schedule.hora_fin) {
        const start = new Date(`2000-01-01T${schedule.hora_inicio}`);
        const end = new Date(`2000-01-01T${schedule.hora_fin}`);
        const hours = (end - start) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

    return { total, thisWeek, totalHours: Math.round(totalHours * 10) / 10 };
  }, [filteredSchedules]);

  // Calcula el rango de fechas de la semana actual para mostrarlo en los filtros
  const getWeekDates = () => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return {
      start: weekStart.toLocaleDateString(),
      end: weekEnd.toLocaleDateString()
    };
  };

  // Calcula el rango de fechas del mes actual para mostrarlo en los filtros
  const getMonthDates = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: monthStart.toLocaleDateString(),
      end: monthEnd.toLocaleDateString()
    };
  };
  // Mientras carga la primera vez, se muestra un spinner en lugar del contenido
  if (loading && mySchedules.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando horarios...</p>
      </div>
    );
  }

  return (
    <div className="my-schedules">
        {/* Header: título y subtítulo de la página */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Mis Horarios</h1>
            <p className="page-subtitle">Consulta tu calendario de trabajo</p>
          </div>
        </div>

        {/* Stats Cards: total de horarios, horarios de la semana y horas acumuladas */}
        <div className="stats-grid">
          {/* Tarjeta: número total de horarios filtrados */}
          <div className="stat-card">
            <div className="stat-icon total">
              <span>📅</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.total}</p>
              <p className="stat-label">Total Horarios</p>
            </div>
          </div>

          {/* Tarjeta: horarios asignados en la semana actual */}
          <div className="stat-card">
            <div className="stat-icon week">
              <span>📆</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.thisWeek}</p>
              <p className="stat-label">Esta Semana</p>
            </div>
          </div>

          {/* Tarjeta: suma de horas de todos los horarios filtrados */}
          <div className="stat-card">
            <div className="stat-icon hours">
              <span>⏰</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.totalHours}</p>
              <p className="stat-label">Horas Totales</p>
            </div>
          </div>
        </div>

        {/* Action Button: navega a la página para crear una solicitud de cambio de horario */}
        <div className="action-section">
          <button 
            onClick={() => navigate('/employee/create-request')}
            className="btn btn-primary"
          >
            📝 Solicitar Cambio de Horario
          </button>
        </div>

        {/* Filters: búsqueda por texto y selección de período (semana/mes/todos) */}
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

            {/* Date Filter: el valor del select controla filterWeek, que filtra por período */}
            <div className="filter-group">
              <label className="filter-label">Período</label>
              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="filter-select"
              >
                <option value="current">Esta Semana</option>
                <option value="month">Este Mes</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>

          {/* Muestra el rango de fechas exacto del período seleccionado (semana o mes) */}
          <div className="filter-info">
            {filterWeek === 'current' && (
              <span className="filter-text">
                {getWeekDates().start} - {getWeekDates().end}
              </span>
            )}
            {filterWeek === 'month' && (
              <span className="filter-text">
                {getMonthDates().start} - {getMonthDates().end}
              </span>
            )}
          </div>
        </div>

        {/* Error: alerta visible solo cuando el contexto reporta un error */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Schedules Table: muestra la tabla si hay horarios; si no, un estado vacío con mensaje */}
        <div className="schedules-table">
          {filteredSchedules.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Día</th>
                    <th>Horario</th>
                    <th>Duración</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((schedule) => {
                    // Prepara los datos de presentación: nombre del día, duración en horas y fecha
                    const date = new Date(schedule.fecha);
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
                    const duration = schedule.hora_inicio && schedule.hora_fin 
                      ? `${Math.round((new Date(`2000-01-01T${schedule.hora_fin}`) - new Date(`2000-01-01T${schedule.hora_inicio}`)) / (1000 * 60 * 60) * 10) / 10}h`
                      : 'N/A';
                    
                    return (
                      <tr key={schedule.id}>
                        <td>
                          <div className="date-info">
                            <span className="date-number">
                              {date.getDate()}
                            </span>
                            <span className="date-month">
                              {date.toLocaleDateString('es-ES', { month: 'short' })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="day-name">{dayName}</span>
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
                          <span className="duration">{duration}</span>
                        </td>
                        <td>
                          <span className="status active">
                            Activo
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Estado vacío: el mensaje cambia según haya filtros activos o no haya horarios asignados
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>
                {searchTerm || filterWeek !== 'all'
                  ? 'No se encontraron horarios' 
                  : 'No tienes horarios asignados'
                }
              </h3>
              <p>
                {searchTerm || filterWeek !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Tus horarios aparecerán aquí cuando el administrador los asigne'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
};

export default MySchedules;
