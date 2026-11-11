/**
 * Archivo: Login.js
 * Descripción: Página de inicio de sesión de la aplicación
 * Propósito: Permitir a los usuarios autenticarse en el sistema
 * 
 * Funcionalidades:
 * - Formulario de login con correo y contraseña
 * - Validación de campos en tiempo real
 * - Mostrar/ocultar contraseña
 * - Redirección según rol después del login
 * - Manejo de errores de autenticación
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// Componente de la página de inicio de sesión.
// Permite al usuario autenticarse con correo y contraseña y redirige según su rol.
const Login = () => {
  // useNavigate permite redirigir al usuario después del login según su rol
  const navigate = useNavigate();
  // useLocation permite leer el estado de la navegación (por ejemplo, mensajes de registro exitoso)
  const location = useLocation();
  // Se obtienen del contexto de autenticación: función login, estado de carga, error y función para limpiarlo
  const { login, loading, error, clearError } = useAuth();

  // Estado del formulario de login: correo y contraseña controlados por React
  const [formData, setFormData] = useState({
    correo: '',
    contraseña: ''
  });
  
  // Controla si la contraseña se muestra en texto plano o enmascarada
  const [showPassword, setShowPassword] = useState(false);
  // Almacena los errores de validación por campo (correo, contraseña)
  const [validationErrors, setValidationErrors] = useState({});

  // Efecto que limpia el mensaje de "registro exitoso" del estado de navegación
  // después de 5 segundos, para que no persista al recargar la página.
  // Depende de location.state?.message para reaccionar cuando llega un mensaje.
  useEffect(() => {
    if (location.state?.message) {
      // El mensaje se mostrará a través de un estado local
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      // Limpieza: se cancela el temporizador si el componente se desmonta antes
      return () => clearTimeout(timer);
    }
  }, [location.state?.message]);

  // Handler del evento onChange de los inputs: actualiza el campo correspondiente del formulario
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

  // Valida el formulario antes de enviar: correo obligatorio y con formato válido, contraseña obligatoria.
  // Retorna true si no hay errores; de lo contrario guarda los errores y retorna false.
  const validateForm = () => {
    const errors = {};
    
    if (!formData.correo) {
      errors.correo = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      errors.correo = 'El email no es válido';
    }
    
    if (!formData.contraseña) {
      errors.contraseña = 'La contraseña es obligatoria';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler del envío del formulario: valida, llama al login del contexto y redirige según el rol
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      
      // Redirigir según el rol del usuario
      // El usuario se guarda en localStorage por el contexto de autenticación tras el login exitoso;
      // se lee para decidir a qué ruta redirigir según su rol
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.rol === 'admin') {
        navigate('/admin/notifications', { replace: true });
      } else if (user?.rol === 'empleado') {
        navigate('/employee/profile', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      // El error ya se maneja en el contexto
    }
  };

  // Alterna la visibilidad de la contraseña entre texto plano y enmascarada
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Renderizado del formulario de login dentro de una tarjeta centrada
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
          </div>
          <h1 className="login-title">Iniciar Sesión</h1>
          <p className="login-subtitle">
            Ingresa tus credenciales para acceder
          </p>
          
          {/* Mensaje de registro exitoso: se muestra solo si llega state.message desde /register */}
          {location.state?.message && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              <span>{location.state.message}</span>
            </div>
          )}
          
          <p className="login-register-link">
            ¿No tienes cuenta?{' '}
            {/* Enlace de navegación a la página de registro */}
            <Link to="/register" className="link">
              Regístrate
            </Link>
          </p>
        </div>
        
        {/* Formulario de login: se envía con handleSubmit al hacer submit */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Alerta de error de autenticación: se muestra solo si el contexto tiene un error */}
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {/* Campo de correo electrónico: controlado por formData y validado con validateForm */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-group">
                <span className="input-icon"> </span>
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
              {/* Mensaje de error de validación del campo correo, si existe */}
              {validationErrors.correo && (
                <p className="error-message">{validationErrors.correo}</p>
              )}
            </div>
            
            {/* Campo de contraseña con botón para mostrar/ocultar */}
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <span className="input-icon"> </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.contraseña ? 'error' : ''}`}
                  placeholder="••••••••"
                  required
                />
                {/* Botón para alternar la visibilidad de la contraseña (ojo abierto/cerrado) */}
              <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePassword}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {validationErrors.contraseña && (
                <p className="error-message">{validationErrors.contraseña}</p>
              )}
            </div>
          </div>

          {/* Enlace a la página de recuperación de contraseña */}
          <div className="form-options">
            <Link to="/forgot-password" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </Link>
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
                Iniciando sesión...
              </>
            ) : (
              <>
                <span className="btn-icon">🔑</span>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Pie de la tarjeta: muestra las credenciales de administrador de demostración */}
        <div className="login-footer">
          <div className="demo-credentials">
            <p className="demo-title">Credenciales de administrador:</p>
            <div className="demo-info">
              <div className="demo-item">
                <span className="demo-role">Administrador:</span>
                <span className="demo-credentials">admin@example.com / admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
