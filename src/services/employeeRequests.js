/**
 * Archivo: employeeRequests.js
 * Descripción: Servicios para solicitudes de empleo (postulaciones)
 * Propósito: Gestionar postulaciones de trabajo con sistema de aprobación/rechazo
 * Característica: Incluye reintentos automáticos en caso de timeout
 */

import axios from 'axios'; // Librería para realizar peticiones HTTP desde el frontend

// URL base de la API, se toma de la variable de entorno REACT_APP_API_URL
// o se usa por defecto el servidor local en el puerto 3001 bajo /api.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configurar axios para incluir el token en todas las peticiones
// Se crea una instancia propia (distinta de api.js) porque este módulo necesita
// un timeout mayor (30s) y manejo especial de errores de aborto para reintentos.
const api = axios.create({
  baseURL: API_BASE_URL, // Prefijo de todas las rutas relativas de las peticiones
  headers: {
    'Content-Type': 'application/json' // Los cuerpos de petición/respuesta viajan en formato JSON
  },
  timeout: 30000 // 30 segundos de timeout para evitar peticiones colgadas
  // Las operaciones de aprobar/rechazar pueden tardar en el backend, por eso se
  // usa un timeout mayor que el de api.js (10s) para reducir cortes prematuros.
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

// Manejar errores de autenticación y abortos
// Interceptor de respuestas: deja pasar las exitosas y transforma los errores
// de timeout/abort para que los servicios puedan reintentarlos, y cierra sesión
// automáticamente cuando el token es inválido (401).
api.interceptors.response.use(
  (response) => response, // Si la respuesta fue exitosa, se devuelve sin modificaciones
  (error) => { // Se ejecuta cuando el servidor responde con error HTTP o falla la red
    // Manejar específicamente errores de aborto
    if (error.code === 'ECONNABORTED' || error.message.includes('Request aborted')) {
      // ECONNABORTED es el código de axios cuando se supera el timeout;
      // también se detecta el mensaje por si la petición fue abortada manualmente.
      console.warn('Petición abortada o timeout:', error.message); // Registra la causa en consola para depuración
      return Promise.reject({
        ...error, // Conserva todas las propiedades originales del error de axios
        isAborted: true, // Marca el error como abortado/timeout para que los servicios lo detecten
        userMessage: 'La petición tardó demasiado tiempo. Por favor, intenta nuevamente.'
        // Mensaje amigable que los componentes pueden mostrar al usuario final.
      });
    }
    
    if (error.response?.status === 401) {
      // Token expirado o inválido: se limpia la sesión local y se redirige al login.
      localStorage.removeItem('token'); // Elimina el token para invalidar la sesión local
      localStorage.removeItem('user'); // Elimina los datos del usuario guardados en localStorage
      window.location.href = '/login'; // Navegación completa a la pantalla de inicio de sesión
    }
    return Promise.reject(error); // Propaga el error para que el servicio que llamó lo maneje
  }
);

// Servicios de solicitudes de empleo
// Cada función llama a un endpoint de /employee-requests y devuelve response.data
// (el cuerpo completo de la respuesta del backend).

// Obtiene la lista de postulaciones (uso del administrador).
// Parámetro: params (objeto con filtros opcionales: página, estado, búsqueda, etc.)
// que se envían como query string en la petición.
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
// Parámetros: id (ID de la solicitud), data (datos de la aprobación, ej. rol/puesto asignado)
// y retryCount (contador interno de reintentos, no lo pasa el componente).
// Llama a PUT /employee-requests/:id/approve enviando data.
// Si la petición sufre timeout/aborto, reintenta hasta 2 veces con 1 segundo de espera
// entre intentos (máximo 3 intentos en total); si persiste el error, lo lanza.
export const approveEmployeeRequest = async (id, data, retryCount = 0) => {
  try {
    const response = await api.put(`/employee-requests/${id}/approve`, data); // PUT /employee-requests/:id/approve: aprueba la postulación
    return response.data; // Retorna la respuesta completa del backend
  } catch (error) {
    // Si es un error de timeout/aborto y tenemos menos de 2 reintentos, intentar nuevamente
    if ((error.isAborted || error.code === 'ECONNABORTED' || error.message.includes('Request aborted')) && retryCount < 2) {
      // isAborted lo marca el interceptor; los otros dos chequeos cubren errores
      // que no pasaron por él. retryCount < 2 limita a 3 intentos totales.
      console.warn(`Reintentando aprobación (intento ${retryCount + 1}/3)...`); // Registra el número de reintento
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo antes de reintentar
      return approveEmployeeRequest(id, data, retryCount + 1); // Llamada recursiva con el contador incrementado
    }
    throw error; // Si no, lanzar el error original
    // Se relanza el error para que el componente lo muestre al usuario.
  }
};

// Rechaza una postulación de empleo.
// Parámetros: id (ID de la solicitud), data (datos del rechazo, ej. motivo)
// y retryCount (contador interno de reintentos, no lo pasa el componente).
// Llama a PUT /employee-requests/:id/reject enviando data.
// Igual que approveEmployeeRequest: reintenta hasta 2 veces ante timeouts.
export const rejectEmployeeRequest = async (id, data, retryCount = 0) => {
  try {
    const response = await api.put(`/employee-requests/${id}/reject`, data); // PUT /employee-requests/:id/reject: rechaza la postulación
    return response.data; // Retorna la respuesta completa del backend
  } catch (error) {
    // Si es un error de timeout/aborto y tenemos menos de 2 reintentos, intentar nuevamente
    if ((error.isAborted || error.code === 'ECONNABORTED' || error.message.includes('Request aborted')) && retryCount < 2) {
      console.warn(`Reintentando rechazo (intento ${retryCount + 1}/3)...`); // Registra el número de reintento
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo antes de reintentar
      return rejectEmployeeRequest(id, data, retryCount + 1); // Llamada recursiva con el contador incrementado
    }
    throw error; // Si no, lanzar el error original
    // Se relanza el error para que el componente lo muestre al usuario.
  }
};

// Obtiene las postulaciones del usuario actualmente autenticado.
// No recibe parámetros: el backend identifica al usuario por el token JWT.
// Llama a GET /employee-requests/my y retorna la respuesta completa.
export const getMyEmployeeRequests = async () => {
  const response = await api.get('/employee-requests/my'); // GET /employee-requests/my: postulaciones del usuario logueado
  return response.data; // Retorna el cuerpo completo de la respuesta del backend
};

// Exporta la instancia de axios configurada por si algún componente necesita
// hacer peticiones directas a los endpoints de employee-requests.
export default api;
