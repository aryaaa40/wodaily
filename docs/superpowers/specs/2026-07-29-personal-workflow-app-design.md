# Personal Workflow App — Design

## 1. Tujuan

Aplikasi personal (single-user) untuk mengelola kerjaan harian, menyimpan bacaan/riset yang belum kepake, dan secara struktural memaksa pendekatan **problem-driven learning** (mulai dari masalah nyata → belajar sambil jalan) alih-alih overthinking di awal ("ini udah bener belum ya", "apa yang harus dipelajari dulu").

Tiga modul:
1. **Kanban** — todo list harian dalam bentuk board
2. **Capture** — gudang bacaan/riset yang belum kepake, biar gak lupa dan bisa diakses lagi
3. **Learning Tracker** — modul belajar yang wajib dipicu oleh masalah nyata, dengan gate struktural yang mencegah riset mendahului aksi

## 2. Arsitektur

- **Frontend:** React + TypeScript
- **Backend:** NestJS + TypeScript, menyediakan REST API dan sekaligus serve build statis frontend (1 proses, 1 deployable unit)
- **Database:** PostgreSQL, diakses via Prisma ORM
- **Deployment:** Lokal dulu (localhost). Rencana jangka panjang: deploy ke VPS agar bisa diakses dari HP saat di luar. Karena backend serve frontend sebagai satu proses, deploy ke VPS nantinya cukup 1 service.
- **Auth:** Belum didesain di iterasi ini — akan diputuskan saat benar-benar deploy ke VPS (out of scope untuk sekarang).

## 3. Data Model

### `Task` (Kanban)
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid | |
| title | string | wajib |
| description | string | opsional |
| status | enum: `TODO \| IN_PROGRESS \| BLOCKED \| DONE` | default `TODO` |
| position | int | urutan dalam kolom |
| createdAt / updatedAt | timestamp | |

Board bersifat **persistent** — tidak ada reset harian. Task hanya berpindah kolom saat dipindah manual oleh user.

### `CaptureNote`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid | |
| title | string | wajib |
| content | text | catatan bebas, bisa berisi link/URL |
| tags | string[] | tag bebas, dengan autocomplete dari tag yang pernah dipakai |
| createdAt / updatedAt | timestamp | |

Capture note bisa berdiri sendiri (bacaan random tanpa task pemicu) atau lahir dari hasil "generalize" sebuah `LearningEntry` yang sudah `LEARNED`.

### `LearningEntry`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid | |
| taskId | uuid (FK → Task) | **wajib, not null** — tidak ada entry belajar tanpa task pemicu nyata |
| status | enum: `PROBLEM \| ATTEMPT \| LEARNED` | default `PROBLEM` |
| problemStatement | text | wajib — "apa yang literally nge-block sekarang" (spesifik ke task, bukan topik umum) |
| attemptLog | text | wajib sebelum bisa transisi ke `ATTEMPT` — "apa yang udah dicoba" |
| researchNotes | text, nullable | hanya bisa diisi/terlihat aktif setelah `attemptLog` terisi |
| reflection | text, nullable | wajib diisi sebelum transisi ke `LEARNED` — "apa yang sekarang diketahui yang tadi belum" |
| promotedCaptureNoteId | uuid (FK → CaptureNote), nullable | terisi jika reflection di-generalize jadi Capture note baru |
| createdAt / updatedAt | timestamp | |

### Relasi
```
Task (1) ──── (N) LearningEntry ──── (0/1) CaptureNote
```
- Satu `Task` bisa punya banyak `LearningEntry` (task bisa ke-block berkali-kali dengan alasan berbeda sepanjang hidupnya).
- Satu `LearningEntry` opsional terhubung ke satu `CaptureNote` baru hasil promote.
- `CaptureNote` bisa berdiri sendiri tanpa terhubung ke `LearningEntry` apa pun.

## 4. Perilaku per Modul

### Kanban
- Kolom: `To Do → In Progress → Blocked (opsional) → Done`.
- Task dipindah antar kolom secara manual (drag-and-drop, atau tombol pindah untuk versi awal jika drag-and-drop dianggap berlebihan di v1).
- Saat task dipindahkan ke `Blocked`, tersedia aksi cepat **"Block & mulai Learning Entry"** yang langsung membuat `LearningEntry` baru dengan `taskId` ter-prefill ke task tersebut.
- Setelah `LearningEntry` terkait mencapai status `LEARNED`, user memindahkan task kembali ke `In Progress` secara manual (tidak otomatis).

### Capture
- Form cepat: `title` (bisa auto-terisi dari judul saat paste URL) + `content` (catatan bebas) + `tags` (autocomplete dari tag yang sudah pernah dipakai).
- List/grid view dengan filter berdasarkan tag dan full-text search pada `title` + `content`.
- Tidak ada kategori baku — tag sepenuhnya bebas untuk menjaga capture tetap low-friction.

### Learning Tracker
Alur wajib berurutan, tidak bisa dilompati:

1. Task masuk `Blocked` di Kanban → dibuat `LearningEntry` baru dengan `taskId` yang wajib merujuk ke task nyata (Level 3: tidak bisa ada entry belajar tanpa task pemicu).
2. Isi `problemStatement` — pertanyaan wajibnya "apa yang literally nge-block", bukan "mau belajar apa" (mencegah framing topik-umum yang memicu riset roadmap).
3. Isi `attemptLog` — wajib diisi sebelum lanjut, walau isinya "belum coba apa-apa, langsung cari cara". Field `researchNotes` di-lock/collapsed sampai field ini terisi.
4. Field `researchNotes` terbuka — user boleh mencatat referensi/riset seperlunya.
5. Transisi ke `LEARNED` memicu wajib isi `reflection` — kesimpulan/pattern yang didapat.
6. Opsional: tombol "Generalize ke Capture" membuat `CaptureNote` baru dari isi `reflection` (bisa diedit sebelum disimpan), untuk insight yang reusable di masa depan.

Mekanisme anti-overthinking:
- **Gate struktural (A):** field riset secara teknis tidak dapat diakses sebelum ada `attemptLog`. Ini bukan sekadar urutan visual, melainkan constraint yang ditegakkan di backend.
- **Reframing wajib (B):** field pertama yang harus diisi adalah definisi blocker konkret pada task nyata, bukan topik belajar umum — mencegah pertanyaan "apa yang harus gue pelajarin dulu" muncul sebagai entry point.

## 5. Validasi & Edge Case

- Gate status (`attemptLog` sebelum `ATTEMPT`, `reflection` sebelum `LEARNED`, `taskId` wajib saat create) ditegakkan di **backend (NestJS)**, bukan hanya di UI, agar tidak bisa dilewati lewat pemanggilan API langsung.
- Menghapus `Task` yang memiliki `LearningEntry`: cascade delete — entry ikut terhapus (tidak perlu arsip, ini aplikasi personal).
- Menghapus `CaptureNote` yang merupakan hasil promote dari sebuah `LearningEntry`: referensi `promotedCaptureNoteId` di-null-kan, tidak ada efek berantai lain (relasi satu arah).

## 6. Testing

Fokus pada logic yang jika salah akan merusak tujuan utama aplikasi: unit test di backend NestJS untuk aturan transisi status `LearningEntry` (tidak bisa ke `ATTEMPT` tanpa `attemptLog`, tidak bisa ke `LEARNED` tanpa `reflection`, tidak bisa dibuat tanpa `taskId` valid). Kanban, Capture, dan UI lainnya cukup diuji manual selama pemakaian sehari-hari — tidak perlu coverage formal untuk aplikasi single-user.

## 7. Out of Scope (Future Work)

- Autentikasi/login — akan didesain saat aplikasi benar-benar akan di-deploy ke VPS.
- Akses mobile/dari luar — bergantung pada deployment VPS di atas.
- Drag-and-drop kanban yang halus (bisa dimulai dari tombol pindah manual, upgrade belakangan).
- Timer/time-box nudge otomatis pada Learning Entry (dipertimbangkan sebagai peningkatan lanjutan, bukan bagian inti mekanisme).
