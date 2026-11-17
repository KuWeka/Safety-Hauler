import { describe, expect, it } from 'vitest';
import { calculateScore, PENALTY, SAFETY_START } from './scoring';
import type { StageData } from './types';

const perfect = (): StageData => ({
  apd: { missingItems: [], trapItemUsed: false, durationMs: 15_000 },
  p2h: { skipped: false, correctReport: true, durationMs: 12_000 },
  loading: { loadedPasses: 5, targetPasses: 5, perfectPasses: 5, overloadCount: 0, durationMs: 20_000 },
  hauling1: { speedingCount: 0, lvViolationCount: 0, radioCorrect: 1, hpLost: 0, durationMs: 35_000 },
  reboisasi: { completed: true, timeLeftMs: 20_000, durationMs: 1 },
  hauling2: { speedingCount: 0, lvViolationCount: 0, radioCorrect: 0, hpLost: 0, durationMs: 15_000 },
  dumping: {
    bermHit: false,
    tooFastCount: 0,
    tooSlowCount: 0,
    greenZoneMs: 10_000,
    sliderMs: 10_000,
    comboCount: 3,
    durationMs: 35_000,
  },
  quiz: { correctCount: 3, durationMs: 20_000 },
});

describe('calculateScore', () => {
  it('skor sempurna', () => {
    const r = calculateScore(perfect());
    expect(r).toMatchObject({
      loading: 1500,
      dumping: 1500,
      safety: 4000,
      unit: 1000,
      reboisasi: 1000,
      quiz: 900,
      extra: 5 * 50 + 3 * 100 + 100 + 200,
      violations: [],
    });
    expect(r.total).toBe(1500 + 1500 + 4000 + 1000 + 1000 + 900 + 850);
  });

  it('beberapa teguran mengurangi Safety', () => {
    const s = perfect();
    s.apd.missingItems = ['helmet', 'boots'];
    s.loading.overloadCount = 1;
    s.hauling1.speedingCount = 2;
    s.dumping.tooSlowCount = 1;
    const r = calculateScore(s);
    expect(r.safety).toBe(SAFETY_START - 2 * 300 - 500 - 2 * 200 - 100);
    expect(r.violations).toEqual([
      { type: 'apdMissing', count: 2, points: 600 },
      { type: 'overload', count: 1, points: 500 },
      { type: 'speeding', count: 2, points: 400 },
      { type: 'dumpTooSlow', count: 1, points: 100 },
    ]);
  });

  it('Safety tidak pernah minus', () => {
    const s = perfect();
    s.hauling1.lvViolationCount = 10;
    s.hauling2.speedingCount = 10;
    expect(10 * PENALTY.lvNotStopped).toBeGreaterThan(SAFETY_START);
    expect(calculateScore(s).safety).toBe(0);
  });

  it('nilai mentah aneh tidak bikin skor melebihi batas', () => {
    const s = perfect();
    s.loading.loadedPasses = 50;
    s.hauling1.speedingCount = -5;
    s.hauling1.hpLost = -100;
    s.dumping.greenZoneMs = 99_999;
    s.quiz.correctCount = 10;
    const r = calculateScore(s);
    expect(r.loading).toBe(1500);
    expect(r.safety).toBe(4000);
    expect(r.unit).toBe(1000);
    expect(r.dumping).toBe(1500);
    expect(r.quiz).toBe(900);
  });

  it('bonus waktu loading turun 10/dtk di atas 25 dtk, reboisasi gagal = 0', () => {
    const s = perfect();
    s.loading.durationMs = 40_000;
    s.reboisasi.completed = false;
    const r = calculateScore(s);
    expect(r.loading).toBe(1000 + 500 - 150);
    expect(r.reboisasi).toBe(0);
  });
});
