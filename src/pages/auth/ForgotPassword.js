import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // Librería para mostrar notificaciones tipo toast
import axios from 'axios'; // Cliente HTTP para llamar al backend

// Componente de la página "Recuperar Contraseña".
// Permite solicitar la recuperación enviando el correo; el sistema envía un token
// por email (a través del administrador) que luego se usa en ResetPassword.
const ForgotPassword = () => {
  // Correo electrónico ingresado por el usuario en el formulario
  const [email, setEmail] = useState('');
  // Indica si la solicitud está en proceso para deshabilitar el botón y mostrar el spinner
  const [loading, setLoading] = useState(false);
  // Indica si la solicitud se envió correctamente para mostrar la pantalla de confirmación
  const [submitted, setSubmitted] = useState(false);

  // Handler del envío del formulario: valida el correo y llama al endpoint del backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica: el correo no puede estar vacío
    if (!email) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);

    try {
      // Se envía el correo al endpoint de recuperación de contraseña del backend
      const response = await axios.post('http://localhost:3001/api/auth/forgot-password', {
        correo: email
      });

      // Si el backend confirma el envío, se muestra la pantalla de confirmación;
      // de lo contrario se muestra el mensaje de error devuelto por el servidor
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Solicitud enviada correctamente. Revisa tu email para más instrucciones.');
      } else {
        toast.error(response.data.message || 'Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error en forgot password:', error);
      const errorMessage = error.response?.data?.message || 'Error al enviar la solicitud. Inténtalo de nuevo.';
      toast.error(errorMessage);
    } finally {
      // Se restaura el estado de carga independientemente de si hubo éxito o error
      setLoading(false);
    }
  };

  // Renderizado condicional: si la solicitud ya fue enviada, se muestra la
  // pantalla de confirmación en lugar del formulario
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Solicitud Enviada
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Hemos enviado tu solicitud de recuperación de contraseña al administrador.
            </p>
          </div>
          
          {/* Cuadro informativo que explica al usuario qué pasos seguir después de la solicitud */}
          <div className="mt-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800">¿Qué pasa ahora?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>El administrador recibirá tu solicitud</li>
                  <li>Te enviará un token de recuperación por email</li>
                  <li>Usa ese token en la página de restablecimiento</li>
                  <li>El token expirará en 1 hora por seguridad</li>
                </ul>
              </div>
            </div>

            {/* Enlaces de navegación: uno lleva a restablecer la contraseña y otro vuelve al login */}
            <div className="text-center space-y-3">
              <Link
                to="/reset-password"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ir a Restablecer Contraseña
              </Link>
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Volver al Inicio de Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado principal: formulario para ingresar el correo y solicitar la recuperación
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para recuperar tu contraseña
          </p>
        </div>
        
        {/* Formulario de solicitud: envía el correo al backend mediante handleSubmit */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Actualiza el estado email al escribir
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          </div>

          {/* Botón de envío: se deshabilita mientras loading y muestra un spinner de carga */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </button>
          </div>

          {/* Enlace de navegación para volver a la página de inicio de sesión */}
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Volver al Inicio de Sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
