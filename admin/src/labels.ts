import type { RunStatus, ViolationType } from '../../shared/types';

// Teks dashboard admin (Bahasa Indonesia).
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

export const STATUS_LABEL: Record<RunStatus, string> = {
  in_progress: 'Berjalan',
  valid: 'Valid',
  flagged: 'Perlu ditinjau',
  dq: 'Diskualifikasi',
};

export const FLAG_LABEL: Record<string, string> = {
  total_time_too_short: 'Total waktu terlalu singkat',
  stage_time_exceeds_server_time: 'Durasi tahap melebihi waktu server',
  apd_too_fast: 'APD terlalu cepat',
  p2h_too_fast: 'P2H terlalu cepat',
  loading_too_fast: 'Loading terlalu cepat',
  hauling1_too_fast: 'Hauling 1 terlalu cepat',
  hauling2_too_fast: 'Hauling 2 terlalu cepat',
  reboisasi_too_fast: 'Reboisasi terlalu cepat',
  dumping_too_fast: 'Dumping terlalu cepat',
  quiz_too_fast: 'Kuis terlalu cepat',
  loading_target_mismatch: 'Target loading tidak sesuai',
  loading_counts_inconsistent: 'Jumlah pass loading janggal',
  loading_overload_count: 'Overload terlalu banyak',
  hauling_lv_count: 'Jumlah LV janggal',
  hauling_radio_count: 'Jumlah radio janggal',
  hauling_speeding_count: 'Teguran ngebut terlalu banyak',
  hauling_hp_lost: 'Kerusakan unit janggal',
  reboisasi_time_left: 'Sisa waktu reboisasi janggal',
  reboisasi_time_inconsistent: 'Waktu reboisasi tidak konsisten',
  dumping_slider_mismatch: 'Durasi slider dumping tidak sesuai',
  dumping_green_exceeds_slider: 'Zona hijau melebihi durasi slider',
  dumping_shorter_than_slider: 'Dumping lebih singkat dari slider',
  dumping_combo_inconsistent: 'Jumlah combo dumping janggal',
  dumping_warning_count: 'Teguran dumping terlalu banyak',
  quiz_correct_count: 'Jumlah jawaban benar janggal',
};

export const T = {
  appName: 'Safety Hauler',
  loginTitle: 'Masuk Admin',
  password: 'Password',
  login: 'Masuk',
  logout: 'Keluar',
  badLogin: 'Password salah.',
  rateLimited: 'Terlalu banyak percobaan. Tunggu semenit.',
  serverError: 'Server bermasalah. Coba lagi.',
  navTv: 'Mode TV',
  navManage: 'Mode Kelola',
  tvTitle: 'LEADERBOARD',
  tvEmpty: 'Belum ada skor. Scan QR dan jadi yang pertama!',
  tvScan: 'Scan & main!',
  tvPlayersToday: 'Pemain hari ini',
  tvTopScore: 'Skor tertinggi',
  tvLast: 'Pemain terakhir',
  tvSound: 'Suara',
  tvSoundOn: 'Suara: nyala',
  tvSoundOff: 'Suara: mati',
  tvFullscreen: 'Layar penuh',
  tvOffline: 'Terputus, mencoba lagi...',
};
