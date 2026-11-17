import type Phaser from 'phaser';
import type { LeaderboardEntry } from '@shared/api';
import { LEADERBOARD_TEXT as T } from '../data/leaderboard';
import { api } from '../systems/api';
import { createButton } from './Button';
import { FONT, label } from './text';

const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Panel leaderboard: top 10 + posisi pemain sendiri. Mengambil data dari server saat dibuka. */
export function showLeaderboard(scene: Phaser.Scene, phone: string | undefined): Phaser.GameObjects.Container {
  const { width, height } = scene.scale;
  const panel = scene.add.container(0, 0).setDepth(80);
  const body = scene.add.container(0, 0);
  panel.add([
    scene.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive(),
    label(scene, width / 2, 90, T.title, 54, '#f2b705', true),
    body,
    createButton(scene, width / 2, 1218, T.close, () => panel.destroy()),
  ]);

  const row = (e: LeaderboardEntry, y: number, highlight: boolean): Phaser.GameObjects.GameObject[] => {
    const t = (x: number, yy: number, text: string, size: number, color: string, bold = false, origin = 0) =>
      scene.add
        .text(x, yy, text, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: bold ? 'bold' : 'normal', color })
        .setOrigin(origin, 0.5);
    return [
      scene.add.rectangle(width / 2, y, width - 50, 78, highlight ? 0x5a4a10 : 0x1b1f24, 0.85),
      t(55, y, `${e.rank}`, 36, '#f2b705', true),
      t(135, y - 12, clip(e.name, 18), 30, '#ffffff', true),
      t(135, y + 19, clip(e.division, 24), 22, '#9aa4ae'),
      t(width - 55, y, e.total.toLocaleString('id-ID'), 36, '#ffffff', true, 1),
    ];
  };

  const load = (): void => {
    body.removeAll(true);
    body.add(label(scene, width / 2, height * 0.45, T.loading, 40, '#9aa4ae'));
    api.leaderboard(phone).then(
      (data) => {
        if (!panel.active) return;
        body.removeAll(true);
        if (data.top.length === 0) body.add(label(scene, width / 2, height * 0.4, T.empty, 38, '#ffffff', true, 600));
        data.top.forEach((e, i) => body.add(row(e, 200 + i * 86, !!data.me && e.name === data.me.name && e.total === data.me.total)));
        if (phone) {
          body.add(label(scene, 60, 1040, T.me, 26, '#9aa4ae', true).setOrigin(0, 0.5));
          if (data.me) body.add(row(data.me, 1100, true));
          else body.add(label(scene, width / 2, 1100, T.notRanked, 28, '#ffffff', false, 620));
        }
      },
      () => {
        if (!panel.active) return;
        body.removeAll(true);
        body.add([
          label(scene, width / 2, height * 0.38, T.error, 36, '#ffffff', true, 600),
          createButton(scene, width / 2, height * 0.55, T.retry, load),
        ]);
      },
    );
  };
  load();
  return panel;
}
