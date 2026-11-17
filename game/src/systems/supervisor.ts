import Phaser from 'phaser';
import { DIALOG, EXPRESSION, PRAISE, SUPERVISOR_SHOW_MS, type Expression, type Situation } from '../data/dialogs';
import { UI_TEXT } from '../data/stages';
import { createButton } from '../ui/Button';
import { FONT } from '../ui/text';

// Pengawas "Pak Bos": wajah placeholder dengan 5 ekspresi (diganti sprite di Fase 4).
const active = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();

const pick = (situation: Situation): string => {
  const lines = DIALOG[situation];
  return lines[Math.floor(Math.random() * lines.length)]!;
};

/** Gambar wajah Pak Bos (±130 px) dengan ekspresi tertentu. */
export function drawBoss(scene: Phaser.Scene, x: number, y: number, expr: Expression): Phaser.GameObjects.Container {
  const dark = 0x1b1f24;
  const face = expr === 'marah' ? 0xe08a6a : 0xd9a47a;
  const c = scene.add.container(x, y, [
    scene.add.circle(0, 8, 56, face).setStrokeStyle(4, dark),
    scene.add.ellipse(0, -34, 132, 70, 0xffffff).setStrokeStyle(4, dark), // helm putih pengawas
    scene.add.rectangle(0, -10, 150, 12, 0xe6e6e6).setStrokeStyle(3, dark),
    scene.add.circle(-20, 10, 6, dark),
    scene.add.circle(20, 10, 6, dark),
    scene.add.ellipse(0, 36, 64, 16, 0x3b2a20), // kumis
  ]);
  const g = scene.add.graphics().lineStyle(6, dark);
  const brow = { marah: [8, -8], kesal: [0, 0], kaget: [-6, -6], bangga: [-3, -3], jempol: [-3, -3] }[expr];
  g.lineBetween(-32, -2 + brow[0]!, -10, -2 - brow[0]!);
  g.lineBetween(10, -2 - brow[0]!, 32, -2 + brow[0]!);
  if (expr === 'kaget') g.fillStyle(0x7a1f1a).fillCircle(0, 52, 10);
  else if (expr === 'marah') g.fillStyle(0x7a1f1a).fillRect(-20, 48, 40, 8);
  else if (expr === 'kesal') g.lineBetween(-12, 52, 12, 52);
  else g.beginPath().arc(0, 40, 18, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160)).strokePath();
  c.add(g);
  if (expr === 'jempol') {
    c.add([scene.add.rectangle(70, 40, 30, 34, 0xd9a47a).setStrokeStyle(3, dark), scene.add.rectangle(70, 14, 12, 26, 0xd9a47a).setStrokeStyle(3, dark)]);
  }
  return c;
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
