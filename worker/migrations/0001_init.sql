-- Skema awal sesuai docs/GDD.md bagian "Struktur database D1". Waktu dalam epoch ms.

CREATE TABLE players (
  phone       TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  division    TEXT NOT NULL,
  avatar_json TEXT NOT NULL,
  consent     INTEGER NOT NULL CHECK (consent IN (0, 1)),
  created_at  INTEGER NOT NULL,
  play_count  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE runs (
  id            TEXT PRIMARY KEY,
  phone         TEXT NOT NULL REFERENCES players(phone),
  token_hash    TEXT NOT NULL,
  started_at    INTEGER NOT NULL,
  finished_at   INTEGER,
  stages_json   TEXT,
  score_json    TEXT,
  total         INTEGER,
  total_time_ms INTEGER,
  status        TEXT NOT NULL DEFAULT 'in_progress'
                CHECK (status IN ('in_progress', 'valid', 'flagged', 'dq'))
);

CREATE INDEX idx_runs_phone ON runs(phone, started_at);
-- Leaderboard: run valid, total tertinggi lalu waktu tercepat.
CREATE INDEX idx_runs_leaderboard ON runs(status, total DESC, total_time_ms ASC);

CREATE TABLE config (
  key        TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

-- Nilai awal config. Angka final diatur admin; quiz_bank menyusul di Fase 2.
INSERT INTO config (key, value_json) VALUES
  ('max_runs_per_player', '3'),
  ('ranked_run', '"best"'),
  ('event_open', 'true');
