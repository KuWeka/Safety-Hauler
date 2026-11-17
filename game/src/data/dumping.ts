// Config Dumping. Angka awal Fase 1, di-tuning saat playtest.
export const DUMPING = {
  // Bagian A: mundur. Posisi = sisi belakang truk (piksel layar, makin besar makin dekat berm).
  reverseStartY: 380,
  reverseSpeedPxPerSec: 210,
  stopZoneTop: 880,
  stopZoneBottom: 950,
  bermY: 1000,
  /** Setelah nabrak berm, truk dimundurkan balik ke sini. */
  bermBounceY: 920,
  // Bagian B: slider kecepatan dumping (nilai 0..1).
  sliderMs: 10_000,
  zoneWidth: 0.24,
  /** Zona hijau bergerak: tengah = 0.5 + a1·sin(t·w1) + a2·sin(t·w2), t dalam detik. */
  zoneA1: 0.22,
  zoneW1: 1.9,
  zoneA2: 0.07,
  zoneW2: 4.3,
  /** Di luar zona terus 1,5 dtk = 1 teguran, lalu tiap 2,5 dtk. */
  warnHoldMs: 1500,
  warnRepeatMs: 2500,
  /** Combo: tiap 3 dtk akurat berturut-turut. */
  comboMs: 3000,
};

export const DUMPING_TEXT = {
  titleA: 'Mundur ke dumping point',
  hintA: 'Tahan tombol MUNDUR. Lepas saat spotter bilang STOP!',
  reverse: 'MUNDUR',
  spotterGo: 'Terus...',
  spotterStop: 'STOP!',
  berm: 'Safety berm',
  goodStop: 'Pas! Posisi aman.',
  titleB: 'Atur kecepatan dumping',
  hintB: 'Geser slider, jaga tetap di zona hijau!',
  slow: 'Lambat',
  fast: 'Cepat',
  load: 'Isi bak',
  done: 'Bak kosong!',
  accuracy: (pct: number) => `Akurasi zona hijau: ${pct}%`,
  combo: 'Combo!',
};
