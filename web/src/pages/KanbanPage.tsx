import { useCallback, useEffect, useState } from 'react';
import { Clock, EllipsisVertical, Plus, Trash2 } from 'lucide-react';
import type { LearningEntry, Task, TaskStatus } from '../types';
import { tasksApi } from '../api/tasks';
import { learningEntriesApi } from '../api/learningEntries';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { TextPromptModal } from '../components/TextPromptModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  TASK_STATUS_ORDER,
  learningStatusMeta,
  taskStatusMeta,
} from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './KanbanPage.module.css';

type Dialog =
  | { kind: 'create' }
  | { kind: 'view'; task: Task }
  | { kind: 'blocked'; task: Task }
  | { kind: 'delete'; task: Task }
  | null;

function CreateTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, description?: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const trimmedTitle = title.trim();

  return (
    <Modal
      title="Task baru"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!trimmedTitle}
            onClick={() => onCreate(trimmedTitle, description.trim() || undefined)}
          >
            Simpan
          </button>
        </>
      }
    >
      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Judul</span>
        <input
          className="input"
          value={title}
          placeholder="Mau ngerjain apa?"
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Deskripsi (opsional)</span>
        <textarea
          className="textarea"
          value={description}
          placeholder="Detail, konteks, atau catatan kecil"
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
    </Modal>
  );
}

function TaskDetailModal({
  task,
  latestEntry,
  onClose,
  onDelete,
}: {
  task: Task;
  latestEntry?: LearningEntry;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      title={task.title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Tutup
          </button>
          <button type="button" className="btn btn--danger" onClick={onDelete}>
            Hapus
          </button>
        </>
      }
    >
      <div className={styles.detailMeta}>
        <StatusPill meta={taskStatusMeta(task.status)} />
        {latestEntry && <StatusPill meta={learningStatusMeta(latestEntry.status)} />}
        <span className={styles.meta}>
          <Clock size={12} aria-hidden />
          {relativeTime(task.updatedAt)}
        </span>
      </div>

      <p className={styles.detailDesc}>
        {task.description || (
          <span className={styles.placeholder}>Belum ada deskripsi.</span>
        )}
      </p>
    </Modal>
  );
}

export function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entriesByTask, setEntriesByTask] = useState<Record<string, LearningEntry[]>>({});
  const [dialog, setDialog] = useState<Dialog>(null);

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

  const handleCreate = async (title: string, description?: string) => {
    await tasksApi.create(title, description);
    setDialog(null);
    await load();
  };

  const handleDelete = async (task: Task) => {
    await tasksApi.remove(task.id);
    setDialog(null);
    await load();
  };

  const handleBlockedReason = async (task: Task, problemStatement: string) => {
    await learningEntriesApi.create(task.id, problemStatement);
    setDialog(null);
    await load();
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    await tasksApi.updateStatus(task.id, status, 0);
    await load();
    if (status === 'BLOCKED') setDialog({ kind: 'blocked', task });
  };

  return (
    <>
      <PageHeader
        title="Kanban"
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setDialog({ kind: 'create' })}
          >
            <Plus size={16} aria-hidden />
            Task Baru
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
                      <article
                        key={task.id}
                        className={styles.card}
                        onClick={() => setDialog({ kind: 'view', task })}
                      >
                        <div className={styles.cardTop}>
                          <h3 className={styles.cardTitle}>{task.title}</h3>
                          <div
                            className={styles.cardActions}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="btn btn--icon"
                              onClick={() => setDialog({ kind: 'delete', task })}
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

      {dialog?.kind === 'create' && (
        <CreateTaskModal onClose={() => setDialog(null)} onCreate={handleCreate} />
      )}

      {dialog?.kind === 'view' && (
        <TaskDetailModal
          task={dialog.task}
          latestEntry={entriesByTask[dialog.task.id]?.[0]}
          onClose={() => setDialog(null)}
          onDelete={() => setDialog({ kind: 'delete', task: dialog.task })}
        />
      )}

      {dialog?.kind === 'blocked' && (
        <TextPromptModal
          title="Kenapa mentok?"
          label="Apa yang literally nge-block sekarang?"
          placeholder="Tulis hambatan konkretnya, bukan topik umum"
          submitLabel="Simpan"
          onSubmit={(value) => handleBlockedReason(dialog.task, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmModal
          title="Hapus task"
          message={`"${dialog.task.title}" bakal dihapus permanen, termasuk semua learning entry yang lahir dari task ini.`}
          confirmLabel="Hapus"
          onConfirm={() => handleDelete(dialog.task)}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
