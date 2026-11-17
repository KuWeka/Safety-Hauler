import type { GameConfig } from '../../shared/types';

export interface ServerConfig extends GameConfig {
  /** Run yang selesai sebelum waktu ini tidak masuk leaderboard (reset tanpa menghapus data). */
  leaderboardSince: number;
  lbVersion: number;
}

const DEFAULTS: ServerConfig = {
  maxRunsPerPlayer: 2,
  rankedRun: 'best',
  eventOpen: true,
  leaderboardSince: 0,
  lbVersion: 0,
};

export async function readConfig(db: D1Database): Promise<ServerConfig> {
  const { results } = await db.prepare('SELECT key, value_json FROM config').all<{ key: string; value_json: string }>();
  const raw = new Map<string, unknown>();
  for (const r of results) {
    try {
      raw.set(r.key, JSON.parse(r.value_json));
    } catch {
      // nilai rusak diabaikan, pakai default
    }
  }
  const int = (k: string, d: number): number => {
    const v = raw.get(k);
    return typeof v === 'number' && Number.isFinite(v) ? v : d;
  };
  const ranked = raw.get('ranked_run');
  const open = raw.get('event_open');
  return {
    maxRunsPerPlayer: int('max_runs_per_player', DEFAULTS.maxRunsPerPlayer),
    rankedRun: ranked === 'first' || ranked === 'best' ? ranked : DEFAULTS.rankedRun,
    eventOpen: typeof open === 'boolean' ? open : DEFAULTS.eventOpen,
    leaderboardSince: int('leaderboard_since', DEFAULTS.leaderboardSince),
    lbVersion: int('lb_version', DEFAULTS.lbVersion),
  };
}

export async function setConfigValue(db: D1Database, key: string, value: unknown): Promise<void> {
  await db
    .prepare('INSERT INTO config (key, value_json) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json')
    .bind(key, JSON.stringify(value))
    .run();
}

/** Naikkan versi leaderboard: kunci cache untuk /api/leaderboard dan /api/tv. */
export async function bumpVersion(db: D1Database): Promise<void> {
  await db.prepare("UPDATE config SET value_json = CAST(CAST(value_json AS INTEGER) + 1 AS TEXT) WHERE key = 'lb_version'").run();
}

export async function readVersion(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT value_json FROM config WHERE key = 'lb_version'").first<{ value_json: string }>();
  return Number(row?.value_json ?? 0) || 0;
}

/** Jumlah run yang sudah selesai (jatah main terpakai). Run in_progress tidak dihitung. */
export async function finishedRunCount(db: D1Database, phone: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM runs WHERE phone = ?1 AND status != 'in_progress'")
    .bind(phone)
    .first<{ n: number }>();
  return row?.n ?? 0;
}
