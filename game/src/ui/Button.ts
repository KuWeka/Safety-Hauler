import Phaser from 'phaser';

const MIN_HEIGHT = 112; // = 56 CSS px di layar 360 px lebar (game 720 px)

/** Tombol placeholder: kotak bulat + teks. Nanti tinggal ganti sprite. */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onTap: () => void,
): Phaser.GameObjects.Container {
  const width = 440;
  const bg = scene.add.rectangle(0, 0, width, MIN_HEIGHT, 0xf2b705).setStrokeStyle(6, 0x1b1f24);
  const text = scene.add
    .text(0, 0, label, { fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#1b1f24' })
    .setOrigin(0.5);
  const button = scene.add.container(x, y, [bg, text]).setSize(width, MIN_HEIGHT);
  button
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => bg.setFillStyle(0xd99e00))
    .on('pointerout', () => bg.setFillStyle(0xf2b705))
    .on('pointerup', () => {
      bg.setFillStyle(0xf2b705);
      onTap();
    });
  return button;
}
