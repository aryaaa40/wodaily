import { useCallback, useEffect, useState } from 'react';
import { Clock, EllipsisVertical, Plus, Trash2 } from 'lucide-react';
import type { LearningEntry, Task, TaskStatus } from '../types';
import { tasksApi } from '../api/tasks';
import { learningEntriesApi } from '../api/learningEntries';
import { apiFetch } from '../api/client';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import {
  TASK_STATUS_ORDER,
  learningStatusMeta,
  taskStatusMeta,
} from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './KanbanPage.module.css';

export function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entriesByTask, setEntriesByTask] = useState<Record<string, LearningEntry[]>>({});

  const load = useCallback(async () => {
    const [taskList, entries] = await Promise.all([
      tasksApi.list(),
      learningEntriesApi.listAll(),
    ]);
    const grouped: Record<string, LearningEntry[]> = {};
    for (const entry of entries) {
      (grouped[entry.taskId] ??= []).push(entry);
    }
    setTasks(taskList);
    setEntriesByTask(grouped);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    const title = window.prompt('Judul task baru');
    if (!title?.trim()) return;
    await tasksApi.create(title.trim());
    await load();
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Hapus "${task.title}"?`)) return;
    await tasksApi.remove(task.id);
    await load();
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    await tasksApi.updateStatus(task.id, status, 0);
    if (status === 'BLOCKED') {
      const problemStatement = window.prompt('Apa yang literally nge-block sekarang?');
      if (problemStatement?.trim()) {
        await apiFetch('/learning-entries', {
          method: 'POST',
          body: JSON.stringify({ taskId: task.id, problemStatement: problemStatement.trim() }),
        });
      }
    }
    await load();
  };

  return (
    <>
      <PageHeader
        title="Kanban"
        action={
          <button type="button" className="btn btn--primary" onClick={handleCreate}>
            <Plus size={16} aria-hidden />
            Task baru
          </button>
        }
      />

      {tasks.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Board masih kosong</p>
          <p className={styles.emptyText}>
            Bikin task pertama lo buat mulai ngatur kerjaan hari ini.
          </p>
        </div>
      ) : (
        <div className={styles.board}>
          {TASK_STATUS_ORDER.map((status) => {
            const meta = taskStatusMeta(status);
            const columnTasks = tasks.filter((task) => task.status === status);
            return (
              <section key={status} className={styles.column}>
                <header className={styles.columnHeader}>
                  <span className={`${styles.columnIcon} ${styles[meta.tone]}`}>
                    <meta.Icon size={16} aria-hidden />
                  </span>
                  <h2 className={styles.columnTitle}>{meta.label}</h2>
                  <span className={styles.columnCount}>{columnTasks.length}</span>
                </header>

                <div className={styles.cards}>
                  {columnTasks.map((task) => {
                    const latestEntry = entriesByTask[task.id]?.[0];
                    return (
                      <article key={task.id} className={styles.card}>
                        <div className={styles.cardTop}>
                          <h3 className={styles.cardTitle}>{task.title}</h3>
                          <div className={styles.cardActions}>
                            <button
                              type="button"
                              className="btn btn--icon"
                              onClick={() => handleDelete(task)}
                              aria-label={`Hapus ${task.title}`}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                            <span className={styles.moveWrap}>
                              <EllipsisVertical size={14} aria-hidden />
                              <select
                                className={styles.moveSelect}
                                value={task.status}
                                onChange={(event) =>
                                  moveTask(task, event.target.value as TaskStatus)
                                }
                                aria-label={`Pindahkan ${task.title}`}
                              >
                                {TASK_STATUS_ORDER.map((option) => (
                                  <option key={option} value={option}>
                                    {taskStatusMeta(option).label}
                                  </option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>

                        {task.description && (
                          <p className={styles.cardDesc}>{task.description}</p>
                        )}

                        <div className={styles.divider} />

                        <div className={styles.cardFooter}>
                          <span className={styles.meta}>
                            <Clock size={12} aria-hidden />
                            {relativeTime(task.updatedAt)}
                          </span>
                          {latestEntry && (
                            <StatusPill meta={learningStatusMeta(latestEntry.status)} size="sm" />
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
