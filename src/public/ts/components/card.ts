import type {
  ITaskCard,
  Task,
  IDragDropService,
  IApiClient,
} from "../types/task.js";

// Single Responsibility Principle - only handles individual task display and editing
export class TaskCard implements ITaskCard {
  private task: Task;
  private element: HTMLElement | null = null;
  private dragDropService: IDragDropService;
  private apiClient: IApiClient;
  private isEditing = false;
  private originalTask: Task;

  constructor(
    task: Task,
    dragDropService: IDragDropService,
    apiClient: IApiClient
  ) {
    this.task = task;
    this.dragDropService = dragDropService;
    this.apiClient = apiClient;
    this.originalTask = { ...task };
  }

  render(): HTMLElement {
    if (this.element) {
      return this.element;
    }

    this.element = document.createElement("div");
    this.element.className = "task-card";
    this.element.dataset.taskId = this.task.id;

    this.updateCardContent();
    this.setupDragHandlers();
    this.setupEditHandlers();

    return this.element;
  }

  enableInlineEdit(): void {
    if (this.isEditing || !this.element) return;

    this.isEditing = true;
    this.element.classList.add("editing");
    this.updateCardContent();

    // Focus on the title input
    const titleInput = this.element.querySelector(
      ".task-card-input"
    ) as HTMLInputElement;
    if (titleInput) {
      titleInput.focus();
      titleInput.select();
    }
  }

  updateTask(task: Task): void {
    this.task = task;
    this.originalTask = { ...task };
    if (this.element) {
      this.updateCardContent();
    }
  }

  private updateCardContent(): void {
    if (!this.element) return;

    if (this.isEditing) {
      this.element.innerHTML = this.getEditingHTML();
      this.setupEditingEventListeners();
    } else {
      this.element.innerHTML = this.getReadOnlyHTML();
    }
  }

  private getReadOnlyHTML(): string {
    const description = this.task.description || "";
    const createdDate = new Date(this.task.createdAt).toLocaleDateString();

    return `
      <!-- EDIT BUTTON COMMENTED OUT -->
      <!-- <div class="task-card-actions">
        <button class="task-action-btn edit" title="Edit task">✏️</button>
      </div> -->
      <div class="task-card-title">${this.escapeHtml(this.task.title)}</div>
      ${
        description
          ? `<div class="task-card-description">${this.escapeHtml(
              description
            )}</div>`
          : ""
      }
      <div class="task-card-meta">Creado: ${createdDate}</div>
    `;
  }

  private getEditingHTML(): string {
    const description = this.task.description || "";

    return `
      <div class="task-card-actions">
        <button class="task-action-btn save" title="Save changes">✓</button>
        <button class="task-action-btn cancel" title="Cancel editing">✕</button>
      </div>
      <input 
        type="text" 
        class="task-card-input task-card-title" 
        value="${this.escapeHtml(this.task.title)}"
        placeholder="Task title (required)"
        maxlength="200"
      />
      <textarea 
        class="task-card-textarea task-card-description" 
        placeholder="Task description (optional)"
        maxlength="1000"
      >${this.escapeHtml(description)}</textarea>
      <div class="task-card-meta">Created: ${new Date(
        this.task.createdAt
      ).toLocaleDateString()}</div>
    `;
  }

  private setupDragHandlers(): void {
    if (this.element) {
      this.dragDropService.setupDragHandlers(this.element, this.task);
    }
  }

  private setupEditHandlers(): void {
    if (!this.element) return;

    // EDITING FUNCTIONALITY COMMENTED OUT
    // Handle edit button click
    // this.element.addEventListener("click", (e) => {
    //   const target = e.target as HTMLElement;

    //   if (target.classList.contains("edit")) {
    //     e.stopPropagation();
    //     this.enableInlineEdit();
    //   }
    // });

    // Handle double-click to edit
    // this.element.addEventListener("dblclick", (e) => {
    //   if (!this.isEditing) {
    //     e.stopPropagation();
    //     this.enableInlineEdit();
    //   }
    // });
  }

  private setupEditingEventListeners(): void {
    if (!this.element) return;

    const saveBtn = this.element.querySelector(".save") as HTMLButtonElement;
    const cancelBtn = this.element.querySelector(
      ".cancel"
    ) as HTMLButtonElement;
    const titleInput = this.element.querySelector(
      ".task-card-input"
    ) as HTMLInputElement;
    const descriptionTextarea = this.element.querySelector(
      ".task-card-textarea"
    ) as HTMLTextAreaElement;

    // Save button
    if (saveBtn) {
      saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.saveChanges();
      });
    }

    // Cancel button
    if (cancelBtn) {
      cancelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.cancelEditing();
      });
    }

    // Keyboard shortcuts
    if (titleInput) {
      titleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.saveChanges();
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.cancelEditing();
        }
      });
    }

    if (descriptionTextarea) {
      descriptionTextarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
          e.preventDefault();
          this.saveChanges();
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.cancelEditing();
        }
      });

      // Auto-resize textarea
      descriptionTextarea.addEventListener("input", () => {
        descriptionTextarea.style.height = "auto";
        descriptionTextarea.style.height =
          descriptionTextarea.scrollHeight + "px";
      });

      // Initial resize
      descriptionTextarea.style.height = "auto";
      descriptionTextarea.style.height =
        descriptionTextarea.scrollHeight + "px";
    }

    // Prevent drag while editing
    if (this.element) {
      this.element.draggable = false;
    }
  }

  private async saveChanges(): Promise<void> {
    if (!this.element) return;

    const titleInput = this.element.querySelector(
      ".task-card-input"
    ) as HTMLInputElement;
    const descriptionTextarea = this.element.querySelector(
      ".task-card-textarea"
    ) as HTMLTextAreaElement;

    if (!titleInput) return;

    const newTitle = titleInput.value.trim();
    const newDescription = descriptionTextarea?.value.trim() || "";

    // Validation
    if (!newTitle) {
      titleInput.focus();
      titleInput.classList.add("error");
      setTimeout(() => titleInput.classList.remove("error"), 2000);
      return;
    }

    // Check if anything changed
    if (
      newTitle === this.task.title &&
      newDescription === (this.task.description || "")
    ) {
      this.cancelEditing();
      return;
    }

    try {
      // Show loading state
      const saveBtn = this.element.querySelector(".save") as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "⏳";
      }

      // Update task via API
      const updateData: { title: string; description?: string } = {
        title: newTitle,
      };

      if (newDescription) {
        updateData.description = newDescription;
      }

      const updatedTask = await this.apiClient.updateTask(
        this.task.id,
        updateData
      );

      // Update local task data
      this.task = updatedTask;
      this.originalTask = { ...updatedTask };

      // Exit editing mode
      this.exitEditingMode();

      // Dispatch custom event for parent components to handle
      this.element.dispatchEvent(
        new CustomEvent("taskUpdated", {
          detail: { task: updatedTask },
          bubbles: true,
        })
      );
    } catch (error) {
      console.error("Failed to update task:", error);

      // Show error state
      const saveBtn = this.element.querySelector(".save") as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "❌";
        setTimeout(() => {
          saveBtn.textContent = "✓";
        }, 2000);
      }

      // Dispatch error event
      this.element.dispatchEvent(
        new CustomEvent("taskUpdateError", {
          detail: { error, task: this.task },
          bubbles: true,
        })
      );
    }
  }

  private cancelEditing(): void {
    // Restore original task data
    this.task = { ...this.originalTask };
    this.exitEditingMode();
  }

  private exitEditingMode(): void {
    this.isEditing = false;
    if (this.element) {
      this.element.classList.remove("editing");
      this.element.draggable = true;
      this.updateCardContent();
      this.setupDragHandlers(); // Re-setup drag handlers
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
