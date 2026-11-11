
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Rutas de Admin
  const adminRoutes = [
    { path: '/admin/employees', label: 'Empleados', icon: '👥' },
    { path: '/admin/schedules', label: 'Horarios', icon: '📅' },
    { path: '/admin/schedule-requests', label: 'Solicitudes', icon: '📋' }
  ];

  // Rutas de Empleado
  const employeeRoutes = [
    { path: '/employee/profile', label: 'Mi Perfil', icon: '👤' },
    { path: '/employee/my-schedules', label: 'Mis Horarios', icon: '📅' },
    { path: '/employee/my-requests', label: 'Mis Solicitudes', icon: '📋' }
  ];

  const currentRoutes = isAdmin() ? adminRoutes : isEmployee() ? employeeRoutes : [];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">⏰</span>
            <span className="brand-text">Gestión de Horarios</span>
          </Link>
        </div>

        <div className="navbar-menu">
          {user && (
            <>
              <div className="nav-links">
                {currentRoutes.map((route) => (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={`nav-link ${isActive(route.path) ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{route.icon}</span>
                    <span className="nav-label">{route.label}</span>
                  </Link>
                ))}
              </div>

              <div className="nav-user">
                <div className="user-info">
                  <span className="user-name">{user.nombre}</span>
                  <span className="user-role">{user.rol}</span>
                </div>
                <div className="user-actions">
                  <button onClick={handleLogout} className="logout-btn">
                    <span>🚪</span>
                    <span>Salir</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {user && (
          <>
            <div className="mobile-user-info">
              <div className="mobile-user-avatar">
                <span>👤</span>
              </div>
              <div className="mobile-user-details">
                <span className="mobile-user-name">{user.nombre}</span>
                <span className="mobile-user-role">{user.rol}</span>
              </div>
            </div>

            <div className="mobile-nav-links">
              {currentRoutes.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className={`mobile-nav-link ${isActive(route.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-nav-icon">{route.icon}</span>
                  <span className="mobile-nav-label">{route.label}</span>
                </Link>
              ))}
            </div>

            <div className="mobile-logout">
              <button onClick={handleLogout} className="mobile-logout-btn">
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
