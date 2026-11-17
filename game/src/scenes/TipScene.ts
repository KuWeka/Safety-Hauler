import Phaser from 'phaser';
import { UI_TEXT } from '../data/stages';
import { SAFETY_TIPS, TIP_DURATION_MS } from '../data/tips';
import { currentIndex, currentStep, startStep } from '../systems/flow';
import { label } from '../ui/text';

/** Layar transisi antar tahap: satu Safety Tip, otomatis lanjut, bisa di-skip dengan tap. */
export class TipScene extends Phaser.Scene {
  constructor() {
    super('Tip');
  }

  create(): void {
    const { width, height } = this.scale;
    const tip = SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)]!;
    this.add.rectangle(0, 0, width, height, 0x1b1f24).setOrigin(0);
    label(this, width / 2, height * 0.3, currentStep().label, 52, '#f2b705', true);
    label(this, width / 2, height * 0.45, UI_TEXT.tipTitle, 34, '#9aa4ae');
    label(this, width / 2, height * 0.53, tip, 44, '#ffffff', false, 620);
    label(this, width / 2, height * 0.85, UI_TEXT.tapToSkip, 30, '#9aa4ae');

    let done = false;
    const go = (): void => {
      if (done) return;
      done = true;
      startStep(this, currentIndex());
    };
    this.time.delayedCall(TIP_DURATION_MS, go);
    this.input.once('pointerup', go);
  }
}
