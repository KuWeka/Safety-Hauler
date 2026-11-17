import type { ViolationType } from '@shared/types';

/** Total di atas ini Pak Bos memuji "skor tinggi"; di bawahnya menyemangati. Bukan aturan skor. */
export const HIGH_SCORE_THRESHOLD = 7000;

export const VIOLATION_LABEL: Record<ViolationType, string> = {
  apdMissing: 'APD tidak lengkap',
  apdTrap: 'Pakai item non-APD',
  p2hSkipped: 'Melewati P2H',
  overload: 'Overload muatan',
  speeding: 'Ngebut',
  lvNotStopped: 'Tidak berhenti untuk LV',
  bermHit: 'Menabrak safety berm',
  dumpTooFast: 'Dumping terlalu cepat',
  dumpTooSlow: 'Dumping terlalu lambat',
};

export const RESULT_TEXT = {
  title: 'Hasil Kerja',
  total: 'Total skor',
  productivity: 'Produktivitas',
  safety: 'Safety',
  unit: 'Kondisi unit',
  bonus: 'Bonus',
  violations: 'Teguran Pengawas',
  noViolations: 'Tanpa teguran. Mantap!',
  violationLine: (label: string, count: number, points: number) => `${label} ×${count} (−${points})`,
  sending: 'Mengirim hasil...',
  waiting: 'Menunggu sinyal... hasilmu aman dan akan dikirim otomatis.',
  rankLine: (rank: number, runsLeft: number) => `Peringkat #${rank}  ·  Sisa main ${runsLeft}x`,
  rankedLine: (rank: number) => `Peringkat #${rank}`,
  recorded: 'Hasil sudah tercatat.',
  flagged: 'Hasilmu sedang ditinjau panitia.',
  noRun: 'Hasil tidak tercatat (sesi tidak ditemukan).',
  sendFailed: 'Hasil tidak bisa dikirim. Tunjukkan layar ini ke panitia.',
  leaderboard: 'Leaderboard',
  finished: 'Selesai',
  card: 'Kartu Operator',
  playAgain: 'Main Lagi',
  incomplete: 'Data run belum lengkap. Main dari awal untuk lihat skor.',
  cardTitle: 'KARTU OPERATOR',
  cardRank: (rank: number | null) => `Peringkat: ${rank ?? '-'}`,
  save: 'Simpan Gambar',
  close: 'Tutup',
  fileName: 'kartu-operator-safety-hauler.png',
};
