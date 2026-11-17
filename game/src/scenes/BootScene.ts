import Phaser from 'phaser';
import { FLOW } from '../data/stages';
import { nextStep, startStep } from '../systems/flow';
import { flushPending } from '../systems/sync';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    // Hasil yang belum terkirim (sinyal putus / tab ketutup) dikirim ulang di latar belakang.
    void flushPending();
    window.addEventListener('online', () => void flushPending());
    // scene.start ditunda satu frame: kalau dipanggil di dalam create(), scene tujuan tidak pernah update.
    this.time.delayedCall(0, () => {
      // Dev only: lompat langsung ke tahap, misal ?stage=Hauling&part=2
      if (import.meta.env.DEV) {
        const q = new URLSearchParams(location.search);
        const part = Number(q.get('part') ?? 1);
        const i = FLOW.findIndex((s) => s.scene === q.get('stage') && (s.part ?? 1) === part);
        if (i >= 0) return startStep(this, i);
      }
      nextStep(this);
    });
  }
}
