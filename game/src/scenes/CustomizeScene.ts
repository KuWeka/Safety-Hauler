import Phaser from 'phaser';
import type { Avatar } from '@shared/types';
import { CUSTOMIZE_TEXT as T, SKIN_COLORS } from '../data/customize';
import { nextStep } from '../systems/flow';
import { session } from '../systems/session';
import { loadPlayer, savePlayer } from '../systems/storage';
import { createButton } from '../ui/Button';
import { Character } from '../ui/Character';
import { label } from '../ui/text';

const DEFAULT_AVATAR: Avatar = { gender: 'male', hair: 0, skin: 0 };

export class CustomizeScene extends Phaser.Scene {
  private avatar: Avatar = DEFAULT_AVATAR;
  private preview?: Character;
  private chips: { bg: Phaser.GameObjects.Rectangle; selected: () => boolean }[] = [];

  constructor() {
    super('Customize');
  }

  create(): void {
    this.avatar = { ...(loadPlayer()?.avatar ?? DEFAULT_AVATAR) };
    this.chips = [];
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x2b3138).setOrigin(0);
    label(this, width / 2, 70, T.title, 48, '#f2b705', true);
    this.add.ellipse(width / 2, 590, 300, 50, 0x000000, 0.25);
    this.redraw();

    const row = (y: number, title: string): void => void label(this, 70, y, title, 30, '#ffffff', true).setOrigin(0, 0.5);
    row(760, T.gender);
    this.chip(310, 760, 200, T.male, () => this.avatar.gender === 'male', () => (this.avatar.gender = 'male'));
    this.chip(540, 760, 200, T.female, () => this.avatar.gender === 'female', () => (this.avatar.gender = 'female'));
    row(880, T.hair);
    ([0, 1, 2] as const).forEach((h, i) =>
      this.chip(310 + i * 150, 880, 120, `${h + 1}`, () => this.avatar.hair === h, () => (this.avatar.hair = h)),
    );
    row(1000, T.skin);
    ([0, 1, 2] as const).forEach((s, i) =>
      this.chip(310 + i * 150, 1000, 120, '', () => this.avatar.skin === s, () => (this.avatar.skin = s), SKIN_COLORS[s]),
    );
    this.refreshChips();

    createButton(this, width / 2, 1170, T.next, () => {
      const player = loadPlayer();
      if (player) {
        savePlayer({ ...player, avatar: this.avatar });
        // Mulai run di latar belakang; ApdScene menunggu hasilnya kalau belum selesai.
        session.start(player.phone).catch(() => undefined);
      }
      nextStep(this);
    });
  }

  private chip(x: number, y: number, w: number, text: string, selected: () => boolean, select: () => void, color = 0x3d4652): void {
    const bg = this.add.rectangle(x, y, w, 96, color).setStrokeStyle(6, 0x1b1f24).setInteractive({ useHandCursor: true });
    if (text) label(this, x, y, text, 34, '#ffffff', true);
    bg.on('pointerup', () => {
      select();
      this.redraw();
      this.refreshChips();
    });
    this.chips.push({ bg, selected });
  }

  private refreshChips(): void {
    for (const c of this.chips) c.bg.setStrokeStyle(c.selected() ? 8 : 6, c.selected() ? 0xf2b705 : 0x1b1f24);
  }

  private redraw(): void {
    this.preview?.destroy();
    this.preview = new Character(this, this.scale.width / 2, 470, this.avatar).setScale(0.8);
    // "Berputar pelan" versi placeholder: goyang kiri-kanan.
    this.tweens.add({ targets: this.preview, scaleX: -0.8, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
}
