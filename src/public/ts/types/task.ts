// Core interfaces matching backend API
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

// UI-specific interfaces
export interface TaskCardElement extends HTMLElement {
  taskId: string;
  taskData: Task;
}

export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  className: string;
}

export interface DragDropData {
  taskId: string;
  sourceColumn: TaskStatus;
  targetColumn: TaskStatus;
}

// API interfaces
export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
}

// Service interfaces following SOLID principles

// Single Responsibility Principle - focused interfaces
export interface IApiClient {
  getTasks(): Promise<Task[]>;
  createTask(data: CreateTaskRequest): Promise<Task>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  updateTask(id: string, data: UpdateTaskRequest): Promise<Task>;
  setAuthService(authService: any): void;
  setUnauthorizedHandler(handler: () => void): void;
}

export interface ITaskCache {
  get(): Task[] | null;
  set(tasks: Task[]): void;
  clear(): void;
}

export interface IDragDropService {
  setupDragHandlers(card: HTMLElement, task: Task): void;
  setupDropZone(
    column: HTMLElement,
    status: TaskStatus,
    onDrop: (
      taskId: string,
      newStatus: TaskStatus,
      sourceStatus: TaskStatus
    ) => Promise<void>
  ): void;
}

// Component interfaces following Interface Segregation Principle
export interface ITaskBoard {
  init(): Promise<void>;
  loadTasks(): Promise<void>;
  createTask(data: CreateTaskRequest): Promise<void>;
}

export interface ITaskColumn {
  render(): HTMLElement;
  addTask(task: Task): void;
  removeTask(taskId: string): void;
  updateTask(task: Task): void;
  getTasks(): Task[];
}

export interface ITaskCard {
  render(): HTMLElement;
  enableInlineEdit(): void;
  updateTask(task: Task): void;
}

export interface ITaskModal {
  show(task?: Task): void;
  hide(): void;
}
