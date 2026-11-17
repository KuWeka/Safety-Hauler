import { describe, expect, it } from 'vitest';
import { approach, judgeDrop, SustainedTimer } from './rules';

describe('judgeDrop', () => {
  it('tengah = perfect, pinggir = edge, luar = miss', () => {
    expect(judgeDrop(530, 530, 45, 100)).toBe('perfect');
    expect(judgeDrop(575, 530, 45, 100)).toBe('perfect');
    expect(judgeDrop(470, 530, 45, 100)).toBe('edge');
    expect(judgeDrop(631, 530, 45, 100)).toBe('miss');
  });
});

describe('SustainedTimer', () => {
  it('terpicu setelah hold, lalu tiap repeat selama aktif', () => {
    const t = new SustainedTimer(1000, 3000);
    const fired: number[] = [];
    for (let ms = 100; ms <= 8000; ms += 100) if (t.update(true, 100)) fired.push(ms);
    expect(fired).toEqual([1000, 4000, 7000]);
  });

  it('putus sebentar = hitungan ulang dari nol', () => {
    const t = new SustainedTimer(1000, 3000);
    for (let i = 0; i < 9; i++) expect(t.update(true, 100)).toBe(false);
    t.update(false, 100);
    for (let i = 0; i < 9; i++) expect(t.update(true, 100)).toBe(false);
    expect(t.update(true, 100)).toBe(true);
  });
});

describe('approach', () => {
  it('tidak melewati target', () => {
    expect(approach(30, 60, 25, 1000)).toBe(55);
    expect(approach(55, 60, 25, 1000)).toBe(60);
    expect(approach(10, 0, 50, 1000)).toBe(0);
  });
});
