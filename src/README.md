# Estructura del Directorio `src`

Este documento explica la organización de archivos y carpetas en el directorio `src` del frontend.

## 📁 Estructura General

```
src/
├── components/       # Componentes reutilizables de React
├── contexts/         # Contextos de React para estado global
├── pages/            # Páginas de la aplicación
├── services/         # Servicios de API para comunicación con backend
├── utils/            # Utilidades y funciones auxiliares
├── App.js            # Componente principal de la aplicación
├── index.tsx         # Punto de entrada de la aplicación
└── index.css         # Estilos globales
```

## 📂 Descripción de Carpetas

### 🧩 `components/`
Componentes reutilizables que se usan en múltiples partes de la aplicación.

- **`auth/`**: Componentes de autenticación
  - `ProtectedRoute.js`: Protege rutas que requieren autenticación
  - `RoleGuard.js`: Verifica roles de usuario para acceso
  
- **`layout/`**: Componentes de layout
  - `Navbar.js`: Barra de navegación principal
  - `Navbar.css`: Estilos de la barra de navegación

### 🌐 `contexts/`
Contextos de React que proporcionan estado global a la aplicación usando el patrón Context API + useReducer.

- **`AuthContext.js`**: Gestión de autenticación (login, logout, registro)
- **`EmployeesContext.js`**: Gestión de empleados (CRUD)
- **`SchedulesContext.js`**: Gestión de horarios y exportación PDF
- **`ScheduleRequestsContext.js`**: Gestión de solicitudes de cambio de horario

### 📄 `pages/`
Páginas principales de la aplicación organizadas por rol.

- **`auth/`**: Páginas de autenticación
  - `Login.js`: Formulario de inicio de sesión
  - `Register.js`: Formulario de registro
  - `ForgotPassword.js`: Recuperación de contraseña
  - `ResetPassword.js`: Restablecimiento de contraseña

- **`admin/`**: Páginas exclusivas para administradores
  - `EmployeesList.js`: Lista de empleados
  - `EmployeeForm.js`: Formulario de creación/edición de empleados
  - `SchedulesList.js`: Lista de horarios
  - `ScheduleForm.js`: Formulario de creación/edición de horarios
  - `ScheduleRequestsList.js`: Lista de solicitudes de cambio
  - `AdminNotifications.js`: Panel de notificaciones
  - `EmployeeRequestDetail.js`: Detalle de solicitud de empleo

- **`employee/`**: Páginas exclusivas para empleados
  - `EmployeeProfile.js`: Perfil del empleado
  - `MySchedules.js`: Horarios personales del empleado
  - `MyRequests.js`: Solicitudes de cambio del empleado
  - `CreateRequest.js`: Crear solicitud de cambio de horario

- **`user/`**: Páginas para solicitantes
  - `RequestStatus.js`: Estado de solicitudes de empleo

### 🔌 `services/`
Servicios de API que manejan la comunicación con el backend usando Axios.

- **`api.js`**: Configuración base de Axios con interceptores
- **`auth.js`**: Servicios de autenticación (login, registro, logout)
- **`employees.js`**: CRUD de empleados
- **`schedules.js`**: CRUD de horarios
- **`scheduleRequests.js`**: Gestión de solicitudes de cambio
- **`employeeRequests.js`**: Gestión de solicitudes de empleo (con reintentos)
- **`notifications.js`**: Sistema de notificaciones

### 🛠️ `utils/`
Funciones auxiliares y utilidades.

- **`pdfExport.js`**: Funciones para exportar datos a PDF

## 🚀 Archivos Principales

### `App.js`
Componente principal que configura:
- Enrutamiento con React Router
- Proveedores de contexto (Auth, Employees, Schedules, ScheduleRequests)
- Rutas protegidas según roles
- Layout principal (Navbar + contenido)

### `index.tsx`
Punto de entrada de la aplicación React:
- Monta el componente App en el DOM
- Inicializa React StrictMode
- Configura métricas de rendimiento

## 🔐 Roles del Sistema

El sistema tiene tres roles principales:

1. **`admin`**: Acceso completo a gestión de empleados, horarios y solicitudes
2. **`empleado`**: Gestión de su perfil, horarios personales y solicitudes propias
3. **`solicitante`**: Consulta de estado de solicitudes de empleo

## 🔄 Flujo de Datos

```
Componentes → Contexts → Services → API → Backend
```

1. **Componentes**: Interfaz de usuario
2. **Contexts**: Estado global y lógica de negocio
3. **Services**: Comunicación con el backend
4. **API**: Configuración de Axios con autenticación JWT

## 🎨 Patrones de Diseño Utilizados

- **Context API**: Para estado global
- **useReducer**: Para manejo de estado complejo
- **Custom Hooks**: Para encapsular lógica reutilizable
- **Protected Routes**: Para control de acceso por roles
- **Service Layer**: Para separación de concerns en API calls

## 📝 Notas para el Profesor

- Todos los archivos JS tienen comentarios explicativos en español
- La arquitectura sigue principios de separación de responsabilidades
- Los contexts centralizan el estado para evitar prop drilling
- Los services abstraen la lógica de comunicación con el backend
- Los componentes están organizados por funcionalidad y rol
