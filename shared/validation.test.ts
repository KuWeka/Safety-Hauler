import { describe, expect, it } from 'vitest';
import type { StageData } from './types';
import { normalizeDivision, normalizeName, normalizePhone, parseStageData, validateRun } from './validation';

describe('normalizePhone', () => {
  it('terima format umum Indonesia', () => {
    expect(normalizePhone('081234567890')).toBe('081234567890');
    expect(normalizePhone('+62 812-3456-7890')).toBe('081234567890');
    expect(normalizePhone('6281234567890')).toBe('081234567890');
    expect(normalizePhone('0812 3456 789')).toBe('08123456789');
  });

  it('tolak nomor tidak wajar', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('0212345678')).toBeNull();
    expect(normalizePhone('08123')).toBeNull();
    expect(normalizePhone('0812345678901234')).toBeNull();
    expect(normalizePhone('08abc4567890')).toBeNull();
  });
});

describe('normalizeName / normalizeDivision', () => {
  it('rapikan spasi, tolak terlalu pendek/panjang', () => {
    expect(normalizeName('  Budi   Santoso ')).toBe('Budi Santoso');
    expect(normalizeName('A')).toBeNull();
    expect(normalizeName('x'.repeat(31))).toBeNull();
    expect(normalizeDivision('  PT  Maju ')).toBe('PT Maju');
    expect(normalizeDivision('   ')).toBeNull();
    expect(normalizeDivision('x'.repeat(41))).toBeNull();
  });
});

const good = (): StageData => ({
  apd: { missingItems: [], trapItemUsed: false, durationMs: 8_000 },
  p2h: { skipped: false, correctReport: true, durationMs: 9_000 },
  loading: { loadedPasses: 5, targetPasses: 5, perfectPasses: 3, overloadCount: 0, durationMs: 14_000 },
  hauling1: { speedingCount: 0, lvViolationCount: 0, radioCorrect: 1, hpLost: 0, durationMs: 48_000 },
  reboisasi: { completed: true, timeLeftMs: 8_000, durationMs: 12_000 },
  hauling2: { speedingCount: 0, lvViolationCount: 0, radioCorrect: 1, hpLost: 0, durationMs: 21_000 },
  dumping: { bermHit: false, tooFastCount: 0, tooSlowCount: 0, greenZoneMs: 7_000, sliderMs: 10_000, comboCount: 2, durationMs: 22_000 },
  quiz: { correctCount: 2, durationMs: 15_000 },
});

describe('parseStageData', () => {
  it('terima data yang bentuknya benar (setelah lewat JSON)', () => {
    const parsed = parseStageData(JSON.parse(JSON.stringify(good())));
    expect(parsed).toEqual(good());
  });

  it('buang item APD ganda', () => {
    const raw = { ...good(), apd: { ...good().apd, missingItems: ['helmet', 'helmet'] } };
    expect(parseStageData(raw)?.apd.missingItems).toEqual(['helmet']);
  });

  it('tolak bentuk salah', () => {
    expect(parseStageData(null)).toBeNull();
    expect(parseStageData([])).toBeNull();
    expect(parseStageData({ ...good(), quiz: undefined })).toBeNull();
    expect(parseStageData({ ...good(), loading: { ...good().loading, loadedPasses: '5' } })).toBeNull();
    expect(parseStageData({ ...good(), loading: { ...good().loading, loadedPasses: -1 } })).toBeNull();
    expect(parseStageData({ ...good(), loading: { ...good().loading, loadedPasses: NaN } })).toBeNull();
    expect(parseStageData({ ...good(), loading: { ...good().loading, durationMs: 1e12 } })).toBeNull();
    expect(parseStageData({ ...good(), apd: { ...good().apd, missingItems: ['sandal'] } })).toBeNull();
    expect(parseStageData({ ...good(), p2h: { ...good().p2h, skipped: 'ya' } })).toBeNull();
  });
});

describe('validateRun', () => {
  const total = 8_000 + 9_000 + 14_000 + 48_000 + 12_000 + 21_000 + 22_000 + 15_000; // 149.000

  it('run wajar lolos dan totalTimeMs = jumlah durasi tahap', () => {
    const c = validateRun(good(), total + 20_000);
    expect(c).toEqual({ ok: true, reasons: [], totalTimeMs: total });
  });

  it('hasil dikirim lama setelah selesai (antrean offline) tetap lolos', () => {
    expect(validateRun(good(), total + 3_600_000).ok).toBe(true);
  });

  it('total waktu server terlalu singkat = flag', () => {
    const c = validateRun(good(), 60_000);
    expect(c.ok).toBe(false);
    expect(c.reasons).toContain('total_time_too_short');
    expect(c.reasons).toContain('stage_time_exceeds_server_time');
  });

  it('durasi tahap tidak masuk akal = flag', () => {
    const s = good();
    s.hauling1.durationMs = 1_000;
    s.quiz.durationMs = 100;
    const c = validateRun(s, 200_000);
    expect(c.reasons).toEqual(expect.arrayContaining(['hauling1_too_fast', 'quiz_too_fast']));
  });

  it('jumlah event tidak konsisten = flag', () => {
    const s = good();
    s.loading.perfectPasses = 6;
    s.hauling1.lvViolationCount = 5;
    s.hauling2.radioCorrect = 3;
    s.dumping.greenZoneMs = 12_000;
    s.dumping.comboCount = 9;
    s.quiz.correctCount = 4;
    const c = validateRun(s, 300_000);
    expect(c.reasons).toEqual(
      expect.arrayContaining([
        'loading_counts_inconsistent',
        'hauling_lv_count',
        'hauling_radio_count',
        'dumping_green_exceeds_slider',
        'dumping_combo_inconsistent',
        'quiz_correct_count',
      ]),
    );
  });

  it('target loading atau slider dimanipulasi = flag', () => {
    const s = good();
    s.loading.targetPasses = 1;
    s.loading.loadedPasses = 1;
    s.dumping.sliderMs = 1_000;
    s.dumping.greenZoneMs = 1_000;
    const c = validateRun(s, 300_000);
    expect(c.reasons).toEqual(expect.arrayContaining(['loading_target_mismatch', 'dumping_slider_mismatch']));
  });
});
