import Phaser from 'phaser';
import { LOADING as C, LOADING_TEXT as T } from '../data/loading';
import { nextStep } from '../systems/flow';
import { judgeDrop } from '../systems/rules';
import { scoreTracker } from '../systems/scoreTracker';
import { say } from '../systems/supervisor';
import { createBar, type Bar } from '../ui/Bar';
import { createButton } from '../ui/Button';
import { ART, ART_SCALE, sprite } from '../systems/art';
import { floatText, label } from '../ui/text';

type State = 'swing' | 'busy' | 'done';

const BAK_X = 530;

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
    // Lantai tambang tampak atas: tanah, area galian (pit) di kiri, jalan di bawah truk.
    this.add.tileSprite(0, 0, width, height, ART, 'tile_dirt').setOrigin(0).setTileScale(ART_SCALE);
    this.add.tileSprite(20, 760, 300, 260, ART, 'tile_pit').setOrigin(0).setTileScale(ART_SCALE);
    this.add.tileSprite(BAK_X - 150, 380, 300, 900, ART, 'tile_road').setOrigin(0).setTileScale(ART_SCALE);

    // HUD
    this.add.rectangle(0, 0, width, 250, 0x1b1f24, 0.9).setOrigin(0).setDepth(30);
    label(this, width / 2, 50, T.title, 44, '#ffffff', true).setDepth(31);
    this.loadBar = createBar(this, 60, 125, 600, 44, 0x2ecc71, 31);
    this.loadText = label(this, width / 2, 125, '', 30, '#ffffff', true).setDepth(32);
    this.timeText = label(this, width / 2, 195, '', 34, '#f2b705', true).setDepth(31);
    label(this, width / 2, 310, T.hint, 36, '#f4f4f4', true).setStroke('#14181d', 8);

    // Zona di atas bak: bar kuning, zona hijau bergerak di dalamnya
    this.add.rectangle(C.zoneCenterX, 610, C.barHalfWidth * 2, 26, 0xf2b705).setStrokeStyle(4, 0x14181d).setDepth(5);
    this.green = this.add.rectangle(C.zoneCenterX, 610, C.greenHalfWidth * 2, 26, 0x4fa24f).setStrokeStyle(2, 0x2c6e3b).setDepth(6);

    // Excavator (pangkal saja; lengan digambar dinamis) dan HD truck
    sprite(this, 175, 700, 'excavator_base', 2.4);
    sprite(this, BAK_X, 860, 'hd_truck_0', 3.4);
    this.arm = this.add.graphics().setDepth(8);

    // Bucket
    const bucketBody = sprite(this, 0, 0, 'bucket', 2);
    this.coal = this.add.rectangle(0, -14, 70, 22, 0x1e1b1b);
    this.bucket = this.add.container(C.swingFromX, C.swingY, [bucketBody, this.coal]).setDepth(10);

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
    // Lengan: garis tebal berwarna palet (outline + kuning) dari pangkal boom ke bucket.
    this.arm.clear().lineStyle(30, 0x14181d).lineBetween(255, 640, this.bucket.x, this.bucket.y).lineStyle(20, 0xf2b705).lineBetween(255, 640, this.bucket.x, this.bucket.y);
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
      y: hit ? 780 : 1000,
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
  }
}
