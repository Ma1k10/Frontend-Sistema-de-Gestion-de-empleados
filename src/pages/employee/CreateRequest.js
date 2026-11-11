// Importaciones de React
import React, { useState, useEffect } from 'react';
// Hook de react-router-dom para navegar (volver a Mis Solicitudes tras enviar/cancelar)
import { useNavigate } from 'react-router-dom';
// Contexto de solicitudes de horario: provee la función para crear una solicitud
import { useScheduleRequests } from '../../contexts/ScheduleRequestsContext';
// Contexto de horarios: provee los horarios del empleado para seleccionarlos
import { useSchedules } from '../../contexts/SchedulesContext';
// Contexto de autenticación: se usa para verificar que el usuario sea empleado
import { useAuth } from '../../contexts/AuthContext';
// Estilos específicos de la página de creación de solicitudes
import './CreateRequest.css';

// Componente con el formulario para que el empleado solicite un cambio de horario
const CreateRequest = () => {
  // Función del contexto para enviar la nueva solicitud al backend
  const { createScheduleRequest } = useScheduleRequests();
  // Horarios del empleado y función para cargarlos al montar
  const { mySchedules, fetchMySchedules } = useSchedules();
  // Verifica el rol del usuario; solo los empleados pueden crear solicitudes
  const { isEmployee } = useAuth();
  const navigate = useNavigate();
  
  // Estado del formulario: fecha, horario actual, nuevo horario y motivo del cambio
  const [formData, setFormData] = useState({
    fecha_solicitada: '',
    hora_actual_inicio: '',
    hora_actual_fin: '',
    nueva_hora_inicio: '',
    nueva_hora_fin: '',
    motivo: ''
  });
  
  // Estados de UI: carga, error y mensaje de éxito
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  // Horario existente seleccionado en el desplegable, usado para precargar el formulario
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Cargar horarios del empleado al montar
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        // Verificar que el usuario sea empleado
        if (!isEmployee()) {
          setError('Solo los empleados pueden crear solicitudes de cambio de horario.');
          return;
        }
        
        await fetchMySchedules();
      } catch (error) {
        console.error('Error loading schedules:', error);
        setError('Error al cargar tus horarios. Intenta recargar la página.');
      }
    };
    
    loadSchedules();
  }, [isEmployee, fetchMySchedules]);

  // Manejar selección de horario
  const handleScheduleSelect = (scheduleId) => {
    const schedule = mySchedules.find(s => s.id === parseInt(scheduleId));
    if (schedule) {
      setSelectedSchedule(schedule);
      // Precarga en el formulario la fecha y el horario actual del horario elegido,
      // y limpia el nuevo horario para que el empleado lo defina
      setFormData(prev => ({
        ...prev,
        fecha_solicitada: schedule.fecha,
        hora_actual_inicio: schedule.hora_inicio ? schedule.hora_inicio.substring(0, 5) : '',
        hora_actual_fin: schedule.hora_fin ? schedule.hora_fin.substring(0, 5) : '',
        nueva_hora_inicio: '',
        nueva_hora_fin: ''
      }));
    }
  };

  // Actualiza un campo del formulario según el name del input y limpia mensajes previos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar mensajes
    if (message) setMessage('');
    if (error) setError('');
  };

  // Valida todos los campos del formulario y devuelve un arreglo con los errores encontrados
  const validateForm = () => {
    const errors = [];
    
    if (!formData.fecha_solicitada) {
      errors.push('La fecha solicitada es requerida');
    }
    
    if (!formData.hora_actual_inicio || !formData.hora_actual_fin) {
      errors.push('El horario actual es requerido');
    }
    
    if (!formData.nueva_hora_inicio || !formData.nueva_hora_fin) {
      errors.push('El nuevo horario es requerido');
    }
    
    if (!formData.motivo.trim()) {
      errors.push('El motivo es requerido');
    }
    
    // Validar que las horas sean válidas
    if (formData.hora_actual_inicio >= formData.hora_actual_fin) {
      errors.push('La hora de fin actual debe ser posterior a la hora de inicio');
    }
    
    if (formData.nueva_hora_inicio >= formData.nueva_hora_fin) {
      errors.push('La hora de fin nueva debe ser posterior a la hora de inicio');
    }
    
    // Validar que la fecha no sea pasada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDate = new Date(formData.fecha_solicitada);
    if (requestDate < today) {
      errors.push('La fecha solicitada no puede ser anterior a hoy');
    }
    
    return errors;
  };

  // Envía la solicitud de cambio de horario al backend y maneja errores del servidor
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar que el usuario sea empleado
    if (!isEmployee()) {
      setError('Solo los empleados pueden crear solicitudes de cambio de horario.');
      return;
    }
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      // Formatear las horas para asegurar formato HH:MM
      const formattedData = {
        ...formData,
        hora_actual_inicio: formData.hora_actual_inicio ? formData.hora_actual_inicio.substring(0, 5) : '',
        hora_actual_fin: formData.hora_actual_fin ? formData.hora_actual_fin.substring(0, 5) : '',
        nueva_hora_inicio: formData.nueva_hora_inicio ? formData.nueva_hora_inicio.substring(0, 5) : '',
        nueva_hora_fin: formData.nueva_hora_fin ? formData.nueva_hora_fin.substring(0, 5) : ''
      };
      
      await createScheduleRequest(formattedData);
      setMessage('Solicitud creada exitosamente. Será revisada por el administrador.');
      
      // Limpiar formulario
      setFormData({
        fecha_solicitada: '',
        hora_actual_inicio: '',
        hora_actual_fin: '',
        nueva_hora_inicio: '',
        nueva_hora_fin: '',
        motivo: ''
      });
      setSelectedSchedule(null);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/employee/my-requests');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating schedule request:', error);
      // Traduce los códigos de error del backend a mensajes entendibles para el usuario
      let errorMessage = 'Error al crear la solicitud';
      
      if (error.response?.data?.error === 'EMPLOYEE_NOT_FOUND') {
        errorMessage = 'No se encontró tu registro de empleado. Contacta al administrador.';
      } else if (error.response?.data?.error === 'SCHEDULE_REQUEST_ALREADY_APPROVED') {
        errorMessage = 'Ya tienes una solicitud aprobada. No puedes realizar otra solicitud mientras exista una aprobada.';
      } else if (
        error.response?.data?.error === 'PENDING_REQUEST_ALREADY_EXISTS' ||
        error.response?.data?.error === 'SCHEDULE_REQUEST_ALREADY_EXISTS_FOR_HORARIO'
      ) {
        errorMessage = 'Ya existe una solicitud previa para este horario. Solo puedes hacer una solicitud por horario.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cancela la creación y regresa a la lista de solicitudes del empleado
  const handleCancel = () => {
    navigate('/employee/my-requests');
  };

  // Devuelve la fecha de hoy en formato YYYY-MM-DD para usarla como fecha mínima en el input
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  return (
    <div className="create-request">
        {/* Header: título y subtítulo de la página de creación */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Crear Solicitud</h1>
            <p className="page-subtitle">Solicita un cambio en tu horario</p>
          </div>
        </div>

        {/* Form: contenedor del formulario que llama a handleSubmit al enviarse */}
        <div className="form-container">
          <form onSubmit={handleSubmit} className="request-form">
            {/* Success Message: alerta verde que aparece tras crear la solicitud */}
            {message && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                <span>{message}</span>
              </div>
            )}
            
            {/* Error Message: alerta roja que muestra errores de validación o del servidor */}
            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-grid">
              {/* Seleccionar Horario Existente: al elegir uno se precargan fecha y horario actual */}
              <div className="form-group full-width">
                <label className="form-label">Seleccionar Horario a Cambiar *</label>
                <select
                  value={selectedSchedule ? selectedSchedule.id : ""}
                  onChange={(e) => handleScheduleSelect(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Selecciona un horario --</option>
                  {mySchedules.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.fecha} - {schedule.hora_inicio} a {schedule.hora_fin}
                    </option>
                  ))}
                </select>
                {/* Aviso cuando el empleado no tiene horarios asignados y el selector queda vacío */}
                {mySchedules.length === 0 && (
                  <p className="form-help">No tienes horarios asignados. Contacta al administrador.</p>
                )}
              </div>

              {/* Fecha Solicitada */}
              <div className="form-group full-width">
                <label className="form-label">Fecha del Cambio *</label>
                <input
                  type="date"
                  name="fecha_solicitada"
                  value={formData.fecha_solicitada}
                  onChange={handleChange}
                  min={getMinDate()}
                  className="form-input"
                  required
                />
              </div>

              {/* Horario Actual: se bloquea en modo solo lectura cuando hay un horario seleccionado */}
              <div className="form-section">
                <h3 className="section-title">Horario Actual</h3>
                <div className="time-inputs">
                  <div className="form-group">
                    <label className="form-label">Hora Inicio *</label>
                    <input
                      type="time"
                      name="hora_actual_inicio"
                      value={formData.hora_actual_inicio}
                      onChange={handleChange}
                      className="form-input"
                      readOnly={selectedSchedule !== null}
                      placeholder={selectedSchedule ? 'Seleccionado del horario existente' : 'Ingresa hora actual'}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Fin *</label>
                    <input
                      type="time"
                      name="hora_actual_fin"
                      value={formData.hora_actual_fin}
                      onChange={handleChange}
                      className="form-input"
                      readOnly={selectedSchedule !== null}
                      placeholder={selectedSchedule ? 'Seleccionado del horario existente' : 'Ingresa hora actual'}
                      required
                    />
                  </div>
                </div>
                {/* Nota informativa cuando el horario actual viene precargado de la selección */}
                {selectedSchedule && (
                  <p className="form-help">ℹ️ Horario precargado desde tu selección. Solo puedes modificar el nuevo horario.</p>
                )}
              </div>

              {/* Nuevo Horario: rango de horas deseado para el cambio solicitado */}
              <div className="form-section">
                <h3 className="section-title">Nuevo Horario</h3>
                <div className="time-inputs">
                  <div className="form-group">
                    <label className="form-label">Hora Inicio *</label>
                    <input
                      type="time"
                      name="nueva_hora_inicio"
                      value={formData.nueva_hora_inicio}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Fin *</label>
                    <input
                      type="time"
                      name="nueva_hora_fin"
                      value={formData.nueva_hora_fin}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Motivo: textarea donde el empleado explica la razón del cambio */}
              <div className="form-group full-width">
                <label className="form-label">Motivo del Cambio *</label>
                <textarea
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Explica por qué necesitas cambiar tu horario..."
                  rows={4}
                  required
                />
                <p className="form-help">
                  Sé específico sobre el motivo de tu solicitud para facilitar su aprobación.
                </p>
              </div>
            </div>

            {/* Form Actions: botones de cancelar (vuelve a Mis Solicitudes) y enviar la solicitud */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={loading}
              >
                <span className="btn-icon">❌</span>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📤</span>
                    Enviar Solicitud
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card: recordatorios sobre plazos y proceso de revisión de solicitudes */}
        <div className="info-card">
          <h3 className="info-title">ℹ️ Información Importante</h3>
          <ul className="info-list">
            <li>Las solicitudes deben enviarse con al menos 24 horas de anticipación</li>
            <li>El administrador revisará tu solicitud y te notificará la respuesta</li>
            <li>Sé específico en el motivo para facilitar la aprobación</li>
            <li>Puedes ver el estado de tus solicitudes en "Mis Solicitudes"</li>
          </ul>
        </div>
      </div>
  );
};

export default CreateRequest;
