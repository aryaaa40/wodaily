import { apiFetch } from './client';
import type { CaptureNote } from '../types';

export const captureNotesApi = {
  list: (params?: { tag?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.tag) query.set('tag', params.tag);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiFetch<CaptureNote[]>(`/capture-notes${qs ? `?${qs}` : ''}`);
  },
  create: (title: string, content: string, tags: string[]) =>
    apiFetch<CaptureNote>('/capture-notes', {
      method: 'POST',
      body: JSON.stringify({ title, content, tags }),
    }),
  remove: (id: string) => apiFetch<void>(`/capture-notes/${id}`, { method: 'DELETE' }),
};
