/**
 * Archivo: App.js
 * Descripción: Componente principal de la aplicación React
 * Propósito: Configurar enrutamiento, proveedores de contexto y estructura general
 * 
 * Estructura:
 * - Proveedores de contexto: Envuelven la app para proporcionar estado global
 * - Router: Define todas las rutas de la aplicación
 * - Rutas protegidas: Solo accesibles según el rol del usuario
 * - Layout: Estructura visual común (Navbar + contenido)
 * 
 * Roles del sistema:
 * - admin: Gestión completa de empleados, horarios y solicitudes
 * - empleado: Gestión de su perfil, horarios y solicitudes propias
 * - solicitante: Consulta de estado de solicitudes de empleo
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeesProvider } from './contexts/EmployeesContext';
import { SchedulesProvider } from './contexts/SchedulesContext';
import { ScheduleRequestsProvider } from './contexts/ScheduleRequestsContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import EmployeesList from './pages/admin/EmployeesList';
import EmployeeForm from './pages/admin/EmployeeForm';
import AdminNotifications from './pages/admin/AdminNotifications';
import EmployeeRequestDetail from './pages/admin/EmployeeRequestDetail';
import RequestStatus from './pages/user/RequestStatus';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import MySchedules from './pages/employee/MySchedules';
import MyRequests from './pages/employee/MyRequests';
import CreateRequest from './pages/employee/CreateRequest';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import SchedulesList from './pages/admin/SchedulesList';
import ScheduleRequestsList from './pages/admin/ScheduleRequestsList';
import ScheduleForm from './pages/admin/ScheduleForm';

// Layout principal
const MainLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="container mx-auto px-4 py-8">
      {children}
    </main>
  </div>
);

// Página de inicio redirige según rol
const Home = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setUser(null);
    }
  }, []);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.rol) {
    case 'admin':
      return <Navigate to="/admin/notifications" replace />;
    case 'empleado':
      return <Navigate to="/employee/profile" replace />;
    case 'solicitante':
      return <Navigate to="/user/request-status" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <EmployeesProvider>
        <SchedulesProvider>
          <ScheduleRequestsProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Rutas de Admin */}
                  <Route path="/admin/employees" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <EmployeesList />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/employees/new" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <EmployeeForm />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/employees/:id/edit" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <EmployeeForm />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/notifications" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <AdminNotifications />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/employee-requests/:id" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <EmployeeRequestDetail />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/schedules" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <SchedulesList />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/schedules/new" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <ScheduleForm />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/schedules/:id/edit" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <ScheduleForm />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/schedule-requests" element={
                    <ProtectedRoute requiredRole="admin">
                      <MainLayout>
                        <ScheduleRequestsList />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Empleado */}
                  <Route path="/employee/profile" element={
                    <ProtectedRoute requiredRole="empleado">
                      <MainLayout>
                        <EmployeeProfile />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/employee/my-schedules" element={
                    <ProtectedRoute requiredRole="empleado">
                      <MainLayout>
                        <MySchedules />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/employee/my-requests" element={
                    <ProtectedRoute requiredRole="empleado">
                      <MainLayout>
                        <MyRequests />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/employee/create-request" element={
                    <ProtectedRoute requiredRole="empleado">
                      <MainLayout>
                        <CreateRequest />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Usuario/Solicitante */}
                  <Route path="/user/request-status" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <RequestStatus />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </Router>
          </ScheduleRequestsProvider>
        </SchedulesProvider>
      </EmployeesProvider>
    </AuthProvider>
  );
}

export default App;