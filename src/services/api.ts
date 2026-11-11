import axios from 'axios'; // Librería para realizar peticiones HTTP desde el frontend

// URL base de la API del backend.
// Primero intenta usar la variable de entorno REACT_APP_API_URL (configurada en .env)
// y, si no existe, usa por defecto el servidor local en el puerto 3001.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Crear instancia de axios
// Se crea una instancia propia (no el axios global) para centralizar la configuración:
// baseURL evita repetir la URL en cada petición y los headers/timeouts aplican a todo.
const api = axios.create({
  baseURL: API_BASE_URL, // Todas las rutas relativas de las peticiones se resuelven contra esta URL
  timeout: 10000, // Tiempo máximo de espera de 10 segundos; si el backend no responde, la petición falla
  headers: {
    'Content-Type': 'application/json', // Indica que los cuerpos de petición/respuesta viajan en formato JSON
  },
});

// Interceptor para añadir token
// Se ejecuta ANTES de cada petición HTTP: lee el token JWT guardado en localStorage
// y lo agrega en el header Authorization con el esquema Bearer para que el backend
// sepa qué usuario está haciendo la petición.
api.interceptors.request.use(
  (config) => { // config: objeto de configuración de la petición (método, url, headers, etc.)
    const token = localStorage.getItem('token'); // Recupera el token almacenado al hacer login
    if (token) { // Solo se agrega el header si existe un token guardado
      config.headers.Authorization = `Bearer ${token}`; // Formato estándar: "Bearer <token>"
    }
    return config; // Se devuelve la configuración modificada para continuar la petición
  },
  (error) => { // Se ejecuta si la petición falla ANTES de enviarse al servidor
    return Promise.reject(error); // Rechaza la promesa para que el error llegue al llamador
  }
);

// Interceptor para manejar errores
// Se ejecuta DESPUÉS de cada respuesta: deja pasar las respuestas exitosas tal cual
// y intercepta los errores para detectar sesiones expiradas o sin permisos.
api.interceptors.response.use(
  (response) => response, // Si la respuesta fue exitosa, se devuelve sin cambios
  (error) => { // Se ejecuta cuando el servidor responde con error HTTP o falla la red
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expirado o inválido (401 Unauthorized) o sin permisos (403 Forbidden)
      localStorage.removeItem('token'); // Limpia el token para forzar una nueva autenticación
      localStorage.removeItem('user'); // Limpia los datos del usuario guardados
      window.location.href = '/login'; // Redirige al usuario a la página de inicio de sesión
    }
    return Promise.reject(error); // Propaga el error para que el servicio que llamó lo maneje
  }
);

export default api; // Exporta la instancia configurada para usarla en los demás servicios
