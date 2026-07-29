import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { KanbanPage } from './pages/KanbanPage';
import { CapturePage } from './pages/CapturePage';
import { LearningPage } from './pages/LearningPage';

export function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ddd' }}>
        <Link to="/">Kanban</Link>
        <Link to="/capture">Capture</Link>
        <Link to="/learning">Learning Tracker</Link>
      </nav>
      <Routes>
        <Route path="/" element={<KanbanPage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/learning" element={<LearningPage />} />
      </Routes>
    </BrowserRouter>
  );
}
