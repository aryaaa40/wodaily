import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { KanbanPage } from './pages/KanbanPage';
import { CapturePage } from './pages/CapturePage';
import { LearningPage } from './pages/LearningPage';

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<KanbanPage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/learning" element={<LearningPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
