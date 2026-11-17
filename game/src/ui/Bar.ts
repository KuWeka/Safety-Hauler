import type Phaser from 'phaser';

export interface Bar {
  set(ratio: number): void;
  setColor(color: number): void;
}

/** Bar horizontal (muatan, HP, timer). set(ratio) dengan ratio 0..1. */
export function createBar(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number, depth = 0): Bar {
  scene.add.rectangle(x, y, width, height, 0x111418).setOrigin(0, 0.5).setStrokeStyle(4, 0xffffff, 0.6).setDepth(depth);
  const fill = scene.add.rectangle(x + 4, y, width - 8, height - 8, color).setOrigin(0, 0.5).setDepth(depth);
  return {
    set(ratio: number): void {
      fill.setSize((width - 8) * Math.min(1, Math.max(0, ratio)), height - 8);
    },
    setColor(c: number): void {
      fill.setFillStyle(c);
    },
  };
}
