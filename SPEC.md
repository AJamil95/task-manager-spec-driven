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
