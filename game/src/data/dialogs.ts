// Dialog Pengawas (Pak Bos): 3 variasi per situasi, dipilih acak. Boleh campur sedikit Banjar.
export const DIALOG = {
  apdMissing: [
    'Eits! Helmnya mana? Kepala cuma satu, jangan dijadiin taruhan!',
    'APD belum lengkap kok sudah jalan? Balik dulu!',
    'Kada lengkap APD-nya, kada boleh masuk!',
  ],
  apdTrap: [
    'Ini tambang, bukan pantai!',
    'Sandal? Serius kah? Pakai sepatu safety!',
    'Gaya boleh, tapi safety nomor satu!',
  ],
  p2hSkipped: [
    'Unit belum dicek kok udah naik? P2H dulu!',
    'P2H dilewati? Nanti remnya blong siapa yang tanggung?',
    'Cek dulu unitnya, jangan main naik aja!',
  ],
  p2hWrong: [
    'Salah lapor! Cek lagi yang teliti.',
    'Bukan itu yang rusak. Matanya dipakai, bos!',
    'Kalau lapornya salah, unit rusak tetap jalan. Bahaya!',
  ],
  p2hCorrect: [
    'Mantap, temuanmu tepat! Unit diperbaiki dulu.',
    'Nah, teliti! Gitu baru P2H.',
    'Bagus banar, kerusakan ketahuan sebelum celaka!',
  ],
  overload: [
    'Muatan lebih bukan prestasi, itu bahaya!',
    'Stop! Baknya sudah penuh, jangan ditambah lagi!',
    'Overload bikin rem kerja keras. Kada usah serakah!',
  ],
  speeding: [
    'Pelan-pelan! Rambunya bukan hiasan!',
    'Ngebut mau ke mana? Jalan tambang bukan sirkuit!',
    'Lihat speedometer! Turunkan kecepatan!',
  ],
  lvNotStopped: [
    'WOI! LV-nya hampir kamu lindas!',
    'Di persimpangan itu BERHENTI, bukan tancap gas!',
    'Astaga! Utamakan keselamatan, berhenti dulu!',
  ],
  bermHit: [
    'Ikutin aba-aba spotter, jangan ngira-ngira!',
    'Berm-nya ditabrak! Spotter sudah bilang stop!',
    'Lihat spotter-nya, bujur-bujur kada didengar!',
  ],
  dumpTooSlow: [
    'Ini dumping apa nunggu jodoh? Lama banget!',
    'Ayo, dipercepat sedikit!',
    'Lambat banar! Antrean di belakang sudah panjang!',
  ],
  dumpTooFast: [
    'Mau celaka kah? Buru-buru banget, gak safety!',
    'Pelan! Dumping kecepatan tinggi bikin unit oleng!',
    'Jangan buru-buru, ikuti zona hijau!',
  ],
  combo: [
    'Nah, begitu! Operator teladan!',
    'Mantap! Stabil terus!',
    'Bagus banar! Pertahankan!',
  ],
  radioCorrect: [
    'Betul! Gitu baru operator!',
    'Jawaban tepat, mantap!',
    'Nah, paham aturan. Bagus!',
  ],
  scoreHigh: [
    'Mantap, besok kamu yang ngajarin yang lain.',
    'Operator idaman! Safety-nya juara!',
    'Kerja bagus, pulang selamat!',
  ],
  scoreLow: [
    'Gak apa-apa, yang penting pulang selamat. Coba lagi!',
    'Masih banyak teguran. Ayo belajar lagi!',
    'Pelan asal selamat. Coba sekali lagi!',
  ],
} as const;

export type Situation = keyof typeof DIALOG;

/** Situasi pujian (balon hijau). Sisanya teguran (balon merah). */
export const PRAISE: ReadonlySet<Situation> = new Set(['combo', 'radioCorrect', 'p2hCorrect', 'scoreHigh', 'scoreLow']);

/** 5 ekspresi Pak Bos sesuai GDD. */
export type Expression = 'marah' | 'kesal' | 'kaget' | 'bangga' | 'jempol';

export const EXPRESSION: Record<Situation, Expression> = {
  apdMissing: 'marah',
  apdTrap: 'kesal',
  p2hSkipped: 'marah',
  p2hWrong: 'kesal',
  p2hCorrect: 'jempol',
  overload: 'marah',
  speeding: 'kesal',
  lvNotStopped: 'kaget',
  bermHit: 'kaget',
  dumpTooSlow: 'kesal',
  dumpTooFast: 'kaget',
  combo: 'jempol',
  radioCorrect: 'jempol',
  scoreHigh: 'bangga',
  scoreLow: 'jempol',
};

export const SUPERVISOR_SHOW_MS = 2000;
