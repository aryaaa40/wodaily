import { useEffect, useState } from 'react';
import type { LearningEntry } from '../types';
import { learningEntriesApi } from '../api/learningEntries';

export function LearningPage() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);

  const load = () => {
    learningEntriesApi.listAll().then(setEntries);
  };

  useEffect(() => {
    load();
  }, []);

  const logAttempt = async (entry: LearningEntry) => {
    const attemptLog = window.prompt('Apa yang udah lo coba?');
    if (!attemptLog) return;
    await learningEntriesApi.update(entry.id, { attemptLog, status: 'ATTEMPT' });
    load();
  };

  const addResearch = async (entry: LearningEntry) => {
    const researchNotes = window.prompt('Catatan riset:', entry.researchNotes ?? '');
    if (researchNotes === null) return;
    await learningEntriesApi.update(entry.id, { researchNotes });
    load();
  };

  const markLearned = async (entry: LearningEntry) => {
    const reflection = window.prompt('Apa yang sekarang lo tau yang tadi belum?');
    if (!reflection) return;
    await learningEntriesApi.update(entry.id, { reflection, status: 'LEARNED' });
    load();
  };

  const generalize = async (entry: LearningEntry) => {
    const title = window.prompt('Judul capture note baru:', entry.problemStatement);
    if (!title) return;
    await learningEntriesApi.generalize(entry.id, title, []);
    load();
  };

  return (
    <div style={{ padding: '1rem' }}>
      {entries.map((entry) => (
        <div key={entry.id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
          <div>Status: {entry.status}</div>
          <div>Problem: {entry.problemStatement}</div>

          {entry.attemptLog && <div>Attempt: {entry.attemptLog}</div>}

          {entry.attemptLog && (
            <div>
              Research: {entry.researchNotes ?? '(belum ada)'}{' '}
              <button onClick={() => addResearch(entry)}>Edit riset</button>
            </div>
          )}

          {entry.status === 'PROBLEM' && <button onClick={() => logAttempt(entry)}>Log attempt</button>}
          {entry.status === 'ATTEMPT' && <button onClick={() => markLearned(entry)}>Tandai Learned</button>}
          {entry.status === 'LEARNED' && !entry.promotedCaptureNoteId && (
            <button onClick={() => generalize(entry)}>Generalize ke Capture</button>
          )}
        </div>
      ))}
    </div>
  );
}
