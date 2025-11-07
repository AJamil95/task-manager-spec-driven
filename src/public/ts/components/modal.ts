import type { ITaskModal, Task, CreateTaskRequest } from "../types/task.js";

/**
 * TaskModal component implementing ITaskModal interface
 * Follows Single Responsibility Principle - only handles modal display and form management
 */
export class TaskModal implements ITaskModal {
  private modal: HTMLElement;
  private form: HTMLFormElement;
  private titleInput: HTMLInputElement;
  private descriptionTextarea: HTMLTextAreaElement;
  private submitButton: HTMLButtonElement;
  private modalTitle: HTMLHeadingElement;
  private isEditMode: boolean = false;
  private currentTask: Task | null = null;
  private onSubmitCallback:
    | ((
        data: CreateTaskRequest | ({ id: string } & CreateTaskRequest)
      ) => Promise<void>)
    | null = null;

  constructor() {
    const modal = document.getElementById("task-modal");
    const form = document.getElementById("task-form");
    const titleInput = document.getElementById("task-title");
    const descriptionTextarea = document.getElementById("task-description");

    if (!modal || !form || !titleInput || !descriptionTextarea) {
      throw new Error("Required modal elements not found in DOM");
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const modalTitle = modal.querySelector(".modal-header h2");

    if (!submitButton || !modalTitle) {
      throw new Error("Required modal elements not found in DOM");
    }

    this.modal = modal as HTMLElement;
    this.form = form as HTMLFormElement;
    this.titleInput = titleInput as HTMLInputElement;
    this.descriptionTextarea = descriptionTextarea as HTMLTextAreaElement;
    this.submitButton = submitButton as HTMLButtonElement;
    this.modalTitle = modalTitle as HTMLHeadingElement;

    this.setupEventListeners();
  }

  /**
   * Show the modal for creating a new task or editing an existing one
   * @param task Optional task to edit. If not provided, modal opens in create mode
   */
  show(task?: Task): void {
    this.currentTask = task || null;
    this.isEditMode = !!task;

    // Update modal title and button text based on mode
    if (this.isEditMode && task) {
      this.modalTitle.textContent = "Editar Tarea";
      this.submitButton.textContent = "Actualizar Tarea";
      this.titleInput.value = task.title;
      this.descriptionTextarea.value = task.description || "";
    } else {
      this.modalTitle.textContent = "Nueva Tarea";
      this.submitButton.textContent = "Crear Tarea";
      this.titleInput.value = "";
      this.descriptionTextarea.value = "";
    }

    // Clear any previous validation errors
    this.clearValidationErrors();

    // Show modal with animation
    this.modal.classList.remove("hidden");

    // Focus management - focus on title input after animation
    setTimeout(() => {
      this.titleInput.focus();
      this.titleInput.select();
    }, 100);

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
  }

  /**
   * Hide the modal and reset form state
   */
  hide(): void {
    this.modal.classList.add("hidden");
    this.form.reset();
    this.clearValidationErrors();
    this.currentTask = null;
    this.isEditMode = false;

    // Restore body scroll
    document.body.style.overflow = "";
  }

  /**
   * Set callback function to handle form submission
   * @param callback Function to call when form is submitted with valid data
   */
  setOnSubmit(
    callback: (
      data: CreateTaskRequest | ({ id: string } & CreateTaskRequest)
    ) => Promise<void>
  ): void {
    this.onSubmitCallback = callback;
  }

  /**
   * Setup all event listeners for modal functionality
   */
  private setupEventListeners(): void {
    // Close button click
    const closeButton = this.modal.querySelector(
      ".modal-close"
    ) as HTMLButtonElement;
    closeButton?.addEventListener("click", () => this.hide());

    // Cancel button click
    const cancelButton = this.modal.querySelector(
      ".modal-cancel"
    ) as HTMLButtonElement;
    cancelButton?.addEventListener("click", () => this.hide());

    // Click outside modal to close
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });

    // Keyboard navigation support
    document.addEventListener("keydown", (event) => {
      if (!this.modal.classList.contains("hidden")) {
        if (event.key === "Escape") {
          event.preventDefault();
          this.hide();
        } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          // Ctrl+Enter or Cmd+Enter to submit
          event.preventDefault();
          this.handleSubmit(event);
        }
      }
    });

    // Form submission
    this.form.addEventListener("submit", (event) => this.handleSubmit(event));

    // Real-time validation
    this.titleInput.addEventListener("input", () => this.validateTitle());
    this.titleInput.addEventListener("blur", () => this.validateTitle());
  }

  /**
   * Handle form submission with validation
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const formData = new FormData(this.form);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    try {
      // Disable submit button during submission
      this.submitButton.disabled = true;
      this.submitButton.textContent = this.isEditMode
        ? "Actualizando..."
        : "Creando...";

      if (this.onSubmitCallback) {
        const trimmedDescription = description.trim();
        if (this.isEditMode && this.currentTask) {
          await this.onSubmitCallback({
            id: this.currentTask.id,
            title: title.trim(),
            ...(trimmedDescription && { description: trimmedDescription }),
          });
        } else {
          await this.onSubmitCallback({
            title: title.trim(),
            ...(trimmedDescription && { description: trimmedDescription }),
          });
        }
      }

      this.hide();
    } catch (error) {
      console.error("Error submitting form:", error);
      this.showError(
        "Error al guardar la tarea. Por favor, inténtalo de nuevo."
      );
    } finally {
      // Re-enable submit button
      this.submitButton.disabled = false;
      this.submitButton.textContent = this.isEditMode
        ? "Actualizar Tarea"
        : "Crear Tarea";
    }
  }

  /**
   * Validate the entire form
   * @returns true if form is valid, false otherwise
   */
  private validateForm(): boolean {
    const isTitleValid = this.validateTitle();
    return isTitleValid;
  }

  /**
   * Validate the title field
   * @returns true if title is valid, false otherwise
   */
  private validateTitle(): boolean {
    const title = this.titleInput.value.trim();
    const formGroup = this.titleInput.closest(".form-group") as HTMLElement;

    if (!title) {
      this.showFieldError(formGroup, "El título es obligatorio");
      return false;
    }

    if (title.length > 200) {
      this.showFieldError(
        formGroup,
        "El título no puede exceder 200 caracteres"
      );
      return false;
    }

    this.clearFieldError(formGroup);
    return true;
  }

  /**
   * Show validation error for a specific field
   */
  private showFieldError(formGroup: HTMLElement, message: string): void {
    formGroup.classList.add("error");

    let errorElement = formGroup.querySelector(".form-error") as HTMLElement;
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "form-error";
      formGroup.appendChild(errorElement);
    }

    errorElement.textContent = message;
  }

  /**
   * Clear validation error for a specific field
   */
  private clearFieldError(formGroup: HTMLElement): void {
    formGroup.classList.remove("error");
    const errorElement = formGroup.querySelector(".form-error");
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Clear all validation errors
   */
  private clearValidationErrors(): void {
    const formGroups = this.form.querySelectorAll(".form-group");
    formGroups.forEach((group) => {
      this.clearFieldError(group as HTMLElement);
    });
  }

  /**
   * Show general error message
   */
  private showError(message: string): void {
    // Create or update error message element
    let errorElement = this.form.querySelector(
      ".form-general-error"
    ) as HTMLElement;
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "form-error form-general-error";
      errorElement.style.marginBottom = "var(--spacing-sm)";
      this.form.insertBefore(
        errorElement,
        this.form.querySelector(".modal-footer")
      );
    }

    errorElement.textContent = message;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.remove();
      }
    }, 5000);
  }
}
