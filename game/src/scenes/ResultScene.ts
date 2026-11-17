import Phaser from 'phaser';
import { calculateScore, DUMPING_MAX, LOADING_LOAD_MAX, LOADING_TIME_BONUS_MAX, SAFETY_START, UNIT_MAX } from '@shared/scoring';
import type { ScoreBreakdown, StageData } from '@shared/types';
import { REQUIRED } from '../data/apd';
import { DIALOG } from '../data/dialogs';
import { HIGH_SCORE_THRESHOLD, RESULT_TEXT as T, VIOLATION_LABEL } from '../data/result';
import { nextStep } from '../systems/flow';
import { scoreTracker } from '../systems/scoreTracker';
import { loadPlayer, savePlayer } from '../systems/storage';
import { drawBoss } from '../systems/supervisor';
import { createButton } from '../ui/Button';
import { Character } from '../ui/Character';
import { label } from '../ui/text';

const STAGE_KEYS: (keyof StageData)[] = ['apd', 'p2h', 'loading', 'hauling1', 'reboisasi', 'hauling2', 'dumping', 'quiz'];

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x22313f).setOrigin(0);
    label(this, width / 2, 60, T.title, 48, '#f2b705', true);

    const stages = scoreTracker.stages;
    if (!STAGE_KEYS.every((k) => stages[k])) {
      label(this, width / 2, height * 0.4, T.incomplete, 36, '#ffffff', true, 600);
      createButton(this, width / 2, height * 0.6, T.playAgain, () => nextStep(this));
      return;
    }

    // Skor lokal (untuk ditampilkan). Skor resmi tetap dihitung ulang server di Fase 3.
    const score = calculateScore(stages as StageData);
    const player = loadPlayer();
    if (player) savePlayer({ ...player, playCount: player.playCount + 1 });

    this.drawBreakdown(score);
    const high = score.total >= HIGH_SCORE_THRESHOLD;
    const lines = DIALOG[high ? 'scoreHigh' : 'scoreLow'];
    drawBoss(this, 110, 935, high ? 'bangga' : 'jempol').setScale(0.75);
    label(this, 200, 935, lines[Math.floor(Math.random() * lines.length)]!, 30, '#ffffff', true, 470).setOrigin(0, 0.5);
    label(this, width / 2, 1022, T.rankPending, 24, '#9aa4ae');

    createButton(this, width / 2, 1105, T.card, () => this.showCard(score.total));
    createButton(this, width / 2, 1222, T.playAgain, () => nextStep(this));
  }

  private drawBreakdown(s: ScoreBreakdown): void {
    const { width } = this.scale;
    label(this, width / 2, 150, T.total, 30, '#9aa4ae', true);
    const total = label(this, width / 2, 225, '0', 96, '#ffffff', true);
    this.tweens.addCounter({
      from: 0,
      to: s.total,
      duration: 900,
      onUpdate: (t) => total.setText(Math.round(t.getValue() ?? 0).toLocaleString('id-ID')),
    });

    const rows: [string, number, number | null][] = [
      [T.productivity, s.loading + s.dumping, LOADING_LOAD_MAX + LOADING_TIME_BONUS_MAX + DUMPING_MAX],
      [T.safety, s.safety, SAFETY_START],
      [T.unit, s.unit, UNIT_MAX],
      [T.bonus, s.reboisasi + s.quiz + s.extra, null],
    ];
    rows.forEach(([name, value, max], i) => {
      const y = 330 + i * 66;
      this.add.rectangle(width / 2, y, width - 60, 56, 0x1b1f24, 0.7);
      label(this, 60, y, name, 30, '#ffffff', true).setOrigin(0, 0.5);
      label(this, width - 60, y, max ? `${value} / ${max}` : `+${value}`, 30, '#f2b705', true).setOrigin(1, 0.5);
    });

    label(this, 60, 610, T.violations, 30, '#ff8a7a', true).setOrigin(0, 0.5);
    if (s.violations.length === 0) {
      label(this, 60, 660, T.noViolations, 28, '#7CFC9A', true).setOrigin(0, 0.5);
    }
    // Dua kolom supaya semua jenis teguran (maks 9) muat.
    s.violations.forEach((v, i) => {
      const x = i % 2 === 0 ? 60 : 375;
      const y = 660 + Math.floor(i / 2) * 50;
      label(this, x, y, T.violationLine(VIOLATION_LABEL[v.type], v.count, v.points), 23, '#ffffff', false, 300)
        .setOrigin(0, 0.5)
        .setAlign('left');
    });
  }

  private showCard(total: number): void {
    const { width, height } = this.scale;
    const player = loadPlayer();
    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive());

    // Kartu: area 60..660 × 130..990, disimpan apa adanya lewat snapshot.
    panel.add(this.add.rectangle(360, 560, 600, 860, 0xfdf6e3).setStrokeStyle(10, 0xf2b705));
    panel.add(this.add.rectangle(360, 185, 600, 90, 0x1b1f24));
    panel.add(label(this, 360, 185, T.cardTitle, 40, '#f2b705', true));
    if (player) {
      panel.add(this.add.ellipse(360, 690, 220, 36, 0x000000, 0.15));
      panel.add(new Character(this, 360, 600, player.avatar).setScale(0.62).setWorn(REQUIRED));
    }
    panel.add(label(this, 360, 760, player?.name ?? '-', 48, '#1b1f24', true, 560));
    panel.add(label(this, 360, 815, player?.division ?? '', 30, '#555555', true, 560));
    panel.add(label(this, 360, 885, total.toLocaleString('id-ID'), 64, '#c0392b', true));
    panel.add(label(this, 360, 945, T.cardRank(null), 28, '#1b1f24', true));

    panel.add(
      createButton(this, width / 2, 1070, T.save, () => {
        this.game.renderer.snapshotArea(60, 130, 600, 860, (img) => {
          if (!(img instanceof HTMLImageElement)) return;
          const a = document.createElement('a');
          a.href = img.src;
          a.download = T.fileName;
          a.click();
        });
      }),
    );
    panel.add(createButton(this, width / 2, 1190, T.close, () => panel.destroy()));
  }
}
