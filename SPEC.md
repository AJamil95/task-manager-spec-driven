# Task Manager - Especificaciones

## Contexto de la Solución

DevPro necesita modernizar su gestión interna de proyectos. Actualmente, la asignación y seguimiento de tareas se realiza de manera informal, generando cuellos de botella y falta de trazabilidad. El objetivo de este proyecto es desarrollar un **Producto Mínimo Viable (MVP)** de un sistema de gestión de tareas simple, aplicando **Desarrollo Dirigido por Especificaciones (Spec-Driven Development)** asistido por IA.

El sistema permitirá crear, listar y actualizar tareas, aplicando buenas prácticas de desarrollo como **TypeScript**, **REST**, **principios SOLID**, asincronía con **Async/Await** y usando **SQLite** como base de datos.

## Requerimientos Funcionales

1. **Crear Tarea**

   - Campos: título, descripción, estado inicial: `pending`
   - La tarea se almacena en la base de datos.

2. **Listar Tareas**

   - Obtener todas las tareas registradas.
   - Respuesta en formato JSON.

3. **Actualizar Estado de Tarea**

   - Modificar el estado de la tarea a `in_progress` o `completed`.
   - Validar que solo se acepten los estados permitidos.

## Requerimientos No Funcionales / Técnicos

- **Lenguaje:** TypeScript
- **Arquitectura:** REST API con MVC
- **Patrones:** Principio de responsabilidad única (SOLID)
- **Asincronía:** Uso de Async/Await
- **Base de Datos:** SQLite (motor ligero y portable)
- **Seguridad:** Placeholders para autenticación y sanitización de entradas
- **Documentación:** Todas las reglas de negocio y contratos de datos deben estar en este SPEC.md, que servirá como fuente única de verdad para el agente de IA.

## Modelo de Datos Simplificado

| Campo       | Tipo   | Restricciones                           |
| ----------- | ------ | --------------------------------------- |
| id          | string | PK, único                               |
| title       | string | obligatorio                             |
| description | string | opcional                                |
| status      | string | `pending` / `in_progress` / `completed` |
| createdAt   | Date   | obligatorio                             |

## Endpoints REST

- **GET /tasks** → Listar todas las tareas
- **POST /tasks** → Crear una nueva tarea
- **PUT /tasks/:id/status** → Actualizar el estado de una tarea

## Frontend UI Funcionalidades

- **Tablero Kanban** con 3 columnas (Pendiente, En Progreso, Completado)
- **Drag & Drop** nativo para mover tareas entre estados
- **Modal de creación** para nuevas tareas
- **Edición inline** de título y descripción
- **Cache local** para mejor rendimiento

## Frontend UI Stack Técnico

- **Vanilla TypeScript** + HTML5 + CSS3
- **APIs nativas**: Fetch, Drag & Drop, DOM, localStorage
- **Integración SPA** en el mismo servidor Express

## Seguridad (Cybersecurity Essentials)

### Autenticación con JWT

Se implementa un sistema de autenticación mediante **JSON Web Tokens (JWT)** con el objetivo de asegurar el acceso a las rutas del sistema:

- **Login Endpoint:** Permite a un usuario autenticarse y recibir un token JWT.
- **Middleware de Autenticación:** Valida el token en cada solicitud realizada a rutas protegidas.
- **Protección de Rutas:** Todas las APIs relacionadas con gestión de tareas requieren un token válido para su uso.

---

### Validación y Sanitización de Entradas

Para asegurar la integridad de los datos y prevenir ataques como **inyección de código**, **XSS**, o datos corruptos, se aplican las siguientes medidas sobre las entradas del usuario:

- **Validación de Datos:** Se verifica el tipo, formato y valores permitidos para cada campo.
- **Sanitización:** Las entradas son limpiadas para remover caracteres o patrones peligrosos.
- **Escape:** Se escapan caracteres especiales para evitar interpretaciones indeseadas.
- **Límites:** Se establecen valores máximos de longitud y tamaño en campos como textos y títulos.
