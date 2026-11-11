import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Register.css';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

// Componente de la página de registro de usuarios.
// Permite solicitar empleo enviando nombre, correo, contraseña, posición deseada y mensaje.
// El registro queda pendiente de aprobación por parte del administrador.
const Register = () => {
  // useNavigate permite redirigir al usuario al login tras un registro exitoso
  const navigate = useNavigate();
  // Se obtiene del contexto de autenticación la función register y los estados de carga/error
  const { register, loading, error, clearError } = useAuth();
  
  // Estado del formulario de registro: todos los campos controlados por React
  const [formData, setFormData] = React.useState({
    nombre: '',
    correo: '',
    contraseña: '',
    confirmPassword: '',
    posicion_deseada: '',
    mensaje: ''
  });
  
  // Almacena los errores de validación por campo para mostrarlos debajo de cada input
  const [validationErrors, setValidationErrors] = React.useState({});

  // Handler del evento onChange: actualiza el campo del formulario y limpia
  // el error de validación de ese campo y el error global de autenticación
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores de validación
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Limpiar error de autenticación
    if (error) {
      clearError();
    }
  };

  // Valida todos los campos del formulario antes de enviar:
  // nombre (obligatorio, mínimo 3 caracteres), correo (formato válido),
  // contraseña (mínimo 6 caracteres), confirmación (debe coincidir)
  // y posición deseada (obligatoria). Retorna true si el formulario es válido.
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nombre) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.correo) {
      errors.correo = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      errors.correo = 'El email no es válido';
    }
    
    if (!formData.contraseña) {
      errors.contraseña = 'La contraseña es obligatoria';
    } else if (formData.contraseña.length < 6) {
      errors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.contraseña !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!formData.posicion_deseada) {
      errors.posicion_deseada = 'La posición deseada es obligatoria';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler del envío del formulario: valida los datos, llama al register del
  // contexto de autenticación y, si tiene éxito, redirige al login con un mensaje
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Solo se envían los campos necesarios; confirmPassword no se incluye en el payload
      await register({
        nombre: formData.nombre,
        correo: formData.correo,
        contraseña: formData.contraseña,
        posicion_deseada: formData.posicion_deseada,
        mensaje: formData.mensaje
      });
      
      // Se pasa un mensaje de estado a través de la navegación para que Login.js
      // pueda mostrar que la solicitud de empleo fue enviada y está pendiente de aprobación
      navigate('/login', { 
        state: { 
          message: '¡Registro exitoso! Tu solicitud de empleo está pendiente de aprobación.' 
        } 
      });
    } catch (error) {
      // El error ya se maneja en el contexto
    }
  };

  // Renderizado del formulario de registro dentro de una tarjeta centrada
  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          {/* Icono de usuario con el que se identifica visualmente la página */}
          <div className="register-icon">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="register-title">Crear Cuenta</h1>
          <p className="register-subtitle">
            Solicita empleo en nuestro sistema
          </p>
          <p className="register-login-link">
            ¿Ya tienes cuenta?{' '}
            {/* Enlace de navegación a la página de inicio de sesión */}
            <Link to="/login" className="link">
              Inicia sesión
            </Link>
          </p>
        </div>
        
        {/* Formulario de registro: se envía con handleSubmit al hacer submit */}
        <form className="register-form" onSubmit={handleSubmit}>
          {/* Alerta de error de autenticación: se muestra solo si el contexto tiene un error */}
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {/* Cuadrícula de campos del formulario dispuesta en dos columnas */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <div className="input-group">
                <span className="input-icon"></span>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.nombre ? 'error' : ''}`}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              {validationErrors.nombre && (
                <p className="error-message">{validationErrors.nombre}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className="input-group">
                <span className="input-icon"></span>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.correo ? 'error' : ''}`}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {validationErrors.correo && (
                <p className="error-message">{validationErrors.correo}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <div className="input-group">
                <span className="input-icon"></span>
                <input
                  type="password"
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.contraseña ? 'error' : ''}`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {validationErrors.contraseña && (
                <p className="error-message">{validationErrors.contraseña}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirmar Contraseña *</label>
              <div className="input-group">
                <span className="input-icon"></span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="error-message">{validationErrors.confirmPassword}</p>
              )}
            </div>
            
            {/* Campo de selección de la posición deseada (select) con opciones predefinidas */}
            <div className="form-group full-width">
              <label className="form-label">Posición Deseada *</label>
              <div className="input-group">
                <span className="input-icon"></span>
                <select
                  name="posicion_deseada"
                  value={formData.posicion_deseada}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.posicion_deseada ? 'error' : ''}`}
                  required
                >
                  <option value="">Selecciona una posición</option>
                  <option value="cajero">Cajero</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="gerente">Gerente</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="tecnico">Técnico</option>
                  <option value="operador">Operador</option>
                </select>
              </div>
              {validationErrors.posicion_deseada && (
                <p className="error-message">{validationErrors.posicion_deseada}</p>
              )}
            </div>
            
            {/* Campo de texto opcional donde el aspirante puede presentarse */}
            <div className="form-group full-width">
              <label className="form-label">Mensaje (Opcional)</label>
              <div className="input-group">
                <span className="input-icon">📝</span>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Cuéntanos por qué te gustaría trabajar con nosotros..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Aviso legal de aceptación de términos y política de privacidad al registrarse */}
          <div className="form-terms">
            Al registrarte, aceptas nuestros{' '}
            <a href="#" className="link">términos y condiciones</a>{' '}
            y{' '}
            <a href="#" className="link">política de privacidad</a>
          </div>

          {/* Botón de envío: se deshabilita mientras loading y muestra un spinner */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Registrando...
              </>
            ) : (
              <>
                <span className="btn-icon">👤</span>
                Crear Cuenta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
