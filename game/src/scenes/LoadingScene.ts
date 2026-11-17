import Phaser from 'phaser';
import { LOADING as C, LOADING_TEXT as T } from '../data/loading';
import { nextStep } from '../systems/flow';
import { judgeDrop } from '../systems/rules';
import { scoreTracker } from '../systems/scoreTracker';
import { say } from '../systems/supervisor';
import { createBar, type Bar } from '../ui/Bar';
import { createButton } from '../ui/Button';
import { floatText, label } from '../ui/text';

type State = 'swing' | 'busy' | 'done';

const BAK_X = 530;
const BAK_TOP = 705;
const BAK_W = 260;
const BAK_H = 110;

export class LoadingScene extends Phaser.Scene {
  private state: State = 'swing';
  private dir = 1;
  private cargo = 0;
  private perfectPasses = 0;
  private overloadCount = 0;
  private elapsed = 0;
  private bucket!: Phaser.GameObjects.Container;
  private coal!: Phaser.GameObjects.Rectangle;
  private arm!: Phaser.GameObjects.Graphics;
  private green!: Phaser.GameObjects.Rectangle;
  private bakFill!: Phaser.GameObjects.Rectangle;
  private loadBar!: Bar;
  private loadText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;

  constructor() {
    super('Loading');
  }

  create(): void {
    this.state = 'swing';
    this.dir = 1;
    this.cargo = 0;
    this.perfectPasses = 0;
    this.overloadCount = 0;
    this.elapsed = 0;

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x9cc7e0).setOrigin(0); // langit
    this.add.rectangle(0, 940, width, height - 940, 0x6b5a48).setOrigin(0); // tanah

    // HUD
    this.add.rectangle(0, 0, width, 250, 0x1b1f24, 0.85).setOrigin(0);
    label(this, width / 2, 50, T.title, 44, '#ffffff', true);
    this.loadBar = createBar(this, 60, 125, 600, 44, 0x2ecc71);
    this.loadText = label(this, width / 2, 125, '', 30, '#ffffff', true);
    this.timeText = label(this, width / 2, 195, '', 34, '#f2b705', true);
    label(this, width / 2, 330, T.hint, 36, '#1b1f24', true);

    // Zona di atas bak
    this.add.rectangle(C.zoneCenterX, 610, C.barHalfWidth * 2, 26, 0xf2b705).setStrokeStyle(3, 0x1b1f24);
    this.green = this.add.rectangle(C.zoneCenterX, 610, C.greenHalfWidth * 2, 26, 0x2ecc71);
    this.add.line(0, 0, C.swingFromX, C.swingY, C.swingToX, C.swingY, 0x1b1f24, 0.25).setOrigin(0);

    // Pit + excavator (placeholder)
    this.add.rectangle(40, 900, 240, 100, 0x3a2e24).setOrigin(0);
    this.add.triangle(150, 900, 0, 60, 80, 0, 160, 60, 0x111111);
    this.add.rectangle(110, 820, 150, 110, 0xf2b705).setStrokeStyle(5, 0x1b1f24);
    this.add.rectangle(110, 890, 190, 34, 0x333333);
    this.arm = this.add.graphics();

    // HD truck (placeholder)
    this.add.rectangle(BAK_X, 880, 320, 120, 0xf2b705).setStrokeStyle(5, 0x1b1f24);
    this.add.rectangle(BAK_X, BAK_TOP + BAK_H / 2, BAK_W, BAK_H, 0x5a5f66).setStrokeStyle(5, 0x1b1f24);
    this.bakFill = this.add.rectangle(BAK_X, BAK_TOP + BAK_H - 3, BAK_W - 12, 0, 0x111111).setOrigin(0.5, 1);
    for (const wx of [420, 640]) this.add.circle(wx, 950, 42, 0x222222).setStrokeStyle(6, 0x555555);

    // Bucket
    const bucketBody = this.add.rectangle(0, 0, 90, 70, 0x3d4247).setStrokeStyle(5, 0x1b1f24);
    this.coal = this.add.rectangle(0, -20, 72, 28, 0x111111);
    this.bucket = this.add.container(C.swingFromX, C.swingY, [bucketBody, this.coal]);

    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.state === 'swing' && over.length === 0) this.dump();
    });
    this.refreshHud();
  }

  override update(_time: number, delta: number): void {
    if (this.state !== 'done') {
      this.elapsed += delta;
      if (this.elapsed >= C.timeLimitMs) {
        this.elapsed = C.timeLimitMs;
        this.finish(false);
      }
    }
    if (this.state !== 'done') {
      const t = this.elapsed / 1000;
      this.green.x = C.zoneCenterX + (C.barHalfWidth - C.greenHalfWidth) * Math.sin(t * C.greenSpeed);
    }
    if (this.state === 'swing') {
      let x = this.bucket.x + this.dir * (C.swingSpeedPxPerSec + C.swingSpeedUpPerPass * this.cargo) * (delta / 1000);
      if (x >= C.swingToX) [x, this.dir] = [C.swingToX, -1];
      if (x <= C.swingFromX) [x, this.dir] = [C.swingFromX, 1];
      this.bucket.x = x;
    }
    this.arm.clear().lineStyle(22, 0xd9a400).lineBetween(130, 790, this.bucket.x, this.bucket.y + 10);
    this.refreshHud();
  }

  private dump(): void {
    this.state = 'busy';
    const result = judgeDrop(this.bucket.x, this.green.x, C.greenHalfWidth, C.zoneCenterX, C.barHalfWidth);
    const hit = result !== 'miss';
    this.coal.setVisible(false);

    const chunk = this.add.rectangle(this.bucket.x, this.bucket.y + 20, 72, 28, 0x111111);
    this.tweens.add({
      targets: chunk,
      y: hit ? BAK_TOP : 1000,
      alpha: hit ? 1 : 0.2,
      duration: C.dumpMs,
      ease: 'Quad.In',
      onComplete: () => {
        chunk.destroy();
        if (hit) {
          if (result === 'perfect') this.perfectPasses++;
          this.cargo += result === 'perfect' ? C.loadPerfect : C.loadEdge;
        }
        this.refreshHud();
        if (this.cargo >= C.targetPasses) this.finish(true);
        else this.returnToPit();
      },
    });
    const text = { perfect: T.perfect, edge: T.edge, miss: T.miss }[result];
    floatText(this, this.bucket.x, this.bucket.y - 60, text, hit ? '#1f8a4c' : '#c0392b');
  }

  private returnToPit(): void {
    this.tweens.add({
      targets: this.bucket,
      x: C.swingFromX,
      duration: C.returnMs,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (this.state === 'done') return;
        this.coal.setVisible(true);
        this.dir = 1;
        this.state = 'swing';
      },
    });
  }

  private finish(full: boolean): void {
    if (this.state === 'done') return;
    this.state = 'done';
    this.tweens.killTweensOf(this.bucket);
    const durationMs = Math.round(this.elapsed);
    const { width } = this.scale;

    this.add.rectangle(0, 990, width, 290, 0x1b1f24, 0.9).setOrigin(0);
    label(this, width / 2, 455, full ? T.full : T.timeUp, 56, full ? '#1f8a4c' : '#c0392b', true);

    const record = (): void =>
      scoreTracker.record('loading', {
        loadedPasses: Math.min(this.cargo, C.targetPasses),
        targetPasses: C.targetPasses,
        perfectPasses: this.perfectPasses,
        overloadCount: this.overloadCount,
        durationMs,
      });

    if (full) {
      // Jebakan edukatif: bak sudah penuh tapi tombol tambah tetap ada.
      createButton(this, width / 2, 1060, T.addMore, () => {
        this.overloadCount++;
        this.bakFill.setSize(BAK_W - 12, BAK_H - 6 + 22 * Math.min(this.overloadCount, 3));
        say(this, 'overload');
      });
    }
    createButton(this, width / 2, 1200, T.depart, () => {
      record();
      nextStep(this);
    });
  }

  private refreshHud(): void {
    const shown = Math.min(this.cargo, C.targetPasses);
    this.loadBar.set(shown / C.targetPasses);
    this.loadText.setText(T.load(shown, C.targetPasses));
    this.timeText.setText(T.time(this.elapsed / 1000));
    if (this.overloadCount === 0) this.bakFill.setSize(BAK_W - 12, (BAK_H - 6) * (shown / C.targetPasses));
  }
}
