export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type LearningEntryStatus = 'PROBLEM' | 'ATTEMPT' | 'LEARNED';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CaptureNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningEntry {
  id: string;
  taskId: string;
  status: LearningEntryStatus;
  problemStatement: string;
  attemptLog: string | null;
  researchNotes: string | null;
  reflection: string | null;
  promotedCaptureNoteId: string | null;
  createdAt: string;
  updatedAt: string;
}
