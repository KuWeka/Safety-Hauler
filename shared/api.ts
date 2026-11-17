// Tipe request/response API Worker (dipakai game, admin, worker). Lihat docs/GDD.md bagian "Endpoint API".
// Aturan: tidak ada request yang membawa skor. Skor hanya ada di response.
import type { Avatar, Player, RunStatus, ScoreBreakdown, StageData } from './types';

/** Semua error API berbentuk ini, dengan HTTP status 4xx/5xx. */
export interface ApiError {
  error: string;
}

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
