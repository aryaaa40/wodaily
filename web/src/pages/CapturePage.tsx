import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import type { CaptureNote } from '../types';
import { captureNotesApi } from '../api/captureNotes';
import { PageHeader } from '../components/AppShell';
import { ConfirmModal } from '../components/ConfirmModal';
import { relativeTime } from '../lib/relativeTime';
import styles from './CapturePage.module.css';

export function CapturePage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<CaptureNote[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<CaptureNote | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Dua permintaan: satu terfilter untuk daftar yang tampil, satu tanpa filter
  // supaya daftar chip tag tetap lengkap walau sedang memfilter.
  const load = useCallback(async () => {
    const [filtered, all] = await Promise.all([
      captureNotesApi.list({
        search: debouncedSearch || undefined,
        tag: tagFilter || undefined,
      }),
      captureNotesApi.list(),
    ]);
    setNotes(filtered);
    setAllTags([...new Set(all.flatMap((note) => note.tags))].sort());
  }, [debouncedSearch, tagFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (note: CaptureNote) => {
    await captureNotesApi.remove(note.id);
    setNoteToDelete(null);
    await load();
  };

  const toggleTag = (tag: string) => {
    setTagFilter((current) => (current === tag ? '' : tag));
  };

  const isFiltering = Boolean(debouncedSearch || tagFilter);

  return (
    <>
      <PageHeader
        title="Capture"
        action={
          <button type="button" className="btn btn--primary" onClick={() => navigate('/capture/new')}>
            <Plus size={16} aria-hidden />
            Catatan baru
          </button>
        }
      />

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} aria-hidden />
          <input
            className={`input ${styles.searchInput}`}
            value={search}
            placeholder="Cari catatan…"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {allTags.length > 0 && (
          <div className={styles.tagRow}>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={
                  tagFilter === tag
                    ? `chip ${styles.tag} ${styles.tagActive}`
                    : `chip ${styles.tag}`
                }
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {isFiltering ? 'Gak ada yang cocok' : 'Belum ada catatan'}
          </p>
          <p className={styles.emptyText}>
            {isFiltering
              ? 'Coba kata kunci lain, atau lepas filter tag-nya.'
              : 'Simpen apa pun yang lo baca tapi belum kepake sekarang.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {notes.map((note) => (
            <article
              key={note.id}
              className={styles.note}
              onClick={() => navigate(`/capture/${note.id}`)}
            >
              <div className={styles.noteTop}>
                <h2 className={styles.noteTitle}>{note.title}</h2>
                <button
                  type="button"
                  className={`btn btn--icon ${styles.noteDelete}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setNoteToDelete(note);
                  }}
                  aria-label={`Hapus ${note.title}`}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>

              <p className={styles.noteContent}>{note.content}</p>

              <div className={styles.noteFooter}>
                <div className={styles.tagRow}>
                  {note.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`chip ${styles.tag}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTag(tag);
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <span className={styles.noteTime}>{relativeTime(note.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {noteToDelete && (
        <ConfirmModal
          title="Hapus catatan"
          message={`"${noteToDelete.title}" bakal dihapus permanen.`}
          confirmLabel="Hapus"
          onConfirm={() => handleDelete(noteToDelete)}
          onClose={() => setNoteToDelete(null)}
        />
      )}
    </>
  );
}
