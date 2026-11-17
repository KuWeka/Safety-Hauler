// Tipe data bersama game, admin, dan worker. Lihat docs/GDD.md bagian "Struktur database D1".

export interface Avatar {
  gender: 'male' | 'female';
  hair: 0 | 1 | 2;
  skin: 0 | 1 | 2;
}

/** Tabel players. */
export interface Player {
  phone: string;
  name: string;
  /** Pilihan dropdown (Arutmin / kontraktor / umum) atau isian bebas. */
  division: string;
  avatar: Avatar;
  consent: boolean;
  createdAt: number;
  playCount: number;
}

export type ApdItem = 'helmet' | 'glasses' | 'vest' | 'boots';

interface Timed {
  durationMs: number;
}

export interface ApdStage extends Timed {
  missingItems: ApdItem[];
  trapItemUsed: boolean;
}

export interface P2hStage extends Timed {
  skipped: boolean;
  correctReport: boolean;
}

export interface LoadingStage extends Timed {
  loadedPasses: number;
  targetPasses: number;
  perfectPasses: number;
  overloadCount: number;
}

export interface HaulingStage extends Timed {
  speedingCount: number;
  lvViolationCount: number;
  radioCorrect: number;
  /** HP unit yang hilang di bagian ini. HP awal ada di scoring.ts (UNIT_HP_MAX). */
  hpLost: number;
}

export interface ReboisasiStage extends Timed {
  completed: boolean;
  timeLeftMs: number;
}

export interface DumpingStage extends Timed {
  bermHit: boolean;
  tooFastCount: number;
  tooSlowCount: number;
  /** Lama slider di zona hijau vs total lama bagian slider. */
  greenZoneMs: number;
  sliderMs: number;
  comboCount: number;
}

export interface QuizStage extends Timed {
  correctCount: number;
}

/** Data mentah semua tahap yang dikirim HP. Skor TIDAK ikut dikirim. */
export interface StageData {
  apd: ApdStage;
  p2h: P2hStage;
  loading: LoadingStage;
  hauling1: HaulingStage;
  reboisasi: ReboisasiStage;
  hauling2: HaulingStage;
  dumping: DumpingStage;
  quiz: QuizStage;
}

export type RunStatus = 'in_progress' | 'valid' | 'flagged' | 'dq';

export type ViolationType =
  | 'apdMissing'
  | 'apdTrap'
  | 'p2hSkipped'
  | 'overload'
  | 'speeding'
  | 'lvNotStopped'
  | 'bermHit'
  | 'dumpTooFast'
  | 'dumpTooSlow';

export interface Violation {
  type: ViolationType;
  count: number;
  /** Total potongan (positif) untuk pelanggaran ini. */
  points: number;
}

export interface ScoreBreakdown {
  loading: number;
  dumping: number;
  safety: number;
  unit: number;
  reboisasi: number;
  quiz: number;
  /** Bonus combo & lainnya: pass sempurna, combo dumping, radio benar, P2H benar. */
  extra: number;
  total: number;
  violations: Violation[];
}

/** Tabel runs. Token run tidak pernah ikut di tipe ini (server hanya simpan hash-nya). */
export interface Run {
  id: string;
  phone: string;
  /** Dicatat server saat POST /api/runs. */
  startedAt: number;
  finishedAt?: number;
  stages?: StageData;
  /** Hanya diisi Worker. */
  score?: ScoreBreakdown;
  total?: number;
  totalTimeMs?: number;
  status: RunStatus;
}

/** Tabel config (satu baris per key). quiz_bank menyusul di Fase 2. */
export interface GameConfig {
  maxRunsPerPlayer: number;
  rankedRun: 'first' | 'best';
  eventOpen: boolean;
}
