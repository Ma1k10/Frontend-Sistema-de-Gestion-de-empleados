import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../services/api';

// ============================
// TIPOS (TypeScript)
// ============================

// Tipo de una solicitud de cambio de horario.
// Representa cuando un empleado pide cambiar/vacaciones/intercambiar su turno.
interface ScheduleRequest {
  id: number;                                             // Identificador único de la solicitud
  empleado_id: number;                                    // ID del empleado que la creó
  schedule_id: number;                                    // ID del horario que quiere modificar
  tipo_solicitud: 'cambio' | 'intercambio' | 'vacaciones'; // Motivo de la solicitud
  fecha_solicitada: string;                               // Fecha para la que pide el cambio
  motivo: string;                                         // Explicación del empleado
  estado: 'pendiente' | 'aprobado' | 'rechazado';          // Estado actual de la solicitud
  created_at: string;                                     // Cuándo se creó
  updated_at: string;                                     // Cuándo se actualizó por última vez
}

// Estado del contexto.
interface ScheduleRequestsState {
  requests: ScheduleRequest[]; // Lista de solicitudes cargadas
  loading: boolean;            // true mientras hay petición en curso
  error: string | null;        // Mensaje de error actual
}

// Tipo del contexto: estado + funciones disponibles para los componentes.
interface ScheduleRequestsContextType extends ScheduleRequestsState {
  fetchRequests: () => Promise<void>;                                            // Cargar todas
  createRequest: (request: Partial<ScheduleRequest>) => Promise<ScheduleRequest>; // Crear nueva
  approveRequest: (id: number) => Promise<void>;                                 // Aprobar
  rejectRequest: (id: number, motivo?: string) => Promise<void>;                 // Rechazar
  clearError: () => void;                                                        // Limpiar error
}

// ============================
// ACCIONES DEL REDUCER
// ============================
// Constantes que nombran cada evento posible.
// El reducer usa action.type para decidir qué caso ejecutar en el switch.
const SCHEDULE_REQUESTS_ACTIONS = {
  FETCH_START: 'FETCH_START',       // Inició la carga de solicitudes
  FETCH_SUCCESS: 'FETCH_SUCCESS',   // Carga exitosa
  FETCH_FAILURE: 'FETCH_FAILURE',   // Carga fallida
  CREATE_SUCCESS: 'CREATE_SUCCESS', // Se creó una solicitud nueva
  APPROVE_SUCCESS: 'APPROVE_SUCCESS', // Se aprobó una solicitud
  REJECT_SUCCESS: 'REJECT_SUCCESS',   // Se rechazó una solicitud
  CLEAR_ERROR: 'CLEAR_ERROR'        // Limpiar error
};

// ============================
// ESTADO INICIAL
// ============================
const initialState: ScheduleRequestsState = {
  requests: [],   // Lista vacía hasta que fetchRequests traiga datos
  loading: false, // Sin carga en curso
  error: null     // Sin error
};

// ============================
// REDUCER
// ============================
// Función pura que recibe (estadoActual, acción) y devuelve el NUEVO estado.
// Nunca modifica el original; usa spread (...) para crear copias.
// Esto garantiza que React detecte los cambios y re-renderice la UI.
const scheduleRequestsReducer = (state: ScheduleRequestsState, action: any): ScheduleRequestsState => {
  switch (action.type) {
    // --- INICIO DE CARGA ---
    // loading = true muestra spinner; error = null limpia errores anteriores.
    case SCHEDULE_REQUESTS_ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    // --- CARGA EXITOSA ---
    // Se guarda la lista completa que vino del backend en action.payload.
    case SCHEDULE_REQUESTS_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        requests: action.payload,
        error: null,
      };

    // --- CARGA FALLIDA ---
    // Se desactiva loading y se guarda el mensaje de error.
    case SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // --- CREAR SOLICITUD ---
    // Se agrega la nueva solicitud al final de la lista
    // sin necesidad de volver a pedir todo al servidor.
    case SCHEDULE_REQUESTS_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        requests: [...state.requests, action.payload],
      };

    // --- APROBAR SOLICITUD ---
    // map recorre la lista; solo la solicitud cuyo id coincide
    // cambia su estado a 'aprobado'. Las demás quedan igual.
    // {...request, estado: 'aprobado'} = copia del objeto con un campo cambiado.
    case SCHEDULE_REQUESTS_ACTIONS.APPROVE_SUCCESS:
      return {
        ...state,
        requests: state.requests.map(request =>
          request.id === action.payload
            ? { ...request, estado: 'aprobado' }
            : request
        ),
      };

    // --- RECHAZAR SOLICITUD ---
    // Igual que aprobar, pero cambia el estado a 'rechazado'.
    case SCHEDULE_REQUESTS_ACTIONS.REJECT_SUCCESS:
      return {
        ...state,
        requests: state.requests.map(request =>
          request.id === action.payload
            ? { ...request, estado: 'rechazado' }
            : request
        ),
      };

    // --- LIMPIAR ERROR ---
    case SCHEDULE_REQUESTS_ACTIONS.CLEAR_ERROR:
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
// Se crea el canal de comunicación. El tipo genérico indica qué forma
// tiene el value que se pasará al Provider.
// undefined = no hay Provider aún; el hook lo valida más abajo.
const ScheduleRequestsContext = createContext<ScheduleRequestsContextType | undefined>(undefined);

// ============================
// PROVIDER
// ============================
// Componente que envuelve la app o una sección y expone el estado
// de solicitudes a todos los componentes hijos.
export const ScheduleRequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useReducer conecta el estado con la función reducer.
  // Devuelve [state, dispatch]:
  //   state   -> datos actuales (requests, loading, error)
  //   dispatch -> función para enviar acciones al reducer
  const [state, dispatch] = useReducer(scheduleRequestsReducer, initialState);

  // ============================
  // FUNCIONES (llamadas al backend)
  // ============================
  // Todas siguen el patrón: dispatch(START) -> await api -> dispatch(SUCCESS/FAILURE)
  // useCallback(fn, []) memoriza la función para que no se recree en cada render.

  // Cargar todas las solicitudes (GET /schedule-requests)
  // El backend filtra según el rol del usuario (admin ve todas, empleado ve las suyas).
  const fetchRequests = useCallback(async () => {
    try {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_START });
      const response = await api.get('/schedule-requests');
      // response.data.data = el backend devuelve { success, data: [...] }
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_SUCCESS, payload: response.data.data });
    } catch (error: any) {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Crear una solicitud nueva (POST /schedule-requests)
  // Devuelve la solicitud creada para que el componente pueda usarla
  // (ej. mostrar un mensaje de confirmación con el id).
  const createRequest = useCallback(async (request: Partial<ScheduleRequest>) => {
    try {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_START });
      const response = await api.post('/schedule-requests', request);
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.CREATE_SUCCESS, payload: response.data.data });
      return response.data.data;  // Se retorna la solicitud creada
    } catch (error: any) {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: error.message });
      throw error;  // Se re-lanza para que el componente lo capture y muestre el error
    }
  }, []);

  // Aprobar una solicitud (PUT /schedule-requests/:id/approve)
  // El backend valida que solo un admin pueda aprobar.
  const approveRequest = useCallback(async (id: number) => {
    try {
      await api.put(`/schedule-requests/${id}/approve`);
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.APPROVE_SUCCESS, payload: id });
    } catch (error: any) {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Rechazar una solicitud (PUT /schedule-requests/:id/reject)
  // "motivo" es opcional; si existe, el backend lo guarda como comentario.
  const rejectRequest = useCallback(async (id: number, motivo?: string) => {
    try {
      await api.put(`/schedule-requests/${id}/reject`, { motivo });
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.REJECT_SUCCESS, payload: id });
    } catch (error: any) {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Limpiar el mensaje de error
  const clearError = useCallback(() => {
    dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.CLEAR_ERROR });
  }, []);

  // ============================
  // VALOR DEL CONTEXTO
  // ============================
  // Se combinan los datos del estado (...state = requests, loading, error)
  // con todas las funciones disponibles.
  // Este objeto es lo que recibirán los componentes hijos.
  const value: ScheduleRequestsContextType = {
    ...state,
    fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest,
    clearError,
  };

  // Provider: inyecta "value" en el árbol de componentes.
  // Todo lo que esté dentro de <ScheduleRequestsProvider>...</ScheduleRequestsProvider>
  // puede usar useScheduleRequests() para acceder a estos datos y funciones.
  return (
    <ScheduleRequestsContext.Provider value={value}>
      {children}
    </ScheduleRequestsContext.Provider>
  );
};

// ============================
// HOOK PERSONALIZADO
// ============================
// Permite usar el contexto con una sola línea en cualquier componente.
// Valida que el componente esté dentro del Provider; si no, lanza error.
export const useScheduleRequests = (): ScheduleRequestsContextType => {
  const context = useContext(ScheduleRequestsContext);
  if (context === undefined) {
    throw new Error('useScheduleRequests must be used within a ScheduleRequestsProvider');
  }
  return context;
};
