// Importaciones de React
import React, { useState, useMemo } from 'react';
// Contexto de notificaciones: provee la lista, el contador de no leídas y las acciones
import { useNotifications } from '../../contexts/NotificationsContext';
// Iconos de lucide-react usados en tarjetas, filtros y acciones de cada notificación
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';

// Componente de la página de notificaciones con búsqueda, filtros y acciones
const Notifications = () => {
  // Notificaciones del contexto y funciones para marcarlas leídas o eliminarlas
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  // Estados de los filtros: término de búsqueda, tipo y estado de lectura
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filtrar notificaciones
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Filtrar por término de búsqueda
      const matchesSearch = searchTerm === '' || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtrar por tipo
      const matchesType = filterType === 'all' || notification.type === filterType;

      // Filtrar por estado (leído/no leído)
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'unread' && !notification.read) ||
        (filterStatus === 'read' && notification.read);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchTerm, filterType, filterStatus]);

  // Estadísticas: totales, no leídas y conteo por tipo para las tarjetas resumen
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {});

    return { total, unread, byType };
  }, [notifications]);

  // Obtener icono según tipo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  // Obtener color de fondo según tipo
  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Marcar como leída
  // Envuelve markAsRead del contexto con manejo de errores para no romper la UI
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marcar todas como leídas
  // Envuelve markAllAsRead del contexto para marcar todas las notificaciones como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Eliminar notificación
  // Envuelve deleteNotification del contexto para eliminar una notificación por id
  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header: título y descripción de la página */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona todas tus notificaciones en un solo lugar
        </p>
      </div>

      {/* Stats Cards: totales de notificaciones, no leídas, leídas y fecha de la más reciente */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tarjeta: número total de notificaciones */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>

        {/* Tarjeta: notificaciones aún no leídas */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
              <p className="text-sm text-gray-600">No leídas</p>
            </div>
          </div>
        </div>

        {/* Tarjeta: notificaciones ya leídas (total menos no leídas) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total - stats.unread}</p>
              <p className="text-sm text-gray-600">Leídas</p>
            </div>
          </div>
        </div>

        {/* Tarjeta: fecha de la notificación más reciente (o "N/A" si no hay) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.length > 0 
                  ? new Date(Math.max(...notifications.map(n => new Date(n.created_at)))).toLocaleDateString()
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-gray-600">Última</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions: barra con buscador, filtros por tipo/estado y botón de marcar todas */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar notificaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter: el select controla filterType para filtrar por tipo de notificación */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="info">Información</option>
              <option value="success">Éxito</option>
              <option value="warning">Advertencia</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Status Filter: el select controla filterStatus para filtrar leídas/no leídas */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="unread">No leídas</option>
            <option value="read">Leídas</option>
          </select>

          {/* Actions: solo se muestra si hay notificaciones sin leer (unreadCount > 0) */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List: lista de notificaciones filtradas o estado vacío */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              // Las notificaciones no leídas se resaltan con fondo azul y borde lateral
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${getNotificationBgColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Nueva
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Botón para marcar como leída; solo aparece en notificaciones no leídas */}
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Estado vacío: el mensaje cambia según haya filtros activos o no haya notificaciones
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                ? 'No se encontraron notificaciones' 
                : 'No tienes notificaciones'
              }
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las notificaciones aparecerán aquí cuando las recibas'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
