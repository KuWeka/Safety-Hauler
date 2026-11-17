import Phaser from 'phaser';
import { UI_TEXT } from '../data/stages';
import { nextStep } from '../systems/flow';
import { label } from '../ui/text';

/** Muat asset (sprite/audio masuk di Fase 4). Sekarang hanya layar judul singkat. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x1b1f24).setOrigin(0);
    label(this, width / 2, height * 0.42, UI_TEXT.gameTitle, 72, '#f2b705', true);
    label(this, width / 2, height * 0.5, UI_TEXT.loading, 32, '#9aa4ae');
    this.time.delayedCall(700, () => nextStep(this));
  }
}
