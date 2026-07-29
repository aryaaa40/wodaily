import { useEffect, useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { tasksApi } from '../api/tasks';
import { apiFetch } from '../api/client';

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

export function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');

  const load = () => {
    tasksApi.list().then(setTasks);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    await tasksApi.create(title);
    setNewTitle('');
    load();
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    await tasksApi.updateStatus(task.id, status, 0);
    if (status === 'BLOCKED') {
      const problemStatement = window.prompt('Apa yang literally nge-block sekarang?');
      if (problemStatement) {
        await apiFetch('/learning-entries', {
          method: 'POST',
          body: JSON.stringify({ taskId: task.id, problemStatement }),
        });
      }
    }
    load();
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task baru" />
        <button onClick={handleCreate}>Tambah</button>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {COLUMNS.map((column) => (
          <div key={column} style={{ flex: 1 }}>
            <h3>{column}</h3>
            {tasks
              .filter((t) => t.status === column)
              .map((task) => (
                <div key={task.id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>{task.title}</div>
                  <select value={task.status} onChange={(e) => moveTask(task, e.target.value as TaskStatus)}>
                    {COLUMNS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
