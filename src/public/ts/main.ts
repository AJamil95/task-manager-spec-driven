/**
 * Main application entry point
 * Implements application bootstrap following Dependency Inversion Principle
 * Requirements: 6.1, 6.4, 6.5
 */

import { TaskBoard } from "./components/board.js";
import { ApiClient } from "./api/client.js";
import { TaskCache } from "./api/cache.js";
import { DragDropService } from "./services/dragdrop.js";
import { AuthService } from "./services/auth.js";
import { LoginComponent } from "./components/login.js";
import type { IApiClient, ITaskCache, IDragDropService } from "./types/task.js";
import type { IAuthService } from "./services/auth.js";
import type { ILoginComponent } from "./components/login.js";

/**
 * Dependency Injection Container
 * Follows Dependency Inversion Principle by managing all service dependencies
 */
class DIContainer {
  private static instance: DIContainer;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Register a service in the container
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }

  /**
   * Get a service from the container
   */
  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in DI container`);
    }
    return service;
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }
}

/**
 * Application class responsible for application lifecycle management
 * Follows Single Responsibility Principle - only handles app initialization and lifecycle
 */
class Application {
  private container: DIContainer;
  private taskBoard: TaskBoard | null = null;
  private loginComponent: ILoginComponent | null = null;
  private authService: IAuthService | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.container = DIContainer.getInstance();
  }

  /**
   * Initialize the application with all dependencies
   * Requirements: 6.1, 6.4, 6.5, 1.1, 1.2, 2.1, 2.2
   */
  async init(): Promise<void> {
    try {
      // Show initial loading state
      this.showGlobalLoading("Inicializando aplicación...");

      // Setup global error handling
      this.setupGlobalErrorHandling();

      // Setup dependency injection container
      this.setupDependencies();

      // Initialize authentication
      this.initializeAuth();

      // Check if user is authenticated
      if (!this.authService?.isAuthenticated()) {
        this.hideGlobalLoading();
        this.showLogin();
        return;
      }

      // Initialize main application components
      await this.initializeComponents();

      // Setup application lifecycle handlers
      this.setupLifecycleHandlers();

      this.isInitialized = true;
      this.hideGlobalLoading();

      // console.log("✅ Task Management UI initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize application:", error);
      this.showGlobalError(
        "Error al inicializar la aplicación. Por favor, recarga la página."
      );
      throw error;
    }
  }

  /**
   * Setup dependency injection container with all services
   * Follows Dependency Inversion Principle
   */
  private setupDependencies(): void {
    // Register core services
    const authService: IAuthService = new AuthService();
    const apiClient: IApiClient = new ApiClient();
    const taskCache: ITaskCache = new TaskCache();
    const dragDropService: IDragDropService = new DragDropService();

    this.container.register("authService", authService);
    this.container.register("apiClient", apiClient);
    this.container.register("taskCache", taskCache);
    this.container.register("dragDropService", dragDropService);

    // console.log("📦 Dependencies registered in DI container");
  }

  /**
   * Initialize authentication components
   * Requirements: 1.1, 1.2, 2.1, 2.2
   */
  private initializeAuth(): void {
    this.authService = this.container.get<IAuthService>("authService");
    const apiClient = this.container.get<IApiClient>("apiClient");

    // Configure API client with auth service
    apiClient.setAuthService(this.authService);

    // Set up 401 handler to show login on token expiration
    apiClient.setUnauthorizedHandler(() => {
      this.handleUnauthorized();
    });

    // Initialize login component
    this.loginComponent = new LoginComponent(this.authService);

    // Handle successful login
    this.loginComponent.onLoginSuccess(async () => {
      this.showGlobalLoading("Cargando aplicación...");
      try {
        await this.initializeComponents();
        this.setupLifecycleHandlers();
        this.isInitialized = true;
        this.hideGlobalLoading();
        this.showGlobalSuccess("Sesión iniciada correctamente");
      } catch (error) {
        console.error("Failed to initialize after login:", error);
        this.hideGlobalLoading();
        this.showGlobalError("Error al cargar la aplicación");
      }
    });

    // console.log("🔐 Authentication initialized");
  }

  /**
   * Handle unauthorized access (401 responses)
   * Requirements: 2.1, 2.2
   */
  private handleUnauthorized(): void {
    this.isInitialized = false;

    // Clear task board
    if (this.taskBoard) {
      const appContainer = document.getElementById("app");
      if (appContainer) {
        appContainer.innerHTML = `
          <div class="task-board">
            <header class="board-header">
              <h1>Gestor de Tareas</h1>
              <button class="create-task-btn">+ Nueva Tarea</button>
            </header>
            <main class="board-container">
              <!-- Columns will be dynamically generated -->
            </main>
          </div>
        `;
      }
      this.taskBoard = null;
    }

    this.showLogin();
    this.showGlobalError(
      "Sesión expirada. Por favor, inicia sesión nuevamente."
    );
  }

  /**
   * Show login modal
   */
  private showLogin(): void {
    if (this.loginComponent) {
      this.loginComponent.show();
    }
  }

  /**
   * Initialize main application components with injected dependencies
   */
  private async initializeComponents(): Promise<void> {
    // Get the main app container
    const appContainer = document.getElementById("app");
    if (!appContainer) {
      throw new Error("App container element not found");
    }

    // Get dependencies from DI container
    const apiClient = this.container.get<IApiClient>("apiClient");
    const taskCache = this.container.get<ITaskCache>("taskCache");
    const dragDropService =
      this.container.get<IDragDropService>("dragDropService");

    // Initialize TaskBoard with injected dependencies
    this.taskBoard = new TaskBoard(
      appContainer,
      apiClient,
      taskCache,
      dragDropService
    );

    // Initialize the board
    await this.taskBoard.init();

    // Setup logout button
    this.setupLogoutButton();

    // console.log("🎯 TaskBoard initialized with dependencies");
  }

  /**
   * Setup logout button event listener
   */
  private setupLogoutButton(): void {
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.handleLogout();
      });
    }
  }

  /**
   * Handle user logout
   */
  private handleLogout(): void {
    if (this.authService) {
      this.authService.logout();
    }

    // Clear cache
    const taskCache = this.container.get<ITaskCache>("taskCache");
    taskCache.clear();

    // Reset application state
    this.isInitialized = false;
    this.taskBoard = null;

    // Reset app container
    const appContainer = document.getElementById("app");
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="task-board">
          <header class="board-header">
            <h1>Gestor de Tareas</h1>
            <div class="header-actions">
              <button class="create-task-btn">+ Nueva Tarea</button>
              <button class="logout-btn" title="Cerrar sesión">Salir</button>
            </div>
          </header>
          <main class="board-container">
            <!-- Columns will be dynamically generated -->
          </main>
        </div>
      `;
    }

    // Show login
    this.showLogin();
    this.showGlobalSuccess("Sesión cerrada correctamente");
  }

  /**
   * Setup global error handling for unhandled errors
   */
  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.showGlobalError(
        "Se produjo un error inesperado. Por favor, inténtalo de nuevo."
      );
      event.preventDefault();
    });

    // Handle general JavaScript errors
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      this.showGlobalError(
        "Se produjo un error inesperado. Por favor, recarga la página."
      );
    });

    // Handle network errors
    window.addEventListener("offline", () => {
      this.showGlobalError(
        "Sin conexión a internet. Algunas funciones pueden no estar disponibles."
      );
    });

    window.addEventListener("online", () => {
      this.showGlobalSuccess("Conexión restaurada");
      // Optionally reload tasks when coming back online
      if (this.taskBoard && this.isInitialized) {
        this.taskBoard.loadTasks().catch((error) => {
          console.error("Failed to reload tasks after coming online:", error);
        });
      }
    });

    // console.log("🛡️ Global error handling setup complete");
  }

  /**
   * Setup application lifecycle handlers
   */
  private setupLifecycleHandlers(): void {
    // Handle page visibility changes (tab switching)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.taskBoard && this.isInitialized) {
        // Reload tasks when user returns to the tab
        this.taskBoard.loadTasks().catch((error) => {
          console.error("Failed to reload tasks on visibility change:", error);
        });
      }
    });

    // Handle beforeunload to warn about unsaved changes
    window.addEventListener("beforeunload", (event) => {
      // Check if there are any unsaved changes (editing mode)
      const editingCards = document.querySelectorAll(".task-card.editing");
      if (editingCards.length > 0) {
        event.preventDefault();
        event.returnValue =
          "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?";
        return event.returnValue;
      }
    });

    // console.log("🔄 Application lifecycle handlers setup complete");
  }

  /**
   * Show global loading state
   */
  private showGlobalLoading(message: string): void {
    const existingLoader = document.querySelector(".global-loader");
    if (existingLoader) {
      existingLoader.remove();
    }

    const loader = document.createElement("div");
    loader.className = "global-loader";
    loader.innerHTML = `
      <div class="global-loader-content">
        <div class="global-loader-spinner"></div>
        <p>${message}</p>
      </div>
    `;

    document.body.appendChild(loader);
  }

  /**
   * Hide global loading state
   */
  private hideGlobalLoading(): void {
    const loader = document.querySelector(".global-loader");
    if (loader) {
      loader.remove();
    }
  }

  /**
   * Show global error message
   */
  private showGlobalError(message: string): void {
    this.showGlobalNotification(message, "error");
  }

  /**
   * Show global success message
   */
  private showGlobalSuccess(message: string): void {
    this.showGlobalNotification(message, "success");
  }

  /**
   * Show global notification
   */
  private showGlobalNotification(
    message: string,
    type: "error" | "success"
  ): void {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(
      ".global-notification"
    );
    existingNotifications.forEach((notification) => notification.remove());

    const notification = document.createElement("div");
    notification.className = `global-notification global-notification--${type}`;
    notification.innerHTML = `
      <div class="global-notification-content">
        <span class="global-notification-icon">
          ${type === "error" ? "⚠️" : "✅"}
        </span>
        <span class="global-notification-message">${message}</span>
        <button class="global-notification-close" type="button">&times;</button>
      </div>
    `;

    // Add close functionality
    const closeButton = notification.querySelector(
      ".global-notification-close"
    );
    closeButton?.addEventListener("click", () => {
      notification.remove();
    });

    document.body.appendChild(notification);

    // Auto-hide after 8 seconds for errors, 4 seconds for success
    const autoHideDelay = type === "error" ? 8000 : 4000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, autoHideDelay);
  }

  /**
   * Get the current TaskBoard instance
   */
  getTaskBoard(): TaskBoard | null {
    return this.taskBoard;
  }

  /**
   * Check if application is initialized
   */
  isAppInitialized(): boolean {
    return this.isInitialized;
  }
}

/**
 * Application bootstrap function
 * Entry point for the entire application
 */
async function bootstrap(): Promise<Application> {
  // console.log("🚀 Starting Task Management UI...");

  const app = new Application();
  await app.init();

  // Make app instance available globally for debugging
  (window as any).__taskApp = app;

  return app;
}

/**
 * Initialize application when DOM is ready
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bootstrap().catch((error) => {
      console.error("Failed to bootstrap application:", error);
    });
  });
} else {
  // DOM is already ready
  bootstrap().catch((error) => {
    console.error("Failed to bootstrap application:", error);
  });
}

// Export for potential testing or external access
export { Application, DIContainer, bootstrap };
