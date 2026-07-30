import { useCallback, useEffect, useState } from 'react';
import { BookmarkCheck, Lock, Pencil } from 'lucide-react';
import type { LearningEntry } from '../types';
import { learningEntriesApi } from '../api/learningEntries';
import { tasksApi } from '../api/tasks';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { TextPromptModal } from '../components/TextPromptModal';
import { LEARNING_STATUS_ORDER, learningStatusMeta } from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './LearningPage.module.css';

type Filter = 'open' | 'all' | 'done';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Belum kelar' },
  { value: 'all', label: 'Semua' },
  { value: 'done', label: 'Kelar' },
];

type Dialog =
  | { kind: 'attempt'; entry: LearningEntry }
  | { kind: 'research'; entry: LearningEntry }
  | { kind: 'reflection'; entry: LearningEntry }
  | { kind: 'generalize'; entry: LearningEntry }
  | null;

function GeneralizeModal({
  entry,
  onClose,
  onSubmit,
}: {
  entry: LearningEntry;
  onClose: () => void;
  onSubmit: (title: string, tags: string[]) => void;
}) {
  const [title, setTitle] = useState(entry.problemStatement);
  const [tagsInput, setTagsInput] = useState('');
  const trimmedTitle = title.trim();

  return (
    <Modal
      title="Simpan sebagai catatan Capture"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!trimmedTitle}
            onClick={() =>
              onSubmit(
                trimmedTitle,
                tagsInput
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              )
            }
          >
            Simpan ke Capture
          </button>
        </>
      }
    >
      <div className={styles.modalContext}>
        <span className={styles.sectionLabel}>Isi catatan</span>
        <p className={styles.sectionText}>{entry.reflection}</p>
      </div>

      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Judul catatan</span>
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Tag (opsional, dipisah koma)</span>
        <input
          className="input"
          value={tagsInput}
          placeholder="react, performance"
          onChange={(event) => setTagsInput(event.target.value)}
        />
      </label>
    </Modal>
  );
}

export function LearningPage() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('open');
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    const [entryList, taskList] = await Promise.all([
      learningEntriesApi.listAll(),
      tasksApi.list(),
    ]);
    setEntries(entryList);
    setTaskTitles(Object.fromEntries(taskList.map((task) => [task.id, task.title])));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitAttempt = async (entry: LearningEntry, attemptLog: string) => {
    await learningEntriesApi.update(entry.id, { attemptLog, status: 'ATTEMPT' });
    setDialog(null);
    await load();
  };

  const submitResearch = async (entry: LearningEntry, researchNotes: string) => {
    await learningEntriesApi.update(entry.id, { researchNotes });
    setDialog(null);
    await load();
  };

  const submitReflection = async (entry: LearningEntry, reflection: string) => {
    await learningEntriesApi.update(entry.id, { reflection, status: 'LEARNED' });
    setDialog(null);
    await load();
  };

  const submitGeneralize = async (
    entry: LearningEntry,
    title: string,
    tags: string[],
  ) => {
    await learningEntriesApi.generalize(entry.id, title, tags);
    setDialog(null);
    await load();
  };

  const visible = entries.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'done') return entry.status === 'LEARNED';
    return entry.status !== 'LEARNED';
  });

  return (
    <>
      <PageHeader title="Learning Tracker" />

      <div className={styles.filterRow} role="tablist" aria-label="Filter entry">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className={
              filter === option.value
                ? `${styles.filterBtn} ${styles.filterBtnActive}`
                : styles.filterBtn
            }
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Gak ada entry di sini</p>
          <p className={styles.emptyText}>
            Learning entry lahir dari task yang lo tandai "Mentok" di board Kanban.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {visible.map((entry) => {
            const meta = learningStatusMeta(entry.status);
            const currentStep = LEARNING_STATUS_ORDER.indexOf(entry.status);

            return (
              <article key={entry.id} className={styles.entry}>
                <header className={styles.entryHeader}>
                  <StatusPill meta={meta} />
                  <span className={styles.origin}>
                    dari · {taskTitles[entry.taskId] ?? 'task tak dikenal'}
                  </span>
                </header>

                <ol className={styles.stepper}>
                  {LEARNING_STATUS_ORDER.map((status, index) => (
                    <li
                      key={status}
                      className={
                        index <= currentStep
                          ? `${styles.step} ${styles.stepDone}`
                          : styles.step
                      }
                    >
                      <span className={styles.stepDot} aria-hidden />
                      {learningStatusMeta(status).label}
                    </li>
                  ))}
                </ol>

                <section className={styles.section}>
                  <h3 className={styles.sectionLabel}>Masalah</h3>
                  <p className={styles.sectionText}>{entry.problemStatement}</p>
                </section>

                {entry.attemptLog && (
                  <section className={styles.section}>
                    <h3 className={styles.sectionLabel}>Yang udah dicoba</h3>
                    <p className={styles.sectionText}>{entry.attemptLog}</p>
                  </section>
                )}

                {entry.attemptLog ? (
                  <section className={styles.section}>
                    <div className={styles.researchHead}>
                      <h3 className={styles.sectionLabel}>Catatan riset</h3>
                      <button
                        type="button"
                        className="btn btn--icon"
                        onClick={() => setDialog({ kind: 'research', entry })}
                        aria-label="Ubah catatan riset"
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                    </div>
                    <p className={styles.sectionText}>
                      {entry.researchNotes || (
                        <span className={styles.placeholder}>Belum ada catatan riset.</span>
                      )}
                    </p>
                  </section>
                ) : (
                  <div className={styles.locked}>
                    <Lock size={14} aria-hidden />
                    <p>
                      Catatan riset kebuka setelah lo catat percobaan pertama. Coba dulu,
                      baru cari referensi.
                    </p>
                  </div>
                )}

                {entry.reflection && (
                  <section className={`${styles.section} ${styles.reflection}`}>
                    <h3 className={styles.sectionLabel}>Yang sekarang gue tau</h3>
                    <p className={styles.sectionText}>{entry.reflection}</p>
                  </section>
                )}

                <footer className={styles.entryFooter}>
                  <span className={styles.time}>{relativeTime(entry.updatedAt)}</span>
                  <div className={styles.actions}>
                    {entry.status === 'PROBLEM' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setDialog({ kind: 'attempt', entry })}
                      >
                        Catat percobaan
                      </button>
                    )}
                    {entry.status === 'ATTEMPT' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setDialog({ kind: 'reflection', entry })}
                      >
                        Tandai paham
                      </button>
                    )}
                    {entry.status === 'LEARNED' &&
                      (entry.promotedCaptureNoteId ? (
                        <span className={styles.promoted}>
                          <BookmarkCheck size={14} aria-hidden />
                          Udah jadi catatan Capture
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--outline"
                          onClick={() => setDialog({ kind: 'generalize', entry })}
                        >
                          Simpan ke Capture
                        </button>
                      ))}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {dialog?.kind === 'attempt' && (
        <TextPromptModal
          title="Catat percobaan"
          label="Apa yang udah lo coba?"
          placeholder="Boleh diisi 'belum coba apa-apa, langsung cari cara' — yang penting jujur"
          context={[{ label: 'Masalah', value: dialog.entry.problemStatement }]}
          submitLabel="Simpan"
          onSubmit={(value) => submitAttempt(dialog.entry, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'research' && (
        <TextPromptModal
          title="Catatan riset"
          label="Referensi atau temuan yang kepake"
          defaultValue={dialog.entry.researchNotes ?? ''}
          submitLabel="Simpan"
          onSubmit={(value) => submitResearch(dialog.entry, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'reflection' && (
        <TextPromptModal
          title="Tandai paham"
          label="Apa yang sekarang lo tau yang tadi belum?"
          placeholder="Kesimpulan atau pattern yang bakal kepake lagi nanti"
          context={[
            { label: 'Masalah', value: dialog.entry.problemStatement },
            ...(dialog.entry.attemptLog
              ? [{ label: 'Yang udah dicoba', value: dialog.entry.attemptLog }]
              : []),
          ]}
          submitLabel="Simpan & tandai paham"
          onSubmit={(value) => submitReflection(dialog.entry, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'generalize' && (
        <GeneralizeModal
          entry={dialog.entry}
          onClose={() => setDialog(null)}
          onSubmit={(title, tags) => submitGeneralize(dialog.entry, title, tags)}
        />
      )}
    </>
  );
}
