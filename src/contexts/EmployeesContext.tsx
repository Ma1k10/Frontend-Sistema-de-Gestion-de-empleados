import React, { createContext, useContext, useReducer, useCallback } from 'react';
import api from '../services/api';

// ============================
// TIPOS (TypeScript)
// ============================
// Las "interfaces" definen la forma de los objetos: qué campos tienen y de qué tipo.
// Sirven para que TypeScript avise si falta un campo o se usa un tipo incorrecto.

// Tipo del empleado: representa un registro de la tabla "usuarios/empleados" del backend.
interface Employee {
  id: number;           // Identificador único del empleado
  nombre: string;       // Nombre completo
  correo: string;       // Correo electrónico (también sirve para login)
  telefono?: string;    // Teléfono (opcional, el ? indica que puede no existir)
  posicion: string;     // Puesto de trabajo (cajero, mesero, etc.)
  rol: 'admin' | 'empleado' | 'usuario';  // Nivel de permisos del usuario
  is_active: boolean;   // Si la cuenta está activa o deshabilitada
  created_at: string;   // Fecha de creación del registro
  updated_at: string;   // Fecha de última modificación
}

// Estado del contexto: agrupa todos los datos que el contexto comparte.
interface EmployeesState {
  employees: Employee[]; // Lista completa de empleados cargados del backend
  loading: boolean;      // true mientras hay una petición HTTP en curso
  error: string | null;  // Mensaje de error actual (null = sin error)
}

// Tipo del contexto: describe TODO lo que se puede consumir desde el hook.
// "extends EmployeesState" significa que incluye los campos del estado
// (employees, loading, error) MÁS las funciones que se definen abajo.
interface EmployeesContextType extends EmployeesState {
  fetchEmployees: () => Promise<void>;                          // Cargar la lista completa
  createEmployee: (employee: Partial<Employee>) => Promise<void>; // Crear nuevo empleado
  updateEmployee: (id: number, employee: Partial<Employee>) => Promise<void>; // Editar empleado
  deleteEmployee: (id: number) => Promise<void>;                // Eliminar empleado
  clearError: () => void;                                       // Borrar mensaje de error
}

// ============================
// ACCIONES DEL REDUCER
// ============================
// Constantes que nombran cada tipo de "evento" que puede ocurrir.
// El reducer usa action.type para saber cuál ejecutar.
// Se escriben en MAYÚSCULAS para distinguirlas de variables normales.
const EMPLOYEES_ACTIONS = {
  FETCH_START: 'FETCH_START',       // Inició la carga de empleados
  FETCH_SUCCESS: 'FETCH_SUCCESS',   // Carga terminada con éxito
  FETCH_FAILURE: 'FETCH_FAILURE',   // La carga falló
  CREATE_SUCCESS: 'CREATE_SUCCESS', // Se creó un empleado nuevo
  UPDATE_SUCCESS: 'UPDATE_SUCCESS', // Se actualizó un empleado existente
  DELETE_SUCCESS: 'DELETE_SUCCESS', // Se eliminó un empleado
  CLEAR_ERROR: 'CLEAR_ERROR'        // Limpiar el error guardado
};

// ============================
// ESTADO INICIAL
// ============================
// Valores con los que arranca el contexto antes de cualquier petición.
const initialState: EmployeesState = {
  employees: [],   // Lista vacía hasta que fetchEmployees traiga datos
  loading: false,  // No hay carga en curso al inicio
  error: null      // No hay error al inicio
};

// ============================
// REDUCER
// ============================
// Función pura: recibe el estado actual y una acción, devuelve el nuevo estado.
// Nunca modifica el estado original; crea copias con el operador spread (...).
// Esto es clave en React: el estado debe tratarse como inmutable para que
// React detecte los cambios y re-renderice los componentes correctamente.
const employeesReducer = (state: EmployeesState, action: any): EmployeesState => {
  switch (action.type) {
    // --- INICIO DE CARGA ---
    // Se activa loading para que la UI muestre un indicador (spinner).
    // Se limpia error por si había uno de una operación anterior.
    case EMPLOYEES_ACTIONS.FETCH_START:
      return {
        ...state,          // Copia todas las propiedades del estado actual
        loading: true,     // Cambia solo loading
        error: null        // Y limpia el error
      };

    // --- CARGA EXITOSA ---
    // Se desactiva loading, se reemplaza la lista completa con los datos
    // que llegaron del backend (action.payload) y se limpia el error.
    case EMPLOYEES_ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        employees: action.payload,  // Nueva lista de empleados desde el servidor
        error: null
      };

    // --- CARGA FALLIDA ---
    // Se desactiva loading y se guarda el mensaje de error para mostrarlo.
    case EMPLOYEES_ACTIONS.FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    // --- CREAR EMPLEADO ---
    // Se agrega el nuevo empleado (action.payload) al FINAL de la lista.
    // [...state.employees, action.payload] = copia de la lista + nuevo elemento.
    // Así la UI se actualiza sin tener que volver a pedir toda la lista.
    case EMPLOYEES_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        employees: [...state.employees, action.payload]
      };

    // --- ACTUALIZAR EMPLEADO ---
    // Se recorre la lista y para cada empleado:
    // - Si su id coincide con el del empleado editado (action.payload.id),
    //   se fusiona el objeto viejo con los cambios nuevos {...employee, ...action.payload}
    // - Si no coincide, se deja igual.
    // El resultado es una lista nueva donde solo cambió el empleado editado.
    case EMPLOYEES_ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        employees: state.employees.map(employee =>
          employee.id === action.payload.id
            ? { ...employee, ...action.payload }  // Fusiona datos viejos + nuevos
            : employee                            // Deja los demás igual
        )
      };

    // --- ELIMINAR EMPLEADO ---
    // Se filtra la lista quitando el empleado cuyo id coincide con action.payload.
    // filter devuelve un array nuevo solo con los elementos que cumplan la condición.
    case EMPLOYEES_ACTIONS.DELETE_SUCCESS:
      return {
        ...state,
        employees: state.employees.filter(employee => employee.id !== action.payload)
      };

    // --- LIMPIAR ERROR ---
    // Solo pone error en null; el resto del estado no cambia.
    case EMPLOYEES_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    // --- ACCIÓN DESCONOCIDA ---
    // Por seguridad, si llega una acción que no existe en el switch,
    // se devuelve el estado sin tocar para que la app no se rompa.
    default:
      return state;
  }
};

// ============================
// CONTEXTO
// ============================
// createContext crea el "canal" de comunicación.
// El valor undefined indica que aún no hay Provider; el hook lo valida después.
const EmployeesContext = createContext<EmployeesContextType | undefined>(undefined);

// ============================
// PROVIDER
// ============================
// Componente que envuelve la parte de la app que necesita estos datos.
// Toda la lógica vive aquí: estado (useReducer) y funciones que llaman a la API.
// Los componentes hijos acceden todo esto con el hook useEmployees().
export const EmployeesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useReducer conecta el reducer con el estado.
  // Devuelve [state, dispatch]:
  //   state   -> datos actuales (employees, loading, error)
  //   dispatch -> función para "enviar" acciones al reducer
  // Cada dispatch({type, payload}) hace que el reducer calcule el nuevo estado.
  const [state, dispatch] = useReducer(employeesReducer, initialState);

  // ============================
  // FUNCIONES (operaciones contra el backend)
  // ============================
  // Todas siguen el mismo patrón:
  //   1. dispatch(START)  -> loading = true
  //   2. await api.metodo -> llamada HTTP real
  //   3. dispatch(SUCCESS)-> actualizar estado con la respuesta
  //   4. catch            -> dispatch(FAILURE) con el mensaje de error
  // useCallback(fn, []) memoriza la función para que no se recree en cada render.

  // Cargar todos los empleados (GET /employees)
  const fetchEmployees = useCallback(async () => {
    try {
      dispatch({ type: EMPLOYEES_ACTIONS.FETCH_START });
      const response = await api.get('/employees');
      // response.data.data = el backend devuelve { success, data: [...] }
      dispatch({ type: EMPLOYEES_ACTIONS.FETCH_SUCCESS, payload: response.data.data });
    } catch (error: any) {
      dispatch({ type: EMPLOYEES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Crear un empleado nuevo (POST /employees)
  // "employee" llega como Partial<Employee>: puede traer solo algunos campos.
  const createEmployee = useCallback(async (employee: Partial<Employee>) => {
    try {
      const response = await api.post('/employees', employee);
      // El backend devuelve el empleado ya creado con su id, se agrega a la lista
      dispatch({ type: EMPLOYEES_ACTIONS.CREATE_SUCCESS, payload: response.data.data });
    } catch (error: any) {
      dispatch({ type: EMPLOYEES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Actualizar un empleado existente (PUT /employees/:id)
  // Combina el id (en la URL) con los campos a modificar (en el body).
  const updateEmployee = useCallback(async (id: number, employee: Partial<Employee>) => {
    try {
      const response = await api.put(`/employees/${id}`, employee);
      dispatch({ type: EMPLOYEES_ACTIONS.UPDATE_SUCCESS, payload: response.data.data });
    } catch (error: any) {
      dispatch({ type: EMPLOYEES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Eliminar un empleado (DELETE /employees/:id)
  // No hay payload de respuesta; el reducer usa el id para quitarlo de la lista.
  const deleteEmployee = useCallback(async (id: number) => {
    try {
      await api.delete(`/employees/${id}`);
      dispatch({ type: EMPLOYEES_ACTIONS.DELETE_SUCCESS, payload: id });
    } catch (error: any) {
      dispatch({ type: EMPLOYEES_ACTIONS.FETCH_FAILURE, payload: error.message });
    }
  }, []);

  // Limpiar el mensaje de error (se llama desde la UI, ej. al cerrar una alerta)
  const clearError = useCallback(() => {
    dispatch({ type: EMPLOYEES_ACTIONS.CLEAR_ERROR });
  }, []);

  // ============================
  // VALOR DEL CONTEXTO
  // ============================
  // Se arma el objeto que recibirán todos los componentes hijos:
  //   ...state        -> employees, loading, error (los datos)
  //   funciones       -> fetchEmployees, createEmployee, etc. (las acciones)
  const value: EmployeesContextType = {
    ...state,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clearError,
  };

  // Provider: inyecta "value" en el árbol de componentes.
  // Todo lo que esté dentro de <EmployeesProvider>...</EmployeesProvider>
  // puede usar useEmployees() para leer estado y llamar funciones.
  return (
    <EmployeesContext.Provider value={value}>
      {children}
    </EmployeesContext.Provider>
  );
};

// ============================
// HOOK PERSONALIZADO
// ============================
// Hook que simplifica el uso del contexto en los componentes.
// En vez de escribir useContext(EmployeesContext) cada vez,
// se usa useEmployees() que además valida que el componente
// esté dentro del Provider (si no, lanza un error claro).
export const useEmployees = (): EmployeesContextType => {
  const context = useContext(EmployeesContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeesProvider');
  }
  return context;
};
