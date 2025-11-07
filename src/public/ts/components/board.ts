import type {
  ITaskBoard,
  IApiClient,
  ITaskCache,
  IDragDropService,
  Task,
  ColumnConfig,
  CreateTaskRequest,
} from "../types/task.js";
import { TaskStatus } from "../types/task.js";
import { TaskColumn } from "./column.js";
import { TaskModal } from "./modal.js";

// Column configuration following the design requirements
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

/**
 * TaskBoard - Main orchestrator component implementing ITaskBoard interface
 * Follows SOLID principles:
 * - Single Responsibility: Orchestrates the board and manages task operations
 * - Dependency Inversion: Depends on interfaces, not concrete implementations
 */
export class TaskBoard implements ITaskBoard {
  private container: HTMLElement;
  private columns: Map<TaskStatus, TaskColumn>;
  private apiClient: IApiClient;
  private cache: ITaskCache;
  private dragDropService: IDragDropService;
  private modal: TaskModal;
  private isLoading: boolean = false;

  constructor(
    container: HTMLElement,
    apiClient: IApiClient,
    cache: ITaskCache,
    dragDropService: IDragDropService
  ) {
    this.container = container;
    this.apiClient = apiClient;
    this.cache = cache;
    this.dragDropService = dragDropService;
    this.columns = new Map();
    this.modal = new TaskModal();
  }

  /**
   * Initialize the board with columns and event listeners
   * Requirements: 1.1, 1.2, 1.3
   */
  async init(): Promise<void> {
    try {
      this.renderBoardStructure();
      this.setupColumns();
      this.setupEventListeners();
      this.setupModal();
      await this.loadTasks();
    } catch (error) {
      console.error("Failed to initialize TaskBoard:", error);
      this.showError("Error al inicializar el tablero de tareas");
    }
  }

  /**
   * Load tasks with cache-first strategy then API fetch
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  async loadTasks(): Promise<void> {
    if (this.isLoading) return;

    try {
      // console.log("🔄 TaskBoard: Starting to load tasks...");
      this.isLoading = true;
      this.showLoadingState();

      // Clear cache first to avoid confusion
      this.cache.clear();

      // Fetch fresh data from API
      // console.log("🌐 TaskBoard: Fetching fresh tasks from API...");
      const freshTasks = await this.apiClient.getTasks();
      // console.log("✅ TaskBoard: Received fresh tasks:", freshTasks);

      // Update cache with fresh data
      this.cache.set(freshTasks);

      // Update display with fresh data
      // console.log("🎨 TaskBoard: Displaying fresh tasks");
      this.displayTasks(freshTasks);
    } catch (error) {
      console.error("❌ TaskBoard: Failed to load tasks:", error);
      // console.error("❌ TaskBoard: Error details:", {
      //   message: error.message,
      //   stack: error.stack,
      //   name: error.name,
      // });

      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      this.showError(`Error al cargar las tareas: ${errorMessage}`);
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  /**
   * Create a new task integrating with modal and API
   * Requirements: 3.4
   */
  async createTask(data: CreateTaskRequest): Promise<void> {
    try {
      // Create task via API
      const newTask = await this.apiClient.createTask(data);

      // Add to appropriate column (new tasks start as pending)
      const pendingColumn = this.columns.get(TaskStatus.PENDING);
      if (pendingColumn) {
        pendingColumn.addTask(newTask);
        // console.log("✅ TaskBoard: New task added to PENDING column:", newTask);
      } else {
        console.error("❌ TaskBoard: PENDING column not found");
      }

      // Update cache with the new task
      const currentTasks = this.cache.get() || [];
      currentTasks.unshift(newTask); // Add to beginning (most recent first)
      this.cache.set(currentTasks);

      // Show success feedback
      this.showSuccess("Tarea creada exitosamente");
    } catch (error) {
      console.error("Failed to create task:", error);
      this.showError("Error al crear la tarea");
      throw error; // Re-throw for modal to handle
    }
  }

  /**
   * Render the basic board HTML structure
   */
  private renderBoardStructure(): void {
    this.container.innerHTML = `
      <div class="task-board">
        <header class="board-header">
          <h1>Gestor de Tareas</h1>
          <button class="create-task-btn" type="button">
            <span class="btn-icon">+</span>
            Nueva Tarea
          </button>
        </header>
        
        <div class="loading-overlay hidden">
          <div class="loading-spinner"></div>
          <span>Cargando tareas...</span>
        </div>
        
        <main class="board-container">
          <!-- Columns will be inserted here -->
        </main>
        
        <div class="error-toast hidden"></div>
        <div class="success-toast hidden"></div>
      </div>
    `;
  }

  /**
   * Setup columns based on configuration
   */
  private setupColumns(): void {
    const boardContainer = this.container.querySelector(
      ".board-container"
    ) as HTMLElement;

    COLUMN_CONFIG.forEach((config) => {
      const column = new TaskColumn(
        config,
        this.dragDropService,
        this.apiClient
      );
      this.columns.set(config.id, column);
      boardContainer.appendChild(column.render());
    });
  }

  /**
   * Setup event listeners for board interactions
   */
  private setupEventListeners(): void {
    // Create task button
    const createButton = this.container.querySelector(
      ".create-task-btn"
    ) as HTMLButtonElement;
    createButton?.addEventListener("click", () => {
      this.modal.show();
    });

    // Listen for task move events from columns
    this.container.addEventListener("taskMoved", (e) => {
      const customEvent = e as CustomEvent;
      const { task, fromColumn, toColumn } = customEvent.detail;
      this.handleTaskMoved(task, fromColumn, toColumn);
    });

    // Listen for task move errors
    this.container.addEventListener("taskMoveError", (e) => {
      const customEvent = e as CustomEvent;
      const { error, taskId, fromColumn, toColumn } = customEvent.detail;
      this.handleTaskMoveError(error, taskId, fromColumn, toColumn);
    });

    // Listen for task update events from columns
    this.container.addEventListener("columnTaskUpdated", (e) => {
      const customEvent = e as CustomEvent;
      const { task } = customEvent.detail;
      this.handleTaskUpdated(task);
    });

    // Listen for task update errors
    this.container.addEventListener("columnTaskUpdateError", (e) => {
      const customEvent = e as CustomEvent;
      const { error, task } = customEvent.detail;
      this.handleTaskUpdateError(error, task);
    });

    // Refresh button (if exists)
    const refreshButton = this.container.querySelector(
      ".refresh-btn"
    ) as HTMLButtonElement;
    refreshButton?.addEventListener("click", () => {
      this.cache.clear();
      this.loadTasks();
    });
  }

  /**
   * Setup modal for task creation and editing
   */
  private setupModal(): void {
    this.modal.setOnSubmit(async (data) => {
      if ("id" in data) {
        // Edit mode - update existing task
        const { id, ...updateData } = data;
        const updatedTask = await this.apiClient.updateTask(id, updateData);

        // Update task in appropriate column
        const column = this.columns.get(updatedTask.status);
        if (column) {
          column.updateTask(updatedTask);
        }

        // Clear cache
        this.cache.clear();
        this.showSuccess("Tarea actualizada exitosamente");
      } else {
        // Create mode
        await this.createTask(data);
      }
    });
  }

  /**
   * Display tasks in their respective columns
   */
  private displayTasks(tasks: Task[]): void {
    // console.log("🎨 TaskBoard: Displaying tasks:", tasks);
    // console.log(
    //   "📊 TaskBoard: Available columns:",
    //   Array.from(this.columns.keys())
    // );

    // Clear all columns first
    this.columns.forEach((column, status) => {
      // Get current tasks and remove them
      const currentTasks = column.getTasks();
      // console.log(
      //   `🗑️ TaskBoard: Clearing ${currentTasks.length} tasks from ${status} column`
      // );
      currentTasks.forEach((task) => column.removeTask(task.id));
    });

    // Add tasks to appropriate columns
    tasks.forEach((task) => {
      // console.log(
      //   `➕ TaskBoard: Adding task "${task.title}" to ${task.status} column`
      // );
      const column = this.columns.get(task.status);
      if (column) {
        column.addTask(task);
        // console.log(`✅ TaskBoard: Task added to ${task.status} column`);
      } else {
        console.error(
          `❌ TaskBoard: No column found for status: ${task.status}`
        );
      }
    });
  }

  /**
   * Handle successful task move between columns
   * Requirements: 2.4, 2.5
   */
  private handleTaskMoved(
    task: Task,
    fromColumn: TaskStatus,
    toColumn: TaskStatus
  ): void {
    // Remove task from source column
    const sourceColumn = this.columns.get(fromColumn);
    if (sourceColumn) {
      sourceColumn.removeTask(task.id);
    }

    // Add task to target column
    const targetColumn = this.columns.get(toColumn);
    if (targetColumn) {
      targetColumn.addTask(task);
    }

    // Clear cache to ensure fresh data on next load
    this.cache.clear();

    this.showSuccess("Tarea movida exitosamente");
  }

  /**
   * Handle task move errors
   */
  private handleTaskMoveError(
    error: Error,
    taskId: string,
    fromColumn: TaskStatus,
    toColumn: TaskStatus
  ): void {
    console.error("Task move failed:", error);
    this.showError("Error al mover la tarea. Inténtalo de nuevo.");

    // Optionally reload tasks to ensure consistency
    setTimeout(() => {
      this.loadTasks();
    }, 1000);
  }

  /**
   * Handle task updates from inline editing
   */
  private handleTaskUpdated(task: Task): void {
    // Clear cache to ensure fresh data
    this.cache.clear();
    this.showSuccess("Tarea actualizada exitosamente");
  }

  /**
   * Handle task update errors
   */
  private handleTaskUpdateError(error: Error, task: Task): void {
    console.error("Task update failed:", error);
    this.showError("Error al actualizar la tarea");
  }

  /**
   * Show loading state
   */
  private showLoadingState(): void {
    const loadingOverlay = this.container.querySelector(
      ".loading-overlay"
    ) as HTMLElement;
    loadingOverlay?.classList.remove("hidden");
  }

  /**
   * Hide loading state
   */
  private hideLoadingState(): void {
    const loadingOverlay = this.container.querySelector(
      ".loading-overlay"
    ) as HTMLElement;
    loadingOverlay?.classList.add("hidden");
  }

  /**
   * Show error message to user
   */
  private showError(message: string): void {
    this.showToast(message, "error");
  }

  /**
   * Show success message to user
   */
  private showSuccess(message: string): void {
    this.showToast(message, "success");
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: "error" | "success"): void {
    const toastClass = type === "error" ? "error-toast" : "success-toast";
    const toast = this.container.querySelector(`.${toastClass}`) as HTMLElement;

    if (toast) {
      toast.textContent = message;
      toast.classList.remove("hidden");

      // Auto-hide after 5 seconds
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 5000);
    }
  }
}
