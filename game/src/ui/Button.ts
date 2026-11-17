import Phaser from 'phaser';
import { ART, ART_SCALE } from '../systems/art';

const MIN_HEIGHT = 112; // = 56 CSS px di layar 360 px lebar (game 720 px)

export interface ButtonOptions {
  /** Lebar minimum (default 440). Dipakai untuk dua tombol sebaris. */
  minWidth?: number;
  fontSize?: number;
}

/** Tombol placeholder: kotak bulat + teks. Nanti tinggal ganti sprite. */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onTap: () => void,
  opts: ButtonOptions = {},
): Phaser.GameObjects.Container {
  const text = scene.add
    .text(0, 0, label, { fontFamily: 'sans-serif', fontSize: `${opts.fontSize ?? 44}px`, fontStyle: 'bold', color: '#1b1f24' })
    .setOrigin(0.5);
  // Melebar mengikuti teks, maks 660 px (layar 720).
  const width = Phaser.Math.Clamp(text.width + 60, opts.minWidth ?? 440, 660);
  // Tombol pixel art: nine-slice (sudut 6 px art) diskala 2x.
  const bg = scene.add.nineslice(0, 0, ART, 'ui_button', width / ART_SCALE, MIN_HEIGHT / ART_SCALE, 6, 6, 6, 6).setScale(ART_SCALE);
  // Urutan: bg harus di bawah teks (teks dibuat lebih dulu, jadi diangkat).
  const button = scene.add.container(x, y, [bg, text]).setSize(width, MIN_HEIGHT);
  button
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => bg.setTint(0xb8b8b8))
    .on('pointerout', () => bg.clearTint())
    .on('pointerup', () => {
      bg.clearTint();
      onTap();
    });
  return button;
}
