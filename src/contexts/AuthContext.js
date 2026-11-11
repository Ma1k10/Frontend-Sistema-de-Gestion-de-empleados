import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'; 
import { authService } from '../services/auth';

// Estado inicial del contexto de autenticación
// Define los valores por defecto cuando no hay usuario autenticado
const initialState = {
  user: null,           // Información del usuario logueado
  token: null,          // Token JWT para autenticación
  isAuthenticated: false, // Indica si hay un usuario autenticado
  loading: true,        // Indica si está cargando la información del usuario
  error: null           // Mensajes de error de autenticación
};

// Acciones disponibles para el reducer de autenticación
// Definen los tipos de acciones que pueden modificar el estado
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',           // Inicia proceso de login
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',       // Login exitoso
  LOGIN_FAILURE: 'LOGIN_FAILURE',       // Login fallido
  LOGOUT: 'LOGOUT',                     // Cerrar sesión
  REGISTER_START: 'REGISTER_START',     // Inicia proceso de registro
  REGISTER_SUCCESS: 'REGISTER_SUCCESS', // Registro exitoso
  REGISTER_FAILURE: 'REGISTER_FAILURE', // Registro fallido
  LOAD_USER_START: 'LOAD_USER_START',   // Inicia carga de usuario desde localStorage
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS', // Usuario cargado exitosamente
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE', // Fallo al cargar usuario
  CLEAR_ERROR: 'CLEAR_ERROR'            // Limpiar mensajes de error
};

// Reducer que maneja el estado de autenticación
// Recibe el estado actual y una acción, devuelve el nuevo estado
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      // Inicia login: muestra loading y limpia errores
      return { ...state, loading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      // Login exitoso: guarda usuario, token y actualiza estado
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      // Login fallido: limpia datos de usuario y muestra error
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      // Cierra sesión: limpia todos los datos de autenticación
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      };
    case AUTH_ACTIONS.REGISTER_START:
      // Inicia registro: muestra loading y limpia errores
      return { ...state, loading: true, error: null };
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      // Registro exitoso: oculta loading
      return { ...state, loading: false, error: null };
    case AUTH_ACTIONS.REGISTER_FAILURE:
      // Registro fallido: muestra error
      return { ...state, loading: false, error: action.payload };
    case AUTH_ACTIONS.LOAD_USER_START:
      // Inicia carga de usuario: muestra loading
      return { ...state, loading: true };
    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      // Usuario cargado: actualiza estado con datos del localStorage
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload,
        token: localStorage.getItem('token')
      };
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      // Fallo al cargar usuario: limpia datos de autenticación
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      // Limpia mensaje de error
      return { ...state, error: null };
    default:
      // Si la acción no existe, devuelve el estado actual
      return state;
  }
};

// Contexto de React para autenticación
// Permite que los componentes accedan al estado de autenticación
const AuthContext = createContext();

// Provider del contexto de autenticación
// Componente que envuelve la aplicación y prepara el estado de autenticación
export const AuthProvider = ({ children }) => {
  // useReducer maneja el estado complejo de autenticación
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Efecto que se ejecuta al montar el componente
  // Intenta cargar los datos del usuario desde la base de datos
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          // Si hay token y usuario enla base de datos, los carga al estado
          const user = JSON.parse(userStr);
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: user });
        } catch (error) {
          console.error('Error loading user:', error);
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE });
        }
      } else {
        // Si no hay datos, marca como no autenticado
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE });
      }
    };

    loadUser();
  }, []); // Array vacío para que solo se ejecute una vez

  // Función para iniciar sesión
  // Recibe credenciales (correo, contraseña) y autentica al usuario
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      // Llama al servicio de autenticación con las credenciales
      const data = await authService.login(credentials.correo, credentials.contraseña);
      // Guarda los datos en el estado
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: data.user, token: data.token }
      });
      return data;
    } catch (error) {
      // Maneja errores y los guarda en el estado
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error al iniciar sesión';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Función para registrar un nuevo usuario
  // Recibe los datos del nuevo usuario y lo registra en el sistema
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      // Llama al servicio de registro con los datos del usuario
      const data = await authService.register(userData);
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS });
      return data;
    } catch (error) {
      // Maneja errores de registro
      const errorMessage = error.response?.data?.error || 'Error al registrarse';
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Función para cerrar sesión
  // Limpia los datos de autenticación 
  const logout = useCallback(() => {
    authService.logout()
    dispatch({ type: AUTH_ACTIONS.LOGOUT }); // Limpia el estado
  }, []);

  // Función para recuperar contraseña
  // Envía un email con instrucciones para resetear la contraseña
  const forgotPassword = useCallback(async (email) => {
    try {
      const data = await authService.forgotPassword(email);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al enviar email';
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      const data = await authService.resetPassword(token, newPassword);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al resetear contraseña';
      throw error;
    }
  }, []);

  // Función para limpiar mensajes de error
  // Útil para mostrar alertas temporales
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Objeto con el estado y funciones que estarán disponibles en el contexto
  const value = {
    ...state,           // Estado actual (user, token, isAuthenticated, loading, error)
    login,              // Función para iniciar sesión
    register,           // Función para registrar usuario
    logout,             // Función para cerrar sesión
    forgotPassword,     // Función para recuperar contraseña
    resetPassword,      // Función para resetear contraseña
    clearError,         // Función para limpiar errores
    // Utilidades para verificar roles del usuario
    hasRole: useCallback((role) => state.user?.rol === role, [state.user?.rol]),        // Verifica si tiene un rol específico
    isAdmin: useCallback(() => state.user?.rol === 'admin', [state.user?.rol]),        // Verifica si es administrador
    isEmployee: useCallback(() => state.user?.rol === 'empleado', [state.user?.rol]),  // Verifica si es empleado
    isUser: useCallback(() => state.user?.rol === 'usuario', [state.user?.rol])        // Verifica si es usuario normal
  };

  // Provee el contexto a todos los componentes hijos
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
// Facilita el acceso al contexto y valida que esté dentro del Provider
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Valida que el hook se use dentro del AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
