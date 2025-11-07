import { ITaskCache, Task } from "../types/task.js";

// Single Responsibility Principle - only handles task caching
export class TaskCache implements ITaskCache {
  private static readonly CACHE_KEY = "tasks_cache";
  private static readonly CACHE_TIMESTAMP_KEY = "tasks_cache_timestamp";
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  get(): Task[] | null {
    const timestamp = localStorage.getItem(TaskCache.CACHE_TIMESTAMP_KEY);
    if (
      !timestamp ||
      Date.now() - parseInt(timestamp) > TaskCache.CACHE_DURATION
    ) {
      this.clear();
      return null;
    }

    const data = localStorage.getItem(TaskCache.CACHE_KEY);
    return data ? JSON.parse(data) : null;
  }

  set(tasks: Task[]): void {
    localStorage.setItem(TaskCache.CACHE_KEY, JSON.stringify(tasks));
    localStorage.setItem(TaskCache.CACHE_TIMESTAMP_KEY, Date.now().toString());
  }

  clear(): void {
    localStorage.removeItem(TaskCache.CACHE_KEY);
    localStorage.removeItem(TaskCache.CACHE_TIMESTAMP_KEY);
  }
}
