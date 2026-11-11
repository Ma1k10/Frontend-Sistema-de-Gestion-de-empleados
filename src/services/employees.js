/**
 * Archivo: employees.js
 * Descripción: Servicios para gestión de empleados
 * Propósito: CRUD completo de empleados (Crear, Leer, Actualizar, Eliminar)
 * Nota: Estas operaciones están restringidas al rol de administrador
 */

import api from './api'; // Instancia de axios configurada con token, baseURL e interceptores

// Objeto que agrupa todas las operaciones de empleados.
// Todas las rutas llaman al endpoint /employees y requieren token de administrador:
// si un usuario sin permisos las invoca, el backend responde 403 y el interceptor
// de api.js lo registra como "Acceso denegado".
export const employeeService = {
  // Obtener todos los empleados (admin)
  // Llama a GET /employees y devuelve la lista completa de empleados registrados.
  // No recibe parámetros; puede recibir filtros futuros según el backend.
  // Retorna: array de empleados (response.data.data.employees).
  // Si el usuario no es admin, el backend responde 403 y la promesa se rechaza.
  getEmployees: async () => {
    const response = await api.get('/employees'); // GET /employees: lista todos los empleados (solo admin)
    return response.data.data.employees; // Extrae el array de empleados del cuerpo de la respuesta
  },

  // Obtener un empleado específico (admin)
  // Parámetro: id (identificador numérico del empleado).
  // Llama a GET /employees/:id y devuelve los datos de ese empleado.
  // Retorna: objeto empleado (response.data.data.employee).
  // Si el empleado no existe, el backend responde 404 y la promesa se rechaza.
  getEmployee: async (id) => {
    const response = await api.get(`/employees/${id}`); // GET /employees/:id: obtiene un empleado por su ID
    return response.data.data.employee; // Extrae el objeto empleado de la respuesta
  },

  // Crear empleado (admin)
  // Parámetro: employeeData (objeto con los datos del nuevo empleado: nombre, correo, etc.).
  // Llama a POST /employees enviando employeeData como cuerpo JSON.
  // Retorna: el objeto empleado recién creado (response.data.data.employee).
  // Si los datos son inválidos o el correo ya existe, el backend responde con error.
  createEmployee: async (employeeData) => {
    const response = await api.post('/employees', employeeData); // POST /employees: crea un nuevo empleado
    return response.data.data.employee; // Extrae el empleado creado de la respuesta
  },

  // Actualizar empleado (admin)
  // Parámetros: id (ID del empleado a actualizar) y employeeData (campos a modificar).
  // Llama a PUT /employees/:id enviando solo los datos que se quieren cambiar.
  // Retorna: el objeto empleado actualizado (response.data.data.employee).
  // Si el empleado no existe, el backend responde 404 y la promesa se rechaza.
  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`/employees/${id}`, employeeData); // PUT /employees/:id: actualiza los datos del empleado
    return response.data.data.employee; // Extrae el empleado actualizado de la respuesta
  },

  // Eliminar empleado (admin)
  // Parámetro: id (ID del empleado a eliminar).
  // Llama a DELETE /employees/:id para borrar el registro del empleado.
  // Retorna: la respuesta completa del backend (response.data), que suele
  // contener un mensaje de confirmación.
  // Si el empleado no existe, el backend responde 404 y la promesa se rechaza.
  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`); // DELETE /employees/:id: elimina el empleado
    return response.data; // Retorna el cuerpo completo de la respuesta (mensaje de confirmación)
  }
};
