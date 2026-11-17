// Config event Reboisasi. Angka awal Fase 1.
export const REBOISASI = {
  cols: 3,
  rows: 3,
  tileSize: 190,
  gap: 16,
  /** Sama dengan REBOISASI_TIME_MS di shared/scoring.ts (dasar bonus). */
  timeLimitMs: 20_000,
};

export const REBOISASI_TEXT = {
  title: 'Event Reboisasi',
  intro: 'Ada lahan bekas tambang yang siap direklamasi!',
  howTo: 'Tap petak 1x untuk sebar topsoil,\ntap lagi untuk tanam bibit.',
  start: 'Mulai',
  time: (sec: number) => `${sec.toFixed(1)} dtk`,
  done: 'Lahan hijau lagi!',
  timeUp: 'Waktu habis!',
  // Fakta reklamasi: perlu divalidasi tim lingkungan Arutmin (lihat GDD).
  fact: 'Lahan bekas tambang wajib direklamasi: ditata ulang, ditutup tanah pucuk, lalu ditanami kembali.',
  next: 'Lanjut',
};
