import type {
  ITaskColumn,
  Task,
  IDragDropService,
  IApiClient,
  ColumnConfig,
} from "../types/task.js";
import { TaskStatus } from "../types/task.js";
import { TaskCard } from "./card.js";

// Single Responsibility Principle - only responsible for column management
export class TaskColumn implements ITaskColumn {
  private element: HTMLElement | null = null;
  private status: TaskStatus;
  private config: ColumnConfig;
  private tasks: Task[] = [];
  private taskCards: Map<string, TaskCard> = new Map();
  private dragDropService: IDragDropService;
  private apiClient: IApiClient;
  private contentElement: HTMLElement | null = null;

  constructor(
    config: ColumnConfig,
    dragDropService: IDragDropService,
    apiClient: IApiClient
  ) {
    this.status = config.id;
    this.config = config;
    this.dragDropService = dragDropService;
    this.apiClient = apiClient;
  }

  render(): HTMLElement {
    if (this.element) {
      return this.element;
    }

    this.element = document.createElement("div");
    this.element.className = `column ${this.config.className}`;
    this.element.dataset.status = this.status;

    // Create column structure
    this.element.innerHTML = `
      <div class="column-header">
        <h2>${this.escapeHtml(this.config.title)}</h2>
      </div>
      <div class="column-content">
        ${this.getEmptyStateHTML()}
      </div>
    `;

    this.contentElement = this.element.querySelector(
      ".column-content"
    ) as HTMLElement;

    this.setupDropZone();
    this.setupEventListeners();

    return this.element;
  }

  addTask(task: Task): void {
    // Only add tasks that match this column's status
    if (task.status !== this.status) {
      return;
    }

    // Check if task already exists
    if (this.taskCards.has(task.id)) {
      this.updateTask(task);
      return;
    }

    // Add to internal collection
    this.tasks.push(task);

    // Create task card
    const taskCard = new TaskCard(task, this.dragDropService, this.apiClient);
    this.taskCards.set(task.id, taskCard);

    // Add to DOM
    if (this.contentElement) {
      this.contentElement.appendChild(taskCard.render());
      this.updateEmptyState();
    }
  }

  removeTask(taskId: string): void {
    // Remove from internal collection
    this.tasks = this.tasks.filter((task) => task.id !== taskId);

    // Remove task card
    const taskCard = this.taskCards.get(taskId);
    if (taskCard) {
      const cardElement = taskCard.render();
      if (cardElement.parentNode) {
        cardElement.parentNode.removeChild(cardElement);
      }
      this.taskCards.delete(taskId);
    }

    this.updateEmptyState();
  }

  updateTask(task: Task): void {
    // If task status changed, remove it from this column
    if (task.status !== this.status) {
      this.removeTask(task.id);
      return;
    }

    // Update internal collection
    const taskIndex = this.tasks.findIndex((t) => t.id === task.id);
    if (taskIndex !== -1) {
      this.tasks[taskIndex] = task;
    }

    // Update task card
    const taskCard = this.taskCards.get(task.id);
    if (taskCard) {
      taskCard.updateTask(task);
    } else {
      // Task doesn't exist in this column, add it
      this.addTask(task);
    }
  }

  getTasks(): Task[] {
    return [...this.tasks]; // Return a copy to prevent external modification
  }

  private setupDropZone(): void {
    if (!this.element) return;

    this.dragDropService.setupDropZone(
      this.element,
      this.status,
      this.handleTaskDrop.bind(this)
    );
  }

  private setupEventListeners(): void {
    if (!this.element) return;

    // Listen for task update events from task cards
    this.element.addEventListener("taskUpdated", (e) => {
      const customEvent = e as CustomEvent;
      const { task } = customEvent.detail;
      this.updateTask(task);

      // Bubble the event up for parent components
      this.element!.dispatchEvent(
        new CustomEvent("columnTaskUpdated", {
          detail: { task, column: this.status },
          bubbles: true,
        })
      );
    });

    // Listen for task update errors
    this.element.addEventListener("taskUpdateError", (e) => {
      const customEvent = e as CustomEvent;
      const { error, task } = customEvent.detail;

      // Bubble the error up for parent components to handle
      this.element!.dispatchEvent(
        new CustomEvent("columnTaskUpdateError", {
          detail: { error, task, column: this.status },
          bubbles: true,
        })
      );
    });
  }

  private async handleTaskDrop(
    taskId: string,
    newStatus: TaskStatus
  ): Promise<void> {
    try {
      // Update task status via API
      const updatedTask = await this.apiClient.updateTaskStatus(
        taskId,
        newStatus
      );

      // Dispatch event for parent component to handle the move
      if (this.element) {
        this.element.dispatchEvent(
          new CustomEvent("taskMoved", {
            detail: {
              task: updatedTask,
              fromColumn: this.status,
              toColumn: newStatus,
            },
            bubbles: true,
          })
        );
      }
    } catch (error) {
      console.error("Failed to move task:", error);

      // Dispatch error event
      if (this.element) {
        this.element.dispatchEvent(
          new CustomEvent("taskMoveError", {
            detail: {
              error,
              taskId,
              fromColumn: this.status,
              toColumn: newStatus,
            },
            bubbles: true,
          })
        );
      }

      throw error; // Re-throw for drag service to handle
    }
  }

  private updateEmptyState(): void {
    if (!this.contentElement) return;

    if (this.tasks.length === 0) {
      // Show empty state if no task cards are present
      const existingCards = this.contentElement.querySelectorAll(".task-card");
      if (existingCards.length === 0) {
        this.contentElement.innerHTML = this.getEmptyStateHTML();
      }
    } else {
      // Remove empty state if it exists
      const emptyState = this.contentElement.querySelector(".column-empty");
      if (emptyState) {
        emptyState.remove();
      }
    }
  }

  private getEmptyStateHTML(): string {
    const messages = {
      [TaskStatus.PENDING]: "No pending tasks",
      [TaskStatus.IN_PROGRESS]: "No tasks in progress",
      [TaskStatus.COMPLETED]: "No completed tasks",
    };

    return `<div class="column-empty">${messages[this.status]}</div>`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
