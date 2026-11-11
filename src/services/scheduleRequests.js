/**
 * Archivo: scheduleRequests.js
 * Descripción: Servicios para solicitudes de cambio de horario
 * Propósito: Empleados solicitan cambios, admin aprueba/rechaza
 * Flujo: Empleado crea solicitud → Admin revisa → Admin aprueba/rechaza
 */

import api from './api'; // Instancia de axios configurada con token, baseURL e interceptores

// Objeto que agrupa las operaciones de solicitudes de cambio de horario.
// Todas las rutas llaman al endpoint /schedule-requests; las operaciones de
// creación/consulta propia las usa el empleado y las de revisión el administrador.
// El backend controla los permisos: si un empleado intenta aprobar, responde 403.
export const scheduleRequestService = {
  // Crear solicitud de cambio de horario (empleado)
  // Parámetro: requestData (objeto con los datos de la solicitud: tipo de cambio,
  // fechas, motivo, etc.).
  // Llama a POST /schedule-requests enviando requestData como cuerpo JSON.
  // Retorna: el objeto solicitud creado (response.data.data.request).
  // Si los datos son inválidos o ya existe una solicitud pendiente, el backend
  // responde con error y la promesa se rechaza.
  createScheduleRequest: async (requestData) => {
    const response = await api.post('/schedule-requests', requestData); // POST /schedule-requests: crea una solicitud de cambio
    return response.data.data.request; // Extrae la solicitud creada de la respuesta
  },

  // Obtener todas las solicitudes (admin)
  // Parámetro: filters (objeto con filtros opcionales: estado, empleado, fechas, etc.)
  // que se convierten en query string con URLSearchParams.
  // Llama a GET /schedule-requests?filtros y retorna el array de solicitudes.
  // Retorna: response.data.data.requests (lista de solicitudes).
  // Si el usuario no es admin, el backend responde 403 y la promesa se rechaza.
  getScheduleRequests: async (filters = {}) => {
    const params = new URLSearchParams(filters); // Convierte el objeto de filtros en query string (?estado=pendiente&...)
    const response = await api.get(`/schedule-requests?${params}`); // GET /schedule-requests: lista todas las solicitudes con filtros
    return response.data.data.requests; // Extrae el array de solicitudes de la respuesta
  },

  // Obtener mis solicitudes (empleado)
  // No recibe parámetros: el backend identifica al empleado por el token JWT
  // y devuelve solo sus propias solicitudes.
  // Llama a GET /schedule-requests (el backend filtra por el usuario autenticado)
  // y retorna el array de solicitudes del empleado.
  // Retorna: response.data.data.requests.
  getMyScheduleRequests: async () => {
    const response = await api.get('/schedule-requests'); // GET /schedule-requests: solicitudes del usuario autenticado
    return response.data.data.requests; // Extrae el array de solicitudes de la respuesta
  },

  // Aprobar/rechazar solicitud (admin)
  // Parámetros: id (ID de la solicitud), action ('approve' o 'reject') y
  // comentarios_revision (comentario opcional del administrador sobre la decisión).
  // Llama a PUT /schedule-requests/:id enviando { action, comentarios_revision }.
  // Retorna: la solicitud actualizada (response.data.data.request).
  // Si la solicitud no existe o ya fue revisada, el backend responde con error.
  approveOrRejectScheduleRequest: async (id, action, comentarios_revision) => {
    const response = await api.put(`/schedule-requests/${id}`, { action, comentarios_revision }); // PUT /schedule-requests/:id: aplica la decisión del admin
    return response.data.data.request; // Extrae la solicitud actualizada de la respuesta
  },

  // Actualizar solicitud (método genérico para compatibilidad)
  // Es un alias de approveOrRejectScheduleRequest que existe para no romper
  // componentes antiguos que llamaban a updateScheduleRequest con la misma firma.
  // Parámetros: id, action y comentarios_revision (idénticos al método anterior).
  // Retorna lo mismo que approveOrRejectScheduleRequest.
  updateScheduleRequest: async (id, action, comentarios_revision) => {
    return await scheduleRequestService.approveOrRejectScheduleRequest(id, action, comentarios_revision); // Delega en el método principal
  }
};
