import { apiFetch } from './client';
import type { Task, TaskStatus } from '../types';

export const tasksApi = {
  list: () => apiFetch<Task[]>('/tasks'),
  create: (title: string, description?: string) =>
    apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify({ title, description }) }),
  updateStatus: (id: string, status: TaskStatus, position: number) =>
    apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status, position }) }),
  remove: (id: string) => apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' }),
};
