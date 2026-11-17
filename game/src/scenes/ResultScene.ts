import { SAFETY_START } from '@shared/scoring';
import { UI_TEXT } from '../data/stages';
import { PlaceholderScene } from './PlaceholderScene';

export class ResultScene extends PlaceholderScene {
  constructor() {
    super('Result');
  }

  override create(): void {
    super.create();
    const { width, height } = this.scale;
    // Bukti shared/ ter-import dari game.
    this.add
      .text(width / 2, height * 0.6, UI_TEXT.safetyMax(SAFETY_START), { fontFamily: 'sans-serif', fontSize: '36px', color: '#f2b705' })
      .setOrigin(0.5);
  }
}
