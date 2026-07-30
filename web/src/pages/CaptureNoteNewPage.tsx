import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { captureNotesApi } from '../api/captureNotes';
import styles from './CaptureNoteFormPage.module.css';

export function CaptureNoteNewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  const handleSave = async () => {
    if (!trimmedTitle || !trimmedContent) return;
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await captureNotesApi.create(trimmedTitle, trimmedContent, tags);
    navigate('/capture');
  };

  return (
    <>
      <Link to="/capture" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden />
        Balik ke Capture
      </Link>

      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Judul</span>
          <input
            className="input"
            value={title}
            placeholder="Tulis apa yang lo baca…"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Isi</span>
          <textarea
            className={`textarea ${styles.contentInput}`}
            value={content}
            placeholder="Ringkasan, link, atau kutipan yang mau lo simpen"
            onChange={(event) => setContent(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Tag (opsional, dipisah koma)</span>
          <input
            className="input"
            value={tagsInput}
            placeholder="react, design-pattern"
            onChange={(event) => setTagsInput(event.target.value)}
          />
        </label>

        <div className={styles.actions}>
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/capture')}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!trimmedTitle || !trimmedContent}
            onClick={handleSave}
          >
            Simpan
          </button>
        </div>
      </div>
    </>
  );
}
