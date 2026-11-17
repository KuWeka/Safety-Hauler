// Hash, token, sesi admin, dan rate limit.

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer): string => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toHex(buf.buffer);
}

/** Bandingkan dua string tanpa membocorkan panjang atau posisi beda lewat waktu proses. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

/** Token bertanda tangan `<kedaluwarsa>.<hmac>` untuk sesi admin dan konfirmasi reset. */
export async function signToken(secret: string, purpose: string, ttlMs: number): Promise<string> {
  const exp = Date.now() + ttlMs;
  return `${exp}.${await hmacHex(secret, `${purpose}:${exp}`)}`;
}

export async function verifyToken(secret: string, purpose: string, token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const [expText, sig] = token.split('.');
  const exp = Number(expText);
  if (!sig || !Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(sig, await hmacHex(secret, `${purpose}:${exp}`));
}

// Kunci tanda tangan diturunkan dari password admin: ganti password = semua sesi lama mati.
export const sessionSecret = (password: string): string => `session-v1:${password}`;

export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_MS = 12 * 3_600_000;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

export function sessionCookie(value: string, secure: boolean, maxAgeSec: number): string {
  return `${SESSION_COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}

/**
 * Rate limit per kunci per menit, disimpan di D1 (tanpa fitur berbayar).
 * Return true kalau masih di bawah batas. Catatan: banyak HP di satu WiFi stand terlihat sebagai satu IP,
 * jadi batas pemain dibuat longgar.
 */
export async function allowRequest(db: D1Database, key: string, limitPerMinute: number): Promise<boolean> {
  const window = Math.floor(Date.now() / 60_000);
  const row = await db
    .prepare('INSERT INTO rate_limits (key, window, count) VALUES (?1, ?2, 1) ON CONFLICT(key, window) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(key, window)
    .first<{ count: number }>();
  if (Math.random() < 0.02) await db.prepare('DELETE FROM rate_limits WHERE window < ?1').bind(window - 60).run();
  return (row?.count ?? 1) <= limitPerMinute;
}
