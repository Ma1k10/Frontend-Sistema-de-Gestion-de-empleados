import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Bienvenido, {user?.nombre || 'Usuario'}
        </p>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2 className="card-title">Panel Principal</h2>
          <p className="card-description">
            Esta es la página principal del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
