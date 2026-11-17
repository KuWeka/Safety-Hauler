import type Phaser from 'phaser';
import { DIALOG, PRAISE, SUPERVISOR_SHOW_MS, type Situation } from '../data/dialogs';
import { UI_TEXT } from '../data/stages';
import { FONT } from '../ui/text';

// shortcut: balon teks saja; karakter Pak Bos + ekspresi masuk di Fase 2 (sistem teguran lengkap).
const active = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();

/** Pengawas muncul 2 detik di atas layar tanpa menghentikan game. */
export function say(scene: Phaser.Scene, situation: Situation): void {
  active.get(scene)?.destroy();
  const lines = DIALOG[situation];
  const line = lines[Math.floor(Math.random() * lines.length)]!;
  const praise = PRAISE.has(situation);
  const { width } = scene.scale;

  const text = scene.add
    .text(0, 18, line, { fontFamily: FONT, fontSize: '34px', color: '#ffffff', align: 'center', wordWrap: { width: 600 } })
    .setOrigin(0.5);
  const h = Math.max(170, text.height + 100);
  const bg = scene.add.rectangle(0, 0, 660, h, praise ? 0x1f5130 : 0x7a1f1a, 0.95).setStrokeStyle(5, 0xffffff);
  const name = scene.add.text(-310, -h / 2 + 14, UI_TEXT.supervisorName, {
    fontFamily: FONT,
    fontSize: '30px',
    fontStyle: 'bold',
    color: praise ? '#7CFC9A' : '#ffb3a8',
  });
  const box = scene.add.container(width / 2, 230, [bg, name, text]).setDepth(100).setScale(0.6).setAlpha(0);
  active.set(scene, box);

  scene.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 150, ease: 'Back.Out' });
  scene.time.delayedCall(SUPERVISOR_SHOW_MS, () => {
    if (active.get(scene) !== box) return;
    scene.tweens.add({ targets: box, alpha: 0, duration: 200, onComplete: () => box.destroy() });
  });
}
