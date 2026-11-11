/**
 * Archivo: SchedulesContext.js
 * Descripción: Contexto de React para gestión de horarios de trabajo
 * Propósito: Centralizar estado de horarios y operaciones de exportación PDF
 * Patrón: Context API + useReducer para manejo de estado centralizado
 *
 * Este contexto permite:
 * - Admin: Gestionar todos los horarios (CRUD completo)
 * - Empleado: Ver sus propios horarios
 * - Exportar horarios a PDF con filtros
 * - Generar reportes de horarios
 */

// Se importan las funciones de React necesarias:
// createContext: crea el "canal" por el que los componentes comparten estado
// useContext: permite a cualquier componente consumir ese estado
// useReducer: alternativa a useState para estado complejo (estilo Redux)
// useEffect: ejecuta efectos secundarios (aunque aquí está importado, no se usa directamente)
// useCallback: memoiza funciones para evitar recrearlas en cada render
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Se importa el servicio que contiene las llamadas HTTP al backend.
// Este archivo NO llama a la API directamente, delega en scheduleService.
import { scheduleService } from '../services/schedules';

// Se importan las librerías para generar PDFs:
// jsPDF: crea el documento PDF
// jspdf-autotable: agrega tablas formateadas al PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Se crea el Context: es el "contenedor" que transportará el estado
// de horarios a todos los componentes que lo necesiten.
const SchedulesContext = createContext();

// ============================
// ESTADO INICIAL
// ============================
// Punto de partida del contexto: listas vacías, sin carga, sin error.
// Tiene DOS listas porque hay dos vistas:
// - schedules: todos los horarios (vista de admin)
// - mySchedules: solo los horarios del usuario logueado (vista de empleado)
// - currentSchedule: el horario que el usuario seleccionó en la UI (para ver detalle)
const initialState = {
  schedules: [],        // Lista completa de horarios (admin)
  mySchedules: [],      // Lista de horarios del empleado logueado
  loading: false,       // true mientras hay petición en curso
  error: null,          // Mensaje de error actual
  currentSchedule: null // Horario seleccionado actualmente (null = ninguno)
};

// ============================
// ACCIONES DEL REDUCER
// ============================
// Etiquetas de cada evento posible. El reducer usa action.type
// para decidir qué caso ejecutar en el switch.
// Se usan constantes para evitar errores de tipeo en strings.
const SCHEDULE_ACTIONS = {
  FETCH_START: 'FETCH_START',           // Inició carga de todos los horarios
  FETCH_SUCCESS: 'FETCH_SUCCESS',       // Carga de todos exitosa
  FETCH_FAILURE: 'FETCH_FAILURE',       // Carga de todos falló
  FETCH_MY_START: 'FETCH_MY_START',     // Inició carga de "mis" horarios
  FETCH_MY_SUCCESS: 'FETCH_MY_SUCCESS', // Carga de "mis" horarios exitosa
  FETCH_MY_FAILURE: 'FETCH_MY_FAILURE', // Carga de "mis" horarios falló
  CREATE_START: 'CREATE_START',         // Inició creación de horario
  CREATE_SUCCESS: 'CREATE_SUCCESS',     // Horario creado
  CREATE_FAILURE: 'CREATE_FAILURE',     // Creación falló
  UPDATE_START: 'UPDATE_START',         // Inició actualización
  UPDATE_SUCCESS: 'UPDATE_SUCCESS',     // Horario actualizado
  UPDATE_FAILURE: 'UPDATE_FAILURE',     // Actualización falló
  DELETE_START: 'DELETE_START',         // Inició eliminación
  DELETE_SUCCESS: 'DELETE_SUCCESS',     // Horario eliminado
  DELETE_FAILURE: 'DELETE_FAILURE',     // Eliminación falló
  SET_CURRENT_SCHEDULE: 'SET_CURRENT_SCHEDULE', // Cambiar horario seleccionado
  CLEAR_ERROR: 'CLEAR_ERROR'            // Limpiar error
};

// ============================
// REDUCER
// ============================
// Función pura: recibe (estadoActual, acción) y devuelve el NUEVO estado.
// NUNCA modifica el original; usa spread (...) para crear copias.
// Cada case describe cómo cambia el estado para esa acción.
const scheduleReducer = (state, action) => {
  switch (action.type) {
    // --- CARGA DE TODOS LOS HORARIOS (admin) ---
    case SCHEDULE_ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null };
    case SCHEDULE_ACTIONS.FETCH_SUCCESS:
      // Se guarda la lista completa en "schedules" (no en mySchedules)
      return { ...state, loading: false, schedules: action.payload, error: null };
    case SCHEDULE_ACTIONS.FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // --- CARGA DE "MIS" HORARIOS (empleado) ---
    // Igual que arriba pero guarda en mySchedules, que es la lista
    // que verá el empleado en su vista.
    case SCHEDULE_ACTIONS.FETCH_MY_START:
      return { ...state, loading: true, error: null };
    case SCHEDULE_ACTIONS.FETCH_MY_SUCCESS:
      return { ...state, loading: false, mySchedules: action.payload, error: null };
    case SCHEDULE_ACTIONS.FETCH_MY_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // --- CREAR HORARIO ---
    // CREATE_SUCCESS agrega el nuevo horario AL INICIO de la lista
    // ([action.payload, ...state.schedules] = nuevo primero, luego los viejos).
    case SCHEDULE_ACTIONS.CREATE_START:
      return { ...state, loading: true, error: null };
    case SCHEDULE_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        loading: false,
        schedules: [action.payload, ...state.schedules],
        error: null
      };
    case SCHEDULE_ACTIONS.CREATE_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // --- ACTUALIZAR HORARIO ---
    // UPDATE_SUCCESS recorre AMBAS listas (schedules y mySchedules)
    // y reemplaza el horario cuyo id coincida con el actualizado.
    // Así el cambio se refleja tanto en la vista admin como en la del empleado.
    case SCHEDULE_ACTIONS.UPDATE_START:
      return { ...state, loading: true, error: null };
    case SCHEDULE_ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        loading: false,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id ? action.payload : schedule
        ),
        mySchedules: state.mySchedules.map(schedule =>
          schedule.id === action.payload.id ? action.payload : schedule
        ),
        error: null
      };
    case SCHEDULE_ACTIONS.UPDATE_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // --- ELIMINAR HORARIO ---
    // DELETE_SUCCESS filtra AMBAS listas quitando el horario con ese id.
    // Así desaparece tanto de la vista admin como de la del empleado.
    case SCHEDULE_ACTIONS.DELETE_START:
      return { ...state, loading: true, error: null };
    case SCHEDULE_ACTIONS.DELETE_SUCCESS:
      return {
        ...state,
        loading: false,
        schedules: state.schedules.filter(schedule => schedule.id !== action.payload),
        mySchedules: state.mySchedules.filter(schedule => schedule.id !== action.payload),
        error: null
      };
    case SCHEDULE_ACTIONS.DELETE_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // --- SELECCIONAR HORARIO ACTUAL ---
    // Guarda en currentSchedule el horario que el usuario clickeó en la UI.
    // Los componentes hijos pueden leerlo para mostrar el detalle.
    case SCHEDULE_ACTIONS.SET_CURRENT_SCHEDULE:
      return { ...state, currentSchedule: action.payload };

    // --- LIMPIAR ERROR ---
    case SCHEDULE_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    // --- ACCIÓN DESCONOCIDA ---
    // Devuelve el estado sin cambios para no romper la app.
    default:
      return state;
  }
};

// ============================
// PROVIDER
// ============================
// Componente que envuelve la app (o una sección) y expone el estado
// de horarios a todos los componentes hijos mediante Context.Provider.
export const SchedulesProvider = ({ children }) => {
  // useReducer conecta el estado con la función reducer.
  // Devuelve [state, dispatch]: state = datos actuales, dispatch = enviar acciones.
  const [state, dispatch] = useReducer(scheduleReducer, initialState);

  // ============================
  // FUNCIONES (operaciones contra el backend)
  // ============================
  // Todas siguen el patrón:
  //   1. dispatch(START)  -> loading = true
  //   2. await servicio   -> llamada HTTP real
  //   3. dispatch(SUCCESS)-> actualizar estado con la respuesta
  //   4. catch            -> dispatch(FAILURE) con el mensaje de error
  // useCallback(fn, []) memoriza la función para que no se recree en cada render.

  // Obtener TODOS los horarios (admin)
  // "filters" permite filtrar por fecha, empleado, etc. desde la UI.
  const fetchSchedules = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: SCHEDULE_ACTIONS.FETCH_START });
      const schedules = await scheduleService.getSchedules(filters);
      dispatch({ type: SCHEDULE_ACTIONS.FETCH_SUCCESS, payload: schedules });
    } catch (error) {
      // error.response?.data?.message extrae el mensaje del backend
      // (el ?. evita error si la estructura no existe)
      const errorMessage = error.response?.data?.message || 'Error al obtener horarios';
      dispatch({ type: SCHEDULE_ACTIONS.FETCH_FAILURE, payload: errorMessage });
    }
  }, []);

  // Obtener MIS horarios (empleado)
  // El backend decide qué horarios devolver según el token del usuario logueado.
  const fetchMySchedules = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: SCHEDULE_ACTIONS.FETCH_MY_START });
      const schedules = await scheduleService.getMySchedules(filters);
      dispatch({ type: SCHEDULE_ACTIONS.FETCH_MY_SUCCESS, payload: schedules });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al obtener mis horarios';
      dispatch({ type: SCHEDULE_ACTIONS.FETCH_MY_FAILURE, payload: errorMessage });
    }
  }, []);

  // Crear horario (admin)
  // Si falla, se hace "throw error" para que el componente que llamó
  // pueda mostrar el mensaje de error al usuario.
  const createSchedule = useCallback(async (scheduleData) => {
    try {
      dispatch({ type: SCHEDULE_ACTIONS.CREATE_START });
      const newSchedule = await scheduleService.createSchedule(scheduleData);
      dispatch({ type: SCHEDULE_ACTIONS.CREATE_SUCCESS, payload: newSchedule });
      return newSchedule;  // Se retorna por si el componente lo necesita
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al crear horario';
      dispatch({ type: SCHEDULE_ACTIONS.CREATE_FAILURE, payload: errorMessage });
      throw error;  // Re-lanza para que el componente lo capture
    }
  }, []);

  // Actualizar horario (admin)
  const updateSchedule = useCallback(async (id, scheduleData) => {
    try {
      dispatch({ type: SCHEDULE_ACTIONS.UPDATE_START });
      const updatedSchedule = await scheduleService.updateSchedule(id, scheduleData);
      dispatch({ type: SCHEDULE_ACTIONS.UPDATE_SUCCESS, payload: updatedSchedule });
      return updatedSchedule;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar horario';
      dispatch({ type: SCHEDULE_ACTIONS.UPDATE_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Eliminar horario (admin)
  const deleteSchedule = useCallback(async (id) => {
    try {
      dispatch({ type: SCHEDULE_ACTIONS.DELETE_START });
      await scheduleService.deleteSchedule(id);
      dispatch({ type: SCHEDULE_ACTIONS.DELETE_SUCCESS, payload: id });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al eliminar horario';
      dispatch({ type: SCHEDULE_ACTIONS.DELETE_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Establecer horario actual
  // Guarda en currentSchedule el horario que el usuario seleccionó en la UI.
  // No llama al backend; solo actualiza el estado local.
  const setCurrentSchedule = useCallback((schedule) => {
    dispatch({ type: SCHEDULE_ACTIONS.SET_CURRENT_SCHEDULE, payload: schedule });
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    dispatch({ type: SCHEDULE_ACTIONS.CLEAR_ERROR });
  }, []);

  // ============================
  // EXPORTAR A PDF
  // ============================
  // Función que genera un PDF con los horarios filtrados.
  // Recibe "filters" (mismos filtros que fetchSchedules) y "title" para el reporte.
  // Usa las librerías jsPDF y jspdf-autotable.
  const exportToPDF = useCallback(async (filters = {}, title = 'Reporte de Horarios') => {
    try {
      console.log('Exportando a PDF con filtros:', filters, 'título:', title);

      // --- Filtrar datos según los filtros recibidos ---
      // Recorre state.schedules y excluye los que no cumplan las condiciones.
      // Cada "if" es un filtro: si no cumple, return false (se excluye).
      let dataToExport = state.schedules.filter(schedule => {
        // Filtro por empleado: si se especificó id_empleado, debe coincidir
        if (filters.id_empleado && schedule.id_empleado !== parseInt(filters.id_empleado)) {
          return false;
        }
        // Filtro por fecha inicio: el horario debe ser >= fecha_inicio
        if (filters.fecha_inicio && schedule.fecha < filters.fecha_inicio) {
          return false;
        }
        // Filtro por fecha fin: el horario debe ser <= fecha_fin
        if (filters.fecha_fin && schedule.fecha > filters.fecha_fin) {
          return false;
        }
        return true;  // Si pasó todos los filtros, se incluye
      });

      // --- Crear nuevo documento PDF ---
      const doc = new jsPDF();

      // Configurar fuente para caracteres especiales (español: á, é, í, ó, ú, ñ)
      doc.setFont('helvetica');

      // --- Título del reporte ---
      doc.setFontSize(18);  // Tamaño de fuente grande
      doc.text(title, 14, 20);  // x=14, y=20 (posición en la página)

      // --- Fecha de generación ---
      doc.setFontSize(10);  // Fuente más pequeña
      // toLocaleString('es-ES') formatea la fecha en español
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 30);

      // --- Preparar datos para la tabla ---
      // Cada horario se convierte en un array de valores para una fila.
      // Se accede a datos anidados con ?. por si no existen (ej. empleado?.usuario?.nombre).
      const tableData = dataToExport.map(schedule => [
        schedule.id || '',                                    // ID del horario
        schedule.empleado?.usuario?.nombre || 'Sin nombre',   // Nombre del empleado
        schedule.empleado?.usuario?.correo || 'Sin correo',   // Correo del empleado
        schedule.fecha || '',                                 // Fecha del turno
        schedule.hora_inicio || '',                           // Hora de entrada
        schedule.hora_fin || ''                               // Hora de salida
      ]);

      // --- Configurar columnas de la tabla ---
      const tableColumns = [
        'ID',
        'Empleado',
        'Correo',
        'Fecha',
        'Hora Inicio',
        'Hora Fin'
      ];

      // --- Agregar tabla al PDF ---
      // autoTable es un plugin de jsPDF que dibuja tablas automáticamente.
      // head = encabezados, body = datos, startY = posición vertical inicial.
      autoTable(doc, {
        head: [tableColumns],   // Primera fila = títulos de columnas
        body: tableData,        // Resto de filas = datos de cada horario
        startY: 40,             // La tabla empieza en y=40 (debajo del título)
        styles: {
          fontSize: 9,          // Tamaño de fuente dentro de la tabla
          cellPadding: 3        // Espacio interno de cada celda
        },
        headStyles: {
          fillColor: [66, 139, 202],  // Color de fondo del encabezado (azul RGB)
          textColor: 255              // Color del texto del encabezado (blanco)
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]  // Filas alternas con fondo gris claro
        }
      });

      // --- Estadísticas ---
      // doc.lastAutoTable.finalY = posición Y donde terminó la tabla.
      // Si no existe, se usa 150 como fallback.
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
      doc.setFontSize(12);
      doc.text(`Total de horarios: ${dataToExport.length}`, 14, finalY);

      // --- Guardar/descargar PDF ---
      // doc.save() dispara la descarga del archivo en el navegador.
      // El nombre incluye el título y la fecha actual (solo la parte de fecha).
      doc.save(`${title}_${new Date().toISOString().split('T')[0]}.pdf`);

      console.log('PDF exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      throw error;  // Re-lanza para que el componente sepa que falló
    }
  }, [state.schedules]);  // Dependencia: se recrea solo si cambia la lista de horarios

  // ============================
  // VALOR DEL CONTEXTO
  // ============================
  // Se combinan los datos del estado (...state = schedules, mySchedules,
  // loading, error, currentSchedule) con todas las funciones disponibles.
  const value = {
    ...state,
    fetchSchedules,
    fetchMySchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    setCurrentSchedule,
    clearError,
    exportToPDF
  };

  // Provider: inyecta "value" en el árbol de componentes.
  // Todo lo que esté dentro de <SchedulesProvider>...</SchedulesProvider>
  // puede usar useSchedules() para acceder a estos datos y funciones.
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
export const useSchedules = () => {
  const context = useContext(SchedulesContext);
  if (!context) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
};
