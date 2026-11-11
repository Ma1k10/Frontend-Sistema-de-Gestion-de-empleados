/**
 * Archivo: EmployeesList.js
 * Descripción: Página de lista de empleados para administradores
 * Propósito: Mostrar y gestionar todos los empleados del sistema
 * 
 * Funcionalidades:
 * - Listado de todos los empleados con búsqueda
 * - Crear nuevo empleado
 * - Editar empleado existente
 * - Eliminar empleado con confirmación
 * - Estadísticas de empleados (total, activos)
 * - Filtrado por nombre, correo o posición
 */

// React y hooks necesarios para estado y memoización de datos derivados
import React, { useState, useEffect, useMemo } from 'react';
// useNavigate permite navegar a las rutas de creación/edición de empleados
import { useNavigate } from 'react-router-dom';
// Contexto que centraliza el estado global de empleados (lista, CRUD y errores)
import { useEmployees } from '../../contexts/EmployeesContext';
// Componente que restringe el acceso a esta página solo a usuarios con rol admin
import RoleGuard from '../../components/auth/RoleGuard';
// Estilos propios de esta página
import './EmployeesList.css';

const EmployeesList = () => {
  // Se consumen del contexto: lista de empleados, estados de carga/error
  // y las funciones fetchEmployees y deleteEmployee para el CRUD
  const { employees, loading, error, fetchEmployees, deleteEmployee } = useEmployees();
  // Término de búsqueda escrito por el usuario en el campo de filtro
  const [searchTerm, setSearchTerm] = useState('');
  // Controla la visibilidad del modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Guarda el empleado seleccionado que se desea eliminar
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  // Hook de react-router-dom para redirigir entre rutas
  const navigate = useNavigate();

  // Al montar el componente se solicita la lista de empleados al backend
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filtrar empleados por nombre, correo o posición según el término de búsqueda.
  // Se usa useMemo para no recalcular el filtro en cada render innecesariamente.
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employees)) {
      return [];
    }
    return employees.filter(employee => {
      const employeeName = employee.usuario?.nombre || '';
      const employeeEmail = employee.usuario?.correo || '';
      const position = employee.posicion || '';
      
      const matchesSearch = searchTerm === '' || 
        employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [employees, searchTerm]);

  // Calcula estadísticas de la lista: total de empleados y cuántos están activos.
  // Se memoiza porque solo depende del array employees del contexto.
  const stats = useMemo(() => {
    if (!Array.isArray(employees)) {
      return { total: 0, active: 0 };
    }
    const total = employees.length;
    const active = employees.filter(emp => emp.estado).length;

    return { total, active };
  }, [employees]);

  // Navega a la ruta de edición del empleado seleccionado
  const handleEdit = (employee) => {
    navigate(`/admin/employees/${employee.id}/edit`);
  };

  // Prepara el modal de confirmación: guarda el empleado a eliminar
  // y muestra el modal sin eliminar todavía
  const handleDelete = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  // Confirma la eliminación real llamando al contexto y cierra el modal
  const confirmDelete = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete.id);
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
      } catch (error) {
        console.error('Error al eliminar empleado:', error);
      }
    }
  };

  // Cancela la eliminación: cierra el modal y limpia el empleado seleccionado
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  // Mientras carga (o si employees aún no es un array válido) se muestra
  // un spinner en lugar del contenido para evitar renderizar datos incompletos
  if (loading || !Array.isArray(employees)) {
    return (
      <RoleGuard requiredRole="admin">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando empleados...</p>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="admin">
      <div className="employees-list">
        {/* Sección de encabezado con título, subtítulo y botón para crear empleado */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Gestión de Empleados</h1>
            <p className="page-subtitle">Administra la lista de empleados del sistema</p>
          </div>
          {/* Navega a la ruta de creación de nuevo empleado */}
          <button 
            onClick={() => navigate('/admin/employees/new')}
            className="btn btn-primary"
          >
            <span className="btn-icon">+</span>
            Nuevo Empleado
          </button>
        </div>

        {/* Tarjetas de estadísticas: total de empleados y empleados activos */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <span>👥</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.total}</p>
              <p className="stat-label">Total Empleados</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              <span>✅</span>
            </div>
            <div className="stat-content">
              <p className="stat-number">{stats.active}</p>
              <p className="stat-label">Empleados Activos</p>
            </div>
          </div>
        </div>

        {/* Campo de búsqueda que actualiza searchTerm y dispara el filtrado memoizado */}
        <div className="search-section">
          <div className="search-input">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field"
            />
          </div>
        </div>

        {/* Mensaje de error del contexto, solo se muestra si existe error */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Lista de empleados: muestra la tabla filtrada o un estado vacío */}
        <div className="employees-table">
          {filteredEmployees.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Contacto</th>
                    <th>Posición</th>
                    <th>Estado</th>
                    <th>Fecha Contratación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Cada fila representa un empleado con sus datos y acciones */}
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {employee.usuario?.nombre?.charAt(0).toUpperCase() || 'E'}
                          </div>
                          <div>
                            <div className="employee-name">
                              {employee.usuario?.nombre || 'Sin nombre'}
                            </div>
                            <div className="employee-role">
                              {employee.usuario?.rol || 'Sin rol'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div className="contact-item">
                            <span className="contact-icon">📧</span>
                            {employee.usuario?.correo || 'Sin correo'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="position">
                          {employee.posicion || 'Sin posición'}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${employee.estado ? 'active' : 'inactive'}`}>
                          {employee.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <span className="date">
                          {employee.fecha_contratacion 
                            ? new Date(employee.fecha_contratacion).toLocaleDateString()
                            : 'Sin fecha'
                          }
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="btn btn-sm btn-secondary"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(employee)}
                            className="btn btn-sm btn-danger"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Estado vacío: mensaje distinto según haya búsqueda activa o no */
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>
                {searchTerm 
                  ? 'No se encontraron empleados' 
                  : 'No hay empleados'
                }
              </h3>
              <p>
                {searchTerm
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Crea tu primer empleado usando el botón superior'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación: solo se renderiza
            cuando showDeleteModal es true y hay un empleado seleccionado */}
        {showDeleteModal && employeeToDelete && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Confirmar Eliminación</h3>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas eliminar al empleado:</p>
                <p className="modal-employee-name">
                  <strong>{employeeToDelete.usuario?.nombre}</strong>
                </p>
                <p className="modal-warning">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  onClick={cancelDelete}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default EmployeesList;
