import { describe, expect, it } from 'vitest';
import { normalizeName, normalizePhone } from './validation';

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

describe('normalizeName', () => {
  it('rapikan spasi, tolak terlalu pendek/panjang', () => {
    expect(normalizeName('  Budi   Santoso ')).toBe('Budi Santoso');
    expect(normalizeName('A')).toBeNull();
    expect(normalizeName('x'.repeat(31))).toBeNull();
  });
});
