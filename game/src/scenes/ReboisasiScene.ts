import Phaser from 'phaser';
import { REBOISASI as C, REBOISASI_TEXT as T } from '../data/reboisasi';
import { nextStep } from '../systems/flow';
import { scoreTracker } from '../systems/scoreTracker';
import { createBar, type Bar } from '../ui/Bar';
import { createButton } from '../ui/Button';
import { label } from '../ui/text';

/** 0 = lahan gundul, 1 = topsoil, 2 = bibit. */
type TileState = 0 | 1 | 2;

const TILE_COLORS: Record<TileState, number> = { 0: 0xa08a6c, 1: 0x4a3426, 2: 0x4a3426 };

export class ReboisasiScene extends Phaser.Scene {
  private states: TileState[] = [];
  private running = false;
  private elapsed = 0;
  private timeBar!: Bar;
  private timeText!: Phaser.GameObjects.Text;

  constructor() {
    super('Reboisasi');
  }

  create(): void {
    this.states = Array<TileState>(C.cols * C.rows).fill(0);
    this.running = false;
    this.elapsed = 0;

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x6f8f5a).setOrigin(0);
    label(this, width / 2, 70, T.title, 48, '#ffffff', true);
    this.timeBar = createBar(this, 60, 150, 600, 40, 0x2ecc71);
    this.timeBar.set(1);
    this.timeText = label(this, width / 2, 150, T.time(C.timeLimitMs / 1000), 26, '#ffffff', true);
    label(this, width / 2, 250, T.howTo, 32, '#ffffff', true);

    const total = C.cols * C.tileSize + (C.cols - 1) * C.gap;
    const x0 = (width - total) / 2 + C.tileSize / 2;
    const y0 = 400 + C.tileSize / 2;
    this.states.forEach((_, i) => {
      const x = x0 + (i % C.cols) * (C.tileSize + C.gap);
      const y = y0 + Math.floor(i / C.cols) * (C.tileSize + C.gap);
      const tile = this.add.rectangle(x, y, C.tileSize, C.tileSize, TILE_COLORS[0]).setStrokeStyle(5, 0x3b2f22).setInteractive();
      const seedling = this.add.container(x, y, [
        this.add.rectangle(0, 20, 10, 60, 0x2e7d32),
        this.add.ellipse(-22, -5, 50, 28, 0x43a047),
        this.add.ellipse(22, -15, 50, 28, 0x66bb6a),
      ]).setVisible(false);
      tile.on('pointerdown', () => this.tapTile(i, tile, seedling));
    });

    this.showIntro();
  }

  private showIntro(): void {
    const { width, height } = this.scale;
    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0).setInteractive());
    panel.add(label(this, width / 2, height * 0.38, T.intro, 46, '#ffffff', true, 600));
    panel.add(
      createButton(this, width / 2, height * 0.62, T.start, () => {
        panel.destroy();
        this.running = true;
      }),
    );
  }

  private tapTile(i: number, tile: Phaser.GameObjects.Rectangle, seedling: Phaser.GameObjects.Container): void {
    const state = this.states[i]!;
    if (!this.running || state === 2) return;
    const next = (state + 1) as TileState;
    this.states[i] = next;
    tile.setFillStyle(TILE_COLORS[next]);
    if (next === 2) {
      seedling.setVisible(true).setScale(0.2);
      this.tweens.add({ targets: seedling, scale: 1, duration: 250, ease: 'Back.Out' });
    }
    if (this.states.every((s) => s === 2)) this.finish(true);
  }

  override update(_time: number, delta: number): void {
    if (!this.running) return;
    this.elapsed = Math.min(C.timeLimitMs, this.elapsed + delta);
    const left = C.timeLimitMs - this.elapsed;
    this.timeBar.set(left / C.timeLimitMs);
    this.timeText.setText(T.time(left / 1000));
    if (left <= 0) this.finish(false);
  }

  private finish(completed: boolean): void {
    this.running = false;
    scoreTracker.record('reboisasi', {
      completed,
      timeLeftMs: Math.round(C.timeLimitMs - this.elapsed),
      durationMs: Math.round(this.elapsed),
    });

    const { width, height } = this.scale;
    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0).setInteractive());
    panel.add(label(this, width / 2, height * 0.3, completed ? T.done : T.timeUp, 56, completed ? '#7CFC9A' : '#ff6b5a', true));
    panel.add(label(this, width / 2, height * 0.45, T.fact, 36, '#ffffff', false, 600));
    // Ditunda: tap terakhir di petak jangan sampai langsung kena tombol ini (fakta reklamasi ke-skip).
    this.time.delayedCall(800, () => panel.add(createButton(this, width / 2, height * 0.7, T.next, () => nextStep(this))));
  }
}
