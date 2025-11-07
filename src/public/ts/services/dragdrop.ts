import type { IDragDropService, Task, DragDropData } from "../types/task.js";
import { TaskStatus } from "../types/task.js";

// Single Responsibility Principle - only handles drag & drop logic
export class DragDropService implements IDragDropService {
  private dragData: DragDropData | null = null;

  setupDragHandlers(card: HTMLElement, task: Task): void {
    card.draggable = true;
    card.dataset.taskId = task.id;

    card.addEventListener("dragstart", (e) => {
      this.dragData = {
        taskId: task.id,
        sourceColumn: task.status,
        targetColumn: task.status,
      };
      card.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", task.id);
      e.dataTransfer!.effectAllowed = "move";
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      this.dragData = null;
    });
  }

  setupDropZone(
    column: HTMLElement,
    status: TaskStatus,
    onDrop: (taskId: string, newStatus: TaskStatus) => Promise<void>
  ): void {
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = "move";
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", (e) => {
      // Only remove drag-over if we're leaving the column entirely
      if (!column.contains(e.relatedTarget as Node)) {
        column.classList.remove("drag-over");
      }
    });

    column.addEventListener("drop", async (e) => {
      e.preventDefault();
      column.classList.remove("drag-over");

      if (this.dragData && this.dragData.sourceColumn !== status) {
        try {
          await onDrop(this.dragData.taskId, status);
        } catch (error) {
          console.error("Failed to move task:", error);
          // Error handling will be done by the calling component
        }
      }
    });
  }
}
