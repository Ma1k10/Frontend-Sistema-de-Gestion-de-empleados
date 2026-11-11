/**
 * Archivo: ScheduleRequestsContext.js
 * Descripción: Contexto de React para gestión de solicitudes de cambio de horario
 * Propósito: Centralizar estado de solicitudes y operaciones de aprobación/rechazo
 * Patrón: Context API + useReducer para manejo de estado centralizado
 *
 * Flujo de trabajo:
 * - Empleado crea solicitud de cambio
 * - Admin ve todas las solicitudes pendientes
 * - Admin aprueba o rechaza con comentarios
 * - Estado se actualiza automáticamente
 */

// Se importan las funciones de React necesarias para crear un Context API
// createContext: crea el "canal" por el que los componentes comparten estado
// useContext: permite a cualquier componente consumir ese estado
// useReducer: alternativa a useState para estado complejo (estilo Redux)
// useCallback: memoiza funciones para evitar recrearlas en cada render
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Se importa el servicio que contiene las llamadas HTTP al backend
// Este archivo NO llama a la API directamente, delega en scheduleRequestService
import { scheduleRequestService } from '../services/scheduleRequests';

// Acciones para el reducer
// Son "etiquetas" (constantes) que describen qué tipo de cambio ocurrió en el estado.
// El reducer usa estas etiquetas en un switch para decidir cómo actualizar el estado.
// Se usan constantes para evitar errores de tipeo al comparar strings.
const SCHEDULE_REQUESTS_ACTIONS = {
  FETCH_START: 'FETCH_START',       // Se inició la carga de solicitudes
  FETCH_SUCCESS: 'FETCH_SUCCESS',   // La carga terminó correctamente
  FETCH_FAILURE: 'FETCH_FAILURE',   // La carga falló
  CREATE_SUCCESS: 'CREATE_SUCCESS', // Se creó una solicitud nueva
  UPDATE_SUCCESS: 'UPDATE_SUCCESS', // Se aprobó/rechazó una solicitud
  CLEAR_ERROR: 'CLEAR_ERROR'        // Se quiere borrar el mensaje de error
};

// Estado inicial
// Es el "punto de partida" del contexto: lista vacía, sin carga en curso y sin error.
// Reducer lo recibirá en la primera llamada y lo devolverá modificado según las acciones.
const initialState = {
  scheduleRequests: [],  // Lista de solicitudes de cambio de horario
  loading: false,        // true mientras hay una petición en curso (muestra spinner en la UI)
  error: null            // Mensaje de error si algo falla, null si todo va bien
};

// Reducer
// Función pura que recibe (estadoActual, accion) y devuelve el NUEVO estado.
// NUNCA modifica el estado original: usa el operador spread (...) para copiar.
// Cada case corresponde a una acción posible y describe cómo cambia el estado.
const scheduleRequestsReducer = (state, action) => {
  switch (action.type) {
    // --- Caso: se empieza a pedir las solicitudes ---
    // Se activa el indicador de carga y se limpia cualquier error anterior.
    case SCHEDULE_REQUESTS_ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null };

    // --- Caso: la petición terminó bien ---
    // Se apaga loading, se guardan las solicitudes recibidas del backend
    // y se limpia el error.
    case SCHEDULE_REQUESTS_ACTIONS.FETCH_SUCCESS:
      return { ...state, loading: false, scheduleRequests: action.payload || [] };

    // --- Caso: la petición falló ---
    // Se apaga loading y se guarda el mensaje de error para mostrarlo en la UI.
    case SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload || 'Error desconocido' };

    // --- Caso: se creó una solicitud nueva ---
    // Se agrega la solicitud al final de la lista sin recargar todo.
    // Si no hay payload (respuesta vacía), se deja la lista igual.
    case SCHEDULE_REQUESTS_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        scheduleRequests: action.payload ? [...state.scheduleRequests, action.payload] : state.scheduleRequests
      };

    // --- Caso: se actualizó una solicitud (aprobar/rechazar) ---
    // Se recorre la lista y se reemplaza SOLO la solicitud cuyo id coincide
    // con el id que devolvió el backend. Las demás quedan intactas.
    case SCHEDULE_REQUESTS_ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        scheduleRequests: action.payload
          ? state.scheduleRequests.map(request =>
              request.id === action.payload.id ? action.payload : request
            )
          : state.scheduleRequests
      };

    // --- Caso: el usuario quiere ocultar el error ---
    case SCHEDULE_REQUESTS_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    // --- Caso por defecto: acción no reconocida ---
    // Se devuelve el estado sin cambios (no rompe la app).
    default:
      return state;
  }
};

// Se crea el Context: es el "contenedor" que transportará el estado.
// createContext() sin valor inicial devuelve un objeto Context con Provider y Consumer.
// Se exporta indirectamente a través del hook useScheduleRequests más abajo.
const ScheduleRequestsContext = createContext();

// Provider
// Componente que "envuelve" a la app (o a una parte de ella) y pone el estado
// a disposición de todos los componentes hijos mediante Context.Provider.
// Aquí se define TODO el estado y TODAS las funciones que los componentes pueden usar.
export const ScheduleRequestsProvider = ({ children }) => {
  // useReducer conecta el estado con la función reducer.
  // Devuelve [state, dispatch]: state = datos actuales, dispatch = función para "enviar" acciones.
  // Cada vez que se llama dispatch({type, payload}), el reducer calcula el nuevo estado.
  const [state, dispatch] = useReducer(scheduleRequestsReducer, initialState);

  // Obtener todas las solicitudes (admin)
  // Función que llama al servicio para traer TODAS las solicitudes del backend.
  // useCallback con [] = la función se crea una sola vez y no cambia entre renders.
  // Flujo: dispatch START -> llamada HTTP -> dispatch SUCCESS o FAILURE.
  const fetchScheduleRequests = useCallback(async () => {
    try {
      // 1) Avisar al reducer que empieza la carga (loading = true)
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_START });

      // 2) Llamada al backend a través del servicio
      const response = await scheduleRequestService.getScheduleRequests();

      // 3) Si todo salió bien, guardar la lista en el estado
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_SUCCESS, payload: response });
    } catch (error) {
      // 4) Si falla, extraer el mensaje de error del backend (o uno genérico)
      // error.response?.data?.message usa optional chaining por si la estructura no existe.
      const errorMessage = error.response?.data?.message || 'Error al obtener solicitudes';
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: errorMessage });
    }
  }, []);

  // Obtener mis solicitudes (empleado)
  // Igual que la anterior pero pide solo las solicitudes del usuario logueado.
  // El backend decide qué solicitudes devolver según el token/JWT del usuario.
  const fetchMyScheduleRequests = useCallback(async () => {
    try {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_START });
      const response = await scheduleRequestService.getMyScheduleRequests();
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_SUCCESS, payload: response });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener solicitudes';
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: errorMessage });
    }
  }, []);

  // Crear nueva solicitud
  // El empleado envía los datos de su solicitud de cambio de horario.
  // Si falla, se hace "throw error" para que el componente que llamó
  // pueda mostrar el mensaje de error al usuario (ej. "ya tienes una solicitud pendiente").
  const createScheduleRequest = useCallback(async (requestData) => {
    try {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_START });
      const request = await scheduleRequestService.createScheduleRequest(requestData);
      // CREATE_SUCCESS agrega la solicitud a la lista sin recargar
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.CREATE_SUCCESS, payload: request });
      // Se retorna la solicitud creada por si el componente la necesita
      return request;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear solicitud';
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: errorMessage });
      // Re-lanzar el error para que el componente pueda capturarlo con su propio try/catch
      throw error;
    }
  }, []);

  // Aprobar/rechazar solicitud (admin)
  // action puede ser 'aprobar' o 'rechazar'; comentarios_revision es opcional.
  // El backend valida permisos: solo un admin puede ejecutar esta acción.
  const updateScheduleRequest = useCallback(async (id, action, comentarios_revision) => {
    try {
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_START });
      const request = await scheduleRequestService.updateScheduleRequest(id, action, comentarios_revision);
      // UPDATE_SUCCESS reemplaza la solicitud actualizada en la lista
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.UPDATE_SUCCESS, payload: request });
      return request;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar solicitud';
      dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.FETCH_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Limpiar errores
  // Permite a la UI borrar el mensaje de error (ej. al cerrar una alerta).
  const clearError = useCallback(() => {
    dispatch({ type: SCHEDULE_REQUESTS_ACTIONS.CLEAR_ERROR });
  }, []);

  // Objeto "value" que se expondrá a todos los componentes hijos.
  // Combina el estado actual (...state = scheduleRequests, loading, error)
  // con todas las funciones disponibles. Es lo que usará useScheduleRequests().
  const value = {
    ...state,
    fetchScheduleRequests,
    fetchMyScheduleRequests,
    createScheduleRequest,
    updateScheduleRequest,
    clearError
  };

  // Provider: envuelve a los hijos y les inyecta "value" como contexto.
  // Cualquier componente descendiente puede acceder con useScheduleRequests().
  return (
    <ScheduleRequestsContext.Provider value={value}>
      {children}
    </ScheduleRequestsContext.Provider>
  );
};

// Hook personalizado
// Función que encapsula useContext para que los componentes no tengan que
// escribir useContext(ScheduleRequestsContext) cada vez.
// Además valida que el componente esté DENTRO del Provider; si no, lanza error.
// Esto evita bugs silenciosos donde el contexto valdría undefined.
export const useScheduleRequests = () => {
  const context = useContext(ScheduleRequestsContext);
  if (!context) {
    throw new Error('useScheduleRequests must be used within a ScheduleRequestsProvider');
  }
  return context;
};
