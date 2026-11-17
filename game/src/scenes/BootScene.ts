import { FLOW } from '../data/stages';
import { startStep } from '../systems/flow';
import { PlaceholderScene } from './PlaceholderScene';

export class BootScene extends PlaceholderScene {
  constructor() {
    super('Boot');
  }

  override create(): void {
    // Dev only: lompat langsung ke tahap, misal ?stage=Hauling&part=2
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(location.search);
      const part = Number(q.get('part') ?? 1);
      const i = FLOW.findIndex((s) => s.scene === q.get('stage') && (s.part ?? 1) === part);
      // Ditunda satu frame: scene.start di dalam create() bikin scene tujuan tidak pernah update.
      if (i >= 0) return void this.time.delayedCall(0, () => startStep(this, i));
    }
    super.create();
  }
}
