import type Phaser from 'phaser';
import { ART, ART_SCALE } from '../systems/art';

export interface Bar {
  set(ratio: number): void;
  setColor(color: number): void;
}

/** Warna bar lama (hex) -> frame pixel art. */
const frameFor = (color: number): string => (color === 0xc0392b ? 'ui_bar_red' : color === 0xf2b705 ? 'ui_bar_yellow' : 'ui_bar_green');

/** Bar horizontal pixel art (muatan, HP, timer). set(ratio) dengan ratio 0..1. */
export function createBar(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number, depth = 0): Bar {
  scene.add
    .nineslice(x, y, ART, 'ui_panel', width / ART_SCALE, height / ART_SCALE, 6, 6, 6, 6)
    .setOrigin(0, 0.5)
    .setScale(ART_SCALE)
    .setDepth(depth);
  const inner = height - 12;
  const fill = scene.add.image(x + 6, y, ART, frameFor(color)).setOrigin(0, 0.5).setDisplaySize(width - 12, inner).setDepth(depth);
  return {
    set(ratio: number): void {
      const w = (width - 12) * Math.min(1, Math.max(0, ratio));
      fill.setVisible(w > 0).setDisplaySize(Math.max(w, 1), inner);
    },
    setColor(c: number): void {
      fill.setFrame(frameFor(c));
    },
  };
}
