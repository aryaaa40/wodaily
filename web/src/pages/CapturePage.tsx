import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import type { CaptureNote } from '../types';
import { captureNotesApi } from '../api/captureNotes';
import { PageHeader } from '../components/AppShell';
import { ConfirmModal } from '../components/ConfirmModal';
import { relativeTime } from '../lib/relativeTime';
import styles from './CapturePage.module.css';

export function CapturePage() {
  const [notes, setNotes] = useState<CaptureNote[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<CaptureNote | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const isDirty = useMemo(
    () => Boolean(title.trim() || content.trim() || tagsInput.trim()),
    [title, content, tagsInput],
  );

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

  const resetComposer = () => {
    setTitle('');
    setContent('');
    setTagsInput('');
    setExpanded(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await captureNotesApi.create(title.trim(), content.trim(), tags);
    resetComposer();
    await load();
  };

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
      <PageHeader title="Capture" />

      <div
        className={styles.composer}
        onFocus={() => setExpanded(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node) && !isDirty) {
            setExpanded(false);
          }
        }}
      >
        <input
          className="input"
          value={title}
          placeholder="Tulis apa yang lo baca…"
          onChange={(event) => setTitle(event.target.value)}
        />

        {expanded && (
          <>
            <textarea
              className="textarea"
              value={content}
              placeholder="Ringkasan, link, atau kutipan yang mau lo simpen"
              onChange={(event) => setContent(event.target.value)}
            />
            <input
              className="input"
              value={tagsInput}
              placeholder="Tag dipisah koma — misal: react, design-pattern"
              onChange={(event) => setTagsInput(event.target.value)}
            />
            <div className={styles.composerActions}>
              <button type="button" className="btn btn--ghost" onClick={resetComposer}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
              >
                Simpan
              </button>
            </div>
          </>
        )}
      </div>

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
            <article key={note.id} className={styles.note}>
              <div className={styles.noteTop}>
                <h2 className={styles.noteTitle}>{note.title}</h2>
                <button
                  type="button"
                  className={`btn btn--icon ${styles.noteDelete}`}
                  onClick={() => setNoteToDelete(note)}
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
                      onClick={() => toggleTag(tag)}
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
