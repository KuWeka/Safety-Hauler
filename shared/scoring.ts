// Satu-satunya sumber angka skor (lihat docs/GDD.md bagian "Sistem skor").
// Pure: tanpa I/O, dipakai game (skor lokal) dan Cloud Function (skor resmi).
import type { ScoreBreakdown, StageData, Violation, ViolationType } from './types';

export const LOADING_LOAD_MAX = 1000;
export const LOADING_TIME_BONUS_MAX = 500;
export const LOADING_TIME_FREE_SEC = 25;
export const LOADING_TIME_PENALTY_PER_SEC = 10;
export const DUMPING_MAX = 1500;
export const SAFETY_START = 4000;
export const UNIT_MAX = 1000;
export const UNIT_HP_MAX = 100;
export const REBOISASI_MAX = 1000;
export const REBOISASI_TIME_MS = 20_000;
export const QUIZ_QUESTIONS = 3;
export const QUIZ_POINTS_PER_CORRECT = 300;

export const BONUS = {
  perfectPass: 50,
  dumpCombo: 100,
  radioCorrect: 100,
  p2hCorrect: 200,
} as const;

/** Potongan Safety per teguran Pengawas. */
export const PENALTY: Record<ViolationType, number> = {
  apdMissing: 300,
  apdTrap: 200,
  p2hSkipped: 400,
  overload: 500,
  speeding: 200,
  lvNotStopped: 500,
  bermHit: 400,
  dumpTooFast: 150,
  dumpTooSlow: 100,
};

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const count = (x: number): number => Math.max(0, Math.floor(x));
const ratio = (part: number, whole: number): number => (whole > 0 ? clamp01(part / whole) : 0);

export function calculateScore(s: StageData): ScoreBreakdown {
  const { apd, p2h, loading: ld, hauling1: h1, hauling2: h2, reboisasi: rb, dumping: dp, quiz } = s;

  // Muatan dibatasi target: overload tidak menambah poin.
  const loadSec = ld.durationMs / 1000;
  const loading =
    LOADING_LOAD_MAX * ratio(ld.loadedPasses, ld.targetPasses) +
    Math.max(
      0,
      LOADING_TIME_BONUS_MAX -
        LOADING_TIME_PENALTY_PER_SEC * Math.max(0, loadSec - LOADING_TIME_FREE_SEC),
    );

  const dumping = DUMPING_MAX * ratio(dp.greenZoneMs, dp.sliderMs);

  const counts: Record<ViolationType, number> = {
    apdMissing: new Set(apd.missingItems).size,
    apdTrap: apd.trapItemUsed ? 1 : 0,
    p2hSkipped: p2h.skipped ? 1 : 0,
    overload: count(ld.overloadCount),
    speeding: count(h1.speedingCount) + count(h2.speedingCount),
    lvNotStopped: count(h1.lvViolationCount) + count(h2.lvViolationCount),
    bermHit: dp.bermHit ? 1 : 0,
    dumpTooFast: count(dp.tooFastCount),
    dumpTooSlow: count(dp.tooSlowCount),
  };
  const violations: Violation[] = (Object.keys(counts) as ViolationType[])
    .filter((t) => counts[t] > 0)
    .map((t) => ({ type: t, count: counts[t], points: counts[t] * PENALTY[t] }));
  const safety = Math.max(0, SAFETY_START - violations.reduce((sum, v) => sum + v.points, 0));

  const hpLost = Math.max(0, h1.hpLost) + Math.max(0, h2.hpLost);
  const unit = UNIT_MAX * clamp01((UNIT_HP_MAX - hpLost) / UNIT_HP_MAX);

  const reboisasi = rb.completed ? REBOISASI_MAX * ratio(rb.timeLeftMs, REBOISASI_TIME_MS) : 0;

  const quizScore = QUIZ_POINTS_PER_CORRECT * Math.min(QUIZ_QUESTIONS, count(quiz.correctCount));

  const extra =
    BONUS.perfectPass * Math.min(count(ld.perfectPasses), count(ld.targetPasses)) +
    BONUS.dumpCombo * count(dp.comboCount) +
    BONUS.radioCorrect * (count(h1.radioCorrect) + count(h2.radioCorrect)) +
    (p2h.correctReport && !p2h.skipped ? BONUS.p2hCorrect : 0);

  const parts = {
    loading: Math.round(loading),
    dumping: Math.round(dumping),
    safety,
    unit: Math.round(unit),
    reboisasi: Math.round(reboisasi),
    quiz: quizScore,
    extra,
  };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  return { ...parts, total, violations };
}
