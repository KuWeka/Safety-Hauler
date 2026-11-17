import type { ApiError, HealthResponse } from '../../shared/api';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

async function health(env: Env): Promise<Response> {
  try {
    await env.DB.prepare('SELECT 1').first();
    return json({ ok: true, db: 'ok' } satisfies HealthResponse);
  } catch {
    return json({ ok: false, db: 'error' } satisfies HealthResponse, 503);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/health' && request.method === 'GET') return health(env);
    if (pathname.startsWith('/api/')) return json({ error: 'not_found' } satisfies ApiError, 404);
    // Selain /api/* dilayani static assets (run_worker_first hanya untuk /api/*).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
