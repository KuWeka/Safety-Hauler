import Phaser from 'phaser';
import { UNIT_HP_MAX } from '@shared/scoring';
import { COURSES, HAULING as C, HAULING_TEXT as T, RADIO_QUESTIONS, type Course, type CourseEvent } from '../data/hauling';
import { nextStep } from '../systems/flow';
import { approach, SustainedTimer } from '../systems/rules';
import { scoreTracker } from '../systems/scoreTracker';
import { say } from '../systems/supervisor';
import { createBar, type Bar } from '../ui/Bar';
import { floatText, label } from '../ui/text';

const TRUCK_Y = 950;
/** Ujung depan truk: titik dunia d tepat berada di sini. */
const FRONT_Y = TRUCK_Y - 90;
const ROAD_LEFT = 120;
const ROAD_RIGHT = 600;
const HUD_H = 190;
const CONTROLS_Y = 1100;
const SLIDER_LEFT = 90;
const SLIDER_W = 540;
const SLIDER_Y = 1195;

type LvState = 'idle' | 'crossing' | 'cleared' | 'violated';

interface WorldObject {
  event: CourseEvent;
  view: Phaser.GameObjects.Container;
  resolved: boolean;
  lv?: { state: LvState; t: number; car: Phaser.GameObjects.Rectangle };
}

export class HaulingScene extends Phaser.Scene {
  private part: 1 | 2 = 1;
  private course!: Course;
  private d = 0;
  private kmh = 0;
  private lane = C.startLane;
  private elapsed = 0;
  private hpStart = UNIT_HP_MAX;
  private hpLost = 0;
  private speedingCount = 0;
  private lvViolationCount = 0;
  private radioCorrect = 0;
  private paused = false;
  private finished = false;
  private targetKmh = 0;
  private sliderId = -1;
  private swipe: { id: number; x: number } | null = null;
  private speeding!: SustainedTimer;
  private objects: WorldObject[] = [];
  private scenery: { view: Phaser.GameObjects.Rectangle; offset: number; spacing: number }[] = [];
  private truck!: Phaser.GameObjects.Container;
  private fog!: Phaser.GameObjects.Rectangle;
  private hpBar!: Bar;
  private hpText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private limitText!: Phaser.GameObjects.Text;
  private throttleFill!: Phaser.GameObjects.Rectangle;
  private throttleThumb!: Phaser.GameObjects.Arc;
  private limitTick!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Hauling');
  }

  init(data: { part?: 1 | 2 }): void {
    this.part = data.part ?? 1;
    this.course = COURSES[this.part];
    this.d = 0;
    this.kmh = C.cruiseKmh;
    this.lane = C.startLane;
    this.elapsed = 0;
    this.hpStart = UNIT_HP_MAX - (this.part === 2 ? (scoreTracker.stages.hauling1?.hpLost ?? 0) : 0);
    this.hpLost = 0;
    this.speedingCount = 0;
    this.lvViolationCount = 0;
    this.radioCorrect = 0;
    this.paused = false;
    this.finished = false;
    this.targetKmh = C.cruiseKmh;
    this.sliderId = -1;
    this.swipe = null;
    this.speeding = new SustainedTimer(C.speedingHoldMs, C.speedingRepeatMs);
    this.objects = [];
    this.scenery = [];
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x8a7158).setOrigin(0);
    this.add.rectangle(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, height, 0x4b4f54).setOrigin(0);

    // Marka lajur + patok jalan yang ikut bergulir (memberi kesan bergerak).
    for (const x of [280, 440]) {
      for (let i = 0; i < 8; i++) this.scenery.push({ view: this.add.rectangle(x, 0, 10, 60, 0xdddddd), offset: i * 160, spacing: 160 * 8 });
    }
    for (const x of [100, 620]) {
      for (let i = 0; i < 6; i++) this.scenery.push({ view: this.add.rectangle(x, 0, 16, 50, 0xffffff).setStrokeStyle(3, 0xd0362a), offset: i * 240, spacing: 240 * 6 });
    }

    for (const event of this.course.events) this.objects.push(this.buildObject(event));

    this.truck = this.add.container(C.lanes[this.lane]!, TRUCK_Y, [
      this.add.rectangle(0, 0, 120, 180, 0xf2b705).setStrokeStyle(5, 0x1b1f24),
      this.add.rectangle(0, -60, 100, 44, 0x2b3138),
      this.add.rectangle(0, 30, 96, 90, 0x5a5f66).setStrokeStyle(3, 0x1b1f24),
    ]).setDepth(10);

    this.fog = this.add.rectangle(ROAD_LEFT - 60, HUD_H, ROAD_RIGHT - ROAD_LEFT + 120, C.fogHeight, 0xd8c8a8, 0).setOrigin(0).setDepth(20);

    this.createHud();
    this.createControls();
  }

  private buildObject(event: CourseEvent): WorldObject {
    const view = this.add.container(0, 0);
    const obj: WorldObject = { event, view, resolved: false };
    const roadMid = (ROAD_LEFT + ROAD_RIGHT) / 2;
    const roadW = ROAD_RIGHT - ROAD_LEFT;
    switch (event.type) {
      case 'hole':
        view.add(this.add.ellipse(C.lanes[event.lane]!, 0, 120, 70, 0x1e1a17).setStrokeStyle(4, 0x5b4a3a));
        break;
      case 'rock':
        view.add(this.add.polygon(C.lanes[event.lane]!, 0, [0, 40, 25, 0, 70, -5, 95, 30, 80, 70, 15, 75], 0x8d8d8d).setStrokeStyle(4, 0x3b3b3b));
        break;
      case 'limit':
        view.add(this.add.circle(665, 0, 42, 0xffffff).setStrokeStyle(10, 0xd0362a));
        view.add(label(this, 665, 0, T.limit(event.kmh), 34, '#111111', true));
        break;
      case 'slippery':
      case 'dust': {
        const h = event.end - event.d;
        const color = event.type === 'slippery' ? 0x5dade2 : 0xd8c8a8;
        view.add(this.add.rectangle(roadMid, 0, roadW, h, color, 0.35).setOrigin(0.5, 1));
        view.add(this.add.rectangle(665, 0, 100, 56, 0xf2b705).setStrokeStyle(4, 0x111111));
        view.add(label(this, 665, 0, event.type === 'slippery' ? T.slipperySign : T.dustSign, 24, '#111111', true));
        break;
      }
      case 'lv': {
        view.add(this.add.rectangle(roadMid, -100, this.scale.width, 160, 0x5c6066).setOrigin(0.5)); // jalan simpang
        view.add(this.add.rectangle(roadMid, 0, roadW, 14, 0xffffff)); // garis stop
        view.add(label(this, roadMid, 30, T.stop, 30, '#ffffff', true));
        const sign = this.add.container(665, 1200, [
          this.add.triangle(0, 0, 0, 60, 40, -10, 80, 60, 0xf2b705).setStrokeStyle(4, 0x111111),
          label(this, 0, 60, T.lvWarning, 22, '#ffffff', true),
        ]);
        view.add(sign);
        const car = this.add.rectangle(-120, -100, 150, 80, 0xf4f4f4).setStrokeStyle(5, 0x2ecc71);
        view.add(car);
        obj.lv = { state: 'idle', t: 0, car };
        break;
      }
      case 'radio':
        break;
    }
    return obj;
  }

  private createHud(): void {
    this.add.rectangle(0, 0, this.scale.width, HUD_H, 0x1b1f24, 0.92).setOrigin(0).setDepth(30);
    label(this, 270, 36, T.title(this.part), 30, '#9aa4ae', true).setDepth(31);
    this.hpBar = createBar(this, 40, 90, 440, 40, 0x2ecc71, 31);
    this.hpText = label(this, 260, 90, '', 24, '#ffffff', true).setDepth(31);
    this.speedText = label(this, 260, 150, '', 44, '#ffffff', true).setDepth(31);
    this.add.circle(625, 100, 62, 0xffffff).setStrokeStyle(12, 0xd0362a).setDepth(31);
    this.limitText = label(this, 625, 100, '', 48, '#111111', true).setDepth(32);

    const hint = label(this, 360, 260, T.hint, 30, '#ffffff', true).setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 3500, duration: 600 });
  }

  private createControls(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, CONTROLS_Y, width, height - CONTROLS_Y, 0x1b1f24).setOrigin(0).setDepth(30);
    label(this, width / 2, CONTROLS_Y + 30, T.throttle, 26, '#9aa4ae', true).setDepth(31);
    this.add.rectangle(SLIDER_LEFT, SLIDER_Y, SLIDER_W, 44, 0x2b3138).setOrigin(0, 0.5).setStrokeStyle(4, 0xffffff).setDepth(31);
    this.throttleFill = this.add.rectangle(SLIDER_LEFT, SLIDER_Y, 0, 36, 0x1e8449).setOrigin(0, 0.5).setDepth(31);
    this.limitTick = this.add.rectangle(0, SLIDER_Y, 10, 70, 0xd0362a).setDepth(32);
    this.throttleThumb = this.add.circle(0, SLIDER_Y, 46, 0xffffff).setStrokeStyle(6, 0x1b1f24).setDepth(33);
    label(this, SLIDER_LEFT - 40, SLIDER_Y, '0', 28, '#ffffff', true).setDepth(31);
    label(this, SLIDER_LEFT + SLIDER_W + 44, SLIDER_Y, `${C.maxKmh}`, 28, '#ffffff', true).setDepth(31);

    // Seluruh area bawah jadi area sentuh slider; jempol tidak harus pas di tombol bulatnya.
    const hit = this.add.rectangle(0, CONTROLS_Y, width, height - CONTROLS_Y, 0xffffff, 0.001).setOrigin(0).setDepth(34).setInteractive();
    const setTarget = (p: Phaser.Input.Pointer): void => {
      this.targetKmh = Phaser.Math.Clamp((p.x - SLIDER_LEFT) / SLIDER_W, 0, 1) * C.maxKmh;
    };
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.sliderId = p.id;
      setTarget(p);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id === this.sliderId) setTarget(p);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0 && p.y < CONTROLS_Y) this.swipe = { id: p.id, x: p.x };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.swipe || p.id !== this.swipe.id) return;
      const dx = p.x - this.swipe.x;
      if (Math.abs(dx) >= C.swipeMinPx) {
        this.changeLane(Math.sign(dx));
        this.swipe.x = p.x;
      }
    });
    const release = (p: Phaser.Input.Pointer): void => {
      if (p.id === this.sliderId) this.sliderId = -1;
      if (p.id === this.swipe?.id) this.swipe = null;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // Keyboard untuk playtest di laptop.
    const nudge = (dk: number): void => {
      this.targetKmh = Phaser.Math.Clamp(this.targetKmh + dk, 0, C.maxKmh);
    };
    this.input.keyboard?.on('keydown-LEFT', () => this.changeLane(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changeLane(1));
    this.input.keyboard?.on('keydown-UP', () => nudge(5));
    this.input.keyboard?.on('keydown-DOWN', () => nudge(-5));
  }

  private changeLane(dir: number): void {
    if (this.paused || this.finished) return;
    const lane = Phaser.Math.Clamp(this.lane + dir, 0, C.lanes.length - 1);
    if (lane === this.lane) return;
    this.lane = lane;
    this.tweens.add({ targets: this.truck, x: C.lanes[lane], duration: 140, ease: 'Sine.Out' });
  }

  override update(_time: number, delta: number): void {
    if (this.finished) return;
    this.elapsed += delta;
    if (this.paused) return;

    const rate = this.targetKmh > this.kmh ? C.gasKmhPerSec : C.brakeKmhPerSec;
    this.kmh = approach(this.kmh, this.targetKmh, rate, delta);

    let nextD = this.d + (this.kmh * C.pxPerKmh * delta) / 1000;
    for (const obj of this.objects) nextD = this.updateObject(obj, nextD, delta);
    this.d = nextD;

    const limit = this.currentLimit();
    if (this.speeding.update(this.kmh > limit + C.speedToleranceKmh, delta)) {
      this.speedingCount++;
      say(this, 'speeding');
    }

    this.layout();
    this.refreshHud(limit);
    if (this.d >= this.course.length) this.finish();
  }

  /** Update satu objek dunia; boleh menahan posisi truk (garis stop LV). Return posisi d baru. */
  private updateObject(obj: WorldObject, nextD: number, delta: number): number {
    const e = obj.event;
    switch (e.type) {
      case 'hole':
      case 'rock':
        if (!obj.resolved && nextD >= e.d + 30) {
          obj.resolved = true;
          if (e.lane === this.lane) this.damage(C.damage[e.type], e.type === 'hole' ? T.hole : T.rock);
        }
        break;
      case 'slippery':
      case 'dust':
        if (!obj.resolved && nextD >= e.d && nextD <= e.end && this.kmh > C.hazardSafeKmh) {
          obj.resolved = true;
          this.damage(C.damage[e.type], e.type === 'slippery' ? T.slippery : T.dust);
        }
        break;
      case 'radio':
        if (!obj.resolved && nextD >= e.d) {
          obj.resolved = true;
          this.openRadio(e.question);
        }
        break;
      case 'lv': {
        const lv = obj.lv!;
        if (lv.state === 'idle' && nextD >= e.d - C.lvTriggerPx) lv.state = 'crossing';
        if (lv.state === 'crossing') {
          lv.t += delta / C.lvCrossMs;
          lv.car.x = Phaser.Math.Linear(-120, this.scale.width + 120, lv.t);
          if (lv.t >= 1) lv.state = 'cleared';
        }
        if (lv.state === 'crossing' && nextD >= e.d) {
          if (this.kmh <= C.lvStopKmh) return e.d; // berhenti di garis stop sampai LV lewat
          lv.state = 'violated';
          this.lvViolationCount++;
          this.damage(C.damage.lv, '');
          say(this, 'lvNotStopped');
          this.tweens.add({ targets: lv.car, x: this.scale.width + 200, duration: 300 });
        }
        break;
      }
      case 'limit':
        break;
    }
    return nextD;
  }

  private damage(amount: number, text: string): void {
    this.hpLost += amount;
    this.cameras.main.shake(180, 0.008);
    floatText(this, this.truck.x, TRUCK_Y - 140, `${text} -${amount}`);
  }

  private currentLimit(): number {
    const zone = this.course.events.find((e) => e.type === 'limit' && this.d >= e.d && this.d <= e.end);
    return zone?.type === 'limit' ? zone.kmh : C.defaultLimitKmh;
  }

  private layout(): void {
    for (const s of this.scenery) {
      s.view.y = ((s.offset + this.d) % s.spacing) - 100;
    }
    for (const obj of this.objects) obj.view.y = FRONT_Y - (obj.event.d - this.d);
    const dust = this.course.events.find((e) => e.type === 'dust' && this.d >= e.d - 500 && this.d <= e.end);
    this.fog.setFillStyle(0xd8c8a8, dust ? 0.8 : 0);
  }

  private hp(): number {
    return Math.max(0, this.hpStart - this.hpLost);
  }

  private refreshHud(limit: number): void {
    const ratio = this.hp() / UNIT_HP_MAX;
    this.hpBar.set(ratio);
    this.hpBar.setColor(ratio > 0.6 ? 0x2ecc71 : ratio > 0.3 ? 0xf2b705 : 0xc0392b);
    this.hpText.setText(`${T.hp} ${Math.round(ratio * 100)}%`);
    this.speedText.setText(T.speed(this.kmh)).setColor(this.kmh > limit + C.speedToleranceKmh ? '#ff6b5a' : '#ffffff');
    this.limitText.setText(T.limit(limit));
    const toX = (kmh: number): number => SLIDER_LEFT + (kmh / C.maxKmh) * SLIDER_W;
    this.throttleThumb.x = toX(this.targetKmh);
    this.throttleFill.setSize(toX(this.kmh) - SLIDER_LEFT, 36);
    this.throttleFill.setFillStyle(this.kmh > limit + C.speedToleranceKmh ? 0xc0392b : 0x1e8449);
    this.limitTick.x = toX(limit);
  }

  private openRadio(index: number): void {
    const q = RADIO_QUESTIONS[index]!;
    this.paused = true;
    const panel = this.add.container(0, 0).setDepth(60);
    panel.add(this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(this.add.rectangle(360, 640, 680, 900, 0x22313f).setStrokeStyle(6, 0xf2b705));
    panel.add(label(this, 360, 250, T.radioTitle, 40, '#f2b705', true));
    panel.add(label(this, 360, 380, q.question, 36, '#ffffff', false, 600));
    q.options.forEach((option, i) => {
      const y = 560 + i * 160;
      const bg = this.add.rectangle(360, y, 620, 130, 0xf4f4f4).setStrokeStyle(4, 0x111111).setInteractive();
      panel.add(bg);
      panel.add(label(this, 360, y, option, 32, '#111111', true, 580));
      bg.on('pointerup', () => this.answerRadio(panel, i === q.correct, q.options[q.correct]!));
    });
  }

  private answerRadio(panel: Phaser.GameObjects.Container, correct: boolean, answer: string): void {
    panel.destroy();
    if (correct) {
      this.radioCorrect++;
      say(this, 'radioCorrect');
      this.paused = false;
      return;
    }
    const box = this.add.container(0, 0).setDepth(60);
    box.add(this.add.rectangle(360, 640, 660, 300, 0x7a1f1a, 0.95).setStrokeStyle(5, 0xffffff));
    box.add(label(this, 360, 640, T.radioWrong(answer), 34, '#ffffff', true, 600));
    this.time.delayedCall(2200, () => {
      box.destroy();
      this.paused = false;
    });
  }

  private finish(): void {
    this.finished = true;
    scoreTracker.record(this.part === 1 ? 'hauling1' : 'hauling2', {
      speedingCount: this.speedingCount,
      lvViolationCount: this.lvViolationCount,
      radioCorrect: this.radioCorrect,
      hpLost: this.hpLost,
      durationMs: Math.round(this.elapsed),
    });
    const box = this.add.container(0, 0).setDepth(60);
    box.add(this.add.rectangle(360, 560, 660, 260, 0x1b1f24, 0.92).setStrokeStyle(5, 0xf2b705));
    box.add(label(this, 360, 520, T.arrived(this.part), 42, '#f2b705', true));
    box.add(label(this, 360, 600, T.hpLeft(Math.round((this.hp() / UNIT_HP_MAX) * 100)), 32, '#ffffff'));
    this.time.delayedCall(1600, () => nextStep(this));
  }
}
