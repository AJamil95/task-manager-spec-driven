// Application entry point - will be implemented in task 11
// Following Dependency Inversion Principle

import { ApiClient } from "./api/client.js";
import { TaskCache } from "./api/cache.js";
import { DragDropService } from "./services/dragdrop.js";
import { TaskBoard } from "./components/board.js";

// Error handling utility
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

// Application bootstrap - will be completed in task 11
async function initializeApp(): Promise<void> {
  try {
    // Dependency injection setup
    const apiClient = new ApiClient();
    const cache = new TaskCache();
    const dragDropService = new DragDropService();

    const boardContainer = document.querySelector(
      ".board-container"
    ) as HTMLElement;
    if (!boardContainer) {
      throw new Error("Board container not found");
    }

    const taskBoard = new TaskBoard(
      boardContainer,
      apiClient,
      cache,
      dragDropService
    );

    // Initialize the board - will be implemented in task 10
    // await taskBoard.init();

    console.log("Task Manager UI initialized successfully");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    ErrorHandler.handleApiError(error as Error);
  }
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Export for potential testing
export { ErrorHandler };
