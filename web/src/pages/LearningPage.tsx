import { useCallback, useEffect, useState } from 'react';
import type { LearningEntry } from '../types';
import { learningEntriesApi } from '../api/learningEntries';
import { tasksApi } from '../api/tasks';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import { LEARNING_STATUS_ORDER, learningStatusMeta } from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './LearningPage.module.css';

type Filter = 'open' | 'all' | 'done';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Belum kelar' },
  { value: 'all', label: 'Semua' },
  { value: 'done', label: 'Kelar' },
];

export function LearningPage() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('open');

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

  const logAttempt = async (entry: LearningEntry) => {
    const attemptLog = window.prompt('Apa yang udah lo coba?');
    if (!attemptLog?.trim()) return;
    await learningEntriesApi.update(entry.id, {
      attemptLog: attemptLog.trim(),
      status: 'ATTEMPT',
    });
    await load();
  };

  const markLearned = async (entry: LearningEntry) => {
    const reflection = window.prompt('Apa yang sekarang lo tau yang tadi belum?');
    if (!reflection?.trim()) return;
    await learningEntriesApi.update(entry.id, {
      reflection: reflection.trim(),
      status: 'LEARNED',
    });
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
                        onClick={() => logAttempt(entry)}
                      >
                        Catat percobaan
                      </button>
                    )}
                    {entry.status === 'ATTEMPT' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => markLearned(entry)}
                      >
                        Tandai paham
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
