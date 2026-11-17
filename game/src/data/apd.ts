// Item APD + alasan singkat. Daftar APD wajib perlu divalidasi tim K3 (lihat GDD).
import type { ApdItem } from '@shared/types';

export type WearSlot = 'head' | 'eyes' | 'body' | 'feet';
export type TrapItem = 'cap' | 'sandal';
export type WearItem = ApdItem | TrapItem;

export interface ItemInfo {
  label: string;
  slot: WearSlot;
  reason: string;
  trap?: boolean;
}

export const ITEMS: Record<WearItem, ItemInfo> = {
  helmet: { label: 'Helm safety', slot: 'head', reason: 'Helm melindungi kepala dari benda jatuh dan benturan.' },
  glasses: { label: 'Kacamata safety', slot: 'eyes', reason: 'Kacamata melindungi mata dari debu dan serpihan batu.' },
  vest: { label: 'Rompi reflektif', slot: 'body', reason: 'Rompi reflektif bikin kamu kelihatan oleh operator unit lain.' },
  boots: { label: 'Sepatu safety', slot: 'feet', reason: 'Sepatu safety melindungi kaki dari tertimpa dan tertusuk.' },
  cap: { label: 'Topi biasa', slot: 'head', reason: 'Topi biasa tidak melindungi kepala dari benturan.', trap: true },
  sandal: { label: 'Sandal', slot: 'feet', reason: 'Sandal tidak melindungi kaki sama sekali.', trap: true },
};

export const REQUIRED: ApdItem[] = ['helmet', 'glasses', 'vest', 'boots'];
/** Satu item jebakan dipilih acak tiap run. */
export const TRAPS: TrapItem[] = ['cap', 'sandal'];

export const APD_TEXT = {
  title: 'Pakai APD',
  hint: 'Seret APD ke badanmu. Tap item yang sudah dipakai untuk melepas.',
  start: 'Mulai Kerja',
  ok: 'Siap, Pak!',
  missing: (labels: string[]) => `Belum dipakai: ${labels.join(', ')}.`,
  trapWorn: (label: string) => `Lepas dulu: ${label}.`,
  allGood: 'APD lengkap. Mantap!',
};
