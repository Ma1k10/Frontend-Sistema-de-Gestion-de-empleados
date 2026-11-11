/**
 * Archivo: EmployeesContext.js
 * Descripción: Contexto de React para gestión de empleados
 * Propósito: Centralizar el estado y operaciones CRUD de empleados
 * Patrón: Context API + useReducer para manejo de estado centralizado
 * 
 * Este contexto permite que los componentes de administración puedan:
 * - Obtener lista de empleados
 * - Crear nuevos empleados
 * - Actualizar información de empleados
 * - Eliminar empleados
 * - Gestionar errores de carga
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { employeeService } from '../services/employees';

// Estado inicial
const initialState = {
  employees: [],
  loading: false,
  error: null,
  currentEmployee: null
};

// Actions
const EMPLOYEE_ACTIONS = {
  FETCH_START: 'FETCH_START', //Comineza la consulta de empleados
  FETCH_SUCCESS: 'FETCH_SUCCESS', //Consulta exitosa
  FETCH_FAILURE: 'FETCH_FAILURE', //Error en la consulta
  CREATE_START: 'CREATE_START', //Comineza la creacion de un empleado
  CREATE_SUCCESS: 'CREATE_SUCCESS', //Creacion exitosa
  CREATE_FAILURE: 'CREATE_FAILURE', //Error en la creacion
  UPDATE_START: 'UPDATE_START', //Comineza la actualizacion de un empleado
  UPDATE_SUCCESS: 'UPDATE_SUCCESS', //Actualizacion exitosa
  UPDATE_FAILURE: 'UPDATE_FAILURE', //Error en la actualizacion
  DELETE_START: 'DELETE_START', //Comineza la eliminacion de un empleado
  DELETE_SUCCESS: 'DELETE_SUCCESS', //Eliminacion exitosa
  DELETE_FAILURE: 'DELETE_FAILURE', //Error en la eliminacion
  SET_CURRENT_EMPLOYEE: 'SET_CURRENT_EMPLOYEE', //Establece el empleado actual
  CLEAR_ERROR: 'CLEAR_ERROR' //Limpia el error
};

// Reducer
const employeeReducer = (state, action) => {
  switch (action.type) {
    case EMPLOYEE_ACTIONS.FETCH_START:
      return { ...state, loading: true, error: null }; //Comienza la consulta
    case EMPLOYEE_ACTIONS.FETCH_SUCCESS:
      return { ...state, loading: false, employees: action.payload, error: null }; //Consulta exitosa
    case EMPLOYEE_ACTIONS.FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload }; //Error en la consulta
    case EMPLOYEE_ACTIONS.CREATE_START:
      return { ...state, loading: true, error: null }; //Comienza la creacion
    case EMPLOYEE_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        loading: false,
        employees: [...state.employees, action.payload],
        error: null
      }; //Creacion exitosa
    case EMPLOYEE_ACTIONS.CREATE_FAILURE:
      return { ...state, loading: false, error: action.payload }; //Error en la creacion
    case EMPLOYEE_ACTIONS.UPDATE_START:
      return { ...state, loading: true, error: null }; //Comienza la actualizacion
    case EMPLOYEE_ACTIONS.UPDATE_SUCCESS:
      return {
        ...state,
        loading: false,
        employees: state.employees.map(employee =>
          employee.id === action.payload.id ? action.payload : employee
        ),
        error: null
      }; //Actualizacion exitosa
    case EMPLOYEE_ACTIONS.UPDATE_FAILURE:
      return { ...state, loading: false, error: action.payload }; //Error en la actualizacion
    case EMPLOYEE_ACTIONS.DELETE_START:
      return { ...state, loading: true, error: null }; //Comienza la eliminacion
    case EMPLOYEE_ACTIONS.DELETE_SUCCESS:
      return {
        ...state,
        loading: false,
        employees: state.employees.filter(employee => employee.id !== action.payload),
        error: null
      }; //Eliminacion exitosa
    case EMPLOYEE_ACTIONS.DELETE_FAILURE:
      return { ...state, loading: false, error: action.payload }; //Error en la eliminacion
    case EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE:
      return { ...state, currentEmployee: action.payload }; //Establece el empleado actual
    case EMPLOYEE_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null }; //Limpia el error
    default:
      return state;
  }
};

// Context
const EmployeesContext = createContext();

// Provider
export const EmployeesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(employeeReducer, initialState); // Crea el estado y el dispatch

  // Obtener todos los empleados (admin)
  const fetchEmployees = useCallback(async () => {
    try {
      dispatch({ type: EMPLOYEE_ACTIONS.FETCH_START });
      const employees = await employeeService.getEmployees(); // Obtiene todos los empleados
      dispatch({ type: EMPLOYEE_ACTIONS.FETCH_SUCCESS, payload: employees });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al obtener empleados';
      dispatch({ type: EMPLOYEE_ACTIONS.FETCH_FAILURE, payload: errorMessage });
    }
  }, []);

  // Obtener un empleado específico (admin)
  const fetchEmployee = useCallback(async (id) => {
    try {
      dispatch({ type: EMPLOYEE_ACTIONS.FETCH_START });
      const employee = await employeeService.getEmployee(id); // Obtiene un empleado específico
      dispatch({ type: EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE, payload: employee });
      dispatch({ type: EMPLOYEE_ACTIONS.FETCH_SUCCESS, payload: state.employees });
      return employee;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al obtener empleado';
      dispatch({ type: EMPLOYEE_ACTIONS.FETCH_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Crear empleado (admin)
  const createEmployee = useCallback(async (employeeData) => {
    try {
      dispatch({ type: EMPLOYEE_ACTIONS.CREATE_START });
      const newEmployee = await employeeService.createEmployee(employeeData); // Crea un nuevo empleado
      dispatch({ type: EMPLOYEE_ACTIONS.CREATE_SUCCESS, payload: newEmployee });
      return newEmployee;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al crear empleado';
      dispatch({ type: EMPLOYEE_ACTIONS.CREATE_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Actualizar empleado (admin)
  const updateEmployee = useCallback(async (id, employeeData) => {
    try {
      dispatch({ type: EMPLOYEE_ACTIONS.UPDATE_START });
      const updatedEmployee = await employeeService.updateEmployee(id, employeeData); // Actualiza un empleado
      dispatch({ type: EMPLOYEE_ACTIONS.UPDATE_SUCCESS, payload: updatedEmployee });
      return updatedEmployee;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar empleado';
      dispatch({ type: EMPLOYEE_ACTIONS.UPDATE_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Eliminar empleado (admin)
  const deleteEmployee = useCallback(async (id) => {
    try {
      dispatch({ type: EMPLOYEE_ACTIONS.DELETE_START });
      await employeeService.deleteEmployee(id); // Elimina un empleado
      dispatch({ type: EMPLOYEE_ACTIONS.DELETE_SUCCESS, payload: id });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al eliminar empleado';
      dispatch({ type: EMPLOYEE_ACTIONS.DELETE_FAILURE, payload: errorMessage });
      throw error;
    }
  }, []);

  // Establecer empleado actual
  const setCurrentEmployee = useCallback((employee) => { 
    dispatch({ type: EMPLOYEE_ACTIONS.SET_CURRENT_EMPLOYEE, payload: employee }); // Establece el empleado actual
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    dispatch({ type: EMPLOYEE_ACTIONS.CLEAR_ERROR }); // Limpia el error
  }, []);

  const value = {
    ...state,
    fetchEmployees,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setCurrentEmployee,
    clearError
  }; // Valores del contexto

  return <EmployeesContext.Provider value={value}>{children}</EmployeesContext.Provider>;
}; // Provider

// Hook
export const useEmployees = () => {
  const context = useContext(EmployeesContext); // Obtiene el contexto
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeesProvider'); // Lanza un error si no se usa dentro del provider
  }
  return context; // Retorna el contexto
};
