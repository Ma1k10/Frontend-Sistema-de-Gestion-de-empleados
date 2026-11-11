/**
 * Archivo: schedules.js
 * Descripción: Servicios para gestión de horarios de trabajo
 * Propósito: CRUD de horarios y consulta de horarios personales de empleados
 * Nota: Admin puede gestionar todos los horarios, empleados solo ven los propios
 */

import api from './api'; // Instancia de axios configurada con token, baseURL e interceptores

// Función auxiliar para normalizar datos de horario antes de enviar al backend
// Garantiza que el payload tenga el formato que el backend espera:
// - id_empleado como número (por si llega como string desde un input)
// - hora_inicio y hora_fin en formato "HH:MM" recortando segundos/fecha
//   (los inputs type="time" pueden devolver "HH:MM:SS" y el backend espera 5 caracteres).
// Parámetro: scheduleData (objeto con los datos del horario a enviar).
// Retorna: un nuevo objeto con los campos normalizados, sin mutar el original.
const normalizeSchedulePayload = (scheduleData = {}) => ({
  ...scheduleData, // Copia todos los campos originales del horario
  id_empleado: Number(scheduleData.id_empleado), // Convierte el ID de empleado a número
  hora_inicio: scheduleData.hora_inicio?.slice(0, 5), // Recorta a "HH:MM" (los primeros 5 caracteres)
  hora_fin: scheduleData.hora_fin?.slice(0, 5) // Recorta a "HH:MM" igual que hora_inicio
});

// Objeto que agrupa las operaciones de horarios de trabajo.
// Las operaciones de escritura (crear, actualizar, eliminar) son solo para admin;
// la consulta de horarios propios la usa el empleado. El backend valida los permisos.
export const scheduleService = {
  // Obtener todos los horarios (admin)
  // Parámetro: filters (objeto con filtros opcionales: empleado, fechas, etc.)
  // que se convierten en query string con URLSearchParams.
  // Llama a GET /schedules?filtros y retorna el array de horarios.
  // Retorna: response.data.data.schedules.
  // Si el usuario no es admin, el backend responde 403 y la promesa se rechaza.
  getSchedules: async (filters = {}) => {
    const params = new URLSearchParams(filters); // Convierte el objeto de filtros en query string (?id_empleado=1&...)
    const response = await api.get(`/schedules?${params}`); // GET /schedules: lista todos los horarios con filtros
    return response.data.data.schedules; // Extrae el array de horarios de la respuesta
  },

  // Crear horario (admin)
  // Parámetro: scheduleData (objeto con los datos del nuevo horario: empleado,
  // fecha, hora_inicio, hora_fin, etc.).
  // Antes de enviar, normaliza el payload con normalizeSchedulePayload para
  // asegurar el formato correcto de ID y horas.
  // Llama a POST /schedules y retorna el horario creado.
  // Retorna: response.data.data.schedule.
  // Si los datos son inválidos o hay solapamiento de horarios, el backend responde con error.
  createSchedule: async (scheduleData) => {
    const response = await api.post('/schedules', normalizeSchedulePayload(scheduleData)); // POST /schedules: crea un nuevo horario normalizado
    return response.data.data.schedule; // Extrae el horario creado de la respuesta
  },

  // Actualizar horario (admin)
  // Parámetros: id (ID del horario a modificar) y scheduleData (campos a actualizar).
  // Igual que createSchedule, normaliza el payload antes de enviarlo.
  // Llama a PUT /schedules/:id y retorna el horario actualizado.
  // Retorna: response.data.data.schedule.
  // Si el horario no existe, el backend responde 404 y la promesa se rechaza.
  updateSchedule: async (id, scheduleData) => {
    const response = await api.put(`/schedules/${id}`, normalizeSchedulePayload(scheduleData)); // PUT /schedules/:id: actualiza el horario normalizado
    return response.data.data.schedule; // Extrae el horario actualizado de la respuesta
  },

  // Eliminar horario (admin)
  // Parámetro: id (ID del horario a eliminar).
  // Llama a DELETE /schedules/:id para borrar el registro del horario.
  // Retorna: la respuesta completa del backend (response.data), que suele
  // contener un mensaje de confirmación.
  // Si el horario no existe, el backend responde 404 y la promesa se rechaza.
  deleteSchedule: async (id) => {
    const response = await api.delete(`/schedules/${id}`); // DELETE /schedules/:id: elimina el horario
    return response.data; // Retorna el cuerpo completo de la respuesta (mensaje de confirmación)
  },

  // Obtener mis horarios (empleado)
  // Parámetro: filters (objeto con filtros opcionales: rango de fechas, etc.)
  // que se convierten en query string con URLSearchParams.
  // No recibe ID de empleado: el backend identifica al usuario por el token JWT
  // y devuelve solo sus propios horarios.
  // Llama a GET /my-schedules?filtros y retorna el array de horarios.
  // Retorna: response.data.data.schedules.
  getMySchedules: async (filters = {}) => {
    const params = new URLSearchParams(filters); // Convierte el objeto de filtros en query string
    const response = await api.get(`/my-schedules?${params}`); // GET /my-schedules: horarios del usuario autenticado
    return response.data.data.schedules; // Extrae el array de horarios de la respuesta
  }
};
