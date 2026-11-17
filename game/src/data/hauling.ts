// Config Hauling. Angka awal Fase 1, di-tuning saat playtest.
// Jarak dalam piksel dunia; kecepatan dalam km/jam (1 km/jam = PX_PER_KMH px/detik di layar).

export const HAULING = {
  pxPerKmh: 10,
  lanes: [200, 360, 520],
  startLane: 1,
  /** Posisi awal slider kecepatan. Truk mengejar kecepatan slider dengan laju gas/rem di bawah. */
  cruiseKmh: 30,
  maxKmh: 60,
  gasKmhPerSec: 25,
  brakeKmhPerSec: 50,
  defaultLimitKmh: 40,
  /** Toleransi di atas batas sebelum dianggap ngebut. */
  speedToleranceKmh: 2,
  /** Ngebut terus 0,7 dtk = 1 teguran; kalau masih ngebut, teguran lagi tiap 2,5 dtk. */
  speedingHoldMs: 700,
  speedingRepeatMs: 2500,
  /** Di jalan licin / debu, di atas kecepatan ini truk kena sekali per zona. */
  hazardSafeKmh: 20,
  /** Di garis stop LV, kecepatan maksimum yang dianggap "berhenti". */
  lvStopKmh: 5,
  /** LV mulai menyeberang saat truk sejarak ini dari garis stop, lama nyeberang. */
  lvTriggerPx: 700,
  lvCrossMs: 3500,
  damage: { hole: 8, rock: 15, slippery: 12, dust: 8, lv: 25 },
  swipeMinPx: 60,
  /** Kabut debu menutup jalan di depan setinggi ini (px dari atas area jalan). */
  fogHeight: 440,
};

export type CourseEvent =
  | { type: 'hole' | 'rock'; d: number; lane: number }
  | { type: 'limit'; d: number; end: number; kmh: number }
  | { type: 'slippery' | 'dust'; d: number; end: number }
  | { type: 'lv'; d: number }
  | { type: 'radio'; d: number; question: number };

export interface Course {
  length: number;
  events: CourseEvent[];
}

/** Bagian 1: rintangan rapat, beberapa menutup 2 lajur sekaligus, rintangan tersembunyi di debu. */
const PART1: Course = {
  length: 11000,
  events: [
    { type: 'hole', d: 900, lane: 1 },
    { type: 'rock', d: 1500, lane: 0 },
    { type: 'hole', d: 1500, lane: 2 },
    { type: 'limit', d: 2400, end: 4200, kmh: 20 },
    { type: 'slippery', d: 2700, end: 4000 },
    { type: 'hole', d: 3200, lane: 1 },
    { type: 'rock', d: 3650, lane: 0 },
    { type: 'radio', d: 4800, question: 0 },
    { type: 'rock', d: 5400, lane: 2 },
    { type: 'hole', d: 5400, lane: 1 },
    { type: 'hole', d: 5900, lane: 0 },
    { type: 'limit', d: 6300, end: 7300, kmh: 20 },
    { type: 'lv', d: 7000 },
    { type: 'dust', d: 7800, end: 9200 },
    { type: 'hole', d: 8400, lane: 1 },
    { type: 'rock', d: 8900, lane: 2 },
    { type: 'rock', d: 9800, lane: 0 },
    { type: 'hole', d: 9800, lane: 2 },
    { type: 'hole', d: 10400, lane: 1 },
  ],
};

/** Bagian 2: singkat tapi padat, ada LV lagi sebelum area dumping. */
const PART2: Course = {
  length: 4800,
  events: [
    { type: 'rock', d: 700, lane: 1 },
    { type: 'hole', d: 700, lane: 0 },
    { type: 'radio', d: 1100, question: 1 },
    { type: 'limit', d: 1500, end: 2900, kmh: 20 },
    { type: 'slippery', d: 1700, end: 2800 },
    { type: 'hole', d: 2200, lane: 2 },
    { type: 'lv', d: 3400 },
    { type: 'rock', d: 4100, lane: 2 },
    { type: 'hole', d: 4100, lane: 1 },
  ],
};

export const COURSES: Record<1 | 2, Course> = { 1: PART1, 2: PART2 };

/** Panggilan radio: pilihan ganda singkat. Perlu divalidasi tim K3. */
export const RADIO_QUESTIONS = [
  {
    question: 'Radio: "Ada LV mau lewat di persimpangan depan." Kamu harus...',
    options: ['Klakson lalu tancap gas', 'Kurangi kecepatan dan siap berhenti', 'Pindah lajur kiri'],
    correct: 1,
    explain: 'HD wajib pelan dan siap berhenti, pastikan LV lewat dulu dengan aman.',
  },
  {
    question: 'Radio: "Jalan depan licin habis hujan." Yang benar...',
    options: ['Rem mendadak kalau mulai selip', 'Tetap 40 km/jam biar cepat sampai', 'Pelan, jaga jarak, hindari rem mendadak'],
    correct: 2,
    explain: 'Di jalan licin, pelan dan jaga jarak. Rem mendadak bikin unit tergelincir.',
  },
];

export const HAULING_TEXT = {
  title: (part: number) => `Hauling – Bagian ${part}`,
  hint: 'Geser jalan kiri/kanan untuk pindah lajur.',
  throttle: 'Geser untuk atur kecepatan',
  speed: (kmh: number) => `${Math.round(kmh)} km/jam`,
  limit: (kmh: number) => `${kmh}`,
  hp: 'Kondisi unit',
  hole: 'Lubang!',
  rock: 'Batu!',
  slippery: 'Tergelincir!',
  dust: 'Nabrak patok!',
  lvWarning: 'AWAS LV',
  stop: 'STOP',
  slipperySign: 'LICIN',
  dustSign: 'DEBU',
  radioTitle: 'Panggilan Radio',
  radioWrong: (answer: string) => `Kurang tepat. Jawaban: ${answer}`,
  arrived: (part: number) => (part === 1 ? 'Eh, ada apa di depan?' : 'Sampai di area dumping!'),
  hpLeft: (hp: number) => `Sisa kondisi unit: ${hp}%`,
};
