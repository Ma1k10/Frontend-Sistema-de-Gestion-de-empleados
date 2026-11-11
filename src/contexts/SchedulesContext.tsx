import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../services/api';

// ============================
// TIPOS (TypeScript)
// ============================

// Tipo de un horario de trabajo.
// Representa el turno asignado a un empleado en un día de la semana.
interface Schedule {
  id: number;              // Identificador único del horario
  empleado_id: number;     // ID del empleado asignado a este turno
  dia_semana: string;      // Día de la semana ('lunes', 'martes', etc.)
  hora_entrada: string;    // Hora de inicio del turno (ej. '08:00')
  hora_salida: string;     // Hora de fin del turno (ej. '17:00')
  activo: boolean;         // Si el horario está vigente o desactivado
  created_at: string;      // Fecha de creación del registro
  updated_at: string;      // Fecha de última modificación
}

// Estado del contexto.
interface SchedulesState {
  schedules: Schedule[]; // Lista de horarios cargados
  loading: boolean;      // true mientras hay petición en curso
  error: string | null;  // Mensaje de error actual
}

// Tipo del contexto: estado + funciones disponibles.
interface SchedulesContextType extends SchedulesState {
  fetchSchedules: () => Promise<void>;                               // Cargar horarios
  createSchedule: (schedule: Partial<Schedule>) => Promise<void>;      // Crear horario
  updateSchedule: (id: number, schedule: Partial<Schedule>) => Promise<void>; // Editar
  deleteSchedule: (id: number) => Promise<void>;                      // Eliminar
  clearError: () => void;                                             // Limpiar error
}

// ============================
// ACCIONES DEL REDUCER
// ============================
// Constantes que nombran cada evento posible.
const SCHEDULES_ACTIONS = {
  FETCH_START: 'FETCH_START',       // Inició la carga de horarios
  FETCH_SUCCESS: 'FETCH_SUCCESS',   // Carga exitosa
  FETCH_FAILURE: 'FETCH_FAILURE',   // Carga fallida
  CREATE_SUCCESS: 'CREATE_SUCCESS', // Se creó un horario nuevo
  UPDATE_SUCCESS: 'UPDATE_SUCCESS', // Se actualizó un horario
  DELETE_SUCCESS: 'DELETE_SUCCESS', // Se eliminó un horario
  CLEAR_ERROR: 'CLEAR_ERROR'        // Limpiar error
};

// ============================
// ESTADO INICIAL
// ============================
const initialState: SchedulesState = {
  schedules: [],   // Lista vacía al inicio
  loading: false,  // Sin carga en curso
  error: null      // Sin error
};

// ============================
// REDUCER
// ============================
// Función pura que recibe (estadoActual, acción) y devuelve el NUEVO estado.
// Nunca modifica el original; usa spread (...) para crear copias.
// Esto es clave en React: el estado debe ser inmutable para que React
// detecte cambios y re-renderice los componentes correctamente.
const schedulesReducer = (state: SchedulesState, action: any): SchedulesState => {
  switch (action.type) {
    // --- INICIO DE CARGA ---
    // loading = true muestra spinner; error = null limpia errores previos.
    case SCHEDULES_ACTIONS.FETCH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    // --- CARGA EXITOSA ---
    // Se guarda la lista completa que vino del backend.
    case SCHEDULES_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        schedules: action.payload,
        error: null,
      };

    // --- CARGA FALLIDA ---
    // Se desactiva loading y se guarda el mensaje de error.
    case SCHEDULES_ACTIONS.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // --- CREAR HORARIO ---
    // Se agrega el nuevo horario al FINAL de la lista
    // sin recargar todo desde el servidor.
    case SCHEDULES_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        schedules: [...state.schedules, action.payload],
      };

    // --- ACTUALIZAR HORARIO ---
    // map recorre la lista; solo el horario con id coincidente
    // fusiona sus datos viejos con los nuevos {...schedule, ...action.payload}.
    // Las demás entradas quedan igual.
    case SCHEDULES_ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id
            ? { ...schedule, ...action.payload }
            : schedule
        ),
      };

    // --- ELIMINAR HORARIO ---
    // filter devuelve una lista nueva SIN el horario cuyo id coincide.
    case SCHEDULES_ACTIONS.DELETE_SUCCESS:
      return {
        ...state,
        schedules: state.schedules.filter(schedule => schedule.id !== action.payload),
      };

    // --- LIMPIAR ERROR ---
    case SCHEDULES_ACTIONS.CLEAR_ERROR:
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
const SchedulesContext = createContext<SchedulesContextType | undefined>(undefined);

// ============================
// PROVIDER
// ============================
// Componente que envuelve la app o una sección y expone el estado
// de horarios a todos los componentes hijos.
export const SchedulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useReducer conecta el estado con el reducer.
  // Devuelve [state, dispatch]: state = datos actuales, dispatch = enviar acciones.
  const [state, dispatch] = useReducer(schedulesReducer, initialState);

  // ============================
  // FUNCIONES (llamadas al backend)
  // ============================
  // Todas siguen el patrón: dispatch(START) -> await api -> dispatch(SUCCESS/FAILURE)
  // useCallback(fn, []) memoriza la función para que no se recree en cada render.

  // Cargar todos los horarios (GET /schedules)
  const fetchSchedules = useCallback(async () => {
    try {
      dispatch({ type: SCHEDULES_ACTIONS.FETCH_START });
      const response = await api.get('/schedules');
      // response.data.data = el backend devuelve { success, data: [...] }
      dispatch({ type: SCHEDULES_ACTIONS.FETCH_SUCCESS, payload: response.data.data });
    } catch (error: any) {
      dispatch({ type: SCHEDULES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Crear un horario nuevo (POST /schedules)
  const createSchedule = useCallback(async (schedule: Partial<Schedule>) => {
    try {
      const response = await api.post('/schedules', schedule);
      dispatch({ type: SCHEDULES_ACTIONS.CREATE_SUCCESS, payload: response.data.data });
    } catch (error: any) {
      dispatch({ type: SCHEDULES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Actualizar un horario existente (PUT /schedules/:id)
  const updateSchedule = useCallback(async (id: number, schedule: Partial<Schedule>) => {
    try {
      const response = await api.put(`/schedules/${id}`, schedule);
      dispatch({ type: SCHEDULES_ACTIONS.UPDATE_SUCCESS, payload: response.data.data });
    } catch (error: any) {
      dispatch({ type: SCHEDULES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Eliminar un horario (DELETE /schedules/:id)
  // No hay payload de respuesta; el reducer usa el id para quitarlo de la lista.
  const deleteSchedule = useCallback(async (id: number) => {
    try {
      await api.delete(`/schedules/${id}`);
      dispatch({ type: SCHEDULES_ACTIONS.DELETE_SUCCESS, payload: id });
    } catch (error: any) {
      dispatch({ type: SCHEDULES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Limpiar el mensaje de error
  const clearError = useCallback(() => {
    dispatch({ type: SCHEDULES_ACTIONS.CLEAR_ERROR });
  }, []);

  // ============================
  // VALOR DEL CONTEXTO
  // ============================
  // Se combinan los datos del estado (...state = schedules, loading, error)
  // con todas las funciones disponibles.
  const value: SchedulesContextType = {
    ...state,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    clearError,
  };

  // Provider: inyecta "value" en el árbol de componentes.
  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
};

// ============================
// HOOK PERSONALIZADO
// ============================
// Permite usar el contexto con una sola línea en cualquier componente.
// Valida que el componente esté dentro del Provider; si no, lanza error.
export const useSchedules = (): SchedulesContextType => {
  const context = useContext(SchedulesContext);
  if (context === undefined) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
};
