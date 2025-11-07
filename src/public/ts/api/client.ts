import {
  IApiClient,
  Task,
  CreateTaskRequest,
  TaskStatus,
  UpdateTaskRequest,
} from "../types/task.js";

// Single Responsibility Principle - only handles HTTP communication
export class ApiClient implements IApiClient {
  private baseUrl = "/api";

  async getTasks(): Promise<Task[]> {
    return this.get<Task[]>("/tasks");
  }

  async createTask(data: CreateTaskRequest): Promise<Task> {
    return this.post<Task>("/tasks", data);
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.put<Task>(`/tasks/${id}/status`, { status });
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    return this.put<Task>(`/tasks/${id}`, data);
  }

  private async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  private async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  private async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}
