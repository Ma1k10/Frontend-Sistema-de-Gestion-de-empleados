import React, { createContext, useContext, useReducer, useCallback } from 'react';

// ============================
// TIPOS (TypeScript)
// ============================

// Tipo de una notificación: título, mensaje, tipo visual y estado de lectura.
interface Notification {
  id: number;                                        // Identificador único
  titulo: string;                                    // Título que se muestra en la campana
  mensaje: string;                                   // Texto completo de la notificación
  tipo: 'info' | 'success' | 'warning' | 'error';    // Define el color/icono en la UI
  leida: boolean;                                    // true si el usuario ya la vio
  created_at: string;                                // Fecha de creación (ISO string)
}

// Estado del contexto de notificaciones.
// Incluye unreadCount porque la UI necesita saber cuántas hay sin leer
// sin tener que calcularlo cada vez.
interface NotificationsState {
  notifications: Notification[]; // Lista de notificaciones
  loading: boolean;              // true mientras se cargan
  error: string | null;          // Mensaje de error actual
  unreadCount: number;           // Contador de notificaciones no leídas
}

// Tipo del contexto: estado + funciones disponibles.
interface NotificationsContextType extends NotificationsState {
  fetchNotifications: () => Promise<void>;   // Cargar notificaciones
  markAsRead: (id: number) => Promise<void>; // Marcar UNA como leída
  markAllAsRead: () => Promise<void>;       // Marcar TODAS como leídas
  clearError: () => void;                    // Limpiar error
}

// ============================
// ACCIONES DEL REDUCER
// ============================
// Etiquetas de cada evento posible en el estado de notificaciones.
const NOTIFICATIONS_ACTIONS = {
  FETCH_START: 'FETCH_START',       // Inició la carga
  FETCH_SUCCESS: 'FETCH_SUCCESS',   // Carga exitosa
  FETCH_FAILURE: 'FETCH_FAILURE',   // Carga fallida
  MARK_READ: 'MARK_READ',           // Se marcó una como leída
  MARK_ALL_READ: 'MARK_ALL_READ',   // Se marcaron todas como leídas
  CLEAR_ERROR: 'CLEAR_ERROR'        // Limpiar error
};

// ============================
// ESTADO INICIAL
// ============================
const initialState: NotificationsState = {
  notifications: [],   // Lista vacía al inicio
  loading: false,      // Sin carga en curso
  error: null,         // Sin error
  unreadCount: 0        // Sin notificaciones sin leer
};

// ============================
// REDUCER
// ============================
// Función pura que calcula el nuevo estado a partir de (estado, acción).
// Nunca muta el estado original; siempre devuelve una copia modificada.
const notificationsReducer = (state: NotificationsState, action: any): NotificationsState => {
  switch (action.type) {
    // --- INICIO DE CARGA ---
    // loading = true para mostrar indicador; se limpia error previo.
    case NOTIFICATIONS_ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    // --- CARGA EXITOSA ---
    // Se guarda la lista recibida y se CALCULA unreadCount contando
    // cuántas notificaciones tienen leida = false.
    // filter devuelve solo las no leídas; .length da el total.
    case NOTIFICATIONS_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: action.payload,
        unreadCount: action.payload.filter((n: Notification) => !n.leida).length,
        error: null,
      };

    // --- CARGA FALLIDA ---
    case NOTIFICATIONS_ACTIONS.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // --- MARCAR UNA COMO LEÍDA ---
    // Se recorre la lista y solo la notificación con el id que coincide
    // cambia su campo leida a true; las demás quedan igual.
    // Además se resta 1 al contador unreadCount (con Math.max para no bajar de 0).
    case NOTIFICATIONS_ACTIONS.MARK_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, leida: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    // --- MARCAR TODAS COMO LEÍDAS ---
    // map recorre TODA la lista y pone leida: true en cada una.
    // unreadCount se pone directamente en 0.
    case NOTIFICATIONS_ACTIONS.MARK_ALL_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          leida: true,
        })),
        unreadCount: 0,
      };

    // --- LIMPIAR ERROR ---
    case NOTIFICATIONS_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    // --- ACCIÓN DESCONOCIDA ---
    // Devuelve el estado sin cambios para no romper la app.
    default:
      return state;
  }
};

// ============================
// CONTEXTO
// ============================
// Se crea el canal de comunicación del contexto.
// undefined = aún no hay Provider; el hook useNotifications lo valida.
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// ============================
// PROVIDER
// ============================
// Componente que envuelve la app (o una sección) y expone el estado
// de notificaciones a todos los componentes hijos.
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useReducer: conecta el estado con el reducer.
  // Devuelve [state, dispatch]: state = datos actuales, dispatch = enviar acciones.
  const [state, dispatch] = useReducer(notificationsReducer, initialState);

  // ============================
  // FUNCIONES
  // ============================

  // Cargar notificaciones
  // NOTA: actualmente usa datos de ejemplo (mock) porque el backend
  // de notificaciones aún no está implementado. Cuando exista,
  // esta función hará api.get('/notifications') igual que los otros contextos.
  const fetchNotifications = useCallback(async () => {
    try {
      dispatch({ type: NOTIFICATIONS_ACTIONS.FETCH_START });

      // Datos de prueba que simulan lo que devolvería el backend.
      // Se crean con new Date().toISOString() para tener fecha actual real.
      const mockNotifications: Notification[] = [
        {
          id: 1,
          titulo: 'Nueva solicitud de empleado',
          mensaje: 'Juan Pérez ha solicitado registrarse como empleado',
          tipo: 'info',
          leida: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          titulo: 'Horario actualizado',
          mensaje: 'El horario del turno mañana ha sido modificado',
          tipo: 'success',
          leida: false,
          created_at: new Date().toISOString(),
        },
      ];

      // Se "simula" una carga exitosa enviando las notificaciones de prueba al reducer
      dispatch({ type: NOTIFICATIONS_ACTIONS.FETCH_SUCCESS, payload: mockNotifications });
    } catch (error: any) {
      dispatch({ type: NOTIFICATIONS_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Marcar UNA notificación como leída
  // Cuando exista el backend, aquí irá la llamada api.put(`/notifications/${id}/read`).
  // Por ahora solo actualiza el estado local con dispatch.
  const markAsRead = useCallback(async (id: number) => {
    try {
      // Aquí iría la llamada al backend
      dispatch({ type: NOTIFICATIONS_ACTIONS.MARK_READ, payload: id });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Marcar TODAS las notificaciones como leídas
  // Igual que la anterior, pendiente de implementación en el backend.
  const markAllAsRead = useCallback(async () => {
    try {
      // Aquí iría la llamada al backend
      dispatch({ type: NOTIFICATIONS_ACTIONS.MARK_ALL_READ });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Limpiar el mensaje de error
  const clearError = useCallback(() => {
    dispatch({ type: NOTIFICATIONS_ACTIONS.CLEAR_ERROR });
  }, []);

  // ============================
  // VALOR DEL CONTEXTO
  // ============================
  // Se combinan los datos del estado (...state = notifications, loading,
  // error, unreadCount) con las funciones que la UI puede llamar.
  const value: NotificationsContextType = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError,
  };

  // Provider: inyecta "value" para que los componentes hijos lo consuman.
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// ============================
// HOOK PERSONALIZADO
// ============================
// Permite usar el contexto con una sola línea: const { notifications } = useNotifications();
// Valida que el componente esté dentro del Provider para evitar errores silenciosos.
export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
