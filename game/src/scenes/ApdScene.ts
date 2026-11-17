import Phaser from 'phaser';
import type { ApdItem } from '@shared/types';
import { APD_TEXT as T, ITEMS, REQUIRED, TRAPS, type WearItem, type WearSlot } from '../data/apd';
import { nextStep, startStep } from '../systems/flow';
import { ensureRun } from '../systems/session';
import { RESTART_INDEX } from '../data/stages';
import { scoreTracker } from '../systems/scoreTracker';
import { loadPlayer } from '../systems/storage';
import { sayBlocking } from '../systems/supervisor';
import { createButton } from '../ui/Button';
import { Character } from '../ui/Character';
import { floatText, label } from '../ui/text';

const ICON_COLORS: Record<WearItem, number> = {
  helmet: 0xf2c200,
  glasses: 0x88c8ff,
  vest: 0xff7a00,
  boots: 0x333333,
  cap: 0xc0392b,
  sandal: 0x8e5b3a,
};
const TRAY_SLOTS = [
  [140, 870],
  [360, 870],
  [580, 870],
  [250, 1010],
  [470, 1010],
] as const;

interface TrayIcon {
  item: WearItem;
  view: Phaser.GameObjects.Container;
  home: { x: number; y: number };
  check: Phaser.GameObjects.Text;
}

export class ApdScene extends Phaser.Scene {
  private character!: Character;
  private wornBySlot = new Map<WearSlot, WearItem>();
  private icons: TrayIcon[] = [];
  private reason!: Phaser.GameObjects.Text;
  private missingEver = new Set<ApdItem>();
  private trapEver = false;
  private elapsed = 0;
  private done = false;
  private ready = false;

  constructor() {
    super('Apd');
  }

  create(): void {
    this.wornBySlot = new Map();
    this.icons = [];
    this.missingEver = new Set();
    this.trapEver = false;
    this.elapsed = 0;
    this.done = false;
    this.ready = false;

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x2b3138).setOrigin(0);
    label(this, width / 2, 55, T.title, 48, '#f2b705', true);
    label(this, width / 2, 125, T.hint, 28, '#ffffff', false, 640);
    const avatar = loadPlayer()?.avatar ?? { gender: 'male', hair: 0, skin: 0 };
    this.add.ellipse(width / 2, 690, 260, 44, 0x000000, 0.25);
    this.character = new Character(this, width / 2, 565, avatar).setScale(0.85);
    this.reason = label(this, width / 2, 760, '', 30, '#7CFC9A', true, 640);
    this.add.rectangle(width / 2, 940, width - 40, 300, 0x1b1f24, 0.6).setStrokeStyle(3, 0x9aa4ae, 0.4);

    const trap = TRAPS[Math.floor(Math.random() * TRAPS.length)]!;
    const items = Phaser.Utils.Array.Shuffle<WearItem>([...REQUIRED, trap]);
    items.forEach((item, i) => this.icons.push(this.makeIcon(item, TRAY_SLOTS[i]![0], TRAY_SLOTS[i]![1])));

    this.input.dragDistanceThreshold = 16;
    createButton(this, width / 2, 1190, T.start, () => this.check());

    // Server mencatat waktu mulai run; durasi tahap baru dihitung setelah run siap.
    ensureRun(
      this,
      () => (this.ready = true),
      () => startStep(this, RESTART_INDEX),
    );
  }

  override update(_time: number, delta: number): void {
    if (this.ready && !this.done) this.elapsed += delta;
  }

  private makeIcon(item: WearItem, x: number, y: number): TrayIcon {
    const info = ITEMS[item];
    const box = this.add.rectangle(0, -10, 180, 96, ICON_COLORS[item]).setStrokeStyle(5, 0xffffff);
    const text = label(this, 0, 58, info.label, 24, '#ffffff', true, 200);
    const check = label(this, 70, -45, '✔', 40, '#7CFC9A', true).setVisible(false);
    const view = this.add.container(x, y, [box, text, check]).setSize(200, 150).setInteractive({ draggable: true, useHandCursor: true });
    const icon: TrayIcon = { item, view, home: { x, y }, check };

    view.on('dragstart', () => view.setDepth(20).setScale(1.08));
    view.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => view.setPosition(dx, dy));
    view.on('dragend', (p: Phaser.Input.Pointer) => {
      view.setDepth(0).setScale(1);
      if (this.character.containsPoint(p.worldX, p.worldY)) this.wear(item);
      view.setPosition(icon.home.x, icon.home.y);
    });
    // Tap (bukan drag) pada item yang sedang dipakai = lepas.
    view.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.getDistance() < 16 && this.isWorn(item)) this.unwear(item);
    });
    return icon;
  }

  private isWorn(item: WearItem): boolean {
    return this.wornBySlot.get(ITEMS[item].slot) === item;
  }

  private wear(item: WearItem): void {
    if (this.done || this.isWorn(item)) return;
    this.wornBySlot.set(ITEMS[item].slot, item); // item lain di slot yang sama otomatis terlepas
    this.reason.setText(ITEMS[item].reason).setColor(ITEMS[item].trap ? '#ff8a7a' : '#7CFC9A');
    this.refresh();
  }

  private unwear(item: WearItem): void {
    if (this.done) return;
    this.wornBySlot.delete(ITEMS[item].slot);
    this.reason.setText('');
    this.refresh();
  }

  private refresh(): void {
    this.character.setWorn(this.wornBySlot.values());
    for (const icon of this.icons) {
      const worn = this.isWorn(icon.item);
      icon.view.setAlpha(worn ? 0.55 : 1);
      icon.check.setVisible(worn);
    }
  }

  /** Tombol Mulai selalu aktif. Kalau APD kurang / ada item jebakan, Pengawas menghentikan pemain. */
  private check(): void {
    if (this.done) return;
    const missing = REQUIRED.filter((i) => !this.isWorn(i));
    const trap = [...this.wornBySlot.values()].find((i) => ITEMS[i].trap);
    if (missing.length === 0 && !trap) return this.finish();

    missing.forEach((i) => this.missingEver.add(i));
    if (trap) this.trapEver = true;
    const extra = [
      missing.length ? T.missing(missing.map((i) => ITEMS[i].label)) : '',
      trap ? T.trapWorn(ITEMS[trap].label) : '',
    ]
      .filter(Boolean)
      .join('\n');
    sayBlocking(this, missing.length ? 'apdMissing' : 'apdTrap', extra, T.ok, () => {
      // Tunjuk item yang bermasalah di baki.
      for (const icon of this.icons) {
        if (missing.includes(icon.item as ApdItem) || icon.item === trap) {
          this.tweens.add({ targets: icon.view, scale: 1.15, duration: 220, yoyo: true, repeat: 2 });
        }
      }
    });
  }

  private finish(): void {
    this.done = true;
    scoreTracker.record('apd', {
      missingItems: [...this.missingEver],
      trapItemUsed: this.trapEver,
      durationMs: Math.round(this.elapsed),
    });
    floatText(this, this.scale.width / 2, 300, T.allGood, '#7CFC9A');
    this.time.delayedCall(900, () => nextStep(this));
  }
}
