/**
 * Archivo: notifications.js
 * Descripción: Servicios para sistema de notificaciones
 * Propósito: Gestión de notificaciones para usuarios y administradores
 * Funcionalidades: Ver notificaciones, marcar como leídas, eliminar notificaciones
 */

import axios from 'axios'; // Librería para realizar peticiones HTTP desde el frontend

// URL base de la API, se toma de la variable de entorno REACT_APP_API_URL
// o se usa por defecto el servidor local en el puerto 3001 bajo /api.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configurar axios para incluir el token en todas las peticiones
// Se crea una instancia propia (distinta de api.js) para aislar la configuración
// de notificaciones y no depender de timeouts/interceptores de otros módulos.
const api = axios.create({
  baseURL: API_BASE_URL, // Prefijo de todas las rutas relativas de las peticiones
  headers: {
    'Content-Type': 'application/json' // Los cuerpos de petición/respuesta viajan en formato JSON
  }
});

// Interceptor para incluir el token de autenticación
// Se ejecuta ANTES de cada petición: agrega el token JWT guardado en localStorage
// al header Authorization para que el backend identifique al usuario.
api.interceptors.request.use(
  (config) => { // config: objeto de configuración de la petición (método, url, headers, etc.)
    const token = localStorage.getItem('token'); // Recupera el token JWT guardado al hacer login
    if (token) { // Solo se agrega el header si existe un token almacenado
      config.headers.Authorization = `Bearer ${token}`; // Formato estándar de autenticación Bearer
    }
    return config; // Se devuelve la configuración modificada para continuar la petición
  },
  (error) => { // Se ejecuta si la petición falla ANTES de enviarse al servidor
    return Promise.reject(error); // Rechaza la promesa para que el error llegue al llamador
  }
);

// Manejar errores de autenticación
// Interceptor de respuestas: deja pasar las exitosas y, ante un 401 (token
// expirado o inválido), cierra la sesión local y redirige al login.
api.interceptors.response.use(
  (response) => response, // Si la respuesta fue exitosa, se devuelve sin modificaciones
  (error) => { // Se ejecuta cuando el servidor responde con error HTTP o falla la red
    if (error.response?.status === 401) {
      // Token expirado o inválido: se limpia la sesión local y se redirige al login.
      localStorage.removeItem('token'); // Elimina el token para invalidar la sesión local
      localStorage.removeItem('user'); // Elimina los datos del usuario guardados en localStorage
      window.location.href = '/login'; // Navegación completa a la pantalla de inicio de sesión
    }
    return Promise.reject(error); // Propaga el error para que el servicio que llamó lo maneje
  }
);

// Servicios de notificaciones
// Cada función llama a un endpoint de /notifications y devuelve response.data
// (el cuerpo completo de la respuesta del backend).

// Obtiene las notificaciones del usuario autenticado.
// Parámetro: params (objeto con filtros opcionales: no leídas, paginación, etc.)
// que se envían como query string en la petición.
// Llama a GET /notifications?params y retorna la respuesta completa.
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params }); // GET /notifications: lista notificaciones del usuario
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Obtiene las notificaciones de administración (uso del administrador).
// Parámetro: params (objeto con filtros opcionales: tipo, estado, paginación, etc.).
// Llama a GET /notifications/admin?params y retorna la respuesta completa.
export const getAdminNotifications = async (params = {}) => {
  const response = await api.get('/notifications/admin', { params }); // GET /notifications/admin: notificaciones administrativas
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Marca una notificación específica como leída.
// Parámetro: notificationId (ID de la notificación a marcar).
// Llama a PUT /notifications/:id/read y retorna la respuesta completa.
export const markAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`); // PUT /notifications/:id/read: marca como leída
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Marca TODAS las notificaciones del usuario como leídas.
// No recibe parámetros.
// Llama a PUT /notifications/read-all y retorna la respuesta completa.
export const markAllAsRead = async () => {
  const response = await api.put('/notifications/read-all'); // PUT /notifications/read-all: marca todas como leídas
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Elimina una notificación específica.
// Parámetro: notificationId (ID de la notificación a eliminar).
// Llama a DELETE /notifications/:id y retorna la respuesta completa.
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`); // DELETE /notifications/:id: elimina la notificación
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Servicios de solicitudes de empleo
// Este módulo también expone las operaciones de employee-requests para que los
// componentes puedan usar una sola instancia de axios con sus interceptores.

// Obtiene la lista de postulaciones de empleo (uso del administrador).
// Parámetro: params (objeto con filtros opcionales: página, estado, búsqueda, etc.).
// Llama a GET /employee-requests?params y retorna la respuesta completa.
export const getEmployeeRequests = async (params = {}) => {
  const response = await api.get('/employee-requests', { params }); // GET /employee-requests: lista postulaciones con filtros
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Obtiene los detalles de una postulación específica.
// Parámetro: id (identificador de la solicitud).
// Llama a GET /employee-requests/:id y retorna la respuesta completa.
export const getEmployeeRequestById = async (id) => {
  const response = await api.get(`/employee-requests/${id}`); // GET /employee-requests/:id: obtiene una postulación por ID
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Aprueba una postulación de empleo.
// Parámetros: id (ID de la solicitud) y data (datos de la aprobación, ej. rol asignado).
// Llama a PUT /employee-requests/:id/approve enviando data y retorna la respuesta completa.
export const approveEmployeeRequest = async (id, data) => {
  const response = await api.put(`/employee-requests/${id}/approve`, data); // PUT /employee-requests/:id/approve: aprueba la postulación
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Rechaza una postulación de empleo.
// Parámetros: id (ID de la solicitud) y data (datos del rechazo, ej. motivo).
// Llama a PUT /employee-requests/:id/reject enviando data y retorna la respuesta completa.
export const rejectEmployeeRequest = async (id, data) => {
  const response = await api.put(`/employee-requests/${id}/reject`, data); // PUT /employee-requests/:id/reject: rechaza la postulación
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Obtiene las postulaciones del usuario actualmente autenticado.
// No recibe parámetros: el backend identifica al usuario por el token JWT.
// Llama a GET /employee-requests/my y retorna la respuesta completa.
export const getMyEmployeeRequests = async () => {
  const response = await api.get('/employee-requests/my'); // GET /employee-requests/my: postulaciones del usuario logueado
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Exporta la instancia de axios configurada por si algún componente necesita
// hacer peticiones directas a los endpoints de notificaciones o solicitudes.
export default api;
