import Phaser from 'phaser';

/** Atlas pixel art (art/ -> game/public/art). Art digambar di 360x640, ditampilkan 2x di layar 720x1280. */
export const ART = 'art';
export const ART_SCALE = 2;

/** Sprite dari atlas dengan skala 2x dan origin tengah-bawah opsional. */
export function sprite(scene: Phaser.Scene, x: number, y: number, frame: string, scale = ART_SCALE): Phaser.GameObjects.Image {
  return scene.add.image(x, y, ART, frame).setScale(scale);
}

/** Frame arah 0..7 (0 = menghadap atas layar, searah jarum jam) untuk sprite 8 arah. */
export const dirFrame = (base: string, dir: number): string => `${base}_${((dir % 8) + 8) % 8}`;
