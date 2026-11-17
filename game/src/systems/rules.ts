// Aturan gameplay murni (tanpa Phaser) supaya bisa di-unit-test.

export type DropResult = 'perfect' | 'edge' | 'miss';

/** Loading: posisi bucket saat tap. Zona hijau bergerak di dalam bar kuning. */
export function judgeDrop(x: number, greenCenter: number, greenHalf: number, barCenter: number, barHalf: number): DropResult {
  if (Math.abs(x - greenCenter) <= greenHalf) return 'perfect';
  if (Math.abs(x - barCenter) <= barHalf) return 'edge';
  return 'miss';
}

/**
 * Kondisi yang harus bertahan terus-menerus sebelum dihitung (ngebut, dumping terlalu cepat, combo).
 * Pertama kali terpicu setelah holdMs, lalu tiap repeatMs selama kondisi masih aktif.
 * Kondisi berhenti = hitungan mulai dari nol lagi.
 */
export class SustainedTimer {
  private elapsed = 0;
  private nextAt: number;

  constructor(
    private readonly holdMs: number,
    private readonly repeatMs: number,
  ) {
    this.nextAt = holdMs;
  }

  /** Return true kalau kejadian terpicu di frame ini. */
  update(active: boolean, dtMs: number): boolean {
    if (!active) {
      this.elapsed = 0;
      this.nextAt = this.holdMs;
      return false;
    }
    this.elapsed += dtMs;
    if (this.elapsed < this.nextAt) return false;
    this.nextAt += this.repeatMs;
    return true;
  }
}

/** Gerak nilai menuju target dengan laju maksimum per detik. */
export function approach(value: number, target: number, ratePerSec: number, dtMs: number): number {
  const step = (ratePerSec * dtMs) / 1000;
  return value < target ? Math.min(target, value + step) : Math.max(target, value - step);
}
