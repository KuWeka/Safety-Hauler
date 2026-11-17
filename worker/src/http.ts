import type { ApiError, ApiErrorCode } from '../../shared/api';

/** Env Worker + secret. ADMIN_PASSWORD diisi lewat `wrangler secret put` (produksi) atau .dev.vars (lokal). */
export type AppEnv = Env & { ADMIN_PASSWORD?: string };

const BASE_HEADERS = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export const fail = (code: ApiErrorCode, status: number): Response => json({ error: code } satisfies ApiError, status);

const MAX_BODY_BYTES = 32 * 1024;

/** Baca body JSON (maks 32 KB). Return null kalau bukan JSON yang valid. */
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return null;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export const clientIp = (request: Request): string => request.headers.get('cf-connecting-ip') ?? 'local';

/** Hari ini dimulai jam 00.00 WITA (Kalimantan Selatan, UTC+8), bukan UTC. */
export const EVENT_UTC_OFFSET_MS = 8 * 3_600_000;
export function startOfEventDay(now: number): number {
  return Math.floor((now + EVENT_UTC_OFFSET_MS) / 86_400_000) * 86_400_000 - EVENT_UTC_OFFSET_MS;
}
