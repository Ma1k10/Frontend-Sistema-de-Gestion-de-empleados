// Importaciones de React y del contexto de autenticación
import React, { useState, useEffect } from 'react';
// Contexto de autenticación: proporciona el usuario actual y la función updateProfile
import { useAuth } from '../../contexts/AuthContext';
// Componente que restringe el acceso según el rol del usuario (solo empleados)
import RoleGuard from '../../components/auth/RoleGuard';
// Estilos específicos de la página de perfil
import './Profile.css';

// Componente de página de perfil del empleado con pestañas
const Profile = () => {
  // Usuario autenticado y función para actualizar su información en el backend
  const { user, updateProfile } = useAuth();
  
  // Estado del formulario: datos personales y campos de cambio de contraseña
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    correo: user?.correo || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estados de UI: indicador de carga, mensaje de éxito y mensaje de error
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // Pestaña activa del panel: 'profile', 'password' o 'account'
  const [activeTab, setActiveTab] = useState('profile');

  // Sincroniza el formulario con los datos del usuario cuando cambian
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nombre: user.nombre || '',
        correo: user.correo || ''
      }));
    }
  }, [user]);

  // Actualiza un campo del formulario según el name del input y limpia mensajes previos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar mensajes
    if (message) setMessage('');
    if (error) setError('');
  };

  // Envía la actualización de datos personales (nombre y correo) al backend
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await updateProfile({
        nombre: formData.nombre,
        correo: formData.correo
      });
      setMessage('Perfil actualizado exitosamente');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Valida y "envía" el cambio de contraseña (actualmente simulado con setTimeout)
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validar contraseñas
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (!formData.currentPassword) {
      setError('Debes ingresar tu contraseña actual');
      setLoading(false);
      return;
    }

    try {
      // Aquí iría la lógica para actualizar la contraseña
      // Por ahora, simularemos una actualización exitosa
      setTimeout(() => {
        setMessage('Contraseña actualizada exitosamente');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError('Error al actualizar la contraseña');
      setLoading(false);
    }
  };

  return (
    // El contenido JSX solo se renderiza si el usuario tiene rol "empleado"
    <RoleGuard requiredRole="empleado">
      <div className="profile-container">
        {/* Header: avatar con la inicial del nombre, nombre, correo y rol del usuario */}
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-text">
              {user?.nombre?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user?.nombre || 'Usuario'}</h1>
            <p className="profile-email">{user?.correo || 'correo@ejemplo.com'}</p>
            <span className="profile-role">{user?.rol || 'empleado'}</span>
          </div>
        </div>

        {/* Tabs: botones que cambian activeTab para mostrar el panel correspondiente */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            Información Personal
          </button>
          <button
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <span className="tab-icon">🔒</span>
            Cambiar Contraseña
          </button>
          <button
            className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <span className="tab-icon">⚙️</span>
            Información de Cuenta
          </button>
        </div>

        {/* Tab Content: renderiza solo el panel de la pestaña activa */}
        <div className="profile-content">
          {/* Profile Information Tab: formulario para editar nombre y correo */}
          {activeTab === 'profile' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Información Personal</h2>
                <p>Actualiza tu información personal</p>
              </div>
              
              {/* Alerta de éxito o error mostrada según el estado de la operación */}
              {message && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  <span>{message}</span>
                </div>
              )}
              
              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Formulario de información personal que llama a handleProfileUpdate */}
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <div className="input-group">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <div className="input-group">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      Actualizar Perfil
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Change Password Tab: formulario para cambiar la contraseña */}
          {activeTab === 'password' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Cambiar Contraseña</h2>
                <p>Actualiza tu contraseña para mantener tu cuenta segura</p>
              </div>
              
              {/* Alerta de éxito o error mostrada según el estado de la operación */}
              {message && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  <span>{message}</span>
                </div>
              )}
              
              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Formulario de cambio de contraseña que llama a handlePasswordUpdate */}
              <form onSubmit={handlePasswordUpdate} className="profile-form">
                <div className="form-group">
                  <label className="form-label">Contraseña Actual</label>
                  <div className="input-group">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nueva Contraseña</label>
                  <div className="input-group">
                    <span className="input-icon">🔑</span>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="form-input"
                      required
                      minLength="6"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Confirmar Nueva Contraseña</label>
                  <div className="input-group">
                    <span className="input-icon">🔑</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                      required
                      minLength="6"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🔒</span>
                      Cambiar Contraseña
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Account Info Tab: muestra datos de solo lectura de la cuenta del usuario */}
          {activeTab === 'account' && (
            <div className="tab-panel">
              <div className="panel-header">
                <h2>Información de la Cuenta</h2>
                <p>Detalles de tu cuenta y estado</p>
              </div>
              
              {/* Cuadrícula de tarjetas con datos de la cuenta: rol, registro, estado e ID */}
              <div className="account-info-grid">
                <div className="info-card">
                  <div className="info-icon">
                    <span>👤</span>
                  </div>
                  <div className="info-content">
                    <p className="info-label">Rol</p>
                    <p className="info-value capitalize">{user?.rol || 'empleado'}</p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">
                    <span>📅</span>
                  </div>
                  <div className="info-content">
                    <p className="info-label">Fecha de Registro</p>
                    <p className="info-value">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">
                    <span>✅</span>
                  </div>
                  <div className="info-content">
                    <p className="info-label">Estado</p>
                    <p className="info-value status-active">Activo</p>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon">
                    <span>🆔</span>
                  </div>
                  <div className="info-content">
                    <p className="info-label">ID de Usuario</p>
                    <p className="info-value">#{user?.id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
};

export default Profile;
