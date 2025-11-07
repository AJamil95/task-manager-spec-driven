# Design Document

## Overview

The Task Management UI is designed as a vanilla TypeScript Single Page Application (SPA) that provides a Kanban-style board interface. The application uses modern web standards including HTML5 Drag & Drop API, CSS Grid/Flexbox, and Fetch API to create a responsive and intuitive task management experience. The UI integrates seamlessly with the existing Express server and consumes the REST API endpoints.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Express       │    │   SQLite DB     │
│   ┌───────────┐ │    │   ┌───────────┐ │    │                 │
│   │    UI     │─┼────┼──▶│    API    │─┼────┼──▶              │
│   │ (Vanilla  │ │    │   │ (Existing)│ │    │                 │
│   │    TS)    │ │    │   └───────────┘ │    │                 │
│   │           │ │    │   ┌───────────┐ │    │                 │
│   │           │◀┼────┼───│  Static   │ │    │                 │
│   └───────────┘ │    │   │  Server   │ │    │                 │
└─────────────────┘    │   └───────────┘ │    │                 │
                       └─────────────────┘    └─────────────────┘
```

### Directory Structure

```
src/
├── public/                 # Frontend source files
│   ├── index.html         # Main HTML template
│   ├── styles/
│   │   ├── main.css       # Global styles and variables
│   │   ├── board.css      # Kanban board layout
│   │   ├── card.css       # Task card styling
│   │   └── modal.css      # Modal and form styling
│   └── ts/
│       ├── main.ts        # Application entry point
│       ├── api/
│       │   ├── client.ts  # HTTP client wrapper
│       │   └── cache.ts   # Local storage cache
│       ├── components/
│       │   ├── board.ts   # Kanban board logic
│       │   ├── column.ts  # Column component
│       │   ├── card.ts    # Task card component
│       │   └── modal.ts   # Create/edit modal
│       ├── services/
│       │   └── dragdrop.ts # Drag & drop handlers
│       └── types/
│           └── task.ts    # TypeScript interfaces
├── dist/                  # Vite build output
└── vite.config.ts         # Vite configuration
```

### Technology Stack

- **Frontend**: Vanilla TypeScript, HTML5, CSS3
- **Build Tool**: Vite for development and production builds
- **HTTP Client**: Native Fetch API
- **Drag & Drop**: HTML5 Drag and Drop API
- **Storage**: localStorage for task caching
- **Styling**: CSS Grid, Flexbox, CSS Custom Properties
- **Integration**: Express static file serving
- **Architecture Principles**: SOLID principles applied throughout component design

## Components and Interfaces

### TypeScript Interfaces

```typescript
// Core interfaces matching backend API
interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

// UI-specific interfaces
interface TaskCardElement extends HTMLElement {
  taskId: string;
  taskData: Task;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  className: string;
}

interface DragDropData {
  taskId: string;
  sourceColumn: TaskStatus;
  targetColumn: TaskStatus;
}

// API interfaces
interface CreateTaskRequest {
  title: string;
  description?: string;
}

interface UpdateTaskStatusRequest {
  status: TaskStatus;
}
```

### Component Architecture (SOLID Principles Applied)

#### SOLID Principles Implementation

**Single Responsibility Principle (SRP):**

- Each component has one clear responsibility
- TaskBoard: orchestrates the board, TaskColumn: manages column state, TaskCard: handles individual task display

**Open/Closed Principle (OCP):**

- Components are open for extension through interfaces
- New task types or column types can be added without modifying existing code

**Liskov Substitution Principle (LSP):**

- All components implement their respective interfaces consistently
- Mock implementations can replace real ones for testing

**Interface Segregation Principle (ISP):**

- Small, focused interfaces rather than large monolithic ones
- Components only depend on methods they actually use

**Dependency Inversion Principle (DIP):**

- Components depend on abstractions (interfaces) not concrete implementations
- ApiClient and Cache are injected dependencies

#### Component Interfaces

```typescript
// Core service interfaces (DIP)
interface IApiClient {
  getTasks(): Promise<Task[]>;
  createTask(data: CreateTaskRequest): Promise<Task>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
}

interface ITaskCache {
  get(): Task[] | null;
  set(tasks: Task[]): void;
  clear(): void;
}

interface IDragDropService {
  setupDragHandlers(card: HTMLElement, task: Task): void;
  setupDropZone(column: HTMLElement, status: TaskStatus): void;
}

// Component interfaces (ISP)
interface ITaskBoard {
  init(): Promise<void>;
  loadTasks(): Promise<void>;
  createTask(data: CreateTaskRequest): Promise<void>;
}

interface ITaskColumn {
  render(): HTMLElement;
  addTask(task: Task): void;
  removeTask(taskId: string): void;
  updateTask(task: Task): void;
}

interface ITaskCard {
  render(): HTMLElement;
  enableInlineEdit(): void;
}
```

#### TaskBoard (Main Component - Orchestrator)

```typescript
class TaskBoard implements ITaskBoard {
  private container: HTMLElement;
  private columns: Map<TaskStatus, ITaskColumn>;
  private apiClient: IApiClient; // DIP: depends on interface
  private cache: ITaskCache; // DIP: depends on interface
  private dragDropService: IDragDropService; // DIP: depends on interface

  constructor(
    container: HTMLElement,
    apiClient: IApiClient,
    cache: ITaskCache,
    dragDropService: IDragDropService
  ) {
    // SRP: Only responsible for board orchestration
    this.container = container;
    this.apiClient = apiClient;
    this.cache = cache;
    this.dragDropService = dragDropService;
    this.columns = new Map();
  }

  async init(): Promise<void>;
  async loadTasks(): Promise<void>;
  async createTask(data: CreateTaskRequest): Promise<void>;
  private setupEventListeners(): void;
}
```

#### TaskColumn (Column Component)

```typescript
class TaskColumn implements ITaskColumn {
  private element: HTMLElement;
  private status: TaskStatus;
  private tasks: Task[];
  private dragDropService: IDragDropService; // DIP: injected dependency

  constructor(status: TaskStatus, dragDropService: IDragDropService) {
    // SRP: Only responsible for column management
    this.status = status;
    this.tasks = [];
    this.dragDropService = dragDropService;
  }

  render(): HTMLElement;
  addTask(task: Task): void;
  removeTask(taskId: string): void;
  updateTask(task: Task): void;
  private setupDropZone(): void;
}
```

#### TaskCard (Card Component)

```typescript
class TaskCard implements ITaskCard {
  private task: Task;
  private element: HTMLElement;
  private editService: ITaskEditService; // DIP: injected dependency

  constructor(task: Task, editService: ITaskEditService) {
    // SRP: Only responsible for individual task display and editing
    this.task = task;
    this.editService = editService;
  }

  render(): HTMLElement;
  enableInlineEdit(): void;
  private setupDragHandlers(): void;
  private handleEdit(field: "title" | "description"): void;
}
```

#### TaskModal (Modal Component)

```typescript
interface ITaskModal {
  show(task?: Task): void;
  hide(): void;
}

class TaskModal implements ITaskModal {
  private modal: HTMLElement;
  private form: HTMLFormElement;

  show(task?: Task): void;
  hide(): void;
  private setupForm(): void;
  private handleSubmit(event: Event): void;
}
```

## Data Models

### Task Entity (Frontend)

| Field       | Type       | Source   | Description          |
| ----------- | ---------- | -------- | -------------------- |
| id          | string     | API      | Unique identifier    |
| title       | string     | API/User | Task title           |
| description | string?    | API/User | Optional description |
| status      | TaskStatus | API/User | Current status       |
| createdAt   | string     | API      | ISO timestamp        |
| updatedAt   | string     | API      | ISO timestamp        |

### Column Configuration

```typescript
const COLUMN_CONFIG: ColumnConfig[] = [
  {
    id: TaskStatus.PENDING,
    title: "Pendiente",
    className: "column-pending",
  },
  {
    id: TaskStatus.IN_PROGRESS,
    title: "En Progreso",
    className: "column-progress",
  },
  {
    id: TaskStatus.COMPLETED,
    title: "Completado",
    className: "column-completed",
  },
];
```

## User Interface Design

### Layout Structure

```html
<div class="task-board">
  <header class="board-header">
    <h1>Task Manager</h1>
    <button class="create-task-btn">+ Nueva Tarea</button>
  </header>

  <main class="board-container">
    <div class="column column-pending">
      <h2>Pendiente</h2>
      <div class="column-content">
        <!-- Task cards -->
      </div>
    </div>

    <div class="column column-progress">
      <h2>En Progreso</h2>
      <div class="column-content">
        <!-- Task cards -->
      </div>
    </div>

    <div class="column column-completed">
      <h2>Completado</h2>
      <div class="column-content">
        <!-- Task cards -->
      </div>
    </div>
  </main>
</div>
```

### CSS Architecture

#### CSS Custom Properties

```css
:root {
  --primary-color: #2563eb;
  --success-color: #16a34a;
  --warning-color: #d97706;
  --danger-color: #dc2626;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --border-radius: 0.5rem;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
}
```

#### Grid Layout

```css
.board-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  min-height: calc(100vh - 80px);
}

@media (max-width: 768px) {
  .board-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
}
```

### Task Card Design

```css
.task-card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
  cursor: grab;
  transition: all 0.2s ease;
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.task-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}
```

## API Integration

### HTTP Client Wrapper (SOLID Implementation)

```typescript
// Interface segregation - focused interface
interface IApiClient {
  getTasks(): Promise<Task[]>;
  createTask(data: CreateTaskRequest): Promise<Task>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
}

// Single responsibility - only handles HTTP communication
class ApiClient implements IApiClient {
  private baseUrl = "/api";

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}
```

### Cache Implementation (SOLID Implementation)

```typescript
// Interface segregation - focused caching interface
interface ITaskCache {
  get(): Task[] | null;
  set(tasks: Task[]): void;
  clear(): void;
}

// Single responsibility - only handles task caching
class TaskCache implements ITaskCache {
  private static readonly CACHE_KEY = "tasks_cache";
  private static readonly CACHE_TIMESTAMP_KEY = "tasks_cache_timestamp";
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static get(): Task[] | null {
    const timestamp = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);
    if (!timestamp || Date.now() - parseInt(timestamp) > this.CACHE_DURATION) {
      this.clear();
      return null;
    }

    const data = localStorage.getItem(this.CACHE_KEY);
    return data ? JSON.parse(data) : null;
  }

  static set(tasks: Task[]): void {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(tasks));
    localStorage.setItem(this.CACHE_TIMESTAMP_KEY, Date.now().toString());
  }

  static clear(): void {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
  }
}
```

## Drag and Drop Implementation (SOLID Implementation)

### Drag Event Handlers

```typescript
// Interface segregation - focused drag & drop interface
interface IDragDropService {
  setupDragHandlers(card: HTMLElement, task: Task): void;
  setupDropZone(column: HTMLElement, status: TaskStatus): void;
}

// Single responsibility - only handles drag & drop logic
class DragDropService implements IDragDropService {
  private dragData: DragDropData | null = null;

  setupDragHandlers(card: HTMLElement, task: Task): void {
    card.draggable = true;

    card.addEventListener("dragstart", (e) => {
      this.dragData = {
        taskId: task.id,
        sourceColumn: task.status,
        targetColumn: task.status,
      };
      card.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", task.id);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      this.dragData = null;
    });
  }

  setupDropZone(column: HTMLElement, status: TaskStatus): void {
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });

    column.addEventListener("drop", async (e) => {
      e.preventDefault();
      column.classList.remove("drag-over");

      if (this.dragData && this.dragData.sourceColumn !== status) {
        await this.handleTaskMove(this.dragData.taskId, status);
      }
    });
  }

  private async handleTaskMove(
    taskId: string,
    newStatus: TaskStatus
  ): Promise<void> {
    // Implementation handled by TaskBoard
  }
}
```

## Error Handling

### Error Display Strategy

```typescript
class ErrorHandler {
  static showError(message: string, duration = 5000): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-toast";
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, duration);
  }

  static handleApiError(error: Error): void {
    console.error("API Error:", error);

    if (error.message.includes("404")) {
      this.showError("Tarea no encontrada");
    } else if (error.message.includes("400")) {
      this.showError("Datos inválidos");
    } else if (error.message.includes("500")) {
      this.showError("Error del servidor");
    } else {
      this.showError("Error de conexión");
    }
  }
}
```

## Build and Integration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/public",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "src/public/index.html",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

### Express Integration

```typescript
// In server.ts
import express from "express";
import path from "path";

const app = express();

// API routes (existing)
app.use("/api", taskRoutes);

// Static files
app.use(express.static(path.join(__dirname, "../dist")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});
```

## Testing Strategy

### Unit Testing Approach

- **Components**: Test DOM manipulation and event handling
- **API Client**: Mock fetch responses and test error handling
- **Cache**: Test localStorage operations and expiration
- **Drag & Drop**: Test event handlers and data transfer

### Integration Testing

- **Full User Flows**: Create task → Drag to different column → Edit task
- **API Integration**: Test with real backend endpoints
- **Error Scenarios**: Network failures, invalid data, server errors

### Manual Testing Checklist

- [ ] Board loads with cached data, then fresh data
- [ ] Drag and drop works between all columns
- [ ] Create task modal opens and submits correctly
- [ ] Inline editing works for title and description
- [ ] Error messages display appropriately
- [ ] Responsive design works on mobile devices
