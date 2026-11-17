import type {
  AdminConfigResponse,
  AdminResetResponse,
  AdminRunRow,
  AdminRunsResponse,
  AdminStatsResponse,
} from '../../shared/api';
import type { RunStatus, ViolationType } from '../../shared/types';
import { bumpVersion, readConfig, setConfigValue } from './db';
import { clientIp, fail, isRecord, json, readJson, type AppEnv } from './http';
import {
  allowRequest,
  readCookie,
  safeEqual,
  sessionCookie,
  sessionSecret,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  signToken,
  verifyToken,
} from './security';

const STATUSES: readonly RunStatus[] = ['valid', 'flagged', 'dq'];

async function isAdmin(request: Request, env: AppEnv): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) return false;
  return verifyToken(sessionSecret(env.ADMIN_PASSWORD), 'admin', readCookie(request, SESSION_COOKIE));
}

const isSecure = (request: Request): boolean => new URL(request.url).protocol === 'https:';

async function login(request: Request, env: AppEnv): Promise<Response> {
  if (!env.ADMIN_PASSWORD) return fail('server_error', 500); // secret belum di-set
  if (!(await allowRequest(env.DB, `login:${clientIp(request)}`, 10))) return fail('rate_limited', 429);
  const body = await readJson(request);
  const password = isRecord(body) && typeof body.password === 'string' ? body.password : '';
  if (!(await safeEqual(password, env.ADMIN_PASSWORD))) return fail('unauthorized', 401);

  const token = await signToken(sessionSecret(env.ADMIN_PASSWORD), 'admin', SESSION_TTL_MS);
  return json({ admin: true }, 200, { 'set-cookie': sessionCookie(token, isSecure(request), SESSION_TTL_MS / 1000) });
}

// ---- daftar run -----------------------------------------------------------

const SORTS: Record<string, string> = {
  newest: 'r.finished_at DESC',
  score: 'r.total DESC',
  time: 'r.total_time_ms ASC',
};
const likeEscape = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

interface RunRowDb {
  id: string;
  phone: string;
  name: string;
  division: string;
  status: RunStatus;
  total: number | null;
  total_time_ms: number | null;
  started_at: number;
  finished_at: number | null;
  flags_json: string | null;
  score_json: string | null;
}

function parseJson<T>(text: string | null, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function listRuns(url: URL, db: D1Database): Promise<Response> {
  const q = url.searchParams;
  const where: string[] = ["r.status != 'in_progress'"];
  const params: (string | number)[] = [];

  const status = q.get('status');
  if (status && STATUSES.includes(status as RunStatus)) {
    where.push('r.status = ?');
    params.push(status);
  }
  const division = q.get('division');
  if (division) {
    where.push('p.division = ?');
    params.push(division);
  }
  const search = q.get('q')?.trim().slice(0, 40);
  if (search) {
    const like = `%${likeEscape(search)}%`;
    where.push("(p.name LIKE ? ESCAPE '\\' OR p.phone LIKE ? ESCAPE '\\' OR p.division LIKE ? ESCAPE '\\')");
    params.push(like, like, like);
  }
  const limit = Math.min(200, Math.max(1, Number(q.get('limit')) || 50));
  const offset = Math.max(0, Number(q.get('offset')) || 0);
  const order = SORTS[q.get('sort') ?? 'newest'] ?? SORTS.newest!;
  const from = `FROM runs r JOIN players p ON p.phone = r.phone WHERE ${where.join(' AND ')}`;

  const [{ results }, count] = await Promise.all([
    db
      .prepare(
        `SELECT r.id, r.phone, p.name, p.division, r.status, r.total, r.total_time_ms, r.started_at, r.finished_at,
                r.flags_json, r.score_json ${from}
         ORDER BY (r.status = 'flagged') DESC, ${order}, r.finished_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...params, limit, offset)
      .all<RunRowDb>(),
    db.prepare(`SELECT COUNT(*) AS n ${from}`).bind(...params).first<{ n: number }>(),
  ]);

  const runs: AdminRunRow[] = results.map((r) => ({
    id: r.id,
    phone: r.phone,
    name: r.name,
    division: r.division,
    status: r.status,
    total: r.total,
    totalTimeMs: r.total_time_ms,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    flags: parseJson<string[]>(r.flags_json, []),
    violations: parseJson<{ violations?: { type: ViolationType; count: number }[] }>(r.score_json, {}).violations?.map(
      ({ type, count }) => ({ type, count }),
    ) ?? [],
  }));
  return json({ runs, total: count?.n ?? 0 } satisfies AdminRunsResponse);
}

async function setRunStatus(request: Request, db: D1Database, runId: string): Promise<Response> {
  const body = await readJson(request);
  const status = isRecord(body) ? body.status : null;
  if (typeof status !== 'string' || !STATUSES.includes(status as RunStatus)) return fail('bad_request', 400);
  const res = await db.prepare("UPDATE runs SET status = ?1 WHERE id = ?2 AND status != 'in_progress'").bind(status, runId).run();
  if (res.meta.changes !== 1) return fail('not_found', 404);
  await bumpVersion(db);
  return json({ ok: true });
}

// ---- config, reset, statistik --------------------------------------------

async function getConfig(db: D1Database): Promise<Response> {
  const { maxRunsPerPlayer, rankedRun, eventOpen } = await readConfig(db);
  return json({ maxRunsPerPlayer, rankedRun, eventOpen } satisfies AdminConfigResponse);
}

async function putConfig(request: Request, db: D1Database): Promise<Response> {
  const body = await readJson(request);
  if (!isRecord(body)) return fail('bad_request', 400);
  const { maxRunsPerPlayer, rankedRun, eventOpen } = body;
  if (maxRunsPerPlayer !== undefined && !(Number.isInteger(maxRunsPerPlayer) && (maxRunsPerPlayer as number) >= 1 && (maxRunsPerPlayer as number) <= 100)) {
    return fail('bad_request', 400);
  }
  if (rankedRun !== undefined && rankedRun !== 'first' && rankedRun !== 'best') return fail('bad_request', 400);
  if (eventOpen !== undefined && typeof eventOpen !== 'boolean') return fail('bad_request', 400);

  if (maxRunsPerPlayer !== undefined) await setConfigValue(db, 'max_runs_per_player', maxRunsPerPlayer);
  if (rankedRun !== undefined) await setConfigValue(db, 'ranked_run', rankedRun);
  if (eventOpen !== undefined) await setConfigValue(db, 'event_open', eventOpen);
  await bumpVersion(db);
  return getConfig(db);
}

/** Reset dua langkah: langkah 1 memberi token 60 detik, langkah 2 mengeksekusi. Data run tidak dihapus. */
async function resetLeaderboard(request: Request, env: AppEnv): Promise<Response> {
  const secret = sessionSecret(env.ADMIN_PASSWORD ?? '');
  const body = await readJson(request);
  const confirmToken = isRecord(body) && typeof body.confirmToken === 'string' ? body.confirmToken : undefined;
  if (!confirmToken) {
    return json({ confirmToken: await signToken(secret, 'reset', 60_000), done: false } satisfies AdminResetResponse);
  }
  if (!(await verifyToken(secret, 'reset', confirmToken))) return fail('bad_request', 400);
  await setConfigValue(env.DB, 'leaderboard_since', Date.now());
  await bumpVersion(env.DB);
  return json({ done: true } satisfies AdminResetResponse);
}

async function stats(db: D1Database): Promise<Response> {
  const [players, runs, flagged, avg, scores, divisions] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM players').first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM runs WHERE status != 'in_progress'").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM runs WHERE status = 'flagged'").first<{ n: number }>(),
    db.prepare("SELECT AVG(total) AS a FROM runs WHERE status = 'valid'").first<{ a: number | null }>(),
    db.prepare("SELECT score_json FROM runs WHERE status IN ('valid', 'flagged') ORDER BY finished_at DESC LIMIT 5000").all<{ score_json: string }>(),
    db.prepare('SELECT DISTINCT division FROM players ORDER BY division LIMIT 200').all<{ division: string }>(),
  ]);
  const counts = new Map<ViolationType, number>();
  for (const row of scores.results) {
    for (const v of parseJson<{ violations?: { type: ViolationType; count: number }[] }>(row.score_json, {}).violations ?? []) {
      counts.set(v.type, (counts.get(v.type) ?? 0) + v.count);
    }
  }
  return json({
    players: players?.n ?? 0,
    finishedRuns: runs?.n ?? 0,
    flaggedRuns: flagged?.n ?? 0,
    averageScore: Math.round(avg?.a ?? 0),
    divisions: divisions.results.map((d) => d.division),
    violations: [...counts].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  } satisfies AdminStatsResponse);
}

// ---- export CSV -----------------------------------------------------------

/** Sel diawali = + - @ dianggap rumus oleh Excel; nama pemain bebas diisi, jadi di-netralkan. */
function csvCell(value: string | number | null): string {
  let s = value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const iso = (ms: number | null): string => (ms ? new Date(ms).toISOString() : '');

function csvResponse(name: string, header: string[], rows: (string | number | null)[][]): Response {
  const body = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  return new Response(body, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' },
  });
}

async function exportCsv(url: URL, db: D1Database): Promise<Response> {
  if (url.searchParams.get('type') === 'runs') {
    const { results } = await db
      .prepare(
        `SELECT r.id, r.phone, p.name, p.division, r.status, r.total, r.total_time_ms, r.started_at, r.finished_at, r.flags_json
         FROM runs r JOIN players p ON p.phone = r.phone WHERE r.status != 'in_progress' ORDER BY r.finished_at DESC`,
      )
      .all<Omit<RunRowDb, 'score_json'>>();
    return csvResponse(
      'safety-hauler-runs.csv',
      ['run_id', 'no_hp', 'nama', 'divisi', 'status', 'skor', 'waktu_ms', 'mulai', 'selesai', 'flag'],
      results.map((r) => [r.id, r.phone, r.name, r.division, r.status, r.total, r.total_time_ms, iso(r.started_at), iso(r.finished_at), parseJson<string[]>(r.flags_json, []).join(' ')]),
    );
  }
  // Per pemain: run valid terbaik, untuk undian dan penyerahan hadiah.
  const { results } = await db
    .prepare(
      `SELECT p.phone, p.name, p.division, p.play_count, p.created_at,
              (SELECT MAX(total) FROM runs WHERE phone = p.phone AND status = 'valid') AS best_total,
              (SELECT total_time_ms FROM runs WHERE phone = p.phone AND status = 'valid' ORDER BY total DESC, total_time_ms ASC LIMIT 1) AS best_time,
              (SELECT COUNT(*) FROM runs WHERE phone = p.phone AND status = 'flagged') AS flagged,
              (SELECT COUNT(*) FROM runs WHERE phone = p.phone AND status = 'dq') AS dq
       FROM players p ORDER BY best_total DESC, best_time ASC`,
    )
    .all<{ phone: string; name: string; division: string; play_count: number; created_at: number; best_total: number | null; best_time: number | null; flagged: number; dq: number }>();
  return csvResponse(
    'safety-hauler-pemain.csv',
    ['no_hp', 'nama', 'divisi', 'jumlah_main', 'skor_terbaik', 'waktu_terbaik_ms', 'run_flagged', 'run_dq', 'daftar'],
    results.map((r) => [r.phone, r.name, r.division, r.play_count, r.best_total, r.best_time, r.flagged, r.dq, iso(r.created_at)]),
  );
}

// ---- router ---------------------------------------------------------------

export async function adminRoute(request: Request, env: AppEnv, url: URL): Promise<Response> {
  const { pathname } = url;
  const method = request.method;

  if (pathname === '/api/admin/login' && method === 'POST') return login(request, env);
  if (pathname === '/api/admin/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', isSecure(request), 0) });
  }
  if (!(await isAdmin(request, env))) return fail('unauthorized', 401);

  if (pathname === '/api/admin/me' && method === 'GET') return json({ admin: true });
  if (pathname === '/api/admin/runs' && method === 'GET') return listRuns(url, env.DB);
  const runStatus = /^\/api\/admin\/runs\/([\w-]{1,64})\/status$/.exec(pathname);
  if (runStatus && method === 'POST') return setRunStatus(request, env.DB, runStatus[1]!);
  if (pathname === '/api/admin/config' && method === 'GET') return getConfig(env.DB);
  if (pathname === '/api/admin/config' && method === 'PUT') return putConfig(request, env.DB);
  if (pathname === '/api/admin/reset-leaderboard' && method === 'POST') return resetLeaderboard(request, env);
  if (pathname === '/api/admin/stats' && method === 'GET') return stats(env.DB);
  if (pathname === '/api/admin/export' && method === 'GET') return exportCsv(url, env.DB);
  return fail('not_found', 404);
}
