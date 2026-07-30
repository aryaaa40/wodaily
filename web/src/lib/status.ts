import {
  Circle,
  CircleCheck,
  CircleDashed,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { LearningEntryStatus, TaskStatus } from '../types';

export type StatusTone = 'idle' | 'active' | 'stuck' | 'done';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  Icon: LucideIcon;
}

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
];

export const LEARNING_STATUS_ORDER: LearningEntryStatus[] = [
  'PROBLEM',
  'ATTEMPT',
  'LEARNED',
];

const TASK_STATUS: Record<TaskStatus, StatusMeta> = {
  TODO: { label: 'To Do', tone: 'idle', Icon: Circle },
  IN_PROGRESS: { label: 'Dikerjain', tone: 'active', Icon: CircleDashed },
  BLOCKED: { label: 'Mentok', tone: 'stuck', Icon: TriangleAlert },
  DONE: { label: 'Kelar', tone: 'done', Icon: CircleCheck },
};

const LEARNING_STATUS: Record<LearningEntryStatus, StatusMeta> = {
  PROBLEM: { label: 'Masalah', tone: 'stuck', Icon: TriangleAlert },
  ATTEMPT: { label: 'Mencoba', tone: 'active', Icon: CircleDashed },
  LEARNED: { label: 'Paham', tone: 'done', Icon: CircleCheck },
};

export function taskStatusMeta(status: TaskStatus): StatusMeta {
  return TASK_STATUS[status];
}

export function learningStatusMeta(status: LearningEntryStatus): StatusMeta {
  return LEARNING_STATUS[status];
}
