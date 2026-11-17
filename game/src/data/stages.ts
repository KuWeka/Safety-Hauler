// Urutan alur sesuai GDD + teks yang tampil ke pemain.
// Hauling dipakai dua kali (bagian 1 dan 2) dengan event Reboisasi di tengahnya.

export type SceneKey =
  | 'Boot'
  | 'Preload'
  | 'Register'
  | 'Customize'
  | 'Apd'
  | 'P2h'
  | 'Loading'
  | 'Hauling'
  | 'Reboisasi'
  | 'Dumping'
  | 'Quiz'
  | 'Result';

export interface FlowStep {
  scene: SceneKey;
  label: string;
  part?: 1 | 2;
  /** Tampilkan layar Safety Tip sebelum tahap ini. */
  tip?: boolean;
}

export const FLOW: FlowStep[] = [
  { scene: 'Boot', label: 'Boot' },
  { scene: 'Preload', label: 'Memuat...' },
  { scene: 'Register', label: 'Registrasi' },
  { scene: 'Customize', label: 'Kustomisasi Karakter' },
  { scene: 'Apd', label: 'Pakai APD', tip: true },
  { scene: 'P2h', label: 'P2H Unit', tip: true },
  { scene: 'Loading', label: 'Loading Coal ke HD', tip: true },
  { scene: 'Hauling', label: 'Hauling – Bagian 1', part: 1, tip: true },
  { scene: 'Reboisasi', label: 'Event Reboisasi' },
  { scene: 'Hauling', label: 'Hauling – Bagian 2', part: 2 },
  { scene: 'Dumping', label: 'Dumping', tip: true },
  { scene: 'Quiz', label: 'Kuis Safety', tip: true },
  { scene: 'Result', label: 'Hasil & Leaderboard', tip: true },
];

/** Setelah Result, main lagi mulai dari Registrasi. */
export const RESTART_INDEX = FLOW.findIndex((s) => s.scene === 'Register');

export const UI_TEXT = {
  gameTitle: 'Safety Hauler',
  loading: 'Memuat...',
  next: 'Lanjut',
  tipTitle: 'Safety Tip',
  tapToSkip: 'Tap untuk lanjut',
  supervisorName: 'Pak Bos',
};
