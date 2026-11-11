import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { EmployeesProvider } from './contexts/EmployeesContext';
import { SchedulesProvider } from './contexts/SchedulesContext';
import { ScheduleRequestsProvider } from './contexts/ScheduleRequestsContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { EmployeeRequestsProvider } from './contexts/EmployeeRequestsContext';

// Importaciones de páginas
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <EmployeesProvider>
          <SchedulesProvider>
            <ScheduleRequestsProvider>
              <EmployeeRequestsProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/" element={<Login />} />
                  </Routes>
                </Router>
              </EmployeeRequestsProvider>
            </ScheduleRequestsProvider>
          </SchedulesProvider>
        </EmployeesProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
