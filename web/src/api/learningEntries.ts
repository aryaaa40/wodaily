import { apiFetch } from './client';
import type { CaptureNote, LearningEntry, LearningEntryStatus } from '../types';

export const learningEntriesApi = {
  listAll: () => apiFetch<LearningEntry[]>('/learning-entries'),
  update: (
    id: string,
    data: Partial<{
      attemptLog: string;
      researchNotes: string;
      reflection: string;
      status: LearningEntryStatus;
    }>,
  ) => apiFetch<LearningEntry>(`/learning-entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  generalize: (id: string, title: string, tags: string[]) =>
    apiFetch<CaptureNote>(`/learning-entries/${id}/generalize`, {
      method: 'POST',
      body: JSON.stringify({ title, tags }),
    }),
};
