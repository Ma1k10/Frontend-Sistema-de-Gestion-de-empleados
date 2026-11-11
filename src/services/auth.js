/**
 * Archivo: auth.js
 * Descripción: Servicios de autenticación de usuarios
 * Propósito: Manejar login, registro, recuperación de contraseña y gestión de sesiones
 */

import api from './api'; // Instancia de axios configurada con token, baseURL e interceptores

// Objeto que agrupa todos los métodos de autenticación.
// Centraliza la lógica de sesión (localStorage) y las llamadas a los endpoints /auth.
export const authService = {
  // Login
  // Inicia sesión enviando correo y contraseña al backend.
  // Parámetros: correo (email del usuario), contraseña (contraseña en texto plano).
  // Retorna: la respuesta del backend con { user, token }.
  // En caso de error (credenciales inválidas, servidor caído), la promesa se rechaza
  // y el componente que llama debe mostrar el mensaje correspondiente.
  login: async (correo, contraseña) => {
    const response = await api.post('/auth/login', { correo, contraseña }); // POST /auth/login: envía credenciales al backend
    const { token, user } = response.data.data; // Extrae token y usuario del cuerpo de la respuesta (formato { data: {...} })
    
    // Guardar en localStorage
    localStorage.setItem('token', token); // Persiste el token para que el interceptor lo envíe en futuras peticiones
    localStorage.setItem('user', JSON.stringify(user)); // Guarda el usuario serializado en JSON para consultas locales
    
    return response.data.data; // Retorna el objeto completo { user, token } al componente
  },

  // Registro
  // Crea una nueva cuenta de usuario en el backend.
  // Parámetro: userData (objeto con los datos del nuevo usuario: nombre, correo, contraseña, etc.).
  // Retorna: la respuesta del backend con los datos del usuario creado.
  // Si el correo ya existe o los datos son inválidos, el backend responde con error
  // y la promesa se rechaza.
  register: async (userData) => {
    const response = await api.post('/auth/register', userData); // POST /auth/register: envía los datos de registro al backend
    return response.data.data; // Retorna el cuerpo de la respuesta (datos del usuario creado)
  },

  // Obtener perfil
  // Recupera el perfil del usuario autenticado desde el backend.
  // No recibe parámetros: el usuario se identifica por el token JWT del header.
  // Retorna: la respuesta del backend con los datos actuales del perfil.
  getProfile: async () => {
    const response = await api.get('/auth/profile'); // GET /auth/profile: obtiene el perfil del usuario autenticado
    return response.data.data; // Retorna el cuerpo de la respuesta (datos del perfil)
  },

  // Cambiar contraseña
  // Cambia la contraseña del usuario autenticado.
  // Parámetros: contraseña_actual (contraseña vigente para verificar identidad) y
  // contraseña_nueva (nueva contraseña a establecer).
  // Retorna: la respuesta completa del backend (no solo .data.data).
  // Si la contraseña actual es incorrecta, el backend responde con error.
  changePassword: async (contraseña_actual, contraseña_nueva) => {
    const response = await api.put('/auth/change-password', { 
      contraseña_actual, // Contraseña actual, usada por el backend para verificar la identidad
      contraseña_nueva  // Nueva contraseña que reemplazará a la actual
    }); // PUT /auth/change-password: actualiza la contraseña del usuario
    return response.data; // Retorna el cuerpo completo de la respuesta del backend
  },

  // Refrescar token
  // Solicita al backend un nuevo token JWT (útil cuando el token está por expirar).
  // No recibe parámetros: se identifica por el token actual en el header.
  // Retorna: la respuesta del backend con el nuevo { token, user }.
  // Además actualiza localStorage con el nuevo token y los datos de usuario.
  refreshToken: async () => {
    const response = await api.post('/auth/refresh'); // POST /auth/refresh: pide un token nuevo al backend
    const { token, user } = response.data.data; // Extrae el nuevo token y los datos del usuario
    
    localStorage.setItem('token', token); // Reemplaza el token antiguo por el nuevo
    localStorage.setItem('user', JSON.stringify(user)); // Actualiza los datos del usuario guardados
    
    return response.data.data; // Retorna el objeto { token, user } actualizado
  },

  // Cerrar sesión
  // Invalida la sesión tanto en el backend como en el frontend.
  // Intenta notificar al backend con POST /auth/logout; si falla (red, token ya
  // expirado), igualmente limpia la sesión local para que el usuario pueda salir.
  logout: async () => {
    try {
      await api.post('/auth/logout'); // POST /auth/logout: notifica al backend que se cierra la sesión
    } catch (error) {
      // Ignorar error en logout
      // Se ignora deliberadamente cualquier error: la sesión local debe cerrarse
      // aunque el backend no responda o el token ya no sea válido.
    }
    localStorage.removeItem('token'); // Elimina el token para cerrar la sesión local
    localStorage.removeItem('user'); // Elimina los datos del usuario del localStorage
  },

  // Obtener usuario actual del localStorage
  // Lee el usuario guardado durante el login sin hacer petición al servidor.
  // Retorna: el objeto usuario parseado, o null si no hay sesión iniciada.
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user'); // Recupera el usuario serializado en JSON
    return userStr ? JSON.parse(userStr) : null; // Lo parsea a objeto; si no existe, retorna null
  },

  // Verificar si está autenticado
  // Comprueba únicamente si existe un token en localStorage (no valida su vigencia;
  // la validación real la hace el backend en cada petición protegida).
  // Retorna: booleano true si hay token, false en caso contrario.
  isAuthenticated: () => {
    return !!localStorage.getItem('token'); // Convierte el valor a booleano con doble negación
  },

  // Verificar rol
  // Comprueba si el usuario autenticado tiene el rol indicado.
  // Parámetro: role (string con el rol a verificar, ej. 'admin').
  // Retorna: true si el usuario existe y su rol coincide; false en caso contrario.
  hasRole: (role) => {
    const user = authService.getCurrentUser(); // Obtiene el usuario actual del localStorage
    return user && user.rol === role; // Compara el rol del usuario con el rol solicitado
  }
};
