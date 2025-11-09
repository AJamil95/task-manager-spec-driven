/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TaskModal } from "../components/modal.js";
import type { Task, TaskStatus, CreateTaskRequest } from "../types/task.js";

const mockTask: Task = {
  id: "1",
  title: "Test Task",
  description: "Test description",
  status: "pending" as TaskStatus,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

describe("TaskModal", () => {
  let taskModal: TaskModal;
  let mockOnSubmit: (
    data: CreateTaskRequest | ({ id: string } & CreateTaskRequest)
  ) => Promise<void>;

  beforeEach(() => {
    // Setup DOM structure that the modal expects
    document.body.innerHTML = `
      <div id="task-modal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Nueva Tarea</h2>
            <button class="modal-close">&times;</button>
          </div>
          <form id="task-form" class="modal-body">
            <div class="form-group">
              <label for="task-title">Título *</label>
              <input type="text" id="task-title" name="title" required />
            </div>
            <div class="form-group">
              <label for="task-description">Descripción</label>
              <textarea id="task-description" name="description" rows="3"></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary modal-cancel">Cancelar</button>
              <button type="submit" class="btn btn-primary">Crear Tarea</button>
            </div>
          </form>
        </div>
      </div>
    `;

    mockOnSubmit = vi.fn().mockResolvedValue(undefined) as (
      data: CreateTaskRequest | ({ id: string } & CreateTaskRequest)
    ) => Promise<void>;
    taskModal = new TaskModal();
    taskModal.setOnSubmit(mockOnSubmit);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  it("should initialize with correct DOM elements", () => {
    expect(taskModal).toBeInstanceOf(TaskModal);
  });

  it("should throw error if required DOM elements are missing", () => {
    document.body.innerHTML = "<div></div>";

    expect(() => new TaskModal()).toThrow(
      "Required modal elements not found in DOM"
    );
  });

  it("should show modal in create mode by default", () => {
    taskModal.show();

    const modal = document.getElementById("task-modal");
    const modalTitle = modal?.querySelector(".modal-header h2");
    const submitButton = modal?.querySelector('button[type="submit"]');

    expect(modal?.classList.contains("hidden")).toBe(false);
    expect(modalTitle?.textContent).toBe("Nueva Tarea");
    expect(submitButton?.textContent).toBe("Crear Tarea");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should show modal in edit mode when task is provided", () => {
    taskModal.show(mockTask);

    const modal = document.getElementById("task-modal");
    const modalTitle = modal?.querySelector(".modal-header h2");
    const submitButton = modal?.querySelector('button[type="submit"]');
    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;
    const descriptionTextarea = document.getElementById(
      "task-description"
    ) as HTMLTextAreaElement;

    expect(modal?.classList.contains("hidden")).toBe(false);
    expect(modalTitle?.textContent).toBe("Editar Tarea");
    expect(submitButton?.textContent).toBe("Actualizar Tarea");
    expect(titleInput.value).toBe("Test Task");
    expect(descriptionTextarea.value).toBe("Test description");
  });

  it("should hide modal and reset form", () => {
    taskModal.show(mockTask);
    taskModal.hide();

    const modal = document.getElementById("task-modal");
    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;
    const descriptionTextarea = document.getElementById(
      "task-description"
    ) as HTMLTextAreaElement;

    expect(modal?.classList.contains("hidden")).toBe(true);
    expect(titleInput.value).toBe("");
    expect(descriptionTextarea.value).toBe("");
    expect(document.body.style.overflow).toBe("");
  });

  it("should close modal when close button is clicked", () => {
    taskModal.show();

    const closeButton = document.querySelector(
      ".modal-close"
    ) as HTMLButtonElement;
    closeButton.click();

    const modal = document.getElementById("task-modal");
    expect(modal?.classList.contains("hidden")).toBe(true);
  });

  it("should close modal when cancel button is clicked", () => {
    taskModal.show();

    const cancelButton = document.querySelector(
      ".modal-cancel"
    ) as HTMLButtonElement;
    cancelButton.click();

    const modal = document.getElementById("task-modal");
    expect(modal?.classList.contains("hidden")).toBe(true);
  });

  it("should close modal when clicking outside modal content", () => {
    taskModal.show();

    const modal = document.getElementById("task-modal");
    modal?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(modal?.classList.contains("hidden")).toBe(true);
  });

  it("should close modal when Escape key is pressed", () => {
    taskModal.show();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    const modal = document.getElementById("task-modal");
    expect(modal?.classList.contains("hidden")).toBe(true);
  });

  it("should validate required title field", async () => {
    taskModal.show();

    const form = document.getElementById("task-form") as HTMLFormElement;
    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;

    // Submit form with empty title
    titleInput.value = "";
    form.dispatchEvent(new Event("submit"));

    // Should show validation error
    const formGroup = titleInput.closest(".form-group");
    expect(formGroup?.classList.contains("error")).toBe(true);
    expect(formGroup?.querySelector(".form-error")?.textContent).toBe(
      "El título es obligatorio"
    );

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should validate title length", async () => {
    taskModal.show();

    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;

    // Set title longer than 200 characters
    titleInput.value = "a".repeat(201);
    titleInput.dispatchEvent(new Event("blur"));

    const formGroup = titleInput.closest(".form-group");
    expect(formGroup?.classList.contains("error")).toBe(true);
    expect(formGroup?.querySelector(".form-error")?.textContent).toBe(
      "El título no puede exceder 100 caracteres"
    );
  });

  it("should submit form with valid data in create mode", async () => {
    taskModal.show();

    const form = document.getElementById("task-form") as HTMLFormElement;
    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;
    const descriptionTextarea = document.getElementById(
      "task-description"
    ) as HTMLTextAreaElement;

    titleInput.value = "New Task";
    descriptionTextarea.value = "New description";

    form.dispatchEvent(new Event("submit"));

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: "New Task",
      description: "New description",
    });
  });

  it("should submit form with valid data in edit mode", async () => {
    taskModal.show(mockTask);

    const form = document.getElementById("task-form") as HTMLFormElement;
    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;
    const descriptionTextarea = document.getElementById(
      "task-description"
    ) as HTMLTextAreaElement;

    titleInput.value = "Updated Task";
    descriptionTextarea.value = "Updated description";

    form.dispatchEvent(new Event("submit"));

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      id: "1",
      title: "Updated Task",
      description: "Updated description",
    });
  });

  it("should handle submission errors gracefully", async () => {
    const errorOnSubmit = vi.fn().mockRejectedValue(new Error("Network error"));
    taskModal.setOnSubmit(errorOnSubmit);
    taskModal.show();

    const form = document.getElementById("task-form") as HTMLFormElement;
    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;

    titleInput.value = "Test Task";
    form.dispatchEvent(new Event("submit"));

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should show error message
    const errorElement = form.querySelector(".form-general-error");
    expect(errorElement?.textContent).toBe(
      "Error al guardar la tarea. Por favor, inténtalo de nuevo."
    );

    // Modal should remain open
    const modal = document.getElementById("task-modal");
    expect(modal?.classList.contains("hidden")).toBe(false);
  });

  it("should clear validation errors when showing modal", () => {
    taskModal.show();

    const titleInput = document.getElementById(
      "task-title"
    ) as HTMLInputElement;
    const formGroup = titleInput.closest(".form-group") as HTMLElement;

    // Add error state
    formGroup.classList.add("error");
    const errorDiv = document.createElement("div");
    errorDiv.className = "form-error";
    errorDiv.textContent = "Test error";
    formGroup.appendChild(errorDiv);

    // Show modal again
    taskModal.show();

    expect(formGroup.classList.contains("error")).toBe(false);
    expect(formGroup.querySelector(".form-error")).toBeNull();
  });
});
