-- Fase 3: alasan flag, rate limit, versi leaderboard, titik reset leaderboard.

ALTER TABLE runs ADD COLUMN flags_json TEXT;

-- Rate limit sederhana per IP per jendela waktu (menit). Dibersihkan berkala dari kode Worker.
CREATE TABLE rate_limits (
  key    TEXT    NOT NULL,
  window INTEGER NOT NULL,
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window)
);

-- lb_version naik tiap data leaderboard berubah (run selesai, status diubah, reset, pemain baru).
-- Dipakai sebagai kunci cache supaya polling dashboard TV cukup membaca 1 baris.
-- leaderboard_since: hanya run yang selesai setelah waktu ini yang masuk leaderboard (reset tanpa hapus data).
INSERT INTO config (key, value_json) VALUES
  ('lb_version', '0'),
  ('leaderboard_since', '0');
