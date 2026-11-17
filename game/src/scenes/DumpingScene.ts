import Phaser from 'phaser';
import { DUMPING as C, DUMPING_TEXT as T } from '../data/dumping';
import { UI_TEXT } from '../data/stages';
import { nextStep } from '../systems/flow';
import { SustainedTimer } from '../systems/rules';
import { scoreTracker } from '../systems/scoreTracker';
import { say } from '../systems/supervisor';
import { createBar, type Bar } from '../ui/Bar';
import { createButton } from '../ui/Button';
import { ART, ART_SCALE, sprite } from '../systems/art';
import { floatText, FONT, label } from '../ui/text';

type Phase = 'reverse' | 'wait' | 'slider' | 'done';

const TRACK_LEFT = 80;
const TRACK_W = 560;
const TRACK_Y = 1010;

export class DumpingScene extends Phaser.Scene {
  private phase: Phase = 'reverse';
  private elapsed = 0;
  private holding = false;
  private rearY = C.reverseStartY;
  private bermHit = false;
  private sliderElapsed = 0;
  private value = 0.5;
  private greenMs = 0;
  private tooSlowCount = 0;
  private tooFastCount = 0;
  private comboCount = 0;
  private slowTimer!: SustainedTimer;
  private fastTimer!: SustainedTimer;
  private comboTimer!: SustainedTimer;
  private partA!: Phaser.GameObjects.Container;
  private truck!: Phaser.GameObjects.Container;
  private bak!: Phaser.GameObjects.Rectangle;
  private spotterText!: Phaser.GameObjects.Text;
  private spotterBubble!: Phaser.GameObjects.NineSlice;
  private zone!: Phaser.GameObjects.Image;
  private thumb!: Phaser.GameObjects.NineSlice;
  private loadBar!: Bar;

  constructor() {
    super('Dumping');
  }

  create(): void {
    this.phase = 'reverse';
    this.elapsed = 0;
    this.holding = false;
    this.rearY = C.reverseStartY;
    this.bermHit = false;
    this.sliderElapsed = 0;
    this.value = 0.5;
    this.greenMs = 0;
    this.tooSlowCount = 0;
    this.tooFastCount = 0;
    this.comboCount = 0;
    this.slowTimer = new SustainedTimer(C.warnHoldMs, C.warnRepeatMs);
    this.fastTimer = new SustainedTimer(C.warnHoldMs, C.warnRepeatMs);
    this.comboTimer = new SustainedTimer(C.comboMs, C.comboMs);

    const { width, height } = this.scale;
    this.add.tileSprite(0, 0, width, height, ART, 'tile_dirt').setOrigin(0).setTileScale(ART_SCALE);
    this.createPartA();
  }

  // ---------- Bagian A: mundur ----------

  private createPartA(): void {
    const { width } = this.scale;
    this.partA = this.add.container(0, 0);
    this.partA.add(this.add.tileSprite(0, C.bermY, width, 70, ART, 'tile_berm').setOrigin(0).setTileScale(ART_SCALE));
    this.partA.add(label(this, width / 2, C.bermY + 35, T.berm, 28, '#e8d8c0', true));
    this.partA.add(this.add.tileSprite(0, C.bermY + 70, width, 210, ART, 'tile_pit').setOrigin(0).setTileScale(ART_SCALE)); // lubang dumping
    this.partA.add(label(this, width / 2, 60, T.titleA, 42, '#ffffff', true));
    this.partA.add(label(this, width / 2, 140, T.hintA, 30, '#ffffff', true, 640));

    // Spotter (placeholder) di kanan dekat titik stop.
    this.partA.add(sprite(this, 640, C.stopZoneTop - 20, 'spotter_4', 2.2));
    this.spotterBubble = this.add.nineslice(520, C.stopZoneTop - 190, ART, 'ui_button_green', 130, 50, 6, 6, 6, 6).setScale(ART_SCALE);
    this.spotterText = label(this, 520, C.stopZoneTop - 192, T.spotterGo, 38, '#ffffff', true);
    this.partA.add([this.spotterBubble, this.spotterText]);

    // Truk tampak belakang (maju = ke atas layar); titik (0,0) kontainer = ujung belakang truk.
    this.truck = this.add.container(320, this.rearY, [sprite(this, 0, 0, 'hd_truck_0', 3).setOrigin(0.5, 0.78)]);
    // Tumpukan batubara di bak: tingginya menyusut saat dumping.
    this.bak = this.add.rectangle(0, -78, 96, 150, 0x1e1b1b).setOrigin(0.5, 0.5);
    this.truck.add(this.bak);

    const btn = this.add.nineslice(width / 2, 1190, ART, 'ui_button_red', 230, 70, 6, 6, 6, 6).setScale(ART_SCALE).setInteractive();
    const btnText = this.add.text(width / 2, 1190, T.reverse, { fontFamily: FONT, fontSize: '52px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.partA.add([btn, btnText]);
    btn.on('pointerdown', () => {
      if (this.phase === 'reverse') this.holding = true;
    });
    this.input.on('pointerup', () => this.releaseReverse());
    this.input.on('pointerupoutside', () => this.releaseReverse());
    this.input.keyboard?.on('keydown-SPACE', () => this.phase === 'reverse' && (this.holding = true));
    this.input.keyboard?.on('keyup-SPACE', () => this.releaseReverse());
  }

  private inStopZone(): boolean {
    return this.rearY >= C.stopZoneTop && this.rearY <= C.stopZoneBottom;
  }

  private releaseReverse(): void {
    if (this.phase !== 'reverse' || !this.holding) return;
    this.holding = false;
    if (this.inStopZone()) {
      floatText(this, 320, this.rearY - 300, T.goodStop, '#7CFC9A');
      this.endPartA();
    }
  }

  private endPartA(): void {
    this.phase = 'wait';
    this.time.delayedCall(1300, () => this.startSlider());
  }

  private updateReverse(delta: number): void {
    if (this.holding) this.rearY += (C.reverseSpeedPxPerSec * delta) / 1000;
    if (this.rearY >= C.bermY) {
      this.bermHit = true;
      this.holding = false;
      this.rearY = C.bermBounceY;
      this.cameras.main.shake(250, 0.012);
      say(this, 'bermHit');
      this.endPartA();
    }
    this.truck.y = this.rearY;
    const stop = this.inStopZone() || this.rearY > C.stopZoneBottom;
    this.spotterBubble.setFrame(stop ? 'ui_button_red' : 'ui_button_green');
    this.spotterText.setText(stop ? T.spotterStop : T.spotterGo);
  }

  // ---------- Bagian B: slider kecepatan dumping ----------

  private startSlider(): void {
    const { width } = this.scale;
    this.partA.destroy();
    this.phase = 'slider';
    this.truck.setPosition(width / 2, 760);

    label(this, width / 2, 60, T.titleB, 42, '#ffffff', true);
    label(this, width / 2, 140, T.hintB, 30, '#ffffff', true, 640);
    label(this, 150, 220, T.load, 28, '#ffffff', true);
    this.loadBar = createBar(this, 230, 220, 420, 36, 0x333333);
    this.loadBar.set(1);

    this.add.nineslice(TRACK_LEFT, TRACK_Y, ART, 'ui_panel', TRACK_W / ART_SCALE, 28, 6, 6, 6, 6).setOrigin(0, 0.5).setScale(ART_SCALE);
    this.zone = this.add.image(0, TRACK_Y, ART, 'ui_bar_green').setDisplaySize(C.zoneWidth * TRACK_W, 44);
    this.thumb = this.add.nineslice(0, TRACK_Y, ART, 'ui_button', 22, 22, 6, 6, 6, 6).setScale(ART_SCALE);
    label(this, TRACK_LEFT + 60, TRACK_Y + 80, T.slow, 30, '#ffffff', true);
    label(this, TRACK_LEFT + TRACK_W - 60, TRACK_Y + 80, T.fast, 30, '#ffffff', true);

    // Area sentuh lebar di sekitar slider; geser di mana saja di area ini.
    const hit = this.add.rectangle(width / 2, TRACK_Y, width, 260, 0xffffff, 0.001).setInteractive();
    const setFromPointer = (p: Phaser.Input.Pointer): void => {
      this.value = Phaser.Math.Clamp((p.x - TRACK_LEFT) / TRACK_W, 0, 1);
    };
    hit.on('pointerdown', setFromPointer);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.phase === 'slider' && p.isDown && Math.abs(p.y - TRACK_Y) < 260) setFromPointer(p);
    });
  }

  private zoneCenter(): number {
    const t = this.sliderElapsed / 1000;
    return 0.5 + C.zoneA1 * Math.sin(t * C.zoneW1) + C.zoneA2 * Math.sin(t * C.zoneW2);
  }

  private updateSlider(delta: number): void {
    this.sliderElapsed = Math.min(C.sliderMs, this.sliderElapsed + delta);
    const center = this.zoneCenter();
    const min = center - C.zoneWidth / 2;
    const max = center + C.zoneWidth / 2;
    const inZone = this.value >= min && this.value <= max;
    if (inZone) this.greenMs += delta;

    if (this.slowTimer.update(this.value < min, delta)) {
      this.tooSlowCount++;
      say(this, 'dumpTooSlow');
    }
    if (this.fastTimer.update(this.value > max, delta)) {
      this.tooFastCount++;
      say(this, 'dumpTooFast');
    }
    if (this.comboTimer.update(inZone, delta)) {
      this.comboCount++;
      floatText(this, this.thumb.x, TRACK_Y - 90, T.combo, '#7CFC9A');
      say(this, 'combo');
    }

    const progress = this.sliderElapsed / C.sliderMs;
    this.zone.x = TRACK_LEFT + center * TRACK_W;
    this.thumb.x = TRACK_LEFT + this.value * TRACK_W;
    this.thumb.setTint(inZone ? 0xa8ffb8 : 0xffa090);
    this.loadBar.set(1 - progress);
    this.bak.setSize(96, Math.max(2, 150 * (1 - progress)));
    if (this.sliderElapsed >= C.sliderMs) this.finish();
  }

  private finish(): void {
    this.phase = 'done';
    scoreTracker.record('dumping', {
      bermHit: this.bermHit,
      tooFastCount: this.tooFastCount,
      tooSlowCount: this.tooSlowCount,
      greenZoneMs: Math.round(this.greenMs),
      sliderMs: C.sliderMs,
      comboCount: this.comboCount,
      durationMs: Math.round(this.elapsed),
    });
    const { width, height } = this.scale;
    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0).setInteractive());
    panel.add(label(this, width / 2, height * 0.35, T.done, 56, '#7CFC9A', true));
    panel.add(label(this, width / 2, height * 0.45, T.accuracy(Math.round((this.greenMs / C.sliderMs) * 100)), 38, '#ffffff', true));
    panel.add(createButton(this, width / 2, height * 0.65, UI_TEXT.next, () => nextStep(this)));
  }

  override update(_time: number, delta: number): void {
    if (this.phase === 'done') return;
    this.elapsed += delta;
    if (this.phase === 'reverse') this.updateReverse(delta);
    if (this.phase === 'slider') this.updateSlider(delta);
  }
}
