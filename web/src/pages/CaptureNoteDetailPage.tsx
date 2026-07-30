import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { CaptureNote } from '../types';
import { captureNotesApi } from '../api/captureNotes';
import { relativeTime } from '../lib/relativeTime';
import styles from './CaptureNoteDetailPage.module.css';

export function CaptureNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<CaptureNote | null | undefined>(undefined);

  useEffect(() => {
    void captureNotesApi
      .list()
      .then((notes) => setNote(notes.find((item) => item.id === id) ?? null));
  }, [id]);

  return (
    <>
      <Link to="/capture" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden />
        Balik ke Capture
      </Link>

      {note === undefined && <p className={styles.status}>Memuat…</p>}

      {note === null && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Catatan gak ketemu</p>
          <p className={styles.emptyText}>Mungkin udah dihapus atau link-nya salah.</p>
        </div>
      )}

      {note && (
        <article className={styles.note}>
          <header className={styles.header}>
            <h1 className={styles.title}>{note.title}</h1>
          </header>

          {note.tags.length > 0 && (
            <div className={styles.tagRow}>
              {note.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className={styles.content}>{note.content}</p>

          <span className={styles.time}>{relativeTime(note.createdAt)}</span>
        </article>
      )}
    </>
  );
}
