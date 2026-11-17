import Phaser from 'phaser';
import { RESTART_STAGE, STAGES, UI_TEXT, type StageKey } from '../data/stages';
import { createButton } from '../ui/Button';

// shortcut: semua tahap pakai layar generik ini; ganti per scene saat tahapnya dikerjakan (Fase 1–2).
export abstract class PlaceholderScene extends Phaser.Scene {
  constructor(private readonly stageKey: StageKey) {
    super(stageKey);
  }

  create(): void {
    const { width, height } = this.scale;
    const index = STAGES.findIndex((s) => s.key === this.stageKey);
    const stage = STAGES[index]!;
    const next = STAGES[index + 1]?.key ?? RESTART_STAGE;

    this.add.rectangle(0, 0, width, height, 0x2b3138).setOrigin(0);
    this.add
      .text(width / 2, height * 0.12, `${index + 1}/${STAGES.length}`, { fontFamily: 'sans-serif', fontSize: '36px', color: '#9aa4ae' })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.4, stage.label, {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 80 },
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.4 + 80, UI_TEXT.placeholder, { fontFamily: 'sans-serif', fontSize: '32px', color: '#9aa4ae' })
      .setOrigin(0.5);

    const label = STAGES[index + 1] ? UI_TEXT.next : UI_TEXT.playAgain;
    createButton(this, width / 2, height * 0.82, label, () => this.scene.start(next));
  }
}
