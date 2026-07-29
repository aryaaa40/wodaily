import { useEffect, useState } from 'react';
import type { CaptureNote } from '../types';
import { captureNotesApi } from '../api/captureNotes';

export function CapturePage() {
  const [notes, setNotes] = useState<CaptureNote[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    captureNotesApi.list({ search: search || undefined, tag: tagFilter || undefined }).then(setNotes);
  }, [search, tagFilter]);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await captureNotesApi.create(title.trim(), content.trim(), tags);
    setTitle('');
    setContent('');
    setTagsInput('');
    captureNotesApi.list({ search: search || undefined, tag: tagFilter || undefined }).then(setNotes);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '400px', marginBottom: '1rem' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Catatan / link" />
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="tag1, tag2" />
        <button onClick={handleCreate}>Simpan</button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari..." />
        <input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="Filter tag" />
      </div>
      <div>
        {notes.map((note) => (
          <div key={note.id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
            <strong>{note.title}</strong>
            <p>{note.content}</p>
            <div>{note.tags.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
