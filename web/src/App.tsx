import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { KanbanPage } from './pages/KanbanPage';
import { CapturePage } from './pages/CapturePage';
import { CaptureNoteNewPage } from './pages/CaptureNoteNewPage';
import { CaptureNoteDetailPage } from './pages/CaptureNoteDetailPage';
import { LearningPage } from './pages/LearningPage';

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<KanbanPage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/capture/new" element={<CaptureNoteNewPage />} />
          <Route path="/capture/:id" element={<CaptureNoteDetailPage />} />
          <Route path="/learning" element={<LearningPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
