// React y hooks para estado local y efectos
import React, { useState, useEffect } from 'react';
// useNavigate para volver a la lista; useParams para detectar modo edición
import { useNavigate, useParams } from 'react-router-dom';
// Contextos: horarios (CRUD) y empleados (para el selector)
import { useSchedules } from '../../contexts/SchedulesContext';
import { useEmployees } from '../../contexts/EmployeesContext';
// Guardia de rol: solo administradores pueden crear/editar horarios
import RoleGuard from '../../components/auth/RoleGuard';

const ScheduleForm = () => {
  const navigate = useNavigate();
  // id de la ruta: si existe, el formulario edita un horario existente
  const { id } = useParams();
  // Empleados para poblar el selector; employeesLoading muestra spinner
  const { employees, loading: employeesLoading } = useEmployees();
  // Acciones CRUD del contexto de horarios
  const { createSchedule, updateSchedule, schedules, loading } = useSchedules();
  
  // Datos del formulario: empleado, fecha e intervalo horario
  const [formData, setFormData] = useState({
    id_empleado: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: ''
  });
  // Errores de validación por campo y error general de envío
  const [errors, setErrors] = useState({});
  // Evita envíos duplicados mientras la petición está en curso
  const [isSubmitting, setIsSubmitting] = useState(false);

  // true si hay id en la URL (edición), false si es creación
  const isEditing = Boolean(id);

  // En modo edición, busca el horario en el contexto y precarga el formulario
  useEffect(() => {
    if (isEditing && schedules.length > 0) {
      const schedule = schedules.find(s => s.id === parseInt(id));
      if (schedule) {
        setFormData({
          id_empleado: schedule.id_empleado.toString(),
          fecha: schedule.fecha,
          hora_inicio: schedule.hora_inicio,
          hora_fin: schedule.hora_fin
        });
      }
    }
  }, [id, isEditing, schedules]);

  // Valida campos obligatorios y que la hora fin sea posterior a la inicio
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.id_empleado) {
      newErrors.id_empleado = 'Selecciona un empleado';
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }
    
    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es requerida';
    }
    
    if (!formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin es requerida';
    }
    
    if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
    }
    
    // Devuelve true solo si no quedó ningún error de validación
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Envía el formulario: valida, normaliza los datos (id numérico y horas
  // en formato HH:MM), llama a update o create según el modo y vuelve a la lista
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Normaliza el payload: convierte el id a número y recorta las horas
    // a "HH:MM" para que coincida con el formato esperado por el backend
    const normalizedFormData = {
      ...formData,
      id_empleado: Number(formData.id_empleado),
      hora_inicio: formData.hora_inicio?.slice(0, 5),
      hora_fin: formData.hora_fin?.slice(0, 5)
    };
    
    setIsSubmitting(true);
    
    try {
      // Crea o actualiza según sea edición o creación
      if (isEditing) {
        await updateSchedule(parseInt(id), normalizedFormData);
      } else {
        await createSchedule(normalizedFormData);
      }
      // Tras guardar con éxito, vuelve a la lista de horarios
      navigate('/admin/schedules');
    } catch (error) {
      console.error('Error al guardar horario:', error);
      // Extrae el mensaje del backend si existe; si no, usa uno genérico
      const backendMessage = error.response?.data?.message || error.response?.data?.details?.[0] || 'Error al guardar el horario. Inténtalo de nuevo.';
      setErrors({ submit: backendMessage });
    } finally {
      // Libera el bloqueo del botón de envío
      setIsSubmitting(false);
    }
  };

  // Actualiza un campo del formulario y limpia su error al escribir
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Mientras cargan los empleados se muestra un mensaje de carga
  // para evitar mostrar el selector vacío
  if (employeesLoading) {
    return (
      <RoleGuard requiredRole="admin">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </RoleGuard>
    );
  }

  // Formulario protegido por RoleGuard: solo administradores lo ven
  return (
    <RoleGuard requiredRole="admin">
      <div className="space-y-6">
        {/* Encabezado con título y subtítulo dinámicos según modo */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Horario' : 'Asignar Nuevo Horario'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Modifica los datos del horario existente' : 'Asigna un nuevo horario a un empleado'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          {/* onSubmit ejecuta handleSubmit al enviar el formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error general devuelto por el backend al guardar */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selector de empleado: deshabilitado en edición para no
                cambiar el empleado asignado al horario existente */}
            <div>
              <label htmlFor="id_empleado" className="block text-sm font-medium text-gray-700">
                Empleado *
              </label>
              <select
                id="id_empleado"
                name="id_empleado"
                value={formData.id_empleado}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.id_empleado ? 'border-red-500' : ''
                }`}
                disabled={isEditing}
              >
                <option value="">Selecciona un empleado</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.usuario?.nombre || 'Sin nombre'} - {employee.usuario?.correo || 'Sin correo'}
                  </option>
                ))}
              </select>
              {errors.id_empleado && (
                <p className="mt-1 text-sm text-red-600">{errors.id_empleado}</p>
              )}
            </div>

            {/* Fecha del horario: el atributo min impide elegir fechas pasadas */}
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
                Fecha *
              </label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.fecha ? 'border-red-500' : ''
                }`}
              />
              {errors.fecha && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha}</p>
              )}
            </div>

            {/* Intervalo horario: hora de inicio y hora de fin en dos columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hora_inicio" className="block text-sm font-medium text-gray-700">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  id="hora_inicio"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.hora_inicio ? 'border-red-500' : ''
                  }`}
                />
                {errors.hora_inicio && (
                  <p className="mt-1 text-sm text-red-600">{errors.hora_inicio}</p>
                )}
              </div>

              <div>
                <label htmlFor="hora_fin" className="block text-sm font-medium text-gray-700">
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  id="hora_fin"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.hora_fin ? 'border-red-500' : ''
                  }`}
                />
                {errors.hora_fin && (
                  <p className="mt-1 text-sm text-red-600">{errors.hora_fin}</p>
                )}
              </div>
            </div>

            {/* Botones: cancelar vuelve a la lista; submit envía y se
                deshabilita mientras isSubmitting para evitar duplicados */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/schedules')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Asignar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ScheduleForm;
