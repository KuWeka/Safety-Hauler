import Phaser from 'phaser';
import type { StartRunResponse } from '@shared/api';
import { errorMessage, NET_TEXT } from '../data/net';
import { createButton } from '../ui/Button';
import { label } from '../ui/text';
import { api, ApiFailure } from './api';
import { loadPlayer } from './storage';
import { flushPending, hasPending } from './sync';

// Satu run aktif: server mencatat waktu mulai dan memberi token sekali pakai (GDD alur data langkah 2).
export interface ActiveRun extends StartRunResponse {
  phone: string;
}

let current: ActiveRun | null = null;
let inflight: Promise<ActiveRun> | null = null;

async function begin(phone: string): Promise<ActiveRun> {
  // Run baru menghapus run lama yang belum selesai di server, jadi hasil yang masih tertunda harus terkirim dulu.
  await flushPending();
  if (await hasPending(phone)) throw new ApiFailure('network', 0);
  try {
    return { ...(await api.startRun({ phone })), phone };
  } catch (e) {
    // Server belum kenal pemain ini (misal database di-reset): daftarkan ulang sekali lalu coba lagi.
    const player = loadPlayer();
    if (e instanceof ApiFailure && e.code === 'not_found' && player) {
      await api.register({ phone: player.phone, name: player.name, division: player.division, avatar: player.avatar, consent: true });
      return { ...(await api.startRun({ phone })), phone };
    }
    throw e;
  }
}

export const session = {
  get run(): ActiveRun | null {
    return current;
  },
  reset(): void {
    current = null;
    inflight = null;
  },
  /** Mulai run (atau pakai yang sudah berjalan). Boleh dipanggil lebih awal sebagai prefetch. */
  start(phone: string): Promise<ActiveRun> {
    if (current) return Promise.resolve(current);
    inflight ??= begin(phone)
      .then((r) => (current = r))
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },
};

/**
 * Pastikan run sudah dimulai sebelum tahap pertama. Menampilkan layar "menyiapkan" dan,
 * kalau gagal, pesan + tombol coba lagi. `onReady` dipanggil sekali saat run siap; `onBack` kalau pemain menyerah.
 */
export function ensureRun(scene: Phaser.Scene, onReady: () => void, onBack: () => void): void {
  const player = loadPlayer();
  if (!player) return onBack();
  if (session.run) return onReady();

  const { width, height } = scene.scale;
  const overlay = scene.add.container(0, 0).setDepth(120);
  const attempt = (): void => {
    overlay.removeAll(true);
    overlay.add([
      scene.add.rectangle(0, 0, width, height, 0x1b1f24, 0.96).setOrigin(0).setInteractive(),
      label(scene, width / 2, height * 0.45, NET_TEXT.connecting, 42, '#ffffff', true),
    ]);
    session.start(player.phone).then(
      () => {
        overlay.destroy();
        onReady();
      },
      (e: unknown) => {
        const code = e instanceof ApiFailure ? e.code : 'server_error';
        const retryable = code === 'network' || code === 'rate_limited' || code === 'server_error';
        overlay.removeAll(true);
        overlay.add([
          scene.add.rectangle(0, 0, width, height, 0x1b1f24, 0.96).setOrigin(0).setInteractive(),
          label(scene, width / 2, height * 0.38, errorMessage(code), 38, '#ffffff', true, 600),
          ...(retryable ? [createButton(scene, width / 2, height * 0.56, NET_TEXT.retry, attempt)] : []),
          createButton(scene, width / 2, height * (retryable ? 0.68 : 0.56), NET_TEXT.back, onBack),
        ]);
      },
    );
  };
  attempt();
}
