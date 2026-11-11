import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../services/api';

// ============================
// TIPOS (TypeScript)
// ============================

// Tipo de una solicitud de registro como empleado.
// Cuando un usuario quiere convertirse en empleado, crea una de estas solicitudes
// y un admin la aprueba o rechaza.
interface EmployeeRequest {
  id: number;                          // Identificador único de la solicitud
  id_usuario: number;                  // ID del usuario que hace la solicitud
  posicion_deseada: string;            // Puesto que el usuario quiere ocupar
  mensaje?: string;                    // Mensaje opcional del solicitante
  estado: 'pendiente' | 'aprobada' | 'rechazada'; // Estado actual de la solicitud
  fecha_solicitud: string;             // Cuándo se envió la solicitud
  fecha_revision?: string;             // Cuándo la revisó el admin (si ya lo hizo)
  revisado_por?: number;               // ID del admin que la revisó
  comentarios_admin?: string;          // Comentarios del admin (ej. motivo de rechazo)
  created_at: string;                  // Fecha de creación del registro
  updated_at: string;                  // Fecha de última modificación
  usuario?: {                          // Datos del usuario solicitante (vienen del backend)
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    is_active: boolean;
    created_at: string;
  };
  revisor?: {                          // Datos del admin que revisó (opcional)
    id: number;
    nombre: string;
    correo: string;
  };
}

// Estado del contexto.
interface EmployeeRequestsState {
  requests: EmployeeRequest[]; // Lista de solicitudes cargadas
  loading: boolean;            // true mientras hay petición en curso
  error: string | null;        // Mensaje de error actual
}

// Tipo del contexto: estado + funciones disponibles.
interface EmployeeRequestsContextType extends EmployeeRequestsState {
  fetchRequests: () => Promise<void>;                              // Cargar solicitudes
  approveRequest: (id: number, posicion?: string) => Promise<void>; // Aprobar solicitud
  rejectRequest: (id: number, motivo?: string) => Promise<void>;   // Rechazar solicitud
  clearError: () => void;                                          // Limpiar error
}

// ============================
// ACCIONES DEL REDUCER
// ============================
// Constantes que nombran cada evento posible en el estado.
const EMPLOYEE_REQUESTS_ACTIONS = {
  FETCH_START: 'FETCH_START',       // Inició la carga de solicitudes
  FETCH_SUCCESS: 'FETCH_SUCCESS',   // Carga exitosa
  FETCH_FAILURE: 'FETCH_FAILURE',   // Carga fallida
  APPROVE_SUCCESS: 'APPROVE_SUCCESS', // Se aprobó una solicitud
  REJECT_SUCCESS: 'REJECT_SUCCESS',   // Se rechazó una solicitud
  CLEAR_ERROR: 'CLEAR_ERROR'        // Limpiar error
};

// ============================
// ESTADO INICIAL
// ============================
const initialState: EmployeeRequestsState = {
  requests: [],   // Lista vacía al inicio
  loading: false, // Sin carga en curso
  error: null     // Sin error
};

// ============================
// REDUCER
// ============================
// Función pura que recibe (estadoActual, acción) y devuelve el NUEVO estado.
// Nunca modifica el original; usa spread (...) para crear copias.
// Esto es clave en React: el estado debe ser inmutable para que React
// detecte cambios y re-renderice los componentes correctamente.
const employeeRequestsReducer = (state: EmployeeRequestsState, action: any): EmployeeRequestsState => {
  switch (action.type) {
    // --- INICIO DE CARGA ---
    // loading = true muestra spinner; error = null limpia errores previos.
    case EMPLOYEE_REQUESTS_ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    // --- CARGA EXITOSA ---
    // Se guarda la lista completa que vino del backend en action.payload.
    case EMPLOYEE_REQUESTS_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        requests: action.payload,
        error: null,
      };

    // --- CARGA FALLIDA ---
    // Se desactiva loading y se guarda el mensaje de error.
    case EMPLOYEE_REQUESTS_ACTIONS.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // --- APROBAR SOLICITUD ---
    // map recorre la lista; solo la solicitud cuyo id coincide
    // cambia su estado a 'aprobada'. Las demás quedan igual.
    // {...request, estado: 'aprobada'} = copia del objeto con un campo cambiado.
    case EMPLOYEE_REQUESTS_ACTIONS.APPROVE_SUCCESS:
      return {
        ...state,
        requests: state.requests.map(request =>
          request.id === action.payload
            ? { ...request, estado: 'aprobada' }
            : request
        ),
      };

    // --- RECHAZAR SOLICITUD ---
    // Igual que aprobar, pero cambia el estado a 'rechazada'.
    case EMPLOYEE_REQUESTS_ACTIONS.REJECT_SUCCESS:
      return {
        ...state,
        requests: state.requests.map(request =>
          request.id === action.payload
            ? { ...request, estado: 'rechazada' }
            : request
        ),
      };

    // --- LIMPIAR ERROR ---
    case EMPLOYEE_REQUESTS_ACTIONS.CLEAR_ERROR:
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
// El tipo genérico describe la forma del value que recibirá el Provider.
const EmployeeRequestsContext = createContext<EmployeeRequestsContextType | undefined>(undefined);

// ============================
// PROVIDER
// ============================
// Componente que envuelve la app o una sección y expone el estado
// de solicitudes de empleados a todos los componentes hijos.
export const EmployeeRequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useReducer conecta el estado con el reducer.
  // Devuelve [state, dispatch]: state = datos actuales, dispatch = enviar acciones.
  const [state, dispatch] = useReducer(employeeRequestsReducer, initialState);

  // ============================
  // FUNCIONES (llamadas al backend)
  // ============================
  // Todas siguen el patrón: dispatch(START) -> await api -> dispatch(SUCCESS/FAILURE)
  // useCallback(fn, []) memoriza la función para que no se recree en cada render.

  // Cargar todas las solicitudes (GET /employee-requests)
  // Solo un admin debería ver esta lista completa; el backend valida permisos.
  const fetchRequests = useCallback(async () => {
    try {
      dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.FETCH_START });
      const response = await api.get('/employee-requests');
      // response.data.data.requests = el backend devuelve { data: { requests: [...] } }
      dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.FETCH_SUCCESS, payload: response.data.data.requests || [] });
    } catch (error: any) {
      dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Aprobar una solicitud (PUT /employee-requests/:id/approve)
  // "posicion" es opcional: si el admin quiere asignar un puesto específico,
  // se envía en el body. Si no, el backend usa la posición deseada por el usuario.
  const approveRequest = useCallback(async (id: number, posicion?: string) => {
    try {
      // Se arma el body: si hay posición se envía { posicion }, si no, objeto vacío {}
      const payload = posicion ? { posicion } : {};
      await api.put(`/employee-requests/${id}/approve`, payload);
      dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.APPROVE_SUCCESS, payload: id });
    } catch (error: any) {
      dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Rechazar una solicitud (PUT /employee-requests/:id/reject)
  // "motivo" es opcional; si existe, el backend lo guarda como comentario_admin.
  const rejectRequest = useCallback(async (id: number, motivo?: string) => {
    try {
      await api.put(`/employee-requests/${id}/reject`, { motivo });
      dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.REJECT_SUCCESS, payload: id });
    } catch (error: any) {
      dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Limpiar el mensaje de error
  const clearError = useCallback(() => {
    dispatch({ type: EMPLOYEE_REQUESTS_ACTIONS.CLEAR_ERROR });
  }, []);

  // ============================
  // VALOR DEL CONTEXTO
  // ============================
  // Se combinan los datos del estado (...state = requests, loading, error)
  // con todas las funciones disponibles.
  const value: EmployeeRequestsContextType = {
    ...state,
    fetchRequests,
    approveRequest,
    rejectRequest,
    clearError,
  };

  // Provider: inyecta "value" en el árbol de componentes.
  return (
    <EmployeeRequestsContext.Provider value={value}>
      {children}
    </EmployeeRequestsContext.Provider>
  );
};

// ============================
// HOOK PERSONALIZADO
// ============================
// Permite usar el contexto con una sola línea en cualquier componente.
// Valida que el componente esté dentro del Provider; si no, lanza error.
export const useEmployeeRequests = (): EmployeeRequestsContextType => {
  const context = useContext(EmployeeRequestsContext);
  if (context === undefined) {
    throw new Error('useEmployeeRequests must be used within an EmployeeRequestsProvider');
  }
  return context;
};
