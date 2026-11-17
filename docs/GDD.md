# GDD Game Bazar Arutmin – Safety Hauler

Versi awal: 17 Nov 2026 · Weka

## Ringkasan

**Safety Hauler** (judul kerja) adalah web game 2.5D isometrik yang dimainkan pengunjung bazar PT Arutmin di HP masing-masing lewat scan QR. Pemain menjalani satu siklus kerja tambang (loading, hauling, reklamasi, dumping) sambil belajar aturan safety. Skornya masuk leaderboard bersama.

| Aspek | Keputusan |
| --- | --- |
| Platform | Web browser HP, tanpa install, portrait, kontrol sentuh |
| Gaya visual | 2.5D isometrik, satu art style konsisten |
| Durasi main | 3–4 menit per sesi |
| Target pemain | Karyawan Arutmin, kontraktor, keluarga, pengunjung umum bazar |
| Pesan utama | Safety lebih penting dari kecepatan: bobot skor safety > produktivitas |
| Leaderboard | Tampil di HP pemain di akhir game + dashboard admin realtime |
| Tim | Weka + Claude Code |

## Alur pemain

Total target ± 3–4 menit dari scan QR sampai lihat leaderboard.

| # | Tahap | Durasi target | Masuk skor? |
| --- | --- | --- | --- |
| 1 | Scan QR → registrasi | 30 dtk | Tidak |
| 2 | Kustomisasi karakter | 15 dtk | Tidak |
| 3 | Pakai APD | 20 dtk | Ya (Safety) |
| 4 | P2H unit | 15 dtk | Ya (Safety) |
| 5 | Loading coal ke HD | 40 dtk | Ya (Produktivitas) |
| 6 | Hauling bagian 1 | 35 dtk | Ya (Safety + HP unit) |
| 7 | Event reboisasi | 20 dtk | Ya (Bonus) |
| 8 | Hauling bagian 2 | 15 dtk | Ya (Safety + HP unit) |
| 9 | Mundur ke dumping point + dumping | 35 dtk | Ya (Produktivitas + Safety) |
| 10 | Kuis safety 3 soal | 30 dtk | Ya (Bonus) |
| 11 | Hasil, Kartu Operator, leaderboard | – | – |

Antar tahap ada layar transisi 1–2 detik berisi satu "Safety Tip" singkat. Pemain bisa skip dengan tap.

## Detail tahap gameplay

### 1. Registrasi

- Field: nama, divisi/perusahaan (dropdown: Arutmin, kontraktor, umum + isian bebas), no HP.
- Checkbox persetujuan: "No HP hanya dipakai untuk menghubungi pemenang."
- No HP jadi ID unik pemain. Kalau nomornya sudah terdaftar, lanjut ke akun yang sama.
- Data disimpan di HP (localStorage), jadi kalau tab ketutup pemain gak perlu daftar ulang.

### 2. Kustomisasi karakter

- Pilihan: cowok/cewek, 3 gaya rambut, 3 warna kulit.
- Preview karakter isometrik berputar pelan di tengah layar.

### 3. Pakai APD

- Karakter tampil tanpa APD. Item APD (helm, kacamata safety, rompi reflektif, sepatu safety) di-drag ke badan.
- Tiap item terpasang memunculkan satu kalimat alasan, misal helm: melindungi kepala dari benda jatuh dan benturan.
- Tombol Mulai selalu aktif. Kalau ada APD yang belum dipakai, Pengawas menghentikan pemain dan menunjuk item yang kurang (− poin Safety per teguran).
- Opsional: 1 item jebakan (misal sandal atau topi biasa). Kalau dipakai, kena teguran.

### 4. P2H (Pemeriksaan Harian unit)

- Tampil excavator dengan 4 titik cek: ban/track, lampu, oli bocor, kaca/spion.
- Satu titik bermasalah secara acak. Pemain tap semua titik, lalu laporkan yang bermasalah.
- Benar = bonus Safety. Lewati P2H = teguran.

### 5. Loading (excavator → HD)

- Target 5 pass sampai bak HD penuh. Progress bar muatan + timer berjalan.
- Mekanik timing: bucket berayun dari pit ke bak. Ada zona tepat di atas bak. Tap untuk menumpahkan muatan.
- Tepat di zona hijau = muatan penuh + bonus kecil. Pinggir zona = muatan normal. Meleset = coal tumpah, pass terbuang.
- Overload: setelah bak penuh masih ada tombol "tambah lagi". Kalau ditekan, Pengawas menegur karena overload membahayakan (− Safety). Ini jebakan edukatif.

### 6. Hauling bagian 1

- Kamera isometrik mengikuti truk yang otomatis maju. Kontrol: geser kiri/kanan untuk pindah lajur, slider kecepatan di bawah layar (keputusan Weka, 17 Nov 2026: lebih gampang dari tombol gas dan rem).
- HP bar unit (kondisi truk) + speedometer dengan batas kecepatan dari rambu.

| Rintangan | Aksi benar | Kalau salah |
| --- | --- | --- |
| Lubang jalan | Hindari / pindah lajur | − HP kecil |
| Batu jatuh di jalan | Hindari | − HP sedang |
| Rambu batas kecepatan | Rem sampai di bawah batas | Teguran ngebut (− Safety) |
| LV menyeberang di persimpangan | Berhenti / rem | − HP besar + teguran |
| Jalan licin habis hujan | Kurangi kecepatan | Truk tergelincir, − HP sedang |
| Debu menutup pandangan | Pelan, ikuti patok jalan | − HP kecil |

- Sesekali panggilan radio: pertanyaan pilihan ganda singkat (misal "Ada LV mau lewat, kamu harus..."). Benar = bonus Safety.

### 7. Event reboisasi

- Muncul di tengah hauling: "Ada lahan bekas tambang yang siap direklamasi!"
- Langkah 1: tap petak lahan untuk sebar topsoil. Langkah 2: tap petak yang sama untuk tanam bibit.
- Timer 20 detik. Makin cepat selesai, makin besar bonus.
- Penutup: satu kalimat fakta reklamasi (perlu divalidasi tim lingkungan).

### 8. Hauling bagian 2

- Singkat, 2–3 rintangan, menuju area dumping.

### 9. Dumping

- Bagian A, mundur: truk mundur ke dumping point. Spotter memberi aba-aba. Tahan tombol mundur, lepas saat spotter memberi tanda stop, sebelum safety berm. Terlalu jauh = nabrak berm, teguran.
- Bagian B, slider: slider kecepatan dumping + zona hijau yang bergerak. Pemain menjaga slider tetap di zona hijau sampai bak kosong.
    - Di bawah zona (terlalu lambat): Pengawas menegur karena lambat (− poin).
    - Di atas zona (terlalu cepat): Pengawas menegur karena tidak safety (− poin).
    - Combo: tiap 3 detik akurat berturut-turut = bonus poin.

### 10. Kuis safety

- 3 soal pilihan ganda acak dari bank soal (target 20–30 soal). 10 detik per soal.
- Benar = bonus. Salah = tampilkan jawaban yang benar + penjelasan 1 kalimat.

### 11. Hasil

- Rincian skor per kategori, total, dan peringkat pemain.
- Kartu Operator: karakter pemain, nama, divisi, skor, rank. Bisa disimpan sebagai gambar untuk dibagikan.
- Leaderboard top 10 + posisi pemain sendiri.

### Angka awal gameplay (Fase 1, di-tuning saat playtest)

Ditentukan Claude Code atas permintaan Weka (17 Nov 2026). Semua angka ada di `game/src/data/`.

| Tahap | Angka |
| --- | --- |
| Loading | Bucket berayun 520 px/dtk. Bar kuning ±160 px di atas bak; zona hijau ±45 px bergerak bolak-balik di dalam bar (gerak sinus, 2,2 rad/dtk). Hijau = 1 pass + bonus sempurna; kuning = setengah pass; di luar bar = tumpah. Bak penuh di 5 pass. Batas waktu 60 dtk |
| Hauling | 3 lajur, geser jalan ≥ 60 px untuk pindah lajur. Kecepatan diatur slider di bawah layar (0–60 km/jam, mulai 30); truk naik 25 km/jam/dtk dan turun 50 km/jam/dtk menuju angka slider. Garis merah di slider = batas kecepatan. Batas default 40, zona rambu 20. Ngebut = lewat batas +2 km/jam selama 1 dtk (teguran lagi tiap 3 dtk). HP unit 100 dibagi dua bagian |
| Hauling – rintangan | Lubang −5 HP, batu −10, licin −10 dan debu −5 (kalau di atas 25 km/jam, sekali per zona), LV −25 + teguran (kalau lewat garis stop di atas 8 km/jam saat LV menyeberang) |
| Hauling – panjang | Bagian 1: 9 rintangan + 1 radio (± 35–50 dtk). Bagian 2: 3 rintangan (± 15–20 dtk) |
| Reboisasi | 9 petak (3×3), tiap petak 2 tap (topsoil lalu bibit), 20 dtk |
| Dumping A | Mundur 210 px/dtk, zona stop 70 px sebelum berm |
| Dumping B | 10 dtk, zona hijau 24% lebar slider dan bergerak (gerak sinus 1,9 + 4,3 rad/dtk). Di luar zona 1,5 dtk = teguran (lalu tiap 2,5 dtk). Combo tiap 3 dtk akurat berturut-turut |
| Transisi | Safety Tip 1,8 dtk sebelum APD, P2H, Loading, Hauling 1, Dumping, Kuis, Hasil. Reboisasi dan Hauling 2 tanpa tip supaya terasa satu perjalanan |

## Sistem skor

Skor maksimum ± 10.000. Safety punya porsi terbesar (40%), jadi pemain yang ngebut tapi sering ditegur kalah dari yang pelan tapi patuh. Angka di bawah adalah titik awal dan akan di-tuning saat playtest.

```
Total = Produktivitas + Safety + Kondisi Unit + Bonus
```

| Kategori | Maks | Cara hitung |
| --- | --- | --- |
| Produktivitas – Loading | 1.500 | 1.000 × (muatan / target) + bonus waktu: max(0, 500 − 10 × detik di atas 25 dtk) |
| Produktivitas – Dumping | 1.500 | 1.500 × (% waktu slider di zona hijau) |
| Safety | 4.000 | Mulai 4.000, dikurangi tiap teguran (tabel di bawah). Minimal 0 |
| Kondisi Unit | 1.000 | 1.000 × (sisa HP / HP awal) |
| Bonus Reboisasi | 1.000 | 1.000 × (sisa waktu / 20 dtk), hanya jika semua petak selesai |
| Bonus Kuis | 900 | 300 per jawaban benar |
| Bonus Combo & lainnya | ± 600 | Pass loading sempurna +50, combo dumping +100, radio benar +100, P2H benar +200 |

**Teguran Pengawas (mengurangi Safety)**

| Pelanggaran | Potongan |
| --- | --- |
| Mulai tanpa APD lengkap (per item) | −300 |
| Pakai item APD jebakan | −200 |
| Melewati P2H | −400 |
| Overload muatan | −500 |
| Melebihi batas kecepatan (per kejadian) | −200 |
| Tidak berhenti untuk LV | −500 |
| Menabrak safety berm saat mundur | −400 |
| Dumping terlalu cepat (per teguran) | −150 |
| Dumping terlalu lambat (per teguran) | −100 |

- Muatan loading dihitung maksimal sebesar target: overload tidak menambah poin.
- Bonus waktu loading dihitung dari durasi tahap Loading saja.
- P2H benar (+200) dan radio benar (+100) masuk kategori Bonus, bukan Safety. Safety tetap maks 4.000.
- Bonus combo & lainnya tidak dibatasi; angka ± 600 di tabel hanya perkiraan.
- Tie-breaker: skor sama → total waktu main lebih cepat menang.
- Skor dihitung ulang di server dari data tiap tahap, bukan dari angka yang dikirim HP (lihat bagian Anti-curang).

## Karakter Pengawas & dialog

Pengawas adalah wajah game ini: galak tapi lucu, dan selalu benar soal safety. Dia muncul sebagai pop-up karakter + balon teks 2 detik, tanpa menghentikan game kecuali saat cek APD. Nama sementara: **Pak Bos** (bisa diganti nama yang lebih lokal).

- Ekspresi yang dibutuhkan: marah, kesal, kaget, bangga, jempol.
- Tiap situasi punya 3 variasi dialog, dipilih acak biar gak bosan.
- Bahasa: santai, boleh campur sedikit Banjar biar dekat dengan pemain lokal.

| Situasi | Contoh dialog |
| --- | --- |
| APD belum lengkap | "Eits! Helmnya mana? Kepala cuma satu, jangan dijadiin taruhan!" |
| Pakai sandal | "Ini tambang, bukan pantai!" |
| Lewati P2H | "Unit belum dicek kok udah naik? P2H dulu!" |
| Overload | "Muatan lebih bukan prestasi, itu bahaya!" |
| Ngebut | "Pelan-pelan! Rambunya bukan hiasan!" |
| Tidak berhenti untuk LV | "WOI! LV-nya hampir kamu lindas!" |
| Nabrak berm | "Ikutin aba-aba spotter, jangan ngira-ngira!" |
| Dumping terlalu lambat | "Ini dumping apa nunggu jodoh? Lama banget!" |
| Dumping terlalu cepat | "Mau celaka kah? Buru-buru banget, gak safety!" |
| Combo akurat | "Nah, begitu! Operator teladan!" |
| Hasil skor tinggi | "Mantap, besok kamu yang ngajarin yang lain." |
| Hasil skor rendah | "Gak apa-apa, yang penting pulang selamat. Coba lagi!" |

## Art direction & daftar asset

Semua asset dibuat sebagai model 3D low-poly di Blender, lalu di-render jadi sprite isometrik dengan satu setting kamera dan lighting yang sama. Hasilnya otomatis konsisten, dan asset baru tinggal render ulang dengan setting yang sama.

**Aturan style (dikunci dari awal)**

- Kamera: orthographic, sudut isometrik 2:1, arah cahaya dari kiri-atas.
- Bentuk: low-poly, proporsi agak chibi untuk karakter (kepala besar biar APD kelihatan jelas).
- Warna: palet terbatas ± 16 warna. Kuning HD/excavator, oranye rompi, cokelat-hitam batubara, hijau reklamasi, biru langit pucat.
- Outline: tebal gelap (bisa lewat shader Freestyle Blender atau efek di game).
- UI: tombol besar dan bulat, font tebal mudah dibaca di layar kecil.
- Ukuran: sprite di-export WebP, dikemas jadi texture atlas. Target total asset < 8 MB.

| Kategori | Asset | Animasi / varian | Prioritas |
| --- | --- | --- | --- |
| Karakter pemain | Cowok, cewek | Idle, jalan, naik unit; 3 rambut, 3 warna kulit | MVP |
| APD | Helm, kacamata, rompi, sepatu safety + item jebakan | Ikon UI + versi terpasang di karakter | MVP |
| Pengawas | Pak Bos | 5 ekspresi | MVP |
| Spotter | 1 karakter | Aba-aba mundur, stop | MVP |
| Excavator | 1 unit | Swing bucket, gali, tumpah | MVP |
| HD truck | 1 unit | Jalan, mundur, dump (bak naik), tergelincir | MVP |
| Light Vehicle | 1 unit | Jalan | MVP |
| Lingkungan | Pit, jalan hauling, dumping point, safety berm, patok jalan, rambu | Tile isometrik modular | MVP |
| Rintangan | Lubang, batu, genangan, efek debu | Statis + partikel | MVP |
| Reklamasi | Petak lahan, topsoil, bibit, pohon tumbuh | 3 tahap tumbuh | MVP |
| Efek | Coal tumpah, partikel debu, confetti hasil | Partikel | Nice to have |
| UI | Logo game, tombol, progress bar, HP bar, speedometer, Kartu Operator | – | MVP |
| Audio | BGM ringan, mesin, klakson, suara teguran, sukses | – | Nice to have |

Kalau modeling dari nol terlalu berat, alternatifnya: ambil model low-poly berlisensi bebas (CC0), lalu samakan material dan palet di Blender sebelum render. Yang penting semua lewat setting render yang sama.

## Arsitektur teknis

Semua jalan di Cloudflare paket gratis, tanpa kartu kredit. Satu Worker melayani file game, dashboard admin, dan API. Data disimpan di D1 (database SQLite milik Cloudflare).

| Bagian | Teknologi | Catatan |
| --- | --- | --- |
| Game | Phaser 3 + TypeScript + Vite | Scene per tahap, portrait 9:16, kontrol sentuh |
| Hosting | Cloudflare Workers (static assets) | Domain gratis *.workers.dev. Request ke file statis gratis dan tak terbatas |
| API | Cloudflare Worker (TypeScript) | Registrasi, mulai run, kirim hasil, leaderboard, admin |
| Database | Cloudflare D1 | Tabel players, runs, config |
| Validasi skor | Di Worker, memakai shared/scoring.ts | Server menghitung ulang skor dari data mentah |
| Identitas pemain | No HP + token run dari server | Tanpa login/OTP |
| Auth admin | Password di Worker secret → token sesi (cookie HttpOnly) | Hanya admin yang bisa buka dashboard |
| Dashboard admin | Halaman /admin, ambil data dari API tiap ± 3 detik | Mode TV + Mode Kelola |
| Offline | Service worker (PWA) cache asset; hasil disimpan di IndexedDB lalu dikirim ulang saat online | Penting karena sinyal di lokasi bisa jelek |

Kuota gratis Workers 100.000 request/hari, D1 5 juta baris dibaca dan 100.000 baris ditulis per hari. Perkiraan kebutuhan bazar < 20.000 request/hari, termasuk polling dashboard admin.

**Struktur database D1**

| Tabel | Kolom utama |
| --- | --- |
| players | phone (PK), name, division, avatar_json, consent, created_at, play_count |
| runs | id (PK), phone, token_hash, started_at (dicatat server), finished_at, stages_json, score_json, total, total_time_ms, status (in_progress / valid / flagged / dq) |
| config | key (PK), value_json: max_runs_per_player, ranked_run (first/best), event_open, quiz_bank |

Leaderboard tidak punya tabel sendiri. Datanya diambil lewat query: run valid per pemain (pertama atau terbaik sesuai config), urut total tertinggi lalu waktu tercepat.

Nilai awal config: `max_runs_per_player` = 2, `ranked_run` = best, `event_open` = true. Bisa diubah admin saat event.

**Endpoint API**

| Method & path | Fungsi |
| --- | --- |
| POST /api/players | Daftar atau ambil pemain berdasarkan no HP |
| POST /api/runs | Mulai run: cek jatah main, server mencatat waktu mulai, kirim runId + token sekali pakai |
| POST /api/runs/:id/finish | Kirim data mentah tahap + token. Server hitung skor, cek kewajaran, simpan status |
| GET /api/leaderboard | Top 10 + posisi pemain (opsional) |
| /api/admin/* | Login, daftar pemain dan run, diskualifikasi, config, export CSV, statistik |

**Alur data satu sesi**

1. Pemain daftar → POST /api/players.
2. Mulai game → POST /api/runs. Server mencatat waktu mulai, jadi durasi main tidak bisa dipalsukan dari HP.
3. Selama main, data mentah tiap tahap disimpan lokal di HP.
4. Selesai → POST /api/runs/:id/finish. Worker menghitung ulang skor dengan shared/scoring.ts, cek kewajaran, simpan status valid atau flagged.
5. HP menampilkan hasil + leaderboard. Dashboard admin ikut berubah saat polling berikutnya.

## Dashboard admin

Dashboard punya dua mode: Mode TV untuk dipajang di stand, dan Mode Kelola untuk panitia.

**Mode TV (layar penuh)**

- Top 10 leaderboard dengan nama, divisi, skor. Update otomatis tiap ± 3 detik.
- Animasi + suara saat ada pemain baru masuk top 10.
- Ticker bawah: jumlah pemain hari ini, skor tertinggi, "Pemain terakhir: [nama] – [skor]".
- QR code besar di pojok supaya orang yang lewat bisa langsung ikut main.

**Mode Kelola**

- Tabel semua pemain dan sesi: cari, filter per divisi, urutkan per skor atau waktu.
- Tandai/diskualifikasi run yang mencurigakan. Run berstatus flagged muncul di atas.
- Reset leaderboard (misal per hari) dengan konfirmasi dua langkah.
- Atur config: buka/tutup event, jumlah percobaan per pemain, mode ranking (percobaan pertama atau terbaik).
- Export pemain + skor ke Excel/CSV untuk undian atau penyerahan hadiah.
- Statistik singkat: total pemain, rata-rata skor, pelanggaran safety paling sering. Ini bisa jadi bahan laporan menarik untuk K3.

## Anti-curang, sinyal & edge case

Aturan dasarnya: HP pemain tidak pernah dipercaya untuk menentukan skor. Server yang menghitung, dan admin yang punya keputusan akhir.

| Risiko | Penanganan |
| --- | --- |
| Kirim skor palsu lewat devtools | HP hanya kirim data mentah tahap. Skor dihitung Worker. Tidak ada endpoint untuk menulis skor langsung |
| Data mentah dimanipulasi (misal waktu 1 detik) | Cek kewajaran: durasi per tahap, total waktu dibandingkan waktu mulai yang dicatat server (minimal ± 90 dtk), jumlah event sesuai jumlah rintangan. Gagal cek → status flagged |
| Kirim hasil berkali-kali atau pakai run orang lain | Tiap run punya token sekali pakai dari server. Hasil hanya diterima sekali per run |
| Main berkali-kali | Batas percobaan per no HP (config). Mode ranking: percobaan pertama atau terbaik |
| No HP asal-asalan | Validasi format nomor Indonesia. Opsional: kode unik dari penjaga stand saat ada hadiah |
| Satu orang banyak nomor | Diterima sebagai risiko kecil. Admin bisa diskualifikasi manual. Pemenang diverifikasi saat ambil hadiah |
| Spam request | Rate limit sederhana per IP di Worker + batas run per nomor |
| Sinyal putus di tengah game | Game tetap jalan offline. Hasil disimpan di IndexedDB dan dikirim otomatis saat online. Layar hasil menampilkan "menunggu sinyal..." |
| Tab tertutup / HP mati di tengah game | Run dianggap batal, tidak mengurangi jatah percobaan kalau belum selesai tahap Loading |
| HP kentang / browser lama | Target tes: Chrome Android 2–3 tahun terakhir + Safari iOS. Opsi grafis rendah (partikel mati) otomatis kalau FPS turun |
| Banyak pemain bersamaan | Worker otomatis skala. Kebutuhan bazar jauh di bawah kuota gratis 100.000 request/hari |

## Roadmap pengerjaan

Urutannya: gameplay jalan dulu pakai kotak-kotak placeholder, baru art masuk belakangan. Jadi keseruan game bisa dites sebelum waktu habis buat bikin asset. Tanggal menyusul setelah tanggal bazar pasti.

**Fase 0 – Fondasi**

- [ ] Setup repo GitHub + project Phaser 3 + TypeScript + Vite
- [ ] Setup Cloudflare (Wrangler, Worker, D1) + environment dev/prod
- [x] Buat CLAUDE.md berisi ringkasan GDD ini, aturan kode, dan struktur folder sebagai pegangan Claude Code

**Fase 1 – Prototype gameplay (placeholder)**

- [x] Scene manager + transisi antar tahap
- [x] Minigame Loading (timing bucket)
- [x] Hauling (lajur, gas/rem, rintangan, HP bar, rambu kecepatan)
- [x] Event Reboisasi
- [x] Dumping (mundur + slider zona hijau)
- [ ] Playtest pertama: apakah tiap minigame paham tanpa dijelasin?

**Fase 2 – Alur lengkap**

- [ ] Registrasi, kustomisasi, APD drag & drop, P2H, kuis, layar hasil
- [ ] Sistem teguran Pengawas + dialog acak
- [ ] Skor lokal sesuai rumus

**Fase 3 – Backend & admin**

- [ ] API Worker + D1: registrasi, run token, hitung ulang skor + cek kewajaran
- [ ] Leaderboard realtime di HP
- [ ] Dashboard admin: Mode TV + Mode Kelola + export
- [ ] Offline mode (PWA + antrean kirim hasil)

**Fase 4 – Art & audio**

- [ ] Kunci style: 1 karakter + 1 HD jadi "style reference"
- [ ] Produksi asset sesuai daftar, render isometrik, texture atlas
- [ ] Ganti placeholder dengan asset final + animasi
- [ ] Audio

**Fase 5 – Uji & siap event**

- [ ] Tuning skor dari hasil playtest (5–10 orang beda usia)
- [ ] Tes di berbagai HP + tes sinyal lemah
- [ ] Load test ringan (simulasi banyak pemain bersamaan)
- [ ] Validasi konten ke K3 + revisi teks
- [ ] Cetak banner QR, siapkan laptop/TV untuk Mode TV
- [ ] Gladi: reset data uji, buka event

## Yang perlu divalidasi

Ini dikerjakan menjelang Fase 5. Semua teks edukasi di game sementara ditulis umum dulu, lalu disesuaikan dengan SOP site.

**Ke tim K3 / lingkungan Arutmin**

- [ ] Daftar APD wajib di area tambang (apakah ada tambahan, misal sarung tangan atau masker debu)
- [ ] Istilah dan isi checklist P2H unit
- [ ] Batas kecepatan di jalan hauling dan aturan prioritas di persimpangan (HD vs LV)
- [ ] Prosedur dumping: aba-aba spotter, safety berm
- [ ] Fakta reklamasi/reboisasi yang ditampilkan
- [ ] Bank soal kuis safety

**Ke panitia bazar**

- [ ] Tanggal, jam, dan lokasi stand
- [ ] Ketersediaan listrik, WiFi, atau sinyal seluler di lokasi
- [ ] Logo dan aset brand Arutmin versi resmi
- [ ] Hadiah (ada atau tidak, berapa pemenang, per hari atau total)
- [ ] Aturan penyimpanan data pengunjung (no HP)
