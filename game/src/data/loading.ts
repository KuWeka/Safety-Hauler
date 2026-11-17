// Config minigame Loading (excavator → HD). Angka awal Fase 1, di-tuning saat playtest.
// Koordinat dalam piksel game (720×1280).
export const LOADING = {
  targetPasses: 5,
  /** Muatan per tumpahan: tepat di zona hijau = 1 pass, pinggir zona = setengah. */
  loadPerfect: 1,
  loadEdge: 0.5,
  /** Bucket berayun bolak-balik antara pit dan ujung kanan. */
  swingFromX: 150,
  swingToX: 680,
  swingY: 520,
  swingSpeedPxPerSec: 520,
  /** Zona di atas bak HD. */
  zoneCenterX: 530,
  greenHalfWidth: 45,
  edgeHalfWidth: 100,
  /** Lama animasi tumpah dan kembali ke pit. */
  dumpMs: 350,
  returnMs: 450,
  /** Waktu habis kalau bak belum penuh. */
  timeLimitMs: 60_000,
};

export const LOADING_TEXT = {
  title: 'Loading Coal ke HD',
  hint: 'Tap saat bucket di atas zona hijau!',
  perfect: 'Pas!',
  edge: 'Lumayan',
  miss: 'Tumpah!',
  load: (n: number, target: number) => `Muatan ${n}/${target}`,
  time: (sec: number) => `${sec.toFixed(1)} dtk`,
  full: 'Bak penuh!',
  timeUp: 'Waktu habis!',
  addMore: 'Tambah lagi',
  depart: 'Berangkat',
};
