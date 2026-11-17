import type { Player } from '@shared/types';

// Profil pemain disimpan di HP supaya tab ketutup tidak perlu daftar ulang (GDD bagian Registrasi).
const KEY = 'safetyHauler.player.v1';

export function loadPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Player>;
    return typeof p.phone === 'string' && typeof p.name === 'string' && p.avatar ? (p as Player) : null;
  } catch {
    return null;
  }
}

export function savePlayer(player: Player): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(player));
  } catch {
    // Storage diblokir (mode privat) / penuh: game tetap jalan, hanya tidak diingat.
  }
}

export function clearPlayer(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
