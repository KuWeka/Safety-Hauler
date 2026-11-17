// Tipe request/response API Worker (dipakai game, admin, worker). Lihat docs/GDD.md bagian "Endpoint API".
// Aturan: tidak ada request yang membawa skor. Skor hanya ada di response.
import type { Avatar, GameConfig, Player, RunStatus, ScoreBreakdown, StageData, ViolationType } from './types';

/** Semua error API berbentuk ini, dengan HTTP status 4xx/5xx. */
export interface ApiError {
  error: ApiErrorCode;
}

export type ApiErrorCode =
  | 'bad_request'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'event_closed'
  | 'quota_exceeded'
  | 'already_finished'
  | 'invalid_token'
  | 'rate_limited'
  | 'server_error';

/** GET /api/health */
export interface HealthResponse {
  ok: boolean;
  db: 'ok' | 'error';
}

/** POST /api/players: daftar baru, atau ambil pemain lama kalau no HP sudah ada. */
export interface RegisterPlayerRequest {
  phone: string;
  name: string;
  division: string;
  avatar: Avatar;
  consent: true;
}
export interface RegisterPlayerResponse {
  player: Player;
  /** Sisa jatah main sesuai config max_runs_per_player. */
  runsLeft: number;
  eventOpen: boolean;
}

/** POST /api/runs: server mencatat waktu mulai dan memberi token sekali pakai. */
export interface StartRunRequest {
  phone: string;
}
export interface StartRunResponse {
  runId: string;
  token: string;
  startedAt: number;
}

/** POST /api/runs/:id/finish */
export interface FinishRunRequest {
  token: string;
  stages: StageData;
}
export interface FinishRunResponse {
  status: RunStatus;
  score: ScoreBreakdown;
  /** Peringkat di leaderboard; null kalau run tidak masuk ranking (flagged / bukan run yang dihitung). */
  rank: number | null;
  runsLeft: number;
}

/** GET /api/leaderboard?phone=... */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  division: string;
  total: number;
  totalTimeMs: number;
}
export interface LeaderboardResponse {
  top: LeaderboardEntry[];
  /** Posisi pemain sendiri kalau query phone diisi dan pemain punya run valid. */
  me: LeaderboardEntry | null;
}

/** GET /api/tv: data Mode TV (publik, di-cache berdasarkan versi leaderboard). */
export interface TvResponse {
  top: LeaderboardEntry[];
  playersToday: number;
  topScore: number;
  last: { name: string; total: number } | null;
}

// ---------------------------------------------------------------------------
// Admin (/api/admin/*, butuh cookie sesi admin)
// ---------------------------------------------------------------------------

export interface AdminLoginRequest {
  password: string;
}
export interface AdminMeResponse {
  admin: true;
}

export interface AdminRunRow {
  id: string;
  phone: string;
  name: string;
  division: string;
  status: RunStatus;
  total: number | null;
  totalTimeMs: number | null;
  startedAt: number;
  finishedAt: number | null;
  flags: string[];
  violations: { type: ViolationType; count: number }[];
}
export interface AdminRunsResponse {
  runs: AdminRunRow[];
  total: number;
}
export type AdminRunSort = 'newest' | 'score' | 'time';
export interface AdminSetStatusRequest {
  status: Exclude<RunStatus, 'in_progress'>;
}

export type AdminConfigResponse = GameConfig;
export type AdminConfigRequest = Partial<GameConfig>;

export interface AdminStatsResponse {
  players: number;
  finishedRuns: number;
  flaggedRuns: number;
  averageScore: number;
  /** Semua divisi/perusahaan yang pernah mendaftar, untuk filter. */
  divisions: string[];
  /** Pelanggaran terbanyak, urut dari yang paling sering. Bahan laporan K3. */
  violations: { type: ViolationType; count: number }[];
}

/** Reset leaderboard dua langkah: langkah 1 minta konfirmasi, langkah 2 kirim confirmToken. */
export interface AdminResetRequest {
  confirmToken?: string;
}
export interface AdminResetResponse {
  /** Ada kalau ini langkah 1 (belum dieksekusi). Berlaku 60 detik. */
  confirmToken?: string;
  done: boolean;
}
