import type {
  IApiClient,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../types/task.js";
import { TaskStatus } from "../types/task.js";
import type { IAuthService } from "../services/auth.js";

// Single Responsibility Principle - only handles HTTP communication
export class ApiClient implements IApiClient {
  private baseUrl = "/api";
  private authService: IAuthService | null = null;
  private onUnauthorized: (() => void) | null = null;

  /**
   * Set auth service for token management
   */
  setAuthService(authService: IAuthService): void {
    this.authService = authService;
  }

  /**
   * Set callback for unauthorized responses (401)
   */
  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  async getTasks(): Promise<Task[]> {
    // console.log("🔍 ApiClient: Fetching tasks from", `${this.baseUrl}/tasks`);
    const tasks = await this.get<Task[]>("/tasks");
    // console.log("✅ ApiClient: Received tasks:", tasks);
    return tasks;
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

  /**
   * Get authorization headers with JWT token
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.authService) {
      const token = this.authService.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle HTTP response and check for authorization errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.error("❌ Unauthorized: Token invalid or expired");

      // Clear token locally (don't call backend on 401)
      if (this.authService) {
        const token = this.authService.getToken();
        if (token) {
          localStorage.removeItem("jwt_token");
        }
      }

      if (this.onUnauthorized) {
        this.onUnauthorized();
      }

      throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
    }

    if (!response.ok) {
      console.error("❌ HTTP Error:", response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // console.log("🌐 HTTP GET:", url);

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    // console.log("📡 Response status:", response.status, response.statusText);

    return this.handleResponse<T>(response);
  }

  private async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  private async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }
}
