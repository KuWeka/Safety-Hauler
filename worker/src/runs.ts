import type { FinishRunResponse, StartRunResponse } from '../../shared/api';
import { calculateScore } from '../../shared/scoring';
import { normalizePhone, parseStageData, validateRun } from '../../shared/validation';
import { bumpVersion, finishedRunCount, readConfig } from './db';
import { clientIp, fail, isRecord, json, readJson } from './http';
import { queryRank } from './leaderboard';
import { allowRequest, randomToken, safeEqual, sha256Hex } from './security';

/** POST /api/runs: cek jatah + event, catat waktu mulai di server, beri token sekali pakai. */
export async function startRun(request: Request, db: D1Database): Promise<Response> {
  if (!(await allowRequest(db, `post:${clientIp(request)}`, 300))) return fail('rate_limited', 429);
  const body = await readJson(request);
  const phone = isRecord(body) && typeof body.phone === 'string' ? normalizePhone(body.phone) : null;
  if (!phone) return fail('bad_request', 400);

  const player = await db.prepare('SELECT phone FROM players WHERE phone = ?1').bind(phone).first();
  if (!player) return fail('not_found', 404);

  const cfg = await readConfig(db);
  if (!cfg.eventOpen) return fail('event_closed', 403);
  if ((await finishedRunCount(db, phone)) >= cfg.maxRunsPerPlayer) return fail('quota_exceeded', 403);

  // Satu run aktif per pemain: run lama yang tidak pernah selesai (tab ditutup) dibuang dan tidak memakai jatah.
  await db.prepare("DELETE FROM runs WHERE phone = ?1 AND status = 'in_progress'").bind(phone).run();

  const id = crypto.randomUUID();
  const token = randomToken();
  const startedAt = Date.now();
  await db
    .prepare("INSERT INTO runs (id, phone, token_hash, started_at, status) VALUES (?1, ?2, ?3, ?4, 'in_progress')")
    .bind(id, phone, await sha256Hex(token), startedAt)
    .run();
  return json({ runId: id, token, startedAt } satisfies StartRunResponse);
}

interface RunRow {
  phone: string;
  token_hash: string;
  started_at: number;
  status: string;
}

/**
 * POST /api/runs/:id/finish: terima data mentah tahap, hitung ulang skor, cek kewajaran, simpan.
 * Token hanya berlaku sekali: UPDATE ... WHERE status = 'in_progress' bersifat atomik.
 */
export async function finishRun(request: Request, db: D1Database, runId: string): Promise<Response> {
  if (!(await allowRequest(db, `post:${clientIp(request)}`, 300))) return fail('rate_limited', 429);
  const body = await readJson(request);
  if (!isRecord(body) || typeof body.token !== 'string') return fail('bad_request', 400);
  const stages = parseStageData(body.stages);
  if (!stages) return fail('bad_request', 400);

  const run = await db.prepare('SELECT phone, token_hash, started_at, status FROM runs WHERE id = ?1').bind(runId).first<RunRow>();
  if (!run) return fail('not_found', 404);
  if (!(await safeEqual(await sha256Hex(body.token), run.token_hash))) return fail('invalid_token', 403);
  if (run.status !== 'in_progress') return fail('already_finished', 409);

  const cfg = await readConfig(db);
  const used = await finishedRunCount(db, run.phone);
  if (used >= cfg.maxRunsPerPlayer) return fail('quota_exceeded', 403);

  const now = Date.now();
  const check = validateRun(stages, now - run.started_at);
  const score = calculateScore(stages);
  const status = check.ok ? 'valid' : 'flagged';

  const res = await db
    .prepare(
      `UPDATE runs SET status = ?1, finished_at = ?2, stages_json = ?3, score_json = ?4, total = ?5,
              total_time_ms = ?6, flags_json = ?7
       WHERE id = ?8 AND status = 'in_progress'`,
    )
    .bind(status, now, JSON.stringify(stages), JSON.stringify(score), score.total, check.totalTimeMs, JSON.stringify(check.reasons), runId)
    .run();
  if (res.meta.changes !== 1) return fail('already_finished', 409);

  await db.prepare('UPDATE players SET play_count = play_count + 1 WHERE phone = ?1').bind(run.phone).run();
  await bumpVersion(db);

  const me = status === 'valid' ? await queryRank(db, cfg, run.phone) : null;
  return json({
    status,
    score,
    rank: me?.rank ?? null,
    runsLeft: Math.max(0, cfg.maxRunsPerPlayer - (used + 1)),
  } satisfies FinishRunResponse);
}
