// Validasi data pemain dan data run (dipakai game dan worker). Pure, tanpa I/O.
import { REBOISASI_TIME_MS } from './scoring';
import type { ApdItem, StageData } from './types';

/**
 * Normalisasi no HP Indonesia ke format 08xxxxxxxxxx.
 * Terima "+62 812-3456-7890", "6281234567890", "0812 3456 7890". Return null kalau tidak valid.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+62')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('62')) digits = '0' + digits.slice(2);
  return /^08\d{8,11}$/.test(digits) ? digits : null;
}

export const NAME_MIN = 2;
export const NAME_MAX = 30;
export const DIVISION_MAX = 40;

/** Nama dirapikan (spasi ganda dibuang). Return null kalau terlalu pendek/panjang. */
export function normalizeName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, ' ');
  return name.length >= NAME_MIN && name.length <= NAME_MAX ? name : null;
}

/** Divisi/perusahaan dirapikan. Return null kalau kosong atau terlalu panjang. */
export function normalizeDivision(input: string): string | null {
  const d = input.trim().replace(/\s+/g, ' ');
  return d.length >= 1 && d.length <= DIVISION_MAX ? d : null;
}

// ---------------------------------------------------------------------------
// Validasi data run. HP tidak dipercaya: server hanya memeriksa bentuk data dan kewajarannya.
// Run yang gagal cek kewajaran jadi `flagged` (menunggu admin), bukan ditolak.
// ---------------------------------------------------------------------------

/**
 * Batas kewajaran. Beberapa angka mengikuti data gameplay di game/src/data/ (jumlah LV, durasi
 * slider, target pass). Kalau data gameplay berubah, sesuaikan di sini; run yang salah flag
 * hanya perlu ditinjau admin, tidak hilang.
 */
export const LIMITS = {
  /** GDD: total waktu minimal ± 90 dtk, dibandingkan waktu mulai yang dicatat server. */
  minTotalMs: 90_000,
  /** Toleransi jumlah durasi tahap (klaim HP) terhadap waktu server. */
  durationSlackMs: 5_000,
  loadingTargetPasses: 5,
  dumpingSliderMs: 10_000,
  /** Maks LV dan radio per bagian hauling (satu persimpangan dan satu radio per bagian). */
  lvPerPart: 1,
  radioPerPart: 1,
  maxSpeeding: 60,
  maxCountPerStage: 20,
  maxHpLost: 300,
  quizQuestions: 3,
  minMs: {
    apd: 1_500,
    p2h: 500,
    loading: 3_500,
    hauling1: 12_000,
    hauling2: 5_000,
    reboisasi: 4_000,
    dumping: 10_000,
    quiz: 2_500,
  },
} as const;

const APD_ITEMS: readonly ApdItem[] = ['helmet', 'glasses', 'vest', 'boots'];
const MAX_NUM = 1e7;

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= MAX_NUM ? x : null);
const bool = (x: unknown): boolean | null => (typeof x === 'boolean' ? x : null);

function numbers<K extends string>(o: Rec, keys: readonly K[]): Record<K, number> | null {
  const out = {} as Record<K, number>;
  for (const k of keys) {
    const v = num(o[k]);
    if (v === null) return null;
    out[k] = v;
  }
  return out;
}

const parseHauling = (x: unknown) =>
  isRec(x) ? numbers(x, ['speedingCount', 'lvViolationCount', 'radioCorrect', 'hpLost', 'durationMs']) : null;

/** Periksa bentuk dan tipe data tahap dari HP. Return null kalau tidak valid. Tidak mengubah isi angka. */
export function parseStageData(input: unknown): StageData | null {
  if (!isRec(input)) return null;
  const { apd, p2h, loading, hauling1, reboisasi, hauling2, dumping, quiz } = input;

  if (!isRec(apd) || !Array.isArray(apd.missingItems) || !apd.missingItems.every((i) => APD_ITEMS.includes(i as ApdItem))) return null;
  const apdMs = num(apd.durationMs);
  const trap = bool(apd.trapItemUsed);
  if (apdMs === null || trap === null) return null;

  if (!isRec(p2h)) return null;
  const p2hMs = num(p2h.durationMs);
  const skipped = bool(p2h.skipped);
  const correct = bool(p2h.correctReport);
  if (p2hMs === null || skipped === null || correct === null) return null;

  const ld = isRec(loading) ? numbers(loading, ['loadedPasses', 'targetPasses', 'perfectPasses', 'overloadCount', 'durationMs']) : null;
  const h1 = parseHauling(hauling1);
  const h2 = parseHauling(hauling2);

  if (!isRec(reboisasi)) return null;
  const rbMs = num(reboisasi.durationMs);
  const rbLeft = num(reboisasi.timeLeftMs);
  const rbDone = bool(reboisasi.completed);
  if (rbMs === null || rbLeft === null || rbDone === null) return null;

  const dp = isRec(dumping)
    ? numbers(dumping, ['tooFastCount', 'tooSlowCount', 'greenZoneMs', 'sliderMs', 'comboCount', 'durationMs'])
    : null;
  const berm = isRec(dumping) ? bool(dumping.bermHit) : null;
  const qz = isRec(quiz) ? numbers(quiz, ['correctCount', 'durationMs']) : null;

  if (!ld || !h1 || !h2 || !dp || berm === null || !qz) return null;
  return {
    apd: { missingItems: [...new Set(apd.missingItems as ApdItem[])], trapItemUsed: trap, durationMs: apdMs },
    p2h: { skipped, correctReport: correct, durationMs: p2hMs },
    loading: ld,
    hauling1: h1,
    reboisasi: { completed: rbDone, timeLeftMs: rbLeft, durationMs: rbMs },
    hauling2: h2,
    dumping: { ...dp, bermHit: berm },
    quiz: qz,
  };
}

export interface RunCheck {
  ok: boolean;
  /** Kode alasan flag, untuk ditampilkan ke admin. */
  reasons: string[];
  /** Jumlah durasi semua tahap (klaim HP), dipakai sebagai total waktu main untuk tie-breaker. */
  totalTimeMs: number;
}

/** Cek kewajaran data run. `serverElapsedMs` = waktu server menerima hasil dikurangi waktu mulai yang dicatat server. */
export function validateRun(s: StageData, serverElapsedMs: number): RunCheck {
  const r: string[] = [];
  const stages = [s.apd, s.p2h, s.loading, s.hauling1, s.reboisasi, s.hauling2, s.dumping, s.quiz];
  const totalTimeMs = Math.round(stages.reduce((sum, st) => sum + st.durationMs, 0));

  // Batas bawah saja: hasil bisa dikirim lama setelah selesai (antrean offline), jadi tidak ada batas atas.
  if (serverElapsedMs < LIMITS.minTotalMs) r.push('total_time_too_short');
  if (totalTimeMs > serverElapsedMs + LIMITS.durationSlackMs) r.push('stage_time_exceeds_server_time');

  const m = LIMITS.minMs;
  if (s.apd.durationMs < m.apd) r.push('apd_too_fast');
  if (s.p2h.durationMs < m.p2h) r.push('p2h_too_fast');
  if (s.loading.durationMs < m.loading) r.push('loading_too_fast');
  if (s.hauling1.durationMs < m.hauling1) r.push('hauling1_too_fast');
  if (s.hauling2.durationMs < m.hauling2) r.push('hauling2_too_fast');
  if (s.reboisasi.completed && s.reboisasi.durationMs < m.reboisasi) r.push('reboisasi_too_fast');
  if (s.dumping.durationMs < m.dumping) r.push('dumping_too_fast');
  if (s.quiz.durationMs < m.quiz) r.push('quiz_too_fast');

  const ld = s.loading;
  if (ld.targetPasses !== LIMITS.loadingTargetPasses) r.push('loading_target_mismatch');
  if (ld.loadedPasses > ld.targetPasses || ld.perfectPasses > ld.loadedPasses) r.push('loading_counts_inconsistent');
  if (ld.overloadCount > LIMITS.maxCountPerStage) r.push('loading_overload_count');

  for (const h of [s.hauling1, s.hauling2]) {
    if (h.lvViolationCount > LIMITS.lvPerPart) r.push('hauling_lv_count');
    if (h.radioCorrect > LIMITS.radioPerPart) r.push('hauling_radio_count');
    if (h.speedingCount > LIMITS.maxSpeeding) r.push('hauling_speeding_count');
    if (h.hpLost > LIMITS.maxHpLost) r.push('hauling_hp_lost');
  }

  if (s.reboisasi.timeLeftMs > REBOISASI_TIME_MS) r.push('reboisasi_time_left');
  if (s.reboisasi.completed && s.reboisasi.timeLeftMs > REBOISASI_TIME_MS - s.reboisasi.durationMs + 500) {
    r.push('reboisasi_time_inconsistent');
  }

  const d = s.dumping;
  if (d.sliderMs !== LIMITS.dumpingSliderMs) r.push('dumping_slider_mismatch');
  if (d.greenZoneMs > d.sliderMs) r.push('dumping_green_exceeds_slider');
  if (d.durationMs < d.sliderMs) r.push('dumping_shorter_than_slider');
  if (d.comboCount > Math.floor(d.greenZoneMs / 3000)) r.push('dumping_combo_inconsistent');
  if (d.tooFastCount > LIMITS.maxCountPerStage || d.tooSlowCount > LIMITS.maxCountPerStage) r.push('dumping_warning_count');

  if (s.quiz.correctCount > LIMITS.quizQuestions) r.push('quiz_correct_count');

  return { ok: r.length === 0, reasons: [...new Set(r)], totalTimeMs };
}
