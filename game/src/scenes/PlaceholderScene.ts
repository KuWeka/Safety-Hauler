import Phaser from 'phaser';
import { FLOW, UI_TEXT, type SceneKey } from '../data/stages';
import { currentIndex, currentStep, nextStep } from '../systems/flow';
import { createButton } from '../ui/Button';
import { label } from '../ui/text';

// shortcut: tahap yang belum dikerjakan pakai layar generik ini; diganti per scene di Fase 2.
export abstract class PlaceholderScene extends Phaser.Scene {
  constructor(key: SceneKey) {
    super(key);
  }

  create(): void {
    const { width, height } = this.scale;
    const index = currentIndex();
    this.add.rectangle(0, 0, width, height, 0x2b3138).setOrigin(0);
    label(this, width / 2, height * 0.12, `${index + 1}/${FLOW.length}`, 36, '#9aa4ae');
    label(this, width / 2, height * 0.4, currentStep().label, 64, '#ffffff', true);
    label(this, width / 2, height * 0.4 + 80, UI_TEXT.placeholder, 32, '#9aa4ae');
    const last = index === FLOW.length - 1;
    createButton(this, width / 2, height * 0.82, last ? UI_TEXT.playAgain : UI_TEXT.next, () => nextStep(this));
  }
}
