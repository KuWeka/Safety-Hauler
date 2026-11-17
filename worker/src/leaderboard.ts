import type { LeaderboardEntry, LeaderboardResponse, TvResponse } from '../../shared/api';
import { readConfig, readVersion, type ServerConfig } from './db';
import { json, startOfEventDay } from './http';

// Leaderboard = run valid terbaik (atau pertama) tiap pemain, tidak disimpan di tabel sendiri.
// Hasilnya di-cache per isolate dengan kunci lb_version, jadi polling dashboard TV cukup membaca 1 baris
// (menjaga kuota baca D1 gratis).

const TOP_N = 10;

/** `order` hanya berasal dari konstanta ini, tidak pernah dari input pengguna. */
const bestCte = (rankedRun: ServerConfig['rankedRun']): string => {
  const order = rankedRun === 'first' ? 'finished_at ASC' : 'total DESC, total_time_ms ASC';
  return `WITH ranked AS (
      SELECT phone, total, total_time_ms,
             ROW_NUMBER() OVER (PARTITION BY phone ORDER BY ${order}) AS rn
      FROM runs WHERE status = 'valid' AND finished_at >= ?1
    ), best AS (SELECT phone, total, total_time_ms FROM ranked WHERE rn = 1)`;
};

interface Row {
  name: string;
  division: string;
  total: number;
  total_time_ms: number;
  rank?: number;
}

/** Peringkat kompetisi: skor dan waktu sama berbagi peringkat yang sama. */
function withRanks(rows: Row[]): LeaderboardEntry[] {
  const out: LeaderboardEntry[] = [];
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    const same = prev && prev.total === r.total && prev.total_time_ms === r.total_time_ms;
    out.push({
      rank: same ? out[i - 1]!.rank : i + 1,
      name: r.name,
      division: r.division,
      total: r.total,
      totalTimeMs: r.total_time_ms,
    });
  });
  return out;
}

async function queryTop(db: D1Database, cfg: ServerConfig): Promise<LeaderboardEntry[]> {
  const { results } = await db
    .prepare(
      `${bestCte(cfg.rankedRun)}
       SELECT p.name, p.division, b.total, b.total_time_ms
       FROM best b JOIN players p ON p.phone = b.phone
       ORDER BY b.total DESC, b.total_time_ms ASC LIMIT ${TOP_N}`,
    )
    .bind(cfg.leaderboardSince)
    .all<Row>();
  return withRanks(results);
}

/** Posisi satu pemain (run yang dihitung untuk ranking). null kalau belum punya run valid. */
export async function queryRank(db: D1Database, cfg: ServerConfig, phone: string): Promise<LeaderboardEntry | null> {
  const row = await db
    .prepare(
      `${bestCte(cfg.rankedRun)}
       SELECT p.name, p.division, m.total, m.total_time_ms,
              (SELECT COUNT(*) FROM best x
                WHERE x.total > m.total OR (x.total = m.total AND x.total_time_ms < m.total_time_ms)) + 1 AS rank
       FROM best m JOIN players p ON p.phone = m.phone WHERE m.phone = ?2`,
    )
    .bind(cfg.leaderboardSince, phone)
    .first<Row>();
  return row ? { rank: row.rank ?? 0, name: row.name, division: row.division, total: row.total, totalTimeMs: row.total_time_ms } : null;
}

let cache: { version: number; top: LeaderboardEntry[]; tv: TvResponse } | null = null;

async function cached(db: D1Database): Promise<NonNullable<typeof cache>> {
  const version = await readVersion(db);
  if (cache && cache.version === version) return cache;

  const cfg = await readConfig(db);
  const top = await queryTop(db, cfg);
  const dayStart = startOfEventDay(Date.now());
  const day = await db
    .prepare("SELECT COUNT(DISTINCT phone) AS n FROM runs WHERE status != 'in_progress' AND finished_at >= ?1")
    .bind(dayStart)
    .first<{ n: number }>();
  const last = await db
    .prepare(
      `SELECT p.name, r.total FROM runs r JOIN players p ON p.phone = r.phone
       WHERE r.status = 'valid' AND r.finished_at >= ?1 ORDER BY r.finished_at DESC LIMIT 1`,
    )
    .bind(cfg.leaderboardSince)
    .first<{ name: string; total: number }>();

  cache = {
    version,
    top,
    tv: { top, playersToday: day?.n ?? 0, topScore: top[0]?.total ?? 0, last: last ? { name: last.name, total: last.total } : null },
  };
  return cache;
}

export async function leaderboardRoute(db: D1Database, phone: string | null): Promise<Response> {
  const { top } = await cached(db);
  let me: LeaderboardEntry | null = null;
  if (phone) me = await queryRank(db, await readConfig(db), phone);
  return json({ top, me } satisfies LeaderboardResponse);
}

export async function tvRoute(db: D1Database): Promise<Response> {
  return json((await cached(db)).tv);
}
