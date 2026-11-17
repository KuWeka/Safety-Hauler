// Config Hauling. Angka awal Fase 1, di-tuning saat playtest.
// Jarak dalam piksel dunia; kecepatan dalam km/jam (1 km/jam = PX_PER_KMH px/detik di layar).

export const HAULING = {
  pxPerKmh: 10,
  lanes: [200, 360, 520],
  startLane: 1,
  /** Tanpa input, truk otomatis menuju kecepatan jelajah. */
  cruiseKmh: 30,
  maxKmh: 60,
  gasKmhPerSec: 25,
  brakeKmhPerSec: 50,
  coastKmhPerSec: 15,
  defaultLimitKmh: 40,
  /** Toleransi di atas batas sebelum dianggap ngebut. */
  speedToleranceKmh: 2,
  /** Ngebut terus 1 dtk = 1 teguran; kalau masih ngebut, teguran lagi tiap 3 dtk. */
  speedingHoldMs: 1000,
  speedingRepeatMs: 3000,
  /** Di jalan licin / debu, di atas kecepatan ini truk kena sekali per zona. */
  hazardSafeKmh: 25,
  /** Di garis stop LV, kecepatan maksimum yang dianggap "berhenti". */
  lvStopKmh: 8,
  /** LV mulai menyeberang saat truk sejarak ini dari garis stop, lama nyeberang. */
  lvTriggerPx: 900,
  lvCrossMs: 3500,
  damage: { hole: 5, rock: 10, slippery: 10, dust: 5, lv: 25 },
  swipeMinPx: 60,
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

/** Bagian 1 ±35 dtk: semua jenis rintangan + 1 panggilan radio. */
const PART1: Course = {
  length: 10800,
  events: [
    { type: 'hole', d: 1300, lane: 1 },
    { type: 'rock', d: 2200, lane: 0 },
    { type: 'limit', d: 3000, end: 4700, kmh: 20 },
    { type: 'slippery', d: 3400, end: 4500 },
    { type: 'radio', d: 5200, question: 0 },
    { type: 'hole', d: 5900, lane: 2 },
    { type: 'lv', d: 7300 },
    { type: 'dust', d: 8200, end: 9400 },
    { type: 'hole', d: 10000, lane: 0 },
    { type: 'rock', d: 10000, lane: 2 },
  ],
};

/** Bagian 2 ±15 dtk: 3 rintangan menuju area dumping. */
const PART2: Course = {
  length: 4600,
  events: [
    { type: 'rock', d: 900, lane: 1 },
    { type: 'limit', d: 1800, end: 3100, kmh: 20 },
    { type: 'slippery', d: 2000, end: 3000 },
    { type: 'hole', d: 3700, lane: 2 },
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
];

export const HAULING_TEXT = {
  title: (part: number) => `Hauling – Bagian ${part}`,
  hint: 'Geser kiri/kanan pindah lajur. Tahan GAS / REM.',
  gas: 'GAS',
  brake: 'REM',
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
