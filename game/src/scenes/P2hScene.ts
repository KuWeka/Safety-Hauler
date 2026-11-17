import Phaser from 'phaser';
import { P2H_POINTS, P2H_TEXT as T } from '../data/p2h';
import { nextStep } from '../systems/flow';
import { scoreTracker } from '../systems/scoreTracker';
import { say } from '../systems/supervisor';
import { createButton } from '../ui/Button';
import { label } from '../ui/text';

type Mode = 'inspect' | 'report' | 'done';

export class P2hScene extends Phaser.Scene {
  private mode: Mode = 'inspect';
  private problem = 0;
  private checked = new Set<number>();
  private elapsed = 0;
  private spots: Phaser.GameObjects.Arc[] = [];
  private info!: Phaser.GameObjects.Text;
  private counter!: Phaser.GameObjects.Text;
  private reportBtn?: Phaser.GameObjects.Container;

  constructor() {
    super('P2h');
  }

  create(): void {
    this.mode = 'inspect';
    this.problem = Math.floor(Math.random() * P2H_POINTS.length);
    this.checked = new Set();
    this.elapsed = 0;
    this.spots = [];
    this.reportBtn = undefined;

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x8a7158).setOrigin(0);
    this.add.rectangle(0, 0, width, 200, 0x1b1f24, 0.85).setOrigin(0);
    label(this, width / 2, 55, T.title, 48, '#f2b705', true);
    label(this, width / 2, 135, T.hint, 28, '#ffffff', false, 640);
    this.counter = label(this, width / 2, 240, T.checked(0, P2H_POINTS.length), 30, '#1b1f24', true);
    this.drawExcavator();

    P2H_POINTS.forEach((p, i) => {
      const spot = this.add.circle(p.x, p.y, 46, 0xf2b705, 0.9).setStrokeStyle(6, 0x1b1f24).setInteractive({ useHandCursor: true });
      label(this, p.x, p.y, '?', 44, '#1b1f24', true);
      label(this, p.x, p.y + 66, p.label, 26, '#ffffff', true).setStroke('#1b1f24', 6);
      this.tweens.add({ targets: spot, scale: 1.12, duration: 600, yoyo: true, repeat: -1 });
      spot.on('pointerup', () => this.tapSpot(i));
      this.spots.push(spot);
    });

    this.add.rectangle(width / 2, 958, width - 40, 130, 0x1b1f24, 0.85).setStrokeStyle(3, 0xffffff, 0.4);
    this.info = label(this, width / 2, 958, '', 30, '#ffffff', true, 640);
    createButton(this, width / 2, 1215, T.skip, () => this.skip());
  }

  override update(_time: number, delta: number): void {
    if (this.mode !== 'done') this.elapsed += delta;
  }

  private drawExcavator(): void {
    const dark = 0x1b1f24;
    this.add.rectangle(360, 800, 460, 110, 0x3d4247).setStrokeStyle(6, dark); // track
    for (let x = 160; x <= 560; x += 50) this.add.rectangle(x, 800, 30, 90, 0x2b2f33);
    this.add.rectangle(380, 640, 360, 190, 0xf2b705).setStrokeStyle(6, dark); // body
    this.add.rectangle(300, 500, 170, 150, 0xf2b705).setStrokeStyle(6, dark); // kabin
    this.add.rectangle(300, 495, 130, 100, 0x88c8ff, 0.8).setStrokeStyle(4, dark);
    this.add.line(0, 0, 470, 560, 640, 330, dark).setOrigin(0).setLineWidth(30); // boom
    this.add.rectangle(640, 380, 70, 120, 0x3d4247).setStrokeStyle(5, dark); // bucket
  }

  private tapSpot(i: number): void {
    if (this.mode === 'done') return;
    if (this.mode === 'report') return this.report(i);
    const point = P2H_POINTS[i]!;
    this.checked.add(i);
    this.spots[i]!.setFillStyle(0x5dade2, 0.9);
    this.info.setText(`${point.label}: ${i === this.problem ? point.problem : point.ok}`);
    this.counter.setText(T.checked(this.checked.size, P2H_POINTS.length));
    if (this.checked.size === P2H_POINTS.length && !this.reportBtn) {
      this.reportBtn = createButton(this, this.scale.width / 2, 1090, T.report, () => {
        this.mode = 'report';
        this.reportBtn?.destroy();
        this.info.setText(T.reportHint).setColor('#f2b705');
      });
    }
  }

  private report(i: number): void {
    const correct = i === this.problem;
    this.finish(false, correct);
    this.spots[this.problem]!.setFillStyle(0xc0392b, 0.95);
    this.info.setText(correct ? T.correct : T.wrong(P2H_POINTS[this.problem]!.label)).setColor(correct ? '#7CFC9A' : '#ff8a7a');
    say(this, correct ? 'p2hCorrect' : 'p2hWrong');
  }

  private skip(): void {
    if (this.mode === 'done') return;
    this.finish(true, false);
    say(this, 'p2hSkipped');
  }

  private finish(skipped: boolean, correctReport: boolean): void {
    this.mode = 'done';
    scoreTracker.record('p2h', { skipped, correctReport, durationMs: Math.round(this.elapsed) });
    this.time.delayedCall(2300, () => nextStep(this));
  }
}
