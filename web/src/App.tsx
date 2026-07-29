import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

function Placeholder({ name }: { name: string }) {
  return <div style={{ padding: '1rem' }}>{name} page coming in a later task.</div>;
}

export function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ddd' }}>
        <Link to="/">Kanban</Link>
        <Link to="/capture">Capture</Link>
        <Link to="/learning">Learning Tracker</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Placeholder name="Kanban" />} />
        <Route path="/capture" element={<Placeholder name="Capture" />} />
        <Route path="/learning" element={<Placeholder name="Learning Tracker" />} />
      </Routes>
    </BrowserRouter>
  );
}
