// Urutan scene sesuai alur GDD + teks yang tampil ke pemain.
export const STAGES = [
  { key: 'Boot', label: 'Boot' },
  { key: 'Preload', label: 'Memuat...' },
  { key: 'Register', label: 'Registrasi' },
  { key: 'Customize', label: 'Kustomisasi Karakter' },
  { key: 'Apd', label: 'Pakai APD' },
  { key: 'P2h', label: 'P2H Unit' },
  { key: 'Loading', label: 'Loading Coal ke HD' },
  { key: 'Hauling', label: 'Hauling' },
  { key: 'Reboisasi', label: 'Event Reboisasi' },
  { key: 'Dumping', label: 'Dumping' },
  { key: 'Quiz', label: 'Kuis Safety' },
  { key: 'Result', label: 'Hasil & Leaderboard' },
] as const;

export type StageKey = (typeof STAGES)[number]['key'];

/** Setelah Result, main lagi mulai dari Registrasi. */
export const RESTART_STAGE: StageKey = 'Register';

export const UI_TEXT = {
  next: 'Lanjut',
  playAgain: 'Main Lagi',
  placeholder: '(placeholder)',
  safetyMax: (n: number) => `Skor Safety maks: ${n}`,
};
