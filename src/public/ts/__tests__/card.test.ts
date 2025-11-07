/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskCard } from "../components/card.js";
import type {
  Task,
  TaskStatus,
  IDragDropService,
  IApiClient,
} from "../types/task.js";

// Mock implementations
const mockDragDropService: IDragDropService = {
  setupDragHandlers: vi.fn(),
  setupDropZone: vi.fn(),
};

const mockApiClient: IApiClient = {
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTask: vi.fn().mockResolvedValue({
    id: "1",
    title: "Updated Task",
    description: "Updated description",
    status: "pending" as TaskStatus,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  }),
};

const mockTask: Task = {
  id: "1",
  title: "Test Task",
  description: "Test description",
  status: "pending" as TaskStatus,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

describe("TaskCard", () => {
  let taskCard: TaskCard;

  beforeEach(() => {
    vi.clearAllMocks();
    taskCard = new TaskCard(mockTask, mockDragDropService, mockApiClient);
  });

  it("should render task card with correct content", () => {
    const element = taskCard.render();

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.className).toBe("task-card");
    expect(element.dataset.taskId).toBe("1");
    expect(element.textContent).toContain("Test Task");
    expect(element.textContent).toContain("Test description");
  });

  it("should setup drag handlers when rendered", () => {
    const element = taskCard.render();

    expect(mockDragDropService.setupDragHandlers).toHaveBeenCalledWith(
      element,
      mockTask
    );
  });

  it("should enable inline editing mode", () => {
    const element = taskCard.render();

    taskCard.enableInlineEdit();

    expect(element.classList.contains("editing")).toBe(true);
    expect(element.querySelector(".task-card-input")).toBeInstanceOf(
      HTMLInputElement
    );
    expect(element.querySelector(".task-card-textarea")).toBeInstanceOf(
      HTMLTextAreaElement
    );
  });

  it("should update task data", () => {
    const element = taskCard.render();
    const updatedTask: Task = {
      ...mockTask,
      title: "Updated Title",
      description: "Updated Description",
    };

    taskCard.updateTask(updatedTask);

    expect(element.textContent).toContain("Updated Title");
    expect(element.textContent).toContain("Updated Description");
  });

  it("should handle double-click to enable editing", () => {
    const element = taskCard.render();

    // Simulate double-click
    element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

    expect(element.classList.contains("editing")).toBe(true);
  });

  it("should escape HTML in task content", () => {
    const taskWithHtml: Task = {
      ...mockTask,
      title: "<script>alert('xss')</script>",
      description: "<img src=x onerror=alert('xss')>",
    };

    const cardWithHtml = new TaskCard(
      taskWithHtml,
      mockDragDropService,
      mockApiClient
    );
    const element = cardWithHtml.render();

    // Should not contain actual script tags
    expect(element.innerHTML).not.toContain("<script>");
    expect(element.innerHTML).not.toContain("<img");
    // Should contain escaped content
    expect(element.innerHTML).toContain("&lt;script&gt;");
    expect(element.innerHTML).toContain("&lt;img");
  });
});
