// React y hooks para estado local y efectos
import React, { useState, useEffect } from 'react';
// useParams obtiene el id de la URL (para saber si es edición) y
// useNavigate permite volver a la lista tras guardar o cancelar
import { useParams, useNavigate } from 'react-router-dom';
// Sistema de notificaciones tipo toast para feedback al usuario
import { toast } from 'react-toastify';
// Contexto con las funciones CRUD de empleados
import { useEmployees } from '../../contexts/EmployeesContext';
// Guardia de rol: solo administradores pueden ver este formulario
import RoleGuard from '../../components/auth/RoleGuard';
// Estilos propios del formulario de empleado
import './EmployeeForm.css';

const EmployeeForm = () => {
  // id de la ruta: si existe, el formulario opera en modo edición
  const { id } = useParams();
  const navigate = useNavigate();
  // Funciones y estado de carga del contexto de empleados
  const { fetchEmployee, createEmployee, updateEmployee, loading, error } = useEmployees();
  // Determina si estamos editando (hay id en la URL) o creando
  const isEditMode = !!id;
  // Lista cerrada de posiciones válidas para el selector del formulario
  const validPositions = ['cajero', 'supervisor', 'gerente', 'administrativo', 'tecnico', 'operador'];

  // Estado del formulario: separa datos del usuario anidado (usuario.*)
  // de los datos propios del empleado (posición, estado, contratación)
  const [formData, setFormData] = useState({
    usuario: {
      nombre: '',
      correo: '',
      contrasena: '',
      rol: 'empleado'
    },
    posicion: '',
    estado: true,
    fecha_contratacion: ''
  });

  // Errores de validación por campo, se muestran bajo cada input
  const [errors, setErrors] = useState({});
  // Evita envíos duplicados mientras la petición está en curso
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al montar (o cambiar el id) carga los datos del empleado si es edición
  useEffect(() => {
    if (isEditMode) {
      loadEmployee();
    }
  }, [id]);

  // Obtiene el empleado desde el contexto y rellena el formulario.
  // La contraseña se deja vacía porque no se envía en modo edición.
  const loadEmployee = async () => {
    try {
      const employee = await fetchEmployee(id);
      setFormData({
        usuario: {
          nombre: employee.usuario?.nombre || '',
          correo: employee.usuario?.correo || '',
          contrasena: '',
          rol: employee.usuario?.rol || 'empleado'
        },
        posicion: employee.posicion || '',
        estado: employee.estado !== undefined ? employee.estado : true,
        fecha_contratacion: employee.fecha_contratacion ? employee.fecha_contratacion.split('T')[0] : ''
      });
    } catch (err) {
      toast.error('Error al cargar el empleado');
    }
  };

  // Valida todos los campos antes de enviar. La contraseña solo es
  // obligatoria al crear (en edición se puede cambiar después).
  const validateForm = () => {
    const newErrors = {};

    if (!formData.usuario.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.usuario.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.usuario.correo)) {
      newErrors.correo = 'El correo no es válido';
    }

    if (!isEditMode && !formData.usuario.contrasena) {
      newErrors.contrasena = 'La contraseña es requerida';
    } else if (!isEditMode && formData.usuario.contrasena.length < 6) {
      newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.posicion.trim()) {
      newErrors.posicion = 'La posición es requerida';
    }

    if (!formData.fecha_contratacion) {
      newErrors.fecha_contratacion = 'La fecha de contratación es requerida';
    }

    // Devuelve true solo si no quedó ningún error registrado
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Maneja los cambios de cualquier input del formulario.
  // Los campos "usuario.*" actualizan el objeto anidado usuario;
  // el resto actualiza directamente formData (con soporte para checkbox).
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('usuario.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        usuario: {
          ...prev.usuario,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Limpia el mensaje de error del campo en cuanto el usuario corrige el dato
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Envía el formulario: valida, construye el payload (sin contraseña en
  // edición), llama a create/update según el modo y navega a la lista.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // La contraseña solo se incluye al crear; en edición se omite
      // para no sobrescribir la contraseña existente con un valor vacío
      const employeeData = {
        posicion: formData.posicion,
        fecha_contratacion: formData.fecha_contratacion,
        estado: formData.estado,
        usuario: {
          nombre: formData.usuario.nombre,
          correo: formData.usuario.correo,
          rol: formData.usuario.rol,
          ...(isEditMode ? {} : { contrasena: formData.usuario.contrasena })
        }
      };

      // Llama al CRUD correspondiente según sea creación o edición
      if (isEditMode) {
        await updateEmployee(id, employeeData);
        toast.success('Empleado actualizado exitosamente');
      } else {
        await createEmployee(employeeData);
        toast.success('Empleado creado exitosamente');
      }

      // Tras guardar con éxito, vuelve a la lista de empleados
      navigate('/admin/employees');
    } catch (err) {
      console.error('Error al guardar empleado:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al guardar el empleado');
    }
  };

  // Vuelve a la lista sin guardar los cambios
  const handleCancel = () => {
    navigate('/admin/employees');
  };

  // Todo el formulario está protegido por RoleGuard: solo admins lo ven
  return (
    <RoleGuard requiredRole="admin">
      <div className="employee-form">
        {/* Encabezado con título dinámico según modo creación/edición */}
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              {isEditMode ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h1>
            <p className="page-subtitle">
              {isEditMode 
                ? 'Actualiza la información del empleado' 
                : 'Registra un nuevo empleado en el sistema'
              }
            </p>
          </div>
        </div>

        {/* Contenedor de la tarjeta del formulario */}
        <div className="form-container">
          {/* onSubmit ejecuta handleSubmit al pulsar el botón de enviar */}
          <form onSubmit={handleSubmit} className="form">
            {/* Sección de datos del usuario: nombre, correo, contraseña y rol */}
            <div className="form-section">
              <h2 className="section-title">Información de Usuario</h2>
              
              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  Nombre Completo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="usuario.nombre"
                  value={formData.usuario.nombre}
                  onChange={handleChange}
                  className={`form-input ${errors.nombre ? 'error' : ''}`}
                  placeholder="Ej: Juan Pérez"
                />
                {errors.nombre && <span className="error-message">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="correo" className="form-label">
                  Correo Electrónico <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="correo"
                  name="usuario.correo"
                  value={formData.usuario.correo}
                  onChange={handleChange}
                  className={`form-input ${errors.correo ? 'error' : ''}`}
                  placeholder="Ej: juan@empresa.com"
                />
                {errors.correo && <span className="error-message">{errors.correo}</span>}
              </div>

              {/* La contraseña solo se pide al crear; en edición se oculta
                  porque no es necesaria ni se envía al backend */}
              {!isEditMode && (
                <div className="form-group">
                  <label htmlFor="contrasena" className="form-label">
                    Contraseña <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="contrasena"
                    name="usuario.contrasena"
                    value={formData.usuario.contrasena}
                    onChange={handleChange}
                    className={`form-input ${errors.contrasena ? 'error' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.contrasena && <span className="error-message">{errors.contrasena}</span>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="rol" className="form-label">
                  Rol <span className="required">*</span>
                </label>
                <select
                  id="rol"
                  name="usuario.rol"
                  value={formData.usuario.rol}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            {/* Sección de datos del empleado: posición, contratación y estado */}
            <div className="form-section">
              <h2 className="section-title">Información de Empleado</h2>
              
              <div className="form-group">
                <label htmlFor="posicion" className="form-label">
                  Posición/Cargo <span className="required">*</span>
                </label>
                <select
                  id="posicion"
                  name="posicion"
                  value={formData.posicion}
                  onChange={handleChange}
                  className={`form-input ${errors.posicion ? 'error' : ''}`}
                >
                  <option value="">Seleccione una posición</option>
                  {validPositions.map((position) => (
                    <option key={position} value={position}>
                      {position.charAt(0).toUpperCase() + position.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.posicion && <span className="error-message">{errors.posicion}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fecha_contratacion" className="form-label">
                  Fecha de Contratación <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="fecha_contratacion"
                  name="fecha_contratacion"
                  value={formData.fecha_contratacion}
                  onChange={handleChange}
                  className={`form-input ${errors.fecha_contratacion ? 'error' : ''}`}
                />
                {errors.fecha_contratacion && <span className="error-message">{errors.fecha_contratacion}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Estado
                </label>
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="estado"
                    name="estado"
                    checked={formData.estado}
                    onChange={handleChange}
                    className="checkbox"
                  />
                  <label htmlFor="estado" className="checkbox-label">
                    {formData.estado ? 'Activo' : 'Inactivo'}
                  </label>
                </div>
              </div>
            </div>

            {/* Botones de acción: cancelar vuelve atrás, submit envía el formulario.
                Se deshabilitan mientras loading para evitar envíos duplicados. */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
};

export default EmployeeForm;
