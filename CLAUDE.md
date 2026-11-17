# CLAUDE.md – Safety Hauler (Game Bazar Arutmin)

Pegangan untuk Claude Code saat mengerjakan project ini. Baca file ini dulu sebelum mulai kerja.
Desain lengkap ada di [`docs/GDD.md`](docs/GDD.md). Kalau ada yang bertentangan, **GDD yang menang**. Kalau GDD-nya kurang jelas, tanya Weka dulu.

## Tentang project

- **Apa:** Web game edukasi safety tambang batubara untuk stand Weka di bazar PT Arutmin. Judul kerja: "Safety Hauler".
- **Cara main:** Pengunjung scan QR, lalu main di browser HP masing-masing (tanpa install). Satu sesi ±3–4 menit.
- **Alur:** Registrasi → kustomisasi karakter → pakai APD → P2H → loading (excavator → HD) → hauling → event reboisasi → hauling → dumping → kuis → hasil + leaderboard.
- **Pesan utama:** safety lebih penting dari kecepatan. Bobot skor Safety (40%) paling besar.
- **Admin:** dashboard web dengan Mode TV (leaderboard realtime di stand) dan Mode Kelola (data pemain, diskualifikasi, export).
- **Tim:** Weka (owner, keputusan desain) + Claude Code (implementasi).

## Tech stack

| Bagian | Teknologi |
| --- | --- |
| Game | Phaser 3 + TypeScript + Vite |
| Visual | Pixel art resolusi tinggi, tampak atas 3/4: model low-poly Blender → render kecil → kunci ke palet ± 32 warna. Layar 720×1280, art 360×640 (skala 2×) |
| Hosting + API | Cloudflare Workers (paket gratis): satu Worker melayani file statis game, dashboard `/admin`, dan endpoint `/api/*` |
| Database | Cloudflare D1 (SQLite), migrasi SQL lewat Wrangler |
| Auth | Pemain: no HP + token run sekali pakai dari server (tanpa login). Admin: password di Worker secret → token sesi di cookie HttpOnly |
| Admin | Halaman web di `/admin`, polling API tiap ±3 detik (Mode TV + Mode Kelola) |
| Offline | Service worker (PWA) untuk cache asset; hasil disimpan di IndexedDB lalu dikirim ulang saat online |
| Tooling | Wrangler CLI, Vitest |

**Wajib tetap di kuota gratis Cloudflare** (Workers 100.000 request/hari, D1 5 juta baris dibaca & 100.000 ditulis per hari). Jangan pakai fitur Cloudflare yang butuh paket berbayar.

## Struktur folder (target)

```
game tambang/
├── CLAUDE.md
├── docs/
│   └── GDD.md              # Game Design Document (sumber kebenaran desain)
├── shared/                 # Kode yang dipakai game DAN functions
│   ├── scoring.ts          # Rumus skor + daftar teguran (satu-satunya sumber angka skor)
│   ├── validation.ts       # Cek kewajaran data run
│   ├── api.ts              # Tipe request/response API (dipakai game, admin, worker)
│   └── types.ts            # Tipe data: Player, Run, StageData, ScoreBreakdown
├── game/                   # Game pemain (Phaser)
│   ├── src/
│   │   ├── scenes/         # Satu scene per tahap: Boot, Preload, Register, Customize, Apd,
│   │   │                   # P2h, Loading, Hauling, Reboisasi, Dumping, Quiz, Result
│   │   ├── systems/        # supervisor (teguran Pengawas), scoreTracker, storage, sync
│   │   ├── ui/             # Komponen UI reusable (tombol, bar, dialog box)
│   │   ├── data/           # dialog Pengawas, bank soal kuis, safety tips, config tahap
│   │   └── main.ts
│   └── public/assets/      # Sprite pixel art (WebP/PNG + atlas), audio
├── admin/                  # Dashboard admin (build jadi file statis di /admin)
├── worker/                 # Cloudflare Worker: API, auth admin, hitung ulang skor
│   ├── src/index.ts
│   ├── migrations/         # File SQL migrasi D1
│   └── wrangler.toml       # Config Worker, binding D1, static assets
└── package.json            # Workspace root (npm workspaces)
```

Struktur ini masih target, belum dibuat. Ikuti struktur ini waktu bikin file baru. Kalau perlu menyimpang, jelaskan alasannya ke Weka.

## Aturan penting (jangan dilanggar)

1. **Skor tidak pernah dipercaya dari HP.** Game hanya mengirim data mentah per tahap (waktu, jumlah pass, event teguran, sisa HP, dll). Skor resmi dihitung ulang di Worker pakai `shared/scoring.ts`. Tidak boleh ada endpoint yang menerima skor langsung dari client. Waktu mulai run dicatat server, dan tiap run punya token sekali pakai.
2. **Satu sumber angka skor.** Semua bobot, potongan teguran, dan bonus hanya ada di `shared/scoring.ts`. Jangan hardcode angka skor di scene.
3. **Mobile-first, portrait 9:16.** Semua kontrol berupa tap, tahan, atau geser dengan ukuran tombol besar (min 48px). Wajib dites di viewport HP (misal 360×740) sebelum dianggap selesai.
4. **Ringan.** Target total asset < 8 MB, load awal secepat mungkin. Jangan tambah library berat tanpa izin Weka.
5. **Offline-tolerant.** Game harus bisa selesai walau sinyal putus. Pengiriman hasil lewat antrean (IndexedDB) yang otomatis retry.
6. **Placeholder dulu, art belakangan.** Selama art final belum ada, pakai bentuk sederhana (kotak/warna) dengan ukuran dan anchor yang sama seperti sprite nanti. Jadi asset final tinggal ditukar.
7. **Teks game dalam Bahasa Indonesia santai,** boleh sedikit Banjar untuk dialog Pengawas. Semua teks taruh di `game/src/data/`, jangan tersebar di kode.
8. **Data pemain minimal.** Hanya nama, divisi, no HP, avatar, consent. Jangan log no HP ke console atau analytics.
9. **Rahasia tidak masuk repo.** Password admin dan secret lain disimpan pakai `wrangler secret put` (produksi) dan `.dev.vars` (lokal, masuk .gitignore).

## Konvensi kode

- TypeScript `strict`. Hindari `any`.
- Nama file dan variabel dalam bahasa Inggris. Teks yang tampil ke pemain dalam Bahasa Indonesia (lewat `data/`).
- Satu scene = satu file. Logika yang dipakai banyak scene taruh di `systems/`.
- Fungsi skor dan validasi di `shared/` harus pure (tanpa I/O) dan punya unit test (Vitest).
- Commit kecil dan jelas: `feat(hauling): rintangan LV menyeberang`, `fix(scoring): potongan overload`.

## Cara kerja dengan Weka

- Komunikasi pakai Bahasa Indonesia santai.
- Kerjakan per fase sesuai **Roadmap** di GDD. Selesaikan satu fitur sampai bisa dicoba, baru lanjut.
- Setelah fitur selesai: kasih tahu cara mencobanya (perintah + apa yang harus dicek di HP).
- Kalau ada keputusan desain yang belum ada di GDD (angka, alur, tampilan), tanya dulu. Jangan diputuskan diam-diam.
- Kalau keputusan sudah diambil dan mengubah desain, update juga `docs/GDD.md` supaya tetap sinkron.

## Perintah

Semua dijalankan dari root repo. Butuh Node ≥ 22.12.

```
npm install                   # sekali, install semua workspace
npm run db:migrate:local      # sekali (dan tiap ada migrasi baru): migrasi D1 lokal
npm run dev:api               # API Worker + D1 lokal di http://localhost:8787
npm run dev                   # game (Vite, hot reload) di http://localhost:5173, /api di-proxy ke :8787
npm run dev:host              # sama, tapi bisa dibuka dari HP di WiFi yang sama
npm test                      # test scoring & validasi (Vitest)
npm run smoke                 # smoke test API (butuh dev:api jalan; menulis data uji ke D1 LOKAL)
npm run typecheck             # typecheck shared/
npm run build                 # build game → admin (ke game/dist/admin) → typecheck worker
```

- `npm run dev:api` menyajikan hasil **build** di `game/dist`. Untuk ngoding game pakai `npm run dev` (Vite), API tetap dari `dev:api`.
- Dev only: lompat langsung ke tahap lewat URL, misal `http://localhost:5173/?stage=Loading` atau `?stage=Hauling&part=2`. Di laptop: panah kiri/kanan = pindah lajur, atas/bawah = kecepatan ±5 km/jam, spasi = mundur.
- Password admin lokal: salin `worker/.dev.vars.example` ke `worker/.dev.vars` (tidak masuk git). Produksi: `npx wrangler secret put ADMIN_PASSWORD`. Dashboard di `/admin/`.
- Build game mengosongkan `game/dist`, jadi admin harus di-build setelah game (`npm run build` sudah urut).
- Cloud (hanya Weka yang menjalankan): `npx wrangler login`, `npx wrangler d1 create safety-hauler` (salin `database_id` ke `worker/wrangler.toml`), `npx wrangler d1 migrations apply safety-hauler --remote`, `npx wrangler deploy` (dari folder `worker/`, setelah `npm run build`).

## Status

- [x] GDD versi awal (`docs/GDD.md`)
- [x] Fase 0 – Fondasi (repo, Phaser + Vite, Cloudflare Worker + D1). Lokal selesai; remote GitHub dan D1/Worker di cloud belum dibuat.
- [ ] Fase 1 – Prototype gameplay (placeholder)
- [x] Fase 2 – Alur lengkap (leaderboard di layar hasil menyusul Fase 3)
- [x] Fase 3 – Backend & admin (kode selesai dan dites lokal; D1 + deploy ke Cloudflare belum dilakukan)
- [ ] Fase 4 – Art & audio
- [ ] Fase 5 – Uji & siap event

Update checklist ini setiap fase selesai.
