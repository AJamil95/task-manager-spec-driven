# 📝 Task Manager - Spec-Driven Development con IA

Este proyecto es un **Gestor de Tareas** desarrollado bajo el enfoque **Spec-Driven Development**, asistido por un **Agente de IA (Kiro)**. El objetivo es modernizar la gestión interna de tareas en DevPro (empresa inventada solo para fines académicos), permitiendo crear, listar y actualizar el estado de tareas de forma simple y ordenada.

---

## 🎯 Objetivo del Proyecto

Construir un sistema mínimo viable que permita:

- Crear tareas con título y descripción.
- Visualizar el listado de tareas.
- Actualizar el estado de cada tarea (`pendiente`, `en progreso`, `completada`).

Toda la implementación se basará estrictamente en el documento **SPEC.md**, el cual actúa como **fuente única de verdad** tanto para el desarrollador como para la IA.

---

## 🧠 Metodología: Spec-Driven Development con IA

1. Primero se define la especificación detallada (**SPEC.md**).
2. Esa especificación guía estrictamente al agente de IA durante la generación de código.
3. El diseño arquitectónico se define antes de programar.
4. La IA solo genera lo que las especificaciones permiten, evitando improvisaciones.

**Agente utilizado:** Kiro (modelo Claude Sonnet 4 / 4.5).

---

## 🛠️ Cuestiones Técnicas

### Backend (API REST)

- **Lenguaje:** TypeScript (JavaScript Next-Gen)
- **Framework:** Express.js
- **Base de Datos:** PostgreSQL con Prisma ORM
- **Arquitectura:** Patrón MVC (Model-View-Controller)
- **Principios SOLID:** Single Responsibility aplicado en controladores, servicios y modelos
- **Asincronía:** Uso de Promises y Async/Await en todas las operaciones de base de datos
- **API Strategy:** Diseño REST para operaciones CRUD
  - `POST /api/tasks` - Crear tarea
  - `GET /api/tasks` - Listar tareas
  - `PATCH /api/tasks/:id` - Actualizar estado de tarea
- **Seguridad:**
  - Autenticación con JWT (JSON Web Tokens)
  - Middleware de autenticación para rutas protegidas
  - Validación de entradas en controladores
  - Variables de entorno para datos sensibles
- **Manejo de Errores:** Middleware centralizado de errores

### Frontend (UI)

- **Tecnología:** HTML5, CSS3, JavaScript Vanilla
- **Build Tool:** Vite
- **Arquitectura:** SPA (Single Page Application)
- **Comunicación:** Fetch API para consumir endpoints REST
- **Características:**
  - Interfaz responsive
  - Gestión de estado de tareas en tiempo real
  - Formularios de creación y actualización
  - Sistema de autenticación con tokens

---

## 📦 Instalación y Ejecución

### Prerrequisitos

- Node.js (v18 o superior)
- PostgreSQL instalado y ejecutándose
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio:**

   ```bash
   git clone <url-del-repositorio>
   cd task-manager-spec-driven
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   ```bash
   copy .env.example .env
   ```

   Editar `.env` con la configuración necesaria:

   ```env
   # Configuración de Base de Datos
   DATABASE_URL="postgresql://postgres:admin@127.0.0.1:5432/taskmanager?schema=public"

   # Configuración JWT
   JWT_SECRET=dev-secret-key-change-in-production-min-32-chars
   JWT_EXPIRES_IN=24h

   # Credenciales de Autenticación (solo desarrollo)
   AUTH_USERNAME=admin
   AUTH_PASSWORD=admin123
   ```

   **Explicación de las variables:**

   - **Base de Datos (`DATABASE_URL`):** Cadena de conexión a PostgreSQL donde se almacenan las tareas. Formato: `postgresql://usuario:contraseña@host:puerto/nombre_bd`

   - **JWT (JSON Web Tokens):**

     - `JWT_SECRET`: Clave secreta para firmar y verificar tokens de autenticación. Debe ser una cadena segura de mínimo 32 caracteres.
     - `JWT_EXPIRES_IN`: Tiempo de expiración del token (24h = 24 horas). Después de este tiempo, el usuario debe volver a iniciar sesión.

   - **Credenciales de Login:**
     - `AUTH_USERNAME`: Usuario para acceder al sistema (por defecto: admin)
     - `AUTH_PASSWORD`: Contraseña para acceder al sistema (por defecto: admin123)
     - Estas credenciales se validan en el endpoint `/api/auth/login` y generan un token JWT para acceder a las rutas protegidas.

4. **Configurar la base de datos:**
   ```bash
   npm run db:push
   ```

### Ejecución en Desarrollo

**Opción 1: Backend y Frontend juntos**

```bash
npm run dev
```

Acceder a: `http://localhost:3000`

**Opción 2: Backend y Frontend por separado**

Terminal 1 (Backend):

```bash
npm run dev
```

Terminal 2 (Frontend):

```bash
npm run dev:ui
```

### Ejecución en Producción

1. **Compilar el proyecto:**

   ```bash
   npm run build
   ```

2. **Ejecutar migraciones:**

   ```bash
   npm run db:migrate
   ```

3. **Iniciar servidor:**
   ```bash
   npm start
   ```
   <!---

### Ejecutar Tests

```bash
npm test
```

## --->
