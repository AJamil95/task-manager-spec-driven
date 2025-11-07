// Placeholder for TaskBoard component - will be implemented in later tasks
import {
  ITaskBoard,
  IApiClient,
  ITaskCache,
  IDragDropService,
  CreateTaskRequest,
} from "../types/task.js";

export class TaskBoard implements ITaskBoard {
  private container: HTMLElement;
  private apiClient: IApiClient;
  private cache: ITaskCache;
  private dragDropService: IDragDropService;

  constructor(
    container: HTMLElement,
    apiClient: IApiClient,
    cache: ITaskCache,
    dragDropService: IDragDropService
  ) {
    this.container = container;
    this.apiClient = apiClient;
    this.cache = cache;
    this.dragDropService = dragDropService;
  }

  async init(): Promise<void> {
    // Implementation will be added in task 10
    throw new Error("Not implemented yet");
  }

  async loadTasks(): Promise<void> {
    // Implementation will be added in task 10
    throw new Error("Not implemented yet");
  }

  async createTask(data: CreateTaskRequest): Promise<void> {
    // Implementation will be added in task 10
    throw new Error("Not implemented yet");
  }
}
