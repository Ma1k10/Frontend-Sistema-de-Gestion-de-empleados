/**
 * Archivo: api.js
 * Descripción: Configuración principal de Axios para comunicación con el backend
 * Propósito: Centralizar la configuración de las peticiones HTTP a la API
 */

import axios from 'axios'; // Librería para realizar peticiones HTTP desde el frontend

// URL base de la API, obtiene de variables de entorno o usa localhost por defecto
// REACT_APP_API_URL se define en el archivo .env del proyecto; si no existe,
// se asume que el backend corre localmente en el puerto 3001 bajo la ruta /api.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Crear instancia de axios con configuración base
// Esta instancia centraliza baseURL, headers y credenciales para todos los servicios.
const api = axios.create({
  baseURL: API_BASE_URL, // Prefijo que se antepone a todas las rutas relativas de las peticiones
  headers: {
    'Content-Type': 'application/json', // Indica que los cuerpos de petición/respuesta viajan en formato JSON
  },
  withCredentials: true, // Importante para CORS con credenciales
  // Permite enviar cookies y credenciales entre frontend y backend en peticiones cross-origin,
  // necesario cuando el backend usa autenticación por cookies o CORS requiere credenciales.
});

// Interceptor de peticiones: Añade automáticamente el token JWT a cada petición
// Esto permite que el backend identifique al usuario autenticado
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

// Interceptor de respuestas: Maneja errores de autenticación y autorización
// Si el token expira (401), cierra sesión y redirige al login
api.interceptors.response.use(
  (response) => response, // Si la respuesta fue exitosa, se devuelve sin modificaciones
  (error) => { // Se ejecuta cuando el servidor responde con error HTTP o falla la red
    if (error.response?.status === 401) {
      // Token expirado o inválido, cerrar sesión
      localStorage.removeItem('token'); // Elimina el token para invalidar la sesión local
      localStorage.removeItem('user'); // Elimina los datos del usuario guardados en localStorage
      // Evitar bucle de redirección si ya estamos en login
      if (window.location.pathname !== '/login') { // Solo redirige si no estamos ya en la página de login
        window.location.href = '/login'; // Navegación completa a la pantalla de inicio de sesión
      }
    } else if (error.response?.status === 403) {
      // No tiene permisos, redirigir a página principal o mostrar error
      console.error('Acceso denegado'); // Registra en consola que el usuario no tiene permisos
    }
    return Promise.reject(error); // Propaga el error para que el servicio que llamó lo maneje
  }
);

export default api; // Exporta la instancia configurada para usarla en los demás servicios
