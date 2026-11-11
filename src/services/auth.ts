import api from './api'; // Instancia de axios configurada con token, baseURL e interceptores

// Interfaz que define la forma de la respuesta del endpoint de login.
// El backend devuelve el usuario autenticado junto con su token JWT.
export interface LoginResponse {
  user: { // Datos del usuario autenticado
    id: number; // Identificador único del usuario
    nombre: string; // Nombre completo del usuario
    correo: string; // Correo electrónico usado para iniciar sesión
    rol: string; // Rol del usuario (ej. 'admin', 'empleado') para control de acceso
    is_active: boolean; // Indica si la cuenta está activa
    created_at: string; // Fecha de creación de la cuenta
    updated_at: string; // Fecha de última actualización de la cuenta
  };
  token: string; // Token JWT que se usa para autenticar las peticiones posteriores
}

// Objeto que agrupa todos los métodos relacionados con autenticación.
// Se exporta como servicio para que los componentes solo importen authService
// y no tengan que conocer los endpoints ni la lógica de almacenamiento.
export const authService = {
  // Login
  // Inicia sesión enviando el correo y la contraseña al backend.
  // Parámetros: correo (email del usuario), contraseña (contraseña en texto plano).
  // Retorna: Promise<LoginResponse> con el usuario y el token.
  // En caso de error (credenciales inválidas, servidor caído), la promesa se rechaza
  // y el error debe manejarse en el componente que llama.
  login: async (correo: string, contraseña: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { correo, contraseña }); // POST /auth/login: envía credenciales al backend
    const { token, user } = response.data.data; // Extrae token y usuario del cuerpo de la respuesta (formato { data: {...} })
    
    // Guardar en localStorage
    localStorage.setItem('token', token); // Persiste el token para que el interceptor lo envíe en futuras peticiones
    localStorage.setItem('user', JSON.stringify(user)); // Guarda el usuario serializado en JSON para consultas locales
    
    return response.data.data; // Retorna el objeto completo { user, token } al componente
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
  hasRole: (role: string) => {
    const user = authService.getCurrentUser(); // Obtiene el usuario actual del localStorage
    return user && user.rol === role; // Compara el rol del usuario con el rol solicitado
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
};
