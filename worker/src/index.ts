import type { HealthResponse } from '../../shared/api';
import { adminRoute } from './admin';
import { fail, json, type AppEnv } from './http';
import { leaderboardRoute, tvRoute } from './leaderboard';
import { normalizePhone } from '../../shared/validation';
import { registerPlayer } from './players';
import { finishRun, startRun } from './runs';

async function health(env: AppEnv): Promise<Response> {
  try {
    await env.DB.prepare('SELECT 1').first();
    return json({ ok: true, db: 'ok' } satisfies HealthResponse);
  } catch {
    return json({ ok: false, db: 'error' } satisfies HealthResponse, 503);
  }
}

async function route(request: Request, env: AppEnv, url: URL): Promise<Response> {
  const { pathname } = url;
  const method = request.method;

  if (pathname === '/api/health' && method === 'GET') return health(env);
  if (pathname === '/api/players' && method === 'POST') return registerPlayer(request, env.DB);
  if (pathname === '/api/runs' && method === 'POST') return startRun(request, env.DB);
  const finish = /^\/api\/runs\/([\w-]{1,64})\/finish$/.exec(pathname);
  if (finish && method === 'POST') return finishRun(request, env.DB, finish[1]!);
  if (pathname === '/api/leaderboard' && method === 'GET') {
    const raw = url.searchParams.get('phone');
    return leaderboardRoute(env.DB, raw ? normalizePhone(raw) : null);
  }
  if (pathname === '/api/tv' && method === 'GET') return tvRoute(env.DB);
  if (pathname.startsWith('/api/admin/')) return adminRoute(request, env, url);
  return fail('not_found', 404);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    // Selain /api/* dilayani static assets (run_worker_first hanya untuk /api/*).
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    // Perlindungan CSRF tambahan di atas SameSite=Strict: permintaan yang mengubah data harus same-origin.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) return fail('forbidden', 403);
    }
    try {
      return await route(request, env as AppEnv, url);
    } catch (err) {
      console.error('unhandled', err instanceof Error ? err.message : 'unknown'); // tanpa data pemain
      return fail('server_error', 500);
    }
  },
} satisfies ExportedHandler<Env>;
