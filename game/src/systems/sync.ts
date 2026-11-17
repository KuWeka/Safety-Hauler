import type { FinishRunResponse } from '@shared/api';
import type { StageData } from '@shared/types';
import { api, ApiFailure } from './api';

// Antrean hasil run (GDD: offline-tolerant). Hasil disimpan dulu di IndexedDB, baru dikirim,
// dan dikirim ulang otomatis sampai berhasil. Kalau IndexedDB tidak tersedia, jatuh ke memori.

export interface PendingRun {
  runId: string;
  token: string;
  phone: string;
  stages: StageData;
  savedAt: number;
}

/** Hasil pengiriman: `sent` berhasil, `recorded` sudah tercatat tapi respons hilang, `failed` ditolak permanen, `pending` belum terkirim. */
export type SubmitResult =
  | { kind: 'sent'; response: FinishRunResponse }
  | { kind: 'recorded' }
  | { kind: 'failed'; code: string }
  | { kind: 'pending' };

const DB_NAME = 'safetyHauler';
const STORE = 'pending';
const memory = new Map<string, PendingRun>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'runId' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function save(run: PendingRun): Promise<void> {
  memory.set(run.runId, run);
  try {
    await withStore('readwrite', (s) => s.put(run));
  } catch {
    // tetap tersimpan di memori
  }
}

async function remove(runId: string): Promise<void> {
  memory.delete(runId);
  try {
    await withStore('readwrite', (s) => s.delete(runId));
  } catch {
    // abaikan
  }
}

async function listPending(): Promise<PendingRun[]> {
  const all = new Map(memory);
  try {
    for (const r of await withStore('readonly', (s) => s.getAll() as IDBRequest<PendingRun[]>)) all.set(r.runId, r);
  } catch {
    // pakai memori saja
  }
  return [...all.values()].sort((a, b) => a.savedAt - b.savedAt);
}

async function attempt(run: PendingRun): Promise<SubmitResult> {
  try {
    const response = await api.finishRun(run.runId, { token: run.token, stages: run.stages });
    await remove(run.runId);
    return { kind: 'sent', response };
  } catch (e) {
    if (!(e instanceof ApiFailure)) return { kind: 'pending' };
    if (e.retryable) return { kind: 'pending' };
    await remove(run.runId);
    // 409: server sudah mencatat run ini (respons sebelumnya hilang di jalan).
    return e.code === 'already_finished' ? { kind: 'recorded' } : { kind: 'failed', code: e.code };
  }
}

/** Simpan lalu kirim. Aman dipanggil sekali per run. */
export async function submitRun(run: PendingRun): Promise<SubmitResult> {
  await save(run);
  return attempt(run);
}

/** Coba kirim ulang satu run yang masih di antrean. */
export async function retryRun(runId: string): Promise<SubmitResult> {
  const run = (await listPending()).find((r) => r.runId === runId);
  return run ? attempt(run) : { kind: 'recorded' };
}

/** Masih ada hasil yang belum terkirim untuk pemain ini? Run baru ditunda sampai itu terkirim (run baru menghapus run lama di server). */
export async function hasPending(phone: string): Promise<boolean> {
  return (await listPending()).some((r) => r.phone === phone);
}

/** Kirim semua yang tertunda (dipanggil saat game dibuka dan saat sinyal kembali). */
export async function flushPending(): Promise<void> {
  for (const run of await listPending()) await attempt(run);
}
