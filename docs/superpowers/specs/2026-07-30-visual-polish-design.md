# Visual Polish — Design

Fase lanjutan dari [2026-07-29-personal-workflow-app-design.md](2026-07-29-personal-workflow-app-design.md). Aplikasi sudah berfungsi penuh (Task 1–12 selesai); fase ini khusus memperbaiki tampilan dan interaksi tanpa mengubah arsitektur atau perilaku inti.

## 1. Tujuan & Batasan

**Tujuan:** mengubah tampilan dari "prototipe developer" menjadi aplikasi yang enak dipakai harian, mengikuti arah visual referensi (screenshot UI "Codomo": sidebar kiri, kolom kanban abu muda, kartu putih rounded).

**Batasan keras:**

- **Tidak ada perubahan backend sama sekali.** Seluruh pekerjaan fase ini hanya menyentuh `web/`. Semua endpoint yang dibutuhkan sudah ada dan sudah teruji.
- Perilaku gate Learning Tracker tidak berubah. Backend tetap satu-satunya penegak aturan; UI hanya menampilkannya lebih jelas.
- Board Kanban tetap persistent, tetap dipindah manual, tetap tanpa drag-and-drop.

**Non-goals (sengaja tidak dikerjakan):** dark mode, drag-and-drop, animasi selain transisi hover, sistem notifikasi/toast, badge hitungan di sidebar, autentikasi.

## 2. Prinsip Visual

**95% netral, warna hanya untuk status.** Referensi terlihat mahal justru karena hampir seluruh layarnya putih/abu/hitam — warna hanya muncul di tempat yang punya arti. Karena itu aplikasi ini tidak punya "warna brand". Aksi utama memakai hitam pekat, dan satu-satunya warna adalah status.

Nama token status dibuat **netral terhadap modul** (`idle`, `active`, `stuck`, `done`) supaya Kanban dan Learning Tracker berbagi token yang sama:

| Token | Kanban | Learning | Makna |
|---|---|---|---|
| `idle` | `TODO` | — | Belum jalan |
| `active` | `IN_PROGRESS` | `ATTEMPT` | Sedang jalan |
| `stuck` | `BLOCKED` | `PROBLEM` | Mentok |
| `done` | `DONE` | `LEARNED` | Selesai |

`BLOCKED` dan `PROBLEM` sengaja sewarna karena keduanya adalah peristiwa yang sama dilihat dari dua modul; begitu pula `IN_PROGRESS` dan `ATTEMPT`. Warna ikut menjelaskan relasi antar modul.

**Status tidak pernah disampaikan lewat warna saja** — selalu disertai ikon dan label teks.

## 3. Design Tokens

Seluruh nilai hidup di `web/src/styles/tokens.css`. **Tidak boleh ada nilai warna mentah di file komponen mana pun** — ini yang membuat dark mode nanti murah (cukup me-redefine variabel yang sama di dalam blok `@media (prefers-color-scheme: dark)`).

### Warna netral (light)

```
--canvas:          #FAFAFA   /* latar halaman */
--surface:         #FFFFFF   /* kartu, sidebar, modal */
--surface-sunken:  #F4F4F5   /* kontainer kolom, blok konteks */
--surface-subtle:  #F9F9FA   /* hover nav & baris */
--border:          #E4E4E7
--border-subtle:   #EFEFF1   /* garis pemisah dalam kartu */
--border-strong:   #D4D4D8   /* border kartu saat hover */
--text-primary:    #18181B
--text-secondary:  #71717A
--text-tertiary:   #A1A1AA   /* hanya untuk label kecil/dekoratif, bukan teks isi */
--action:          #18181B
--action-hover:    #27272A
--action-fg:       #FFFFFF
--danger:          #DC2626
--danger-hover:    #B91C1C
```

### Warna status

```
--status-idle-fg:    #52525B    --status-idle-bg:    #F4F4F5    --status-idle-dot:   #A1A1AA
--status-active-fg:  #B45309    --status-active-bg:  #FEF3C7    --status-active-dot: #F59E0B
--status-stuck-fg:   #BE123C    --status-stuck-bg:   #FFE4E6    --status-stuck-dot:  #F43F5E
--status-done-fg:    #047857    --status-done-bg:    #D1FAE5    --status-done-dot:   #10B981
```

Seluruh pasangan `fg` di atas `bg`-nya memenuhi kontras WCAG AA (≥ 4.5:1), begitu pula `--text-secondary` di atas `--surface`.

### Tipografi

Font memakai **system stack**, bukan web font: di macOS/iOS menghasilkan SF Pro, tanpa dependency, tanpa flash-of-unstyled-text.

```
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;

--text-xs:   11px   /* label section, uppercase */
--text-sm:   12px   /* chip, meta */
--text-base: 13px   /* deskripsi, isi catatan */
--text-md:   14px   /* teks UI utama, judul kartu, nav */
--text-lg:   16px
--text-xl:   20px
--text-2xl:  28px   /* judul halaman */

--leading-tight:  1.25
--leading-normal: 1.5
```

Bobot yang dipakai: 400, 500, 600, 700. Judul halaman memakai 700 dengan `letter-spacing: -0.02em`.

### Spacing, radius, shadow, layout

```
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px

--radius-sm:   6px    /* chip */
--radius-md:   8px    /* tombol, input, item nav */
--radius-lg:   12px   /* kartu */
--radius-xl:   14px   /* kontainer kolom */
--radius-2xl:  16px   /* panel modal */
--radius-full: 999px

--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);    /* kartu diam */
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);   /* kartu hover */
--shadow-lg: 0 16px 48px rgba(0,0,0,0.18);  /* modal */

--sidebar-width: 240px;
```

Breakpoint mobile: **900px**.

## 4. Arsitektur Frontend

Styling memakai **CSS Modules** (dukungan bawaan Vite, tanpa dependency tambahan) untuk style per-komponen, ditambah dua stylesheet global.

```
web/src/
  styles/
    tokens.css              variabel CSS (bagian 3)
    global.css              reset, base, primitif app-wide (.btn, .input, .chip)
  lib/
    status.ts               enum -> label Indonesia + token status + ikon
    relativeTime.ts         Date -> "2 hari yang lalu"
  components/
    AppShell.tsx      + AppShell.module.css
    Modal.tsx         + Modal.module.css
    TextPromptModal.tsx     pembungkus Modal untuk kasus satu textarea
    StatusPill.tsx    + StatusPill.module.css
  pages/
    KanbanPage.tsx    + KanbanPage.module.css
    CapturePage.tsx   + CapturePage.module.css
    LearningPage.tsx  + LearningPage.module.css
```

`lib/status.ts` adalah satu-satunya sumber kebenaran untuk pemetaan `TaskStatus` / `LearningEntryStatus` ke label Indonesia, token warna, dan ikon. Kanban dan Learning Tracker sama-sama memakainya sehingga label dan warna tidak bisa melenceng antar halaman.

`relativeTime.ts` memakai `Intl.RelativeTimeFormat('id')` bawaan browser — tanpa library tanggal.

**Dependency baru: `lucide-react`** (satu-satunya). Ikon outline dengan ujung membulat, sesuai gaya referensi. Alternatifnya menulis tangan belasan SVG, yang menghasilkan kode lebih buruk.

### Pembersihan

- `web/src/index.css` dihapus, digantikan `styles/tokens.css` + `styles/global.css`. File lama adalah sisa template Vite dan berisi `#root { width: 1126px; text-align: center; border-inline: ... }` yang diam-diam mengunci lebar aplikasi dan merata-tengahkan seluruh teks.
- `web/index.html`: `<title>` diubah menjadi `Wodaily`.
- `web/public/icons.svg` (sisa template Vite) dihapus; `favicon.svg` diganti SVG bikinan sendiri berisi tanda bintang/asterisk berwarna `--text-primary` di atas latar transparan, senada dengan lambang brand di sidebar.
- Nav inline di `App.tsx` dipindah ke `AppShell`.

## 5. Shell & Sidebar

Sidebar lebar `--sidebar-width`, latar `--surface`, dipisah `1px solid var(--border)` di kanan. Isinya brand — ikon lucide `Asterisk` diikuti wordmark "Wodaily" (`--text-md`, bobot 700) — dan tiga item nav: **Kanban**, **Capture**, **Learning**.

- Item non-aktif: teks & ikon `--text-secondary`.
- Hover: latar `--surface-subtle`, radius `--radius-md`.
- Aktif: latar `--surface-sunken`, teks & ikon `--text-primary`, bobot 600.

Area utama berlatar `--canvas` dengan padding `--space-8`; kartu putih di atasnya jadi terlihat "naik". Header halaman berisi judul (`--text-2xl`, bobot 700) dan tombol aksi opsional di kanan.

**Tidak ada breadcrumb** — referensi memakainya karena punya hierarki company→project, sedangkan Wodaily tidak punya hierarki sama sekali. Breadcrumb di sini hanya akan jadi dekorasi kosong.

**Tidak ada badge hitungan di nav.** Menampilkannya mengharuskan `AppShell` menembak API ketiga modul, dan angkanya akan basi setiap kali data berubah tanpa pindah halaman. Angka yang salah lebih buruk daripada tidak ada angka. `AppShell` tetap murni presentasi + navigasi.

**Responsif:** di bawah 900px sidebar berubah menjadi top bar yang menempel di atas (brand di kiri, tiga ikon nav di kanan). Ini penting karena kebutuhan asli pengguna mencakup membuka aplikasi dari HP untuk mencatat cepat.

## 6. Kanban

### Kolom

Kontainer `--surface-sunken`, radius `--radius-xl`, padding `--space-3`. Header kolom: ikon status berwarna + label + jumlah kartu.

Label ditampilkan dalam bahasa Indonesia (nilai enum di database tidak berubah):

| Enum | Label | Ikon (lucide) |
|---|---|---|
| `TODO` | To Do | `Circle` |
| `IN_PROGRESS` | Dikerjain | `CircleDashed` |
| `BLOCKED` | Mentok | `TriangleAlert` |
| `DONE` | Kelar | `CircleCheck` |

Kolom kosong dibiarkan kosong. Jika **seluruh** board kosong, tampilkan empty state di tengah area utama yang mengajak membuat task pertama.

### Kartu

```
┌────────────────────────────────────┐
│ Bikin fitur infinite scroll    ⋮  │
│ Pakai intersection observer,       │
│ jangan scroll listener…            │
│ ────────────────────────────────── │
│ 🕘 2 hari lalu        ◈ Mencoba    │
└────────────────────────────────────┘
```

Latar `--surface`, `1px solid var(--border)`, radius `--radius-lg`, padding `--space-3`, `--shadow-sm`. Saat hover: `--shadow-md` dan border `--border-strong`, dengan `transition` halus.

- **Judul:** `--text-md`, bobot 600, `--text-primary`, membungkus penuh (tidak dipotong).
- **Deskripsi:** `--text-base`, `--text-secondary`, dipotong 2 baris (`-webkit-line-clamp: 2`). Tidak dirender jika kosong.
- **Garis pemisah:** `1px solid var(--border-subtle)`, hanya dirender jika footer punya isi.
- **Footer kiri:** ikon jam + waktu relatif dari `updatedAt` ("baru saja", "2 hari yang lalu"). Lebih berguna daripada tanggal mentah karena langsung menunjukkan task yang menganggur lama.
- **Footer kanan:** chip Learning Entry, hanya muncul jika task punya entry. Warna dan label mengikuti status entry **terbaru** milik task tersebut, yaitu entry pertama dalam daftar yang dikembalikan API (sudah terurut `createdAt` menurun).

Untuk chip tersebut, `KanbanPage` memanggil `learningEntriesApi.listAll()` lalu mengelompokkannya per `taskId` di sisi klien. Ini coupling tingkat halaman (bukan tingkat shell) dan langsung melayani aturan Level 3 dari spec asli.

### Kontrol pindah kolom

Tombol kecil `⋮` di kanan atas kartu. Di belakangnya ada `<select>` asli yang ditumpuk transparan (`opacity: 0`, `position: absolute`, menutupi tombol) berisi empat status. Tampilan bersih, tetapi kontrolnya tetap elemen form asli sehingga tetap dapat diakses keyboard dan memakai menu native.

### Alur Mentok

Perilaku tidak berubah dari implementasi sekarang: memilih "Mentok" memindahkan task, lalu muncul pertanyaan "Apa yang literally nge-block sekarang?". Jika diisi, learning entry dibuat; jika dibatalkan, task tetap pindah tanpa entry. Yang berubah hanya wadahnya — dari `window.prompt()` menjadi modal.

## 7. Capture

Prinsip dari spec asli: **gudang bacaan yang tidak boleh terasa berat**. Karena itu halaman ini justru **tidak** memakai modal untuk menulis — menambah satu klik sebelum bisa mengetik bertentangan dengan tujuannya.

- **Quick add** selalu tampil di atas berupa satu input ("Tulis apa yang lo baca…"). Saat difokus, ia melebar menjadi form penuh: judul, isi, tag. Nol klik untuk mulai mengetik, tidak berantakan saat menganggur. Form menyempit kembali setelah catatan tersimpan, atau saat pengguna mengklik di luar form sementara seluruh field masih kosong — sehingga tulisan yang belum selesai tidak pernah hilang karena salah klik.
- **Filter tag berupa chip.** Semua tag yang ada pada catatan yang termuat ditampilkan sebagai chip yang bisa diklik untuk memfilter; klik lagi untuk melepas filter. Tag pada tiap kartu juga bisa diklik langsung. Ini menggantikan input tag manual yang mengharuskan pengguna mengingat dan mengetik ulang nama tag dengan tepat.
- **Search teks** tetap ada di samping filter tag, memakai parameter `search` yang sudah didukung API.
- **Daftar catatan** berupa grid kartu: 3 kolom, turun ke 2 di bawah 1200px, lalu 1 di bawah 900px. Isi dipotong 4 baris, chip tag di bagian bawah kartu.
- **Hapus catatan:** ikon tong sampah muncul saat hover, dengan modal konfirmasi.
- **Empty state** ditampilkan terpisah untuk kondisi "belum ada catatan sama sekali" dan "tidak ada hasil untuk filter ini".

## 8. Learning Tracker

Halaman yang paling banyak berubah karena versi sekarang paling jauh dari niat aslinya.

```
┌──────────────────────────────────────────────────┐
│ ◈ Mencoba                  dari · "Fitur upload" │
│                                                   │
│ ●───────────●───────────○                         │
│ Problem    Attempt    Learned                     │
│                                                   │
│ MASALAH                                           │
│ Gak paham kenapa cache-nya stale                 │
│                                                   │
│ YANG UDAH DICOBA                                  │
│ Coba tanpa cache dulu, ternyata…                 │
│                                                   │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│   🔒 Catatan riset kebuka setelah lo catat        │
│      percobaan pertama                            │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                              [ Tandai Learned ]   │
└──────────────────────────────────────────────────┘
```

**Task asal ditampilkan.** Versi sekarang sama sekali tidak menunjukkan sebuah entry lahir dari task mana, padahal itu inti aturan Level 3. Judul task ditampilkan di kanan atas kartu ("dari · Fitur upload"), diperoleh dengan memanggil `tasksApi.list()` dan menggabungkannya di sisi klien berdasarkan `taskId`.

**Stepper tiga langkah** (`Problem → Attempt → Learned`) membuat posisi dalam alur terbaca sekali lihat. Langkah yang sudah dilewati memakai warna status, yang belum memakai `--text-tertiary`.

**Gerbang dibuat terlihat.** Ini keputusan desain paling penting dalam fase ini.

Versi sekarang menghilangkan bagian catatan riset sepenuhnya saat status masih `PROBLEM`. Secara teknis benar, tetapi pengguna hanya melihat ruang kosong dan tidak belajar apa pun darinya.

Bagian tersebut tetap dirender, namun dalam keadaan **terkunci**: border putus-putus, warna redup, ikon gembok, disertai kalimat yang menjelaskan *mengapa* terkunci ("Catatan riset kebuka setelah lo catat percobaan pertama"). Aturan yang tadinya hanya validasi backend berubah menjadi pengingat yang mengajarkan — tepat saat pengguna sedang tergoda kabur ke mode riset lebih dulu.

**Setelah `LEARNED`:** refleksi ditampilkan menonjol (itu hasil panennya). Tombol "Generalize ke Capture" berubah menjadi chip "sudah jadi catatan Capture" begitu `promotedCaptureNoteId` terisi.

**Filter** `Belum kelar / Semua / Kelar` di atas daftar, murni filter sisi klien atas data yang sudah termuat, tanpa panggilan API tambahan. Nilai awalnya **Belum kelar** — begitu halaman dibuka, yang tampil lebih dulu adalah loop belajar yang masih menggantung.

## 9. Modal

Satu komponen shell generik `Modal`:

- Overlay gelap transparan menutupi layar; panel `--surface`, `--radius-2xl`, `--shadow-lg`, lebar maksimum 480px (560px untuk modal refleksi yang membawa blok konteks).
- Struktur: header (judul + tombol tutup) → isi → footer (tombol **Batal** ghost + tombol utama).
- Perilaku: `Esc` menutup, klik overlay menutup, field pertama auto-fokus, `Cmd/Ctrl+Enter` submit.
- Aksesibilitas: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` menunjuk judul.
- **Dirender lewat `createPortal` ke `document.body`.** Ini bukan detail sepele: kartu Kanban berada di dalam kontainer kolom yang memiliki `overflow`, sehingga modal yang dirender di tempat akan terpotong.

`TextPromptModal` membungkus `Modal` untuk empat kasus "satu textarea" (problem statement, catat percobaan, catatan riset, refleksi) agar strukturnya tidak ditulis ulang. Menerima `label`, `defaultValue`, `context` opsional, `submitLabel`, dan `onSubmit`.

Modal konfirmasi hapus memakai tombol utama berwarna `--danger`, dan teksnya menyebutkan bahwa menghapus task ikut menghapus learning entry miliknya (cascade).

**Modal refleksi menampilkan konteks:** di atas textarea ada blok `--surface-sunken` berisi problem statement dan attempt log yang sudah tercatat. Jadi saat menulis "apa yang sekarang gue tau", pengguna sedang melihat langsung apa yang tadi belum ia tahu. Ini keuntungan konkret dari memilih modal ketimbang `window.prompt()`.

## 10. Penyesuaian Fungsional yang Disengaja

Perubahan berikut melampaui kosmetik murni, dan dimasukkan karena memoles tampilan saja tidak menyelesaikan masalahnya. **Semuanya memakai endpoint yang sudah ada — tidak ada perubahan backend.**

1. **Modal buat task menyertakan field deskripsi.** UI sekarang hanya menyediakan judul, padahal backend sudah mendukung `description` sejak awal.
2. **Hapus task** (ikon saat hover + konfirmasi). Board saat ini sudah terisi task uji coba (`Gate check`, `Generalize check`, `Try the API`) tanpa cara membuangnya dari UI. Board yang penuh sampah tetap berantakan sepoles apa pun tampilannya.
3. **Hapus catatan Capture** (ikon saat hover + konfirmasi), dengan alasan yang sama.
4. **Kanban memuat learning entry** untuk menampilkan chip status pada kartu.
5. **Learning Tracker memuat daftar task** untuk menampilkan judul task asal.
6. **Chip tag Capture** yang bisa diklik, menggantikan input filter tag manual.
7. **Filter sisi klien** di Learning Tracker.

## 11. Aksesibilitas

- Seluruh elemen interaktif memiliki `:focus-visible` yang jelas.
- Status selalu disampaikan lewat ikon + label, tidak pernah warna saja.
- Kontras teks memenuhi WCAG AA; `--text-tertiary` hanya untuk label kecil/dekoratif, tidak untuk teks isi.
- Kontrol pindah kolom tetap `<select>` asli sehingga semantik dan navigasi keyboard bawaan tidak hilang.
- Modal memakai atribut ARIA dan mengembalikan fokus ke pemicunya saat ditutup.

## 12. Verifikasi

Tidak ada unit test baru untuk styling — mengikuti prinsip spec asli, pengujian otomatis hanya untuk logika yang jika salah merusak tujuan aplikasi, dan penegak sebenarnya dari mekanisme gate tetap unit test backend yang sudah ada (15 test di `learning.service.spec.ts`). Tampilan terkunci di UI adalah lapisan kedua, bukan pengganti.

Verifikasi fase ini dilakukan lewat:

1. `npm run build` lolos tanpa error TypeScript.
2. Pemeriksaan manual tiap halaman pada lebar desktop dan lebar HP (< 900px).
3. Pemeriksaan manual tiap modal: buat task, hapus task, alur Mentok, catat percobaan, catatan riset, refleksi (termasuk blok konteksnya), generalize, hapus catatan.
4. Memastikan blok riset terkunci benar-benar tampil saat status `PROBLEM`, dan terbuka setelah attempt tercatat.
5. Memastikan tidak ada satu pun nilai warna mentah tersisa di file komponen (`grep` untuk `#` heksadesimal di `components/` dan `pages/`).

## 13. Pekerjaan Lanjutan

- Dark mode — arsitektur token sudah disiapkan, tinggal menambah satu blok `@media (prefers-color-scheme: dark)`.
- Drag-and-drop kolom Kanban.
- Badge hitungan di sidebar, jika ternyata dibutuhkan.
- Mengganti font ke Inter bila ingin sama persis dengan referensi (perubahan dua baris pada `tokens.css`).
