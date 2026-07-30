# Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah tampilan Wodaily dari prototipe berstyle inline menjadi aplikasi yang enak dipakai harian — sidebar, kartu kanban bergaya referensi, modal menggantikan `window.prompt()`, dan gerbang anti-overthinking yang terlihat — tanpa menyentuh backend sama sekali.

**Architecture:** Seluruh warna, ukuran, dan jarak hidup sebagai variabel CSS di satu file token; komponen memakai CSS Modules dan tidak pernah menulis nilai warna mentah. Tiga komponen bersama (`AppShell`, `Modal`, `StatusPill`) plus dua modul logika murni (`lib/status.ts`, `lib/relativeTime.ts`) menopang ketiga halaman, sehingga label dan warna status tidak bisa melenceng antar halaman.

**Tech Stack:** React 19, TypeScript, React Router 7, CSS Modules (bawaan Vite), `lucide-react` untuk ikon, `Intl.RelativeTimeFormat` bawaan browser untuk waktu relatif.

## Global Constraints

- **Nol perubahan backend.** Seluruh pekerjaan hanya menyentuh `web/`. Jangan mengubah apa pun di `api/`, termasuk skema Prisma dan DTO.
- **Dependency baru hanya `lucide-react`.** Jangan menambah library styling, tanggal, state management, atau test runner.
- **Tidak boleh ada nilai warna mentah** (heksadesimal, `rgb()`, `hsl()`) di dalam `web/src/components/` maupun `web/src/pages/`. Semua warna diambil dari variabel di `web/src/styles/tokens.css`.
- **Status tidak pernah disampaikan lewat warna saja** — selalu disertai ikon dan label teks.
- **Nilai enum di database tidak berubah.** `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `PROBLEM`, `ATTEMPT`, `LEARNED` tetap apa adanya; hanya labelnya yang di-Indonesia-kan saat ditampilkan.
- **Label tampilan (baku, dipakai di semua halaman):** `TODO` → "To Do", `IN_PROGRESS` → "Dikerjain", `BLOCKED` → "Mentok", `DONE` → "Kelar", `PROBLEM` → "Masalah", `ATTEMPT` → "Mencoba", `LEARNED` → "Paham".
- **Breakpoint mobile: 900px.** Di bawah itu sidebar berubah menjadi top bar.
- **Modal selalu dirender lewat `createPortal` ke `document.body`** — kartu Kanban berada di dalam kontainer ber-`overflow`, jadi modal yang dirender di tempat akan terpotong.
- **Tidak dikerjakan:** dark mode, drag-and-drop, animasi selain transisi hover, toast/notifikasi, badge hitungan di sidebar.
- Tidak ada unit test baru. Verifikasi memakai `npm run build` (type check) dan pemeriksaan manual di browser, sesuai keputusan di spec bagian 12.

## Peta File

| File | Tanggung jawab |
|---|---|
| `web/src/styles/tokens.css` | Semua variabel CSS: warna, tipografi, spacing, radius, shadow, layout |
| `web/src/styles/global.css` | Reset, gaya `body`, dan primitif app-wide (`.btn`, `.input`, `.textarea`, `.chip`) |
| `web/src/lib/status.ts` | Satu-satunya sumber pemetaan enum → label + nada warna + ikon |
| `web/src/lib/relativeTime.ts` | `Date`/ISO string → "baru saja", "2 hari yang lalu" |
| `web/src/components/StatusPill.tsx` | Pil status kecil (ikon + label) berwarna sesuai nada |
| `web/src/components/AppShell.tsx` | Sidebar + area utama + `PageHeader` |
| `web/src/components/Modal.tsx` | Shell modal generik (portal, Esc, fokus, ARIA) |
| `web/src/components/TextPromptModal.tsx` | Pembungkus `Modal` untuk kasus satu textarea + blok konteks |
| `web/src/components/ConfirmModal.tsx` | Modal konfirmasi dengan tombol utama merah |
| `web/src/pages/KanbanPage.tsx` | Board, kartu, dan seluruh dialognya |
| `web/src/pages/CapturePage.tsx` | Quick add, filter tag & pencarian, grid catatan |
| `web/src/pages/LearningPage.tsx` | Kartu entry, stepper, blok riset terkunci, dialog aksi |

Dihapus: `web/src/index.css`, `web/public/icons.svg`. Diubah: `web/index.html`, `web/src/main.tsx`, `web/src/App.tsx`, `web/public/favicon.svg`, `web/src/api/learningEntries.ts`.

---

## Task 1: Fondasi — dependency, token, CSS global, bersih-bersih template Vite

**Files:**
- Create: `web/src/styles/tokens.css`
- Create: `web/src/styles/global.css`
- Delete: `web/src/index.css`, `web/public/icons.svg`
- Modify: `web/src/main.tsx`, `web/index.html`, `web/public/favicon.svg`

**Interfaces:**
- Produces: seluruh variabel CSS di bagian "Design Tokens" dan kelas global `.btn`, `.btn--primary`, `.btn--ghost`, `.btn--outline`, `.btn--danger`, `.btn--icon`, `.input`, `.textarea`, `.chip` — dipakai oleh setiap task berikutnya lewat `className="btn btn--primary"` (kelas global, bukan CSS Module).

- [ ] **Step 1: Pasang lucide-react**

```bash
npm install lucide-react -w web
```

- [ ] **Step 2: Buat file token**

`web/src/styles/tokens.css`:
```css
:root {
  /* Netral */
  --canvas: #fafafa;
  --surface: #ffffff;
  --surface-sunken: #f4f4f5;
  --surface-subtle: #f9f9fa;
  --border: #e4e4e7;
  --border-subtle: #efeff1;
  --border-strong: #d4d4d8;
  --text-primary: #18181b;
  --text-secondary: #71717a;
  --text-tertiary: #a1a1aa;
  --action: #18181b;
  --action-hover: #27272a;
  --action-fg: #ffffff;
  --danger: #dc2626;
  --danger-hover: #b91c1c;
  --danger-fg: #ffffff;

  /* Status */
  --status-idle-fg: #52525b;
  --status-idle-bg: #f4f4f5;
  --status-idle-dot: #a1a1aa;
  --status-active-fg: #b45309;
  --status-active-bg: #fef3c7;
  --status-active-dot: #f59e0b;
  --status-stuck-fg: #be123c;
  --status-stuck-bg: #ffe4e6;
  --status-stuck-dot: #f43f5e;
  --status-done-fg: #047857;
  --status-done-bg: #d1fae5;
  --status-done-dot: #10b981;

  /* Tipografi */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 20px;
  --text-2xl: 28px;
  --leading-tight: 1.25;
  --leading-normal: 1.5;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 14px;
  --radius-2xl: 16px;
  --radius-full: 999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.18);

  /* Layout */
  --sidebar-width: 240px;
}
```

- [ ] **Step 3: Buat CSS global**

`web/src/styles/global.css`:
```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-md);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background: var(--canvas);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1,
h2,
h3,
p {
  margin: 0;
}

button {
  font: inherit;
  color: inherit;
}

input,
textarea,
select {
  font: inherit;
}

:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 2px;
}

/* --- Primitif --- */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 34px;
  padding: 0 var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  font-size: var(--text-md);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--action);
  color: var(--action-fg);
}
.btn--primary:hover:not(:disabled) {
  background: var(--action-hover);
}

.btn--ghost {
  color: var(--text-secondary);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--surface-subtle);
  color: var(--text-primary);
}

.btn--outline {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text-primary);
}
.btn--outline:hover:not(:disabled) {
  background: var(--surface-subtle);
  border-color: var(--border-strong);
}

.btn--danger {
  background: var(--danger);
  color: var(--danger-fg);
}
.btn--danger:hover:not(:disabled) {
  background: var(--danger-hover);
}

.btn--icon {
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--text-tertiary);
}
.btn--icon:hover:not(:disabled) {
  background: var(--surface-sunken);
  color: var(--text-primary);
}

.input,
.textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-primary);
  font-size: var(--text-md);
}

.input::placeholder,
.textarea::placeholder {
  color: var(--text-tertiary);
}

.textarea {
  min-height: 96px;
  line-height: var(--leading-normal);
  resize: vertical;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
}
```

- [ ] **Step 4: Ganti import CSS di entry point**

`web/src/main.tsx` — ganti baris `import './index.css'` menjadi dua import berikut (urutan penting: token harus dimuat sebelum yang memakainya):
```tsx
import './styles/tokens.css'
import './styles/global.css'
```

- [ ] **Step 5: Hapus sisa template Vite**

```bash
rm web/src/index.css web/public/icons.svg
```

- [ ] **Step 6: Perbaiki judul halaman dan favicon**

Di `web/index.html`, ubah `<title>web</title>` menjadi:
```html
<title>Wodaily</title>
```

Ganti seluruh isi `web/public/favicon.svg` dengan:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="#18181b" stroke-width="2.5" stroke-linecap="round">
  <path d="M12 6v12M17.196 9 6.804 15M6.804 9l10.392 6"/>
</svg>
```

- [ ] **Step 7: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses tanpa error TypeScript. (Kalau gagal dengan "Cannot find module './index.css'", berarti Step 4 belum diterapkan.)

- [ ] **Step 8: Verifikasi tampilan**

Jalankan `npm run start:dev -w api` dan `npm run dev -w web`, lalu buka `http://localhost:5173/`.
Diharapkan: halaman **tidak lagi rata tengah dan tidak lagi terkunci selebar 1126px**, latar jadi abu sangat muda, teks memakai font sistem berukuran 14px. Halamannya masih berantakan karena isinya belum digarap — itu wajar pada tahap ini. Yang penting tidak ada error di console.

- [ ] **Step 9: Commit**

```bash
git add web/src/styles web/src/main.tsx web/index.html web/public web/package.json package-lock.json
git add -u web/src/index.css
git commit -m "Add design tokens and global styles, remove Vite template CSS"
```

---

## Task 2: Sistem status — pemetaan enum, waktu relatif, dan StatusPill

**Files:**
- Create: `web/src/lib/status.ts`
- Create: `web/src/lib/relativeTime.ts`
- Create: `web/src/components/StatusPill.tsx`
- Create: `web/src/components/StatusPill.module.css`

**Interfaces:**
- Consumes: variabel `--status-*` dari Task 1.
- Produces:
  - `type StatusTone = 'idle' | 'active' | 'stuck' | 'done'`
  - `interface StatusMeta { label: string; tone: StatusTone; Icon: LucideIcon }`
  - `TASK_STATUS_ORDER: TaskStatus[]` dan `LEARNING_STATUS_ORDER: LearningEntryStatus[]`
  - `taskStatusMeta(status: TaskStatus): StatusMeta`
  - `learningStatusMeta(status: LearningEntryStatus): StatusMeta`
  - `relativeTime(iso: string, now?: Date): string`
  - `<StatusPill meta={StatusMeta} size?: 'sm' | 'md' />`

- [ ] **Step 1: Buat pemetaan status**

`web/src/lib/status.ts`:
```ts
import {
  Circle,
  CircleCheck,
  CircleDashed,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { LearningEntryStatus, TaskStatus } from '../types';

export type StatusTone = 'idle' | 'active' | 'stuck' | 'done';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  Icon: LucideIcon;
}

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
];

export const LEARNING_STATUS_ORDER: LearningEntryStatus[] = [
  'PROBLEM',
  'ATTEMPT',
  'LEARNED',
];

const TASK_STATUS: Record<TaskStatus, StatusMeta> = {
  TODO: { label: 'To Do', tone: 'idle', Icon: Circle },
  IN_PROGRESS: { label: 'Dikerjain', tone: 'active', Icon: CircleDashed },
  BLOCKED: { label: 'Mentok', tone: 'stuck', Icon: TriangleAlert },
  DONE: { label: 'Kelar', tone: 'done', Icon: CircleCheck },
};

const LEARNING_STATUS: Record<LearningEntryStatus, StatusMeta> = {
  PROBLEM: { label: 'Masalah', tone: 'stuck', Icon: TriangleAlert },
  ATTEMPT: { label: 'Mencoba', tone: 'active', Icon: CircleDashed },
  LEARNED: { label: 'Paham', tone: 'done', Icon: CircleCheck },
};

export function taskStatusMeta(status: TaskStatus): StatusMeta {
  return TASK_STATUS[status];
}

export function learningStatusMeta(status: LearningEntryStatus): StatusMeta {
  return LEARNING_STATUS[status];
}
```

- [ ] **Step 2: Buat util waktu relatif**

`web/src/lib/relativeTime.ts`:
```ts
const formatter = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Mengubah ISO timestamp menjadi teks relatif berbahasa Indonesia.
 * Selisih di bawah satu menit dianggap "baru saja".
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);

  if (Number.isNaN(diff)) return '';
  if (abs < MINUTE) return 'baru saja';
  if (abs < HOUR) return formatter.format(Math.round(diff / MINUTE), 'minute');
  if (abs < DAY) return formatter.format(Math.round(diff / HOUR), 'hour');
  if (abs < WEEK) return formatter.format(Math.round(diff / DAY), 'day');
  if (abs < MONTH) return formatter.format(Math.round(diff / WEEK), 'week');
  if (abs < YEAR) return formatter.format(Math.round(diff / MONTH), 'month');
  return formatter.format(Math.round(diff / YEAR), 'year');
}
```

- [ ] **Step 3: Buat komponen StatusPill**

`web/src/components/StatusPill.tsx`:
```tsx
import type { StatusMeta } from '../lib/status';
import styles from './StatusPill.module.css';

interface StatusPillProps {
  meta: StatusMeta;
  size?: 'sm' | 'md';
}

export function StatusPill({ meta, size = 'md' }: StatusPillProps) {
  const { label, tone, Icon } = meta;
  return (
    <span className={`${styles.pill} ${styles[tone]} ${styles[size]}`}>
      <Icon size={size === 'sm' ? 12 : 14} aria-hidden />
      {label}
    </span>
  );
}
```

`web/src/components/StatusPill.module.css`:
```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-sm);
  font-weight: 500;
  white-space: nowrap;
}

.sm {
  padding: 2px var(--space-2);
  font-size: var(--text-sm);
}

.md {
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-base);
}

.idle {
  background: var(--status-idle-bg);
  color: var(--status-idle-fg);
}

.active {
  background: var(--status-active-bg);
  color: var(--status-active-fg);
}

.stuck {
  background: var(--status-stuck-bg);
  color: var(--status-stuck-fg);
}

.done {
  background: var(--status-done-bg);
  color: var(--status-done-fg);
}
```

- [ ] **Step 4: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses. Ini sekaligus membuktikan `LucideIcon` dan tipe enum-nya cocok — belum ada yang memakai komponennya, jadi type check adalah verifikasinya.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib web/src/components
git commit -m "Add status mapping, relative time helper, and StatusPill"
```

---

## Task 3: AppShell — sidebar, area utama, dan header halaman

**Files:**
- Create: `web/src/components/AppShell.tsx`
- Create: `web/src/components/AppShell.module.css`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: kelas global `.btn` dari Task 1.
- Produces:
  - `<AppShell>{children}</AppShell>` — kerangka sidebar + area utama
  - `<PageHeader title="…" action={<button …/>} />` — dipakai di ketiga halaman

- [ ] **Step 1: Buat komponen AppShell**

`web/src/components/AppShell.tsx`:
```tsx
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Asterisk, Inbox, LayoutGrid, Lightbulb } from 'lucide-react';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Kanban', Icon: LayoutGrid, end: true },
  { to: '/capture', label: 'Capture', Icon: Inbox, end: false },
  { to: '/learning', label: 'Learning', Icon: Lightbulb, end: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Asterisk size={20} strokeWidth={2.5} aria-hidden />
          <span className={styles.brandName}>Wodaily</span>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
              }
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      {action}
    </header>
  );
}
```

- [ ] **Step 2: Buat style AppShell**

`web/src/components/AppShell.module.css`:
```css
.shell {
  display: flex;
  min-height: 100%;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: var(--sidebar-width);
  flex-shrink: 0;
  padding: var(--space-5) var(--space-3);
  background: var(--surface);
  border-right: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-2);
  color: var(--text-primary);
}

.brandName {
  font-size: var(--text-md);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.navItem {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-2);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-md);
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

.navItem:hover {
  background: var(--surface-subtle);
  color: var(--text-primary);
}

.navItemActive,
.navItemActive:hover {
  background: var(--surface-sunken);
  color: var(--text-primary);
  font-weight: 600;
}

.main {
  flex: 1;
  min-width: 0;
  padding: var(--space-8);
}

.pageHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.pageTitle {
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: var(--leading-tight);
}

@media (max-width: 900px) {
  .shell {
    flex-direction: column;
  }

  .sidebar {
    position: sticky;
    top: 0;
    z-index: 10;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .nav {
    flex-direction: row;
    gap: var(--space-1);
  }

  .navItem span {
    display: none;
  }

  .navItem {
    padding: var(--space-2);
  }

  .main {
    padding: var(--space-4);
  }
}
```

- [ ] **Step 3: Pasang AppShell di App.tsx**

Ganti seluruh isi `web/src/App.tsx` dengan:
```tsx
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
```

- [ ] **Step 4: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses.

- [ ] **Step 5: Verifikasi tampilan**

Dengan kedua dev server berjalan, buka `http://localhost:5173/`.
Diharapkan: sidebar putih selebar 240px di kiri berisi "Wodaily" dan tiga item nav; item yang sedang aktif punya latar abu muda. Klik tiap nav — halaman berganti dan item aktif ikut berpindah. Isi halamannya masih berstyle lama (inline) — itu wajar, digarap di task berikutnya.

Lalu perkecil jendela browser sampai di bawah 900px: sidebar berubah jadi bar horizontal di atas, label teks nav hilang menyisakan ikon.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/AppShell.tsx web/src/components/AppShell.module.css web/src/App.tsx
git commit -m "Add AppShell with sidebar navigation and responsive top bar"
```

---

## Task 4: Kanban — kolom dan kartu

Task ini hanya menggarap tampilan. Interaksinya (tombol tambah, hapus, alur Mentok) masih memakai `window.prompt()` seperti sekarang dan baru diganti modal di Task 5.

**Files:**
- Modify: `web/src/pages/KanbanPage.tsx`
- Create: `web/src/pages/KanbanPage.module.css`

**Interfaces:**
- Consumes: `PageHeader` (Task 3), `StatusPill` (Task 2), `taskStatusMeta`, `learningStatusMeta`, `TASK_STATUS_ORDER`, `relativeTime` (Task 2), kelas global `.btn` (Task 1).
- Produces: tampilan board final. Task 5 hanya mengganti isi handler-nya, bukan struktur markup-nya.

- [ ] **Step 1: Tulis ulang KanbanPage**

Ganti seluruh isi `web/src/pages/KanbanPage.tsx` dengan:
```tsx
import { useCallback, useEffect, useState } from 'react';
import { Clock, EllipsisVertical, Plus, Trash2 } from 'lucide-react';
import type { LearningEntry, Task, TaskStatus } from '../types';
import { tasksApi } from '../api/tasks';
import { learningEntriesApi } from '../api/learningEntries';
import { apiFetch } from '../api/client';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import {
  TASK_STATUS_ORDER,
  learningStatusMeta,
  taskStatusMeta,
} from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './KanbanPage.module.css';

export function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entriesByTask, setEntriesByTask] = useState<Record<string, LearningEntry[]>>({});

  const load = useCallback(async () => {
    const [taskList, entries] = await Promise.all([
      tasksApi.list(),
      learningEntriesApi.listAll(),
    ]);
    const grouped: Record<string, LearningEntry[]> = {};
    for (const entry of entries) {
      (grouped[entry.taskId] ??= []).push(entry);
    }
    setTasks(taskList);
    setEntriesByTask(grouped);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    const title = window.prompt('Judul task baru');
    if (!title?.trim()) return;
    await tasksApi.create(title.trim());
    await load();
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Hapus "${task.title}"?`)) return;
    await tasksApi.remove(task.id);
    await load();
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    await tasksApi.updateStatus(task.id, status, 0);
    if (status === 'BLOCKED') {
      const problemStatement = window.prompt('Apa yang literally nge-block sekarang?');
      if (problemStatement?.trim()) {
        await apiFetch('/learning-entries', {
          method: 'POST',
          body: JSON.stringify({ taskId: task.id, problemStatement: problemStatement.trim() }),
        });
      }
    }
    await load();
  };

  return (
    <>
      <PageHeader
        title="Kanban"
        action={
          <button type="button" className="btn btn--primary" onClick={handleCreate}>
            <Plus size={16} aria-hidden />
            Task baru
          </button>
        }
      />

      {tasks.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Board masih kosong</p>
          <p className={styles.emptyText}>
            Bikin task pertama lo buat mulai ngatur kerjaan hari ini.
          </p>
        </div>
      ) : (
        <div className={styles.board}>
          {TASK_STATUS_ORDER.map((status) => {
            const meta = taskStatusMeta(status);
            const columnTasks = tasks.filter((task) => task.status === status);
            return (
              <section key={status} className={styles.column}>
                <header className={styles.columnHeader}>
                  <span className={`${styles.columnIcon} ${styles[meta.tone]}`}>
                    <meta.Icon size={16} aria-hidden />
                  </span>
                  <h2 className={styles.columnTitle}>{meta.label}</h2>
                  <span className={styles.columnCount}>{columnTasks.length}</span>
                </header>

                <div className={styles.cards}>
                  {columnTasks.map((task) => {
                    const latestEntry = entriesByTask[task.id]?.[0];
                    return (
                      <article key={task.id} className={styles.card}>
                        <div className={styles.cardTop}>
                          <h3 className={styles.cardTitle}>{task.title}</h3>
                          <div className={styles.cardActions}>
                            <button
                              type="button"
                              className="btn btn--icon"
                              onClick={() => handleDelete(task)}
                              aria-label={`Hapus ${task.title}`}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                            <span className={styles.moveWrap}>
                              <EllipsisVertical size={14} aria-hidden />
                              <select
                                className={styles.moveSelect}
                                value={task.status}
                                onChange={(event) =>
                                  moveTask(task, event.target.value as TaskStatus)
                                }
                                aria-label={`Pindahkan ${task.title}`}
                              >
                                {TASK_STATUS_ORDER.map((option) => (
                                  <option key={option} value={option}>
                                    {taskStatusMeta(option).label}
                                  </option>
                                ))}
                              </select>
                            </span>
                          </div>
                        </div>

                        {task.description && (
                          <p className={styles.cardDesc}>{task.description}</p>
                        )}

                        <div className={styles.divider} />

                        <div className={styles.cardFooter}>
                          <span className={styles.meta}>
                            <Clock size={12} aria-hidden />
                            {relativeTime(task.updatedAt)}
                          </span>
                          {latestEntry && (
                            <StatusPill meta={learningStatusMeta(latestEntry.status)} size="sm" />
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Tulis style Kanban**

`web/src/pages/KanbanPage.module.css`:
```css
.board {
  display: grid;
  grid-template-columns: repeat(4, minmax(240px, 1fr));
  gap: var(--space-4);
  align-items: start;
}

.column {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-xl);
}

.columnHeader {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-1);
}

.columnIcon {
  display: inline-flex;
}

.columnTitle {
  flex: 1;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.columnCount {
  min-width: 20px;
  text-align: center;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.idle {
  color: var(--status-idle-dot);
}
.active {
  color: var(--status-active-dot);
}
.stuck {
  color: var(--status-stuck-dot);
}
.done {
  color: var(--status-done-dot);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card {
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 140ms ease,
    border-color 140ms ease;
}

.card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.cardTop {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.cardTitle {
  flex: 1;
  font-size: var(--text-md);
  font-weight: 600;
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

.cardActions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 120ms ease;
}

.card:hover .cardActions,
.card:focus-within .cardActions {
  opacity: 1;
}

@media (hover: none) {
  .cardActions {
    opacity: 1;
  }
}

.moveWrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
}

.moveWrap:hover {
  background: var(--surface-sunken);
  color: var(--text-primary);
}

.moveSelect {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.cardDesc {
  margin-top: var(--space-2);
  font-size: var(--text-base);
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.divider {
  height: 1px;
  margin: var(--space-3) 0 var(--space-2);
  background: var(--border-subtle);
}

.cardFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.meta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-8);
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
  text-align: center;
}

.emptyTitle {
  font-size: var(--text-lg);
  font-weight: 600;
}

.emptyText {
  font-size: var(--text-md);
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .board {
    grid-auto-flow: column;
    grid-auto-columns: 82%;
    grid-template-columns: none;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: var(--space-2);
  }

  .column {
    scroll-snap-align: start;
  }
}
```

- [ ] **Step 3: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses.

- [ ] **Step 4: Verifikasi tampilan**

Buka `http://localhost:5173/`. Diharapkan:
1. Empat kolom berlatar abu muda dengan ikon berwarna: To Do (abu), Dikerjain (amber), Mentok (rose), Kelar (hijau), masing-masing menampilkan jumlah kartunya.
2. Kartu putih dengan judul tebal; arahkan kursor ke kartu — shadow-nya naik dan dua tombol (tong sampah + titik tiga) muncul di kanan atas.
3. Bagian bawah kartu menampilkan waktu relatif berbahasa Indonesia, misalnya "kemarin" atau "2 hari yang lalu".
4. Kartu yang punya learning entry menampilkan pil berwarna di kanan bawah ("Masalah" rose / "Mencoba" amber / "Paham" hijau).
5. Klik ikon titik tiga — menu native muncul berisi empat label Indonesia; memilih salah satunya memindahkan kartu.
6. Perkecil jendela di bawah 900px — kolom bisa digeser horizontal dan berhenti rapi di tiap kolom.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/KanbanPage.tsx web/src/pages/KanbanPage.module.css
git commit -m "Restyle Kanban board with column containers and card anatomy"
```

---

## Task 5: Modal dan seluruh dialog Kanban

**Files:**
- Create: `web/src/components/Modal.tsx`
- Create: `web/src/components/Modal.module.css`
- Create: `web/src/components/TextPromptModal.tsx`
- Create: `web/src/components/ConfirmModal.tsx`
- Modify: `web/src/api/learningEntries.ts`
- Modify: `web/src/pages/KanbanPage.tsx`
- Modify: `web/src/pages/KanbanPage.module.css`

**Interfaces:**
- Consumes: kelas global `.btn`, `.input`, `.textarea` (Task 1).
- Produces:
  - `<Modal title onClose footer wide?>{children}</Modal>`
  - `<TextPromptModal title label placeholder? defaultValue? context? submitLabel onSubmit onClose />` dengan `context?: { label: string; value: string }[]`
  - `<ConfirmModal title message confirmLabel onConfirm onClose />`
  - `learningEntriesApi.create(taskId: string, problemStatement: string): Promise<LearningEntry>`

- [ ] **Step 1: Buat shell Modal**

`web/src/components/Modal.tsx`:
```tsx
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, footer, children, wide }: ModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    const target =
      bodyRef.current?.querySelector<HTMLElement>('input, textarea') ??
      footerRef.current?.querySelector<HTMLElement>('button');
    target?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      opener?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={wide ? `${styles.panel} ${styles.panelWide}` : styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className="btn btn--icon"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        <div ref={bodyRef} className={styles.body}>
          {children}
        </div>
        <div ref={footerRef} className={styles.footer}>
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}
```

Catatan: penutupan lewat overlay memakai `onMouseDown` dan bukan `onClick` supaya modal tidak ikut tertutup ketika pengguna menyeleksi teks di dalam panel lalu melepas kursor di luar panel.

- [ ] **Step 2: Buat style Modal**

`web/src/components/Modal.module.css`:
```css
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgba(0, 0, 0, 0.45);
}

.panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: var(--surface);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.panelWide {
  max-width: 560px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);
}

.title {
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4) var(--space-4);
  overflow-y: auto;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.fieldLabel {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-secondary);
}

.context {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-md);
}

.contextLabel {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.contextValue {
  margin-top: var(--space-1);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.message {
  font-size: var(--text-md);
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Buat TextPromptModal**

`web/src/components/TextPromptModal.tsx`:
```tsx
import { useState } from 'react';
import { Modal } from './Modal';
import styles from './Modal.module.css';

interface TextPromptModalProps {
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  context?: { label: string; value: string }[];
  submitLabel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function TextPromptModal({
  title,
  label,
  placeholder,
  defaultValue = '',
  context,
  submitLabel,
  onSubmit,
  onClose,
}: TextPromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const trimmed = value.trim();

  const submit = () => {
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide={Boolean(context?.length)}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={submit}
            disabled={!trimmed}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      {context?.length ? (
        <div className={styles.context}>
          {context.map((item) => (
            <div key={item.label}>
              <span className={styles.contextLabel}>{item.label}</span>
              <p className={styles.contextValue}>{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{label}</span>
        <textarea
          className="textarea"
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit();
          }}
        />
      </label>
    </Modal>
  );
}
```

- [ ] **Step 4: Buat ConfirmModal**

`web/src/components/ConfirmModal.tsx`:
```tsx
import { Modal } from './Modal';
import styles from './Modal.module.css';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  );
}
```

- [ ] **Step 5: Tambahkan `create` ke API learning entries**

Di `web/src/api/learningEntries.ts`, tambahkan method `create` di dalam objek `learningEntriesApi`, sebelum `listAll`:
```ts
  create: (taskId: string, problemStatement: string) =>
    apiFetch<LearningEntry>('/learning-entries', {
      method: 'POST',
      body: JSON.stringify({ taskId, problemStatement }),
    }),
```

- [ ] **Step 6: Pakai modal di KanbanPage**

Di `web/src/pages/KanbanPage.tsx`:

Ganti blok import bagian atas menjadi:
```tsx
import { useCallback, useEffect, useState } from 'react';
import { Clock, EllipsisVertical, Plus, Trash2 } from 'lucide-react';
import type { LearningEntry, Task, TaskStatus } from '../types';
import { tasksApi } from '../api/tasks';
import { learningEntriesApi } from '../api/learningEntries';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { TextPromptModal } from '../components/TextPromptModal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  TASK_STATUS_ORDER,
  learningStatusMeta,
  taskStatusMeta,
} from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './KanbanPage.module.css';
```
(`apiFetch` tidak lagi diimpor karena sudah digantikan `learningEntriesApi.create`.)

Tambahkan tipe dialog dan komponen modal buat-task tepat di bawah blok import:
```tsx
type Dialog =
  | { kind: 'create' }
  | { kind: 'blocked'; task: Task }
  | { kind: 'delete'; task: Task }
  | null;

function CreateTaskModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, description?: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const trimmedTitle = title.trim();

  return (
    <Modal
      title="Task baru"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!trimmedTitle}
            onClick={() => onCreate(trimmedTitle, description.trim() || undefined)}
          >
            Simpan
          </button>
        </>
      }
    >
      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Judul</span>
        <input
          className="input"
          value={title}
          placeholder="Mau ngerjain apa?"
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Deskripsi (opsional)</span>
        <textarea
          className="textarea"
          value={description}
          placeholder="Detail, konteks, atau catatan kecil"
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
    </Modal>
  );
}
```

Di dalam komponen `KanbanPage`, tambahkan state dialog setelah state `entriesByTask`:
```tsx
  const [dialog, setDialog] = useState<Dialog>(null);
```

Ganti ketiga handler (`handleCreate`, `handleDelete`, `moveTask`) menjadi:
```tsx
  const handleCreate = async (title: string, description?: string) => {
    await tasksApi.create(title, description);
    setDialog(null);
    await load();
  };

  const handleDelete = async (task: Task) => {
    await tasksApi.remove(task.id);
    setDialog(null);
    await load();
  };

  const handleBlockedReason = async (task: Task, problemStatement: string) => {
    await learningEntriesApi.create(task.id, problemStatement);
    setDialog(null);
    await load();
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    await tasksApi.updateStatus(task.id, status, 0);
    await load();
    if (status === 'BLOCKED') setDialog({ kind: 'blocked', task });
  };
```

Ubah tombol di `PageHeader` agar membuka dialog:
```tsx
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setDialog({ kind: 'create' })}
          >
            <Plus size={16} aria-hidden />
            Task baru
          </button>
```

Ubah tombol hapus di dalam kartu:
```tsx
                            <button
                              type="button"
                              className="btn btn--icon"
                              onClick={() => setDialog({ kind: 'delete', task })}
                              aria-label={`Hapus ${task.title}`}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
```

Terakhir, sisipkan render dialog tepat sebelum penutup `</>` di akhir `return`:
```tsx
      {dialog?.kind === 'create' && (
        <CreateTaskModal onClose={() => setDialog(null)} onCreate={handleCreate} />
      )}

      {dialog?.kind === 'blocked' && (
        <TextPromptModal
          title="Kenapa mentok?"
          label="Apa yang literally nge-block sekarang?"
          placeholder="Tulis hambatan konkretnya, bukan topik umum"
          submitLabel="Simpan"
          onSubmit={(value) => handleBlockedReason(dialog.task, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmModal
          title="Hapus task"
          message={`"${dialog.task.title}" bakal dihapus permanen, termasuk semua learning entry yang lahir dari task ini.`}
          confirmLabel="Hapus"
          onConfirm={() => handleDelete(dialog.task)}
          onClose={() => setDialog(null)}
        />
      )}
```

- [ ] **Step 7: Tambahkan style field modal di Kanban**

Tambahkan di akhir `web/src/pages/KanbanPage.module.css`:
```css
.modalField {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.modalLabel {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-secondary);
}
```

- [ ] **Step 8: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses. Kalau muncul error "'apiFetch' is declared but its value is never read", berarti import lamanya belum dihapus di Step 6.

- [ ] **Step 9: Verifikasi tampilan**

Buka `http://localhost:5173/` dan periksa satu per satu:
1. Klik "Task baru" — modal muncul di tengah dengan overlay gelap, kursor sudah berada di field judul. Isi judul **dan** deskripsi, simpan; kartu baru muncul di kolom To Do lengkap dengan deskripsinya.
2. Buka modal lagi, tekan `Esc` — modal tertutup. Buka lagi, klik area gelap di luar panel — tertutup juga.
3. Pindahkan sebuah kartu ke "Mentok" — kartu berpindah kolom, lalu modal "Kenapa mentok?" muncul. Isi dan simpan; pil "Masalah" berwarna rose muncul di kartu tersebut.
4. Ulangi, tapi kali ini tekan Batal — kartu tetap pindah ke Mentok tanpa learning entry (tidak ada pil di kartunya). Ini memang perilaku yang diinginkan.
5. Klik ikon tong sampah pada sebuah kartu — modal konfirmasi muncul dengan tombol merah dan peringatan soal learning entry yang ikut terhapus. Batalkan sekali, lalu ulangi dan konfirmasi; kartunya hilang.
6. Buang task-task sisa uji coba (`Try the API`, `Gate check`, `Generalize check`, `Investigate caching bug`, `Test kanban flow`) supaya board bersih.

- [ ] **Step 10: Commit**

```bash
git add web/src/components/Modal.tsx web/src/components/Modal.module.css \
  web/src/components/TextPromptModal.tsx web/src/components/ConfirmModal.tsx \
  web/src/api/learningEntries.ts web/src/pages/KanbanPage.tsx web/src/pages/KanbanPage.module.css
git commit -m "Replace browser prompts with modal dialogs across Kanban"
```

---

## Task 6: Capture — quick add, filter tag berupa chip, grid catatan

**Files:**
- Modify: `web/src/pages/CapturePage.tsx`
- Create: `web/src/pages/CapturePage.module.css`

**Interfaces:**
- Consumes: `PageHeader` (Task 3), `ConfirmModal` (Task 5), `relativeTime` (Task 2), kelas global (Task 1).
- Produces: halaman Capture final.

- [ ] **Step 1: Tulis ulang CapturePage**

Ganti seluruh isi `web/src/pages/CapturePage.tsx` dengan:
```tsx
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
```

- [ ] **Step 2: Tulis style Capture**

`web/src/pages/CapturePage.module.css`:
```css
.composer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.composerActions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.searchWrap {
  position: relative;
  max-width: 360px;
}

.searchIcon {
  position: absolute;
  top: 50%;
  left: var(--space-3);
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

/* Ditulis sebagai dua kelas supaya spesifisitasnya (0,2,0) mengalahkan
   shorthand `padding` milik kelas global `.input` (0,1,0), berapa pun
   urutan injeksi CSS-nya. */
.searchWrap .searchInput {
  padding-left: calc(var(--space-3) * 2 + 16px);
}

.tagRow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  cursor: pointer;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

.tag:hover {
  color: var(--text-primary);
}

/* Dua kelas (0,2,0) supaya menang atas kelas global `.chip` (0,1,0)
   tanpa bergantung urutan injeksi CSS. */
.tag.tagActive {
  background: var(--action);
  color: var(--action-fg);
}

.tag.tagActive:hover {
  color: var(--action-fg);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  align-items: start;
}

.note {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 140ms ease,
    border-color 140ms ease;
}

.note:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.noteTop {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.noteTitle {
  flex: 1;
  font-size: var(--text-md);
  font-weight: 600;
  line-height: var(--leading-tight);
}

.noteDelete {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 120ms ease;
}

.note:hover .noteDelete,
.note:focus-within .noteDelete {
  opacity: 1;
}

@media (hover: none) {
  .noteDelete {
    opacity: 1;
  }
}

.noteContent {
  font-size: var(--text-base);
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: pre-wrap;
}

.noteFooter {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

.noteTime {
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-8);
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
  text-align: center;
}

.emptyTitle {
  font-size: var(--text-lg);
  font-weight: 600;
}

.emptyText {
  font-size: var(--text-md);
  color: var(--text-secondary);
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses.

- [ ] **Step 4: Verifikasi tampilan**

Buka `http://localhost:5173/capture` dan periksa:
1. Di atas hanya ada satu input "Tulis apa yang lo baca…". Klik input itu — form melebar memunculkan textarea, input tag, dan tombol Simpan.
2. Tanpa mengetik apa pun, klik di luar form — form menyempit lagi. Ulangi, tapi ketik sesuatu dulu lalu klik di luar — form **tetap terbuka** dan tulisannya tidak hilang.
3. Simpan sebuah catatan dengan dua tag (misal `react, design-pattern`). Kartunya muncul, dan kedua tag muncul sebagai chip di baris filter atas.
4. Klik chip `react` di baris filter — chip jadi hitam dan daftar tersaring. Klik lagi — filter lepas.
5. Klik chip tag di dalam kartu — hasilnya sama, ikut memfilter.
6. Ketik kata yang ada di isi catatan pada kolom pencarian — daftar menyaring setelah jeda singkat. Ketik kata yang tidak ada — muncul empty state "Gak ada yang cocok".
7. Arahkan kursor ke kartu — ikon tong sampah muncul; hapus salah satu catatan lewat modal konfirmasi.
8. Perkecil jendela — grid turun jadi 2 kolom lalu 1 kolom.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/CapturePage.tsx web/src/pages/CapturePage.module.css
git commit -m "Restyle Capture with quick-add composer and clickable tag filters"
```

---

## Task 7: Learning Tracker — kartu, stepper, task asal, dan filter

Task ini menggarap tampilan dan pemuatan data. Blok riset terkunci serta seluruh aksi berbasis modal dikerjakan di Task 8; untuk sementara tombol aksinya masih memakai `window.prompt()`.

**Files:**
- Modify: `web/src/pages/LearningPage.tsx`
- Create: `web/src/pages/LearningPage.module.css`

**Interfaces:**
- Consumes: `PageHeader` (Task 3), `StatusPill`, `learningStatusMeta`, `LEARNING_STATUS_ORDER`, `relativeTime` (Task 2), `tasksApi` (sudah ada), kelas global (Task 1).
- Produces: struktur kartu learning entry yang dipakai Task 8.

- [ ] **Step 1: Tulis ulang LearningPage**

Ganti seluruh isi `web/src/pages/LearningPage.tsx` dengan:
```tsx
import { useCallback, useEffect, useState } from 'react';
import type { LearningEntry } from '../types';
import { learningEntriesApi } from '../api/learningEntries';
import { tasksApi } from '../api/tasks';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import { LEARNING_STATUS_ORDER, learningStatusMeta } from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './LearningPage.module.css';

type Filter = 'open' | 'all' | 'done';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Belum kelar' },
  { value: 'all', label: 'Semua' },
  { value: 'done', label: 'Kelar' },
];

export function LearningPage() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('open');

  const load = useCallback(async () => {
    const [entryList, taskList] = await Promise.all([
      learningEntriesApi.listAll(),
      tasksApi.list(),
    ]);
    setEntries(entryList);
    setTaskTitles(Object.fromEntries(taskList.map((task) => [task.id, task.title])));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logAttempt = async (entry: LearningEntry) => {
    const attemptLog = window.prompt('Apa yang udah lo coba?');
    if (!attemptLog?.trim()) return;
    await learningEntriesApi.update(entry.id, {
      attemptLog: attemptLog.trim(),
      status: 'ATTEMPT',
    });
    await load();
  };

  const markLearned = async (entry: LearningEntry) => {
    const reflection = window.prompt('Apa yang sekarang lo tau yang tadi belum?');
    if (!reflection?.trim()) return;
    await learningEntriesApi.update(entry.id, {
      reflection: reflection.trim(),
      status: 'LEARNED',
    });
    await load();
  };

  const visible = entries.filter((entry) => {
    if (filter === 'all') return true;
    if (filter === 'done') return entry.status === 'LEARNED';
    return entry.status !== 'LEARNED';
  });

  return (
    <>
      <PageHeader title="Learning Tracker" />

      <div className={styles.filterRow} role="tablist" aria-label="Filter entry">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className={
              filter === option.value
                ? `${styles.filterBtn} ${styles.filterBtnActive}`
                : styles.filterBtn
            }
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Gak ada entry di sini</p>
          <p className={styles.emptyText}>
            Learning entry lahir dari task yang lo tandai "Mentok" di board Kanban.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {visible.map((entry) => {
            const meta = learningStatusMeta(entry.status);
            const currentStep = LEARNING_STATUS_ORDER.indexOf(entry.status);

            return (
              <article key={entry.id} className={styles.entry}>
                <header className={styles.entryHeader}>
                  <StatusPill meta={meta} />
                  <span className={styles.origin}>
                    dari · {taskTitles[entry.taskId] ?? 'task tak dikenal'}
                  </span>
                </header>

                <ol className={styles.stepper}>
                  {LEARNING_STATUS_ORDER.map((status, index) => (
                    <li
                      key={status}
                      className={
                        index <= currentStep
                          ? `${styles.step} ${styles.stepDone}`
                          : styles.step
                      }
                    >
                      <span className={styles.stepDot} aria-hidden />
                      {learningStatusMeta(status).label}
                    </li>
                  ))}
                </ol>

                <section className={styles.section}>
                  <h3 className={styles.sectionLabel}>Masalah</h3>
                  <p className={styles.sectionText}>{entry.problemStatement}</p>
                </section>

                {entry.attemptLog && (
                  <section className={styles.section}>
                    <h3 className={styles.sectionLabel}>Yang udah dicoba</h3>
                    <p className={styles.sectionText}>{entry.attemptLog}</p>
                  </section>
                )}

                {entry.reflection && (
                  <section className={`${styles.section} ${styles.reflection}`}>
                    <h3 className={styles.sectionLabel}>Yang sekarang gue tau</h3>
                    <p className={styles.sectionText}>{entry.reflection}</p>
                  </section>
                )}

                <footer className={styles.entryFooter}>
                  <span className={styles.time}>{relativeTime(entry.updatedAt)}</span>
                  <div className={styles.actions}>
                    {entry.status === 'PROBLEM' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => logAttempt(entry)}
                      >
                        Catat percobaan
                      </button>
                    )}
                    {entry.status === 'ATTEMPT' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => markLearned(entry)}
                      >
                        Tandai paham
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Tulis style Learning**

`web/src/pages/LearningPage.module.css`:
```css
.filterRow {
  display: inline-flex;
  gap: var(--space-1);
  padding: var(--space-1);
  margin-bottom: var(--space-5);
  background: var(--surface-sunken);
  border-radius: var(--radius-md);
}

.filterBtn {
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

.filterBtn:hover {
  color: var(--text-primary);
}

.filterBtnActive,
.filterBtnActive:hover {
  background: var(--surface);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 720px;
}

.entry {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.entryHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.origin {
  font-size: var(--text-base);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0;
  margin: 0;
  list-style: none;
}

.step {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-tertiary);
}

.stepDot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--border);
}

.stepDone {
  color: var(--text-primary);
}

.stepDone .stepDot {
  background: var(--text-primary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sectionLabel {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.sectionText {
  font-size: var(--text-md);
  color: var(--text-primary);
  white-space: pre-wrap;
}

.reflection {
  padding: var(--space-3);
  background: var(--status-done-bg);
  border-radius: var(--radius-md);
}

.reflection .sectionLabel {
  color: var(--status-done-fg);
}

.entryFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}

.time {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}

.actions {
  display: flex;
  gap: var(--space-2);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-8);
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: var(--radius-xl);
  text-align: center;
}

.emptyTitle {
  font-size: var(--text-lg);
  font-weight: 600;
}

.emptyText {
  font-size: var(--text-md);
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses.

- [ ] **Step 4: Verifikasi tampilan**

Buka `http://localhost:5173/learning`. Diharapkan:
1. Filter tiga tombol di atas, dengan "Belum kelar" aktif secara default — entry berstatus `LEARNED` **tidak** tampil sampai lo pilih "Semua" atau "Kelar".
2. Tiap kartu menampilkan pil status di kiri atas dan **judul task asalnya** di kanan atas ("dari · …").
3. Stepper tiga titik: titik yang sudah dilewati berwarna hitam, sisanya abu.
4. Entry yang sudah `LEARNED` menampilkan blok refleksi berlatar hijau muda.
5. Kalau belum ada entry sama sekali, muncul empty state yang menjelaskan bahwa entry lahir dari task yang ditandai "Mentok".

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/LearningPage.tsx web/src/pages/LearningPage.module.css
git commit -m "Restyle Learning Tracker with stepper, origin task, and status filter"
```

---

## Task 8: Learning Tracker — blok riset terkunci dan aksi berbasis modal

Ini bagian yang membuat mekanisme anti-overthinking terlihat: alih-alih menyembunyikan bagian riset saat status masih `PROBLEM`, bagian itu tetap dirender dalam keadaan terkunci beserta alasannya.

**Files:**
- Modify: `web/src/pages/LearningPage.tsx`
- Modify: `web/src/pages/LearningPage.module.css`

**Interfaces:**
- Consumes: `TextPromptModal`, `Modal` (Task 5), `captureNotesApi` (sudah ada).
- Produces: halaman Learning Tracker final.

- [ ] **Step 1: Tambahkan import dan komponen modal generalize**

Di `web/src/pages/LearningPage.tsx`, ganti blok import bagian atas menjadi:
```tsx
import { useCallback, useEffect, useState } from 'react';
import { BookmarkCheck, Lock, Pencil } from 'lucide-react';
import type { LearningEntry } from '../types';
import { learningEntriesApi } from '../api/learningEntries';
import { tasksApi } from '../api/tasks';
import { PageHeader } from '../components/AppShell';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { TextPromptModal } from '../components/TextPromptModal';
import { LEARNING_STATUS_ORDER, learningStatusMeta } from '../lib/status';
import { relativeTime } from '../lib/relativeTime';
import styles from './LearningPage.module.css';
```

Tambahkan tipe dialog dan komponen modal generalize tepat di bawah konstanta `FILTERS`:
```tsx
type Dialog =
  | { kind: 'attempt'; entry: LearningEntry }
  | { kind: 'research'; entry: LearningEntry }
  | { kind: 'reflection'; entry: LearningEntry }
  | { kind: 'generalize'; entry: LearningEntry }
  | null;

function GeneralizeModal({
  entry,
  onClose,
  onSubmit,
}: {
  entry: LearningEntry;
  onClose: () => void;
  onSubmit: (title: string, tags: string[]) => void;
}) {
  const [title, setTitle] = useState(entry.problemStatement);
  const [tagsInput, setTagsInput] = useState('');
  const trimmedTitle = title.trim();

  return (
    <Modal
      title="Simpan sebagai catatan Capture"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!trimmedTitle}
            onClick={() =>
              onSubmit(
                trimmedTitle,
                tagsInput
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              )
            }
          >
            Simpan ke Capture
          </button>
        </>
      }
    >
      <div className={styles.modalContext}>
        <span className={styles.sectionLabel}>Isi catatan</span>
        <p className={styles.sectionText}>{entry.reflection}</p>
      </div>

      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Judul catatan</span>
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label className={styles.modalField}>
        <span className={styles.modalLabel}>Tag (opsional, dipisah koma)</span>
        <input
          className="input"
          value={tagsInput}
          placeholder="react, performance"
          onChange={(event) => setTagsInput(event.target.value)}
        />
      </label>
    </Modal>
  );
}
```

- [ ] **Step 2: Ganti handler menjadi berbasis dialog**

Di dalam komponen `LearningPage`, tambahkan state dialog setelah state `filter`:
```tsx
  const [dialog, setDialog] = useState<Dialog>(null);
```

Ganti kedua handler `logAttempt` dan `markLearned` dengan keempat handler berikut:
```tsx
  const submitAttempt = async (entry: LearningEntry, attemptLog: string) => {
    await learningEntriesApi.update(entry.id, { attemptLog, status: 'ATTEMPT' });
    setDialog(null);
    await load();
  };

  const submitResearch = async (entry: LearningEntry, researchNotes: string) => {
    await learningEntriesApi.update(entry.id, { researchNotes });
    setDialog(null);
    await load();
  };

  const submitReflection = async (entry: LearningEntry, reflection: string) => {
    await learningEntriesApi.update(entry.id, { reflection, status: 'LEARNED' });
    setDialog(null);
    await load();
  };

  const submitGeneralize = async (
    entry: LearningEntry,
    title: string,
    tags: string[],
  ) => {
    await learningEntriesApi.generalize(entry.id, title, tags);
    setDialog(null);
    await load();
  };
```

- [ ] **Step 3: Tambahkan blok riset terkunci di dalam kartu**

Di dalam `visible.map(...)`, sisipkan blok berikut tepat setelah `section` "Yang udah dicoba" dan sebelum `section` refleksi:
```tsx
                {entry.attemptLog ? (
                  <section className={styles.section}>
                    <div className={styles.researchHead}>
                      <h3 className={styles.sectionLabel}>Catatan riset</h3>
                      <button
                        type="button"
                        className="btn btn--icon"
                        onClick={() => setDialog({ kind: 'research', entry })}
                        aria-label="Ubah catatan riset"
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                    </div>
                    <p className={styles.sectionText}>
                      {entry.researchNotes || (
                        <span className={styles.placeholder}>Belum ada catatan riset.</span>
                      )}
                    </p>
                  </section>
                ) : (
                  <div className={styles.locked}>
                    <Lock size={14} aria-hidden />
                    <p>
                      Catatan riset kebuka setelah lo catat percobaan pertama. Coba dulu,
                      baru cari referensi.
                    </p>
                  </div>
                )}
```

- [ ] **Step 4: Ganti tombol aksi agar membuka dialog**

Ganti seluruh isi `<div className={styles.actions}>` menjadi:
```tsx
                    {entry.status === 'PROBLEM' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setDialog({ kind: 'attempt', entry })}
                      >
                        Catat percobaan
                      </button>
                    )}
                    {entry.status === 'ATTEMPT' && (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setDialog({ kind: 'reflection', entry })}
                      >
                        Tandai paham
                      </button>
                    )}
                    {entry.status === 'LEARNED' &&
                      (entry.promotedCaptureNoteId ? (
                        <span className={styles.promoted}>
                          <BookmarkCheck size={14} aria-hidden />
                          Udah jadi catatan Capture
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--outline"
                          onClick={() => setDialog({ kind: 'generalize', entry })}
                        >
                          Simpan ke Capture
                        </button>
                      ))}
```

- [ ] **Step 5: Render dialognya**

Sisipkan tepat sebelum penutup `</>` di akhir `return`:
```tsx
      {dialog?.kind === 'attempt' && (
        <TextPromptModal
          title="Catat percobaan"
          label="Apa yang udah lo coba?"
          placeholder="Boleh diisi 'belum coba apa-apa, langsung cari cara' — yang penting jujur"
          context={[{ label: 'Masalah', value: dialog.entry.problemStatement }]}
          submitLabel="Simpan"
          onSubmit={(value) => submitAttempt(dialog.entry, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'research' && (
        <TextPromptModal
          title="Catatan riset"
          label="Referensi atau temuan yang kepake"
          defaultValue={dialog.entry.researchNotes ?? ''}
          submitLabel="Simpan"
          onSubmit={(value) => submitResearch(dialog.entry, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'reflection' && (
        <TextPromptModal
          title="Tandai paham"
          label="Apa yang sekarang lo tau yang tadi belum?"
          placeholder="Kesimpulan atau pattern yang bakal kepake lagi nanti"
          context={[
            { label: 'Masalah', value: dialog.entry.problemStatement },
            ...(dialog.entry.attemptLog
              ? [{ label: 'Yang udah dicoba', value: dialog.entry.attemptLog }]
              : []),
          ]}
          submitLabel="Simpan & tandai paham"
          onSubmit={(value) => submitReflection(dialog.entry, value)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'generalize' && (
        <GeneralizeModal
          entry={dialog.entry}
          onClose={() => setDialog(null)}
          onSubmit={(title, tags) => submitGeneralize(dialog.entry, title, tags)}
        />
      )}
```

- [ ] **Step 6: Tambahkan style blok terkunci dan field modal**

Tambahkan di akhir `web/src/pages/LearningPage.module.css`:
```css
.researchHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.placeholder {
  color: var(--text-tertiary);
}

.locked {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  color: var(--text-tertiary);
  font-size: var(--text-base);
}

/* Sengaja tidak memakai kelas global `.chip` supaya tidak bergantung
   pada urutan injeksi CSS — seluruh gayanya ditulis lengkap di sini. */
.promoted {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--status-done-bg);
  color: var(--status-done-fg);
  font-size: var(--text-sm);
  font-weight: 500;
}

.modalContext {
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-md);
}

.modalField {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.modalLabel {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-secondary);
}
```

- [ ] **Step 7: Verifikasi build**

```bash
npm run build -w web
```
Diharapkan: sukses.

- [ ] **Step 8: Verifikasi alur lengkap**

Ini pemeriksaan terpenting di seluruh rencana. Mulai dari board Kanban yang bersih:

1. Buat task baru, lalu pindahkan ke "Mentok" dan isi alasannya. Buka halaman Learning.
2. Entry baru berstatus "Masalah". Di kartunya, bagian riset tampil sebagai **kotak bergaris putus-putus dengan ikon gembok** berbunyi "Catatan riset kebuka setelah lo catat percobaan pertama" — bukan hilang begitu saja.
3. Klik "Catat percobaan". Modal muncul dan **menampilkan blok konteks berisi masalahnya** di atas textarea. Isi lalu simpan.
4. Kotak gembok berganti menjadi bagian "Catatan riset" beserta tombol pensil. Klik pensil, isi catatan riset, simpan — teksnya muncul.
5. Klik "Tandai paham". Modal muncul dengan **dua blok konteks** (Masalah dan Yang udah dicoba) di atas textarea refleksi. Isi lalu simpan.
6. Kartu kini menampilkan blok refleksi berlatar hijau, stepper penuh, dan tombol "Simpan ke Capture".
7. Klik "Simpan ke Capture". Modal berisi pratinjau isi catatan, judul yang sudah terisi otomatis, dan field tag. Simpan.
8. Tombol tadi berubah menjadi chip hijau "Udah jadi catatan Capture", dan catatannya benar-benar muncul di halaman Capture.
9. Kembali ke halaman Learning, ganti filter ke "Kelar" — entry tadi tampil di situ; ganti ke "Belum kelar" — entry tadi hilang dari daftar.

- [ ] **Step 9: Pastikan tidak ada warna mentah tersisa**

```bash
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(' web/src/components web/src/pages
```
Diharapkan: tidak ada hasil. Satu-satunya nilai warna mentah yang boleh ada di seluruh `web/src` adalah di `styles/tokens.css` dan warna overlay di `components/Modal.module.css` — jika `grep` menemukan overlay tersebut, itu wajar dan boleh dibiarkan.

- [ ] **Step 10: Commit**

```bash
git add web/src/pages/LearningPage.tsx web/src/pages/LearningPage.module.css
git commit -m "Make the research gate visible and move Learning actions into modals"
```

---

## Pemeriksaan Manual Akhir

Jalankan setelah seluruh task selesai, memakai build produksi (`npm run build && npm run start` dari root, lalu buka `http://localhost:3000`):

1. Ketiga halaman tampil rapi lewat satu proses, dan me-refresh langsung di `/capture` maupun `/learning` tidak menghasilkan 404.
2. Perkecil jendela sampai di bawah 900px: sidebar jadi top bar, kolom Kanban bisa digeser, grid Capture jadi satu kolom.
3. Seluruh dialog bisa ditutup dengan `Esc` maupun klik overlay, dan fokus kembali ke tombol pemicunya setelah ditutup.
4. Navigasi keyboard: `Tab` menjangkau tombol hapus dan kontrol pindah kolom pada kartu (keduanya ikut terlihat saat difokus), dan menu pindah kolom bisa dioperasikan tanpa mouse.
5. Alur penuh sekali lagi dari nol: task → Mentok → percobaan → riset → refleksi → Capture, lalu hapus task tersebut dan pastikan learning entry-nya ikut hilang dari halaman Learning (cascade).
