import type {
  AdminConfigRequest,
  AdminConfigResponse,
  AdminResetResponse,
  AdminRunsResponse,
  AdminRunSort,
  AdminStatsResponse,
  ApiError,
  TvResponse,
} from '../../shared/api';
import type { RunStatus } from '../../shared/types';

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

async function call<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AdminApiError(0, 'network');
  }
  if (!res.ok) {
    let code = 'server_error';
    try {
      code = ((await res.json()) as ApiError).error;
    } catch {
      // bukan JSON
    }
    throw new AdminApiError(res.status, code);
  }
  return (await res.json()) as T;
}

export interface RunQuery {
  q: string;
  division: string;
  status: '' | Exclude<RunStatus, 'in_progress'>;
  sort: AdminRunSort;
  limit: number;
  offset: number;
}

export const adminApi = {
  login: (password: string) => call<{ admin: true }>('POST', '/api/admin/login', { password }),
  logout: () => call<{ ok: true }>('POST', '/api/admin/logout', {}),
  me: () => call<{ admin: true }>('GET', '/api/admin/me'),
  runs: (q: RunQuery) => {
    const p = new URLSearchParams({ sort: q.sort, limit: String(q.limit), offset: String(q.offset) });
    if (q.q) p.set('q', q.q);
    if (q.division) p.set('division', q.division);
    if (q.status) p.set('status', q.status);
    return call<AdminRunsResponse>('GET', `/api/admin/runs?${p}`);
  },
  setStatus: (id: string, status: Exclude<RunStatus, 'in_progress'>) => call<{ ok: true }>('POST', `/api/admin/runs/${encodeURIComponent(id)}/status`, { status }),
  config: () => call<AdminConfigResponse>('GET', '/api/admin/config'),
  saveConfig: (patch: AdminConfigRequest) => call<AdminConfigResponse>('PUT', '/api/admin/config', patch),
  stats: () => call<AdminStatsResponse>('GET', '/api/admin/stats'),
  reset: (confirmToken?: string) => call<AdminResetResponse>('POST', '/api/admin/reset-leaderboard', confirmToken ? { confirmToken } : {}),
  tv: () => call<TvResponse>('GET', '/api/tv'),
};
