import type Phaser from 'phaser';

export const FONT = 'sans-serif';

/** Teks rata tengah dengan gaya standar game. */
export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 40,
  color = '#ffffff',
  bold = false,
  wrapWidth = 640,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: bold ? 'bold' : 'normal',
      color,
      align: 'center',
      wordWrap: { width: wrapWidth },
    })
    .setOrigin(0.5);
}

/** Teks melayang naik lalu hilang (misal "-10 HP"). */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ff6b5a'): void {
  const t = label(scene, x, y, text, 44, color, true).setDepth(50);
  scene.tweens.add({ targets: t, y: y - 120, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
}
