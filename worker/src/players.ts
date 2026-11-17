import type { RegisterPlayerResponse } from '../../shared/api';
import type { Avatar, Player } from '../../shared/types';
import { normalizeDivision, normalizeName, normalizePhone } from '../../shared/validation';
import { finishedRunCount, readConfig } from './db';
import { clientIp, fail, isRecord, json, readJson } from './http';
import { allowRequest } from './security';

const isIdx = (x: unknown): x is 0 | 1 | 2 => x === 0 || x === 1 || x === 2;

function parseAvatar(x: unknown): Avatar | null {
  if (!isRecord(x)) return null;
  const { gender, hair, skin } = x;
  return (gender === 'male' || gender === 'female') && isIdx(hair) && isIdx(skin) ? { gender, hair, skin } : null;
}

interface PlayerRow {
  phone: string;
  name: string;
  division: string;
  avatar_json: string;
  consent: number;
  created_at: number;
  play_count: number;
}

export const toPlayer = (r: PlayerRow): Player => ({
  phone: r.phone,
  name: r.name,
  division: r.division,
  avatar: JSON.parse(r.avatar_json) as Avatar,
  consent: r.consent === 1,
  createdAt: r.created_at,
  playCount: r.play_count,
});

/** POST /api/players: daftar atau ambil pemain berdasarkan no HP. Pemain lama tidak ditimpa datanya. */
export async function registerPlayer(request: Request, db: D1Database): Promise<Response> {
  if (!(await allowRequest(db, `post:${clientIp(request)}`, 300))) return fail('rate_limited', 429);
  const body = await readJson(request);
  if (!isRecord(body)) return fail('bad_request', 400);

  const phone = typeof body.phone === 'string' ? normalizePhone(body.phone) : null;
  const name = typeof body.name === 'string' ? normalizeName(body.name) : null;
  const division = typeof body.division === 'string' ? normalizeDivision(body.division) : null;
  const avatar = parseAvatar(body.avatar);
  if (!phone || !name || !division || !avatar || body.consent !== true) return fail('bad_request', 400);

  // INSERT OR IGNORE lalu SELECT: aman kalau dua permintaan dengan no HP sama datang bersamaan.
  await db
    .prepare('INSERT OR IGNORE INTO players (phone, name, division, avatar_json, consent, created_at, play_count) VALUES (?1, ?2, ?3, ?4, 1, ?5, 0)')
    .bind(phone, name, division, JSON.stringify(avatar), Date.now())
    .run();
  const row = await db.prepare('SELECT * FROM players WHERE phone = ?1').bind(phone).first<PlayerRow>();
  if (!row) return fail('server_error', 500);

  const cfg = await readConfig(db);
  const used = await finishedRunCount(db, phone);
  return json({
    player: toPlayer(row),
    runsLeft: Math.max(0, cfg.maxRunsPerPlayer - used),
    eventOpen: cfg.eventOpen,
  } satisfies RegisterPlayerResponse);
}
