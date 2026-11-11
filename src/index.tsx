/**
 * Archivo: index.tsx
 * Descripción: Punto de entrada de la aplicación React
 * Propósito: Renderizar el componente principal App en el DOM
 * 
 * Este archivo es el primero que se ejecuta al cargar la aplicación.
 * Monta el componente App en el elemento HTML con id 'root'.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Crea el root de React y monta la aplicación en el DOM
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Métricas de rendimiento (opcional, para monitoreo)
// Si se desea medir rendimiento, pasar una función para log results
// o enviar a un endpoint de analytics
reportWebVitals();
