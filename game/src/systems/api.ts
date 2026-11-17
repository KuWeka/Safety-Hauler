import type {
  ApiError,
  ApiErrorCode,
  FinishRunRequest,
  FinishRunResponse,
  LeaderboardResponse,
  RegisterPlayerRequest,
  RegisterPlayerResponse,
  StartRunRequest,
  StartRunResponse,
} from '@shared/api';

/** `network` = tidak ada sinyal / timeout (boleh dicoba lagi). Kode lain datang dari server. */
export class ApiFailure extends Error {
  constructor(
    readonly code: ApiErrorCode | 'network',
    readonly status: number,
  ) {
    super(code);
  }

  /** Kegagalan sementara: layak dicoba ulang nanti. */
  get retryable(): boolean {
    return this.code === 'network' || this.code === 'rate_limited' || this.status >= 500;
  }
}

const TIMEOUT_MS = 10_000;

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiFailure('network', 0);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let code: ApiErrorCode = 'server_error';
    try {
      code = ((await res.json()) as ApiError).error;
    } catch {
      // body bukan JSON (misal halaman error proxy): pakai server_error
    }
    throw new ApiFailure(code, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiFailure('server_error', res.status);
  }
}

export const api = {
  register: (req: RegisterPlayerRequest) => request<RegisterPlayerResponse>('POST', '/api/players', req),
  startRun: (req: StartRunRequest) => request<StartRunResponse>('POST', '/api/runs', req),
  finishRun: (runId: string, req: FinishRunRequest) => request<FinishRunResponse>('POST', `/api/runs/${encodeURIComponent(runId)}/finish`, req),
  leaderboard: (phone?: string) => request<LeaderboardResponse>('GET', `/api/leaderboard${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`),
};
