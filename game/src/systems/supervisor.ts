import Phaser from 'phaser';
import { DIALOG, EXPRESSION, PRAISE, SUPERVISOR_SHOW_MS, type Expression, type Situation } from '../data/dialogs';
import { UI_TEXT } from '../data/stages';
import { createButton } from '../ui/Button';
import { FONT } from '../ui/text';
import { sprite } from './art';

// Pengawas "Pak Bos": wajah placeholder dengan 5 ekspresi (diganti sprite di Fase 4).
const active = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();

const pick = (situation: Situation): string => {
  const lines = DIALOG[situation];
  return lines[Math.floor(Math.random() * lines.length)]!;
};

/** Wajah Pak Bos (potret pixel art 5 ekspresi). Tinggi ±190 px layar. */
export function drawBoss(scene: Phaser.Scene, x: number, y: number, expr: Expression): Phaser.GameObjects.Container {
  return scene.add.container(x, y, [sprite(scene, 0, 0, `boss_${expr}`, 1.4)]);
}

function balloon(scene: Phaser.Scene, situation: Situation, extra: string | undefined, width: number) {
  const praise = PRAISE.has(situation);
  const text = scene.add
    .text(-width / 2 + 170, 14, extra ? `${pick(situation)}\n${extra}` : pick(situation), {
      fontFamily: FONT,
      fontSize: '32px',
      color: '#ffffff',
      wordWrap: { width: width - 200 },
    })
    .setOrigin(0, 0.5);
  const h = Math.max(190, text.height + 90);
  const bg = scene.add.rectangle(0, 0, width, h, praise ? 0x1f5130 : 0x7a1f1a, 0.96).setStrokeStyle(5, 0xffffff);
  const name = scene.add.text(-width / 2 + 170, -h / 2 + 12, UI_TEXT.supervisorName, {
    fontFamily: FONT,
    fontSize: '28px',
    fontStyle: 'bold',
    color: praise ? '#7CFC9A' : '#ffb3a8',
  });
  const face = drawBoss(scene, -width / 2 + 85, 0, EXPRESSION[situation]).setScale(0.95);
  return { parts: [bg, face, name, text], h };
}

/** Pengawas muncul 2 detik di atas layar tanpa menghentikan game. */
export function say(scene: Phaser.Scene, situation: Situation): void {
  active.get(scene)?.destroy();
  const { parts } = balloon(scene, situation, undefined, 680);
  const box = scene.add.container(scene.scale.width / 2, 230, parts).setDepth(100).setScale(0.6).setAlpha(0);
  active.set(scene, box);
  scene.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 150, ease: 'Back.Out' });
  scene.time.delayedCall(SUPERVISOR_SHOW_MS, () => {
    if (active.get(scene) !== box) return;
    scene.tweens.add({ targets: box, alpha: 0, duration: 200, onComplete: () => box.destroy() });
  });
}

/** Pengawas menghentikan pemain (cek APD): wajib tap tombol sebelum lanjut. */
export function sayBlocking(scene: Phaser.Scene, situation: Situation, extra: string, okLabel: string, onClose: () => void): void {
  active.get(scene)?.destroy();
  const { width, height } = scene.scale;
  const { parts, h } = balloon(scene, situation, extra, 680);
  const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setInteractive();
  const box = scene.add.container(width / 2, height * 0.4, parts);
  const panel = scene.add.container(0, 0, [overlay, box]).setDepth(110);
  active.set(scene, panel);
  const btn = createButton(scene, width / 2, height * 0.4 + h / 2 + 110, okLabel, () => {
    panel.destroy();
    onClose();
  });
  panel.add(btn);
}
