// Smoke test API terhadap `wrangler dev` + D1 lokal. Jalankan: npm run smoke   (dari root)
// Butuh: `npm run dev:api` jalan, migrasi lokal sudah diterapkan, dan ADMIN_PASSWORD di worker/.dev.vars.
// Data uji ditulis ke D1 LOKAL (nama pemain berawalan "Smoke"). Jangan arahkan ke server produksi.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE ?? 'http://localhost:8787';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error('smoke test hanya untuk server lokal');
const workerDir = fileURLToPath(new URL('..', import.meta.url));
const devVars = readFileSync(`${workerDir}.dev.vars`, 'utf8');
const ADMIN_PASSWORD = /^ADMIN_PASSWORD=(.+)$/m.exec(devVars)?.[1]?.trim();
if (!ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD tidak ada di worker/.dev.vars');

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : `  ${extra}`}`);
  if (!cond) failures++;
};

async function call(method, path, { body, cookie, headers } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, res };
}

const rnd = () => Math.random().toString(36).slice(2, 7);
const phone = () => '08' + String(Math.floor(Math.random() * 1e10)).padStart(10, '0');
const avatar = { gender: 'male', hair: 0, skin: 1 };

const stages = (over = {}) => ({
  apd: { missingItems: [], trapItemUsed: false, durationMs: 8000 },
  p2h: { skipped: false, correctReport: true, durationMs: 9000 },
  loading: { loadedPasses: 5, targetPasses: 5, perfectPasses: 3, overloadCount: 0, durationMs: 14000 },
  hauling1: { speedingCount: 0, lvViolationCount: 0, radioCorrect: 1, hpLost: 0, durationMs: 48000 },
  reboisasi: { completed: true, timeLeftMs: 8000, durationMs: 12000 },
  hauling2: { speedingCount: 0, lvViolationCount: 0, radioCorrect: 1, hpLost: 0, durationMs: 21000 },
  dumping: { bermHit: false, tooFastCount: 0, tooSlowCount: 0, greenZoneMs: 7000, sliderMs: 10000, comboCount: 2, durationMs: 22000 },
  quiz: { correctCount: 2, durationMs: 15000 },
  ...over,
});

/** Mundurkan waktu mulai run di D1 lokal supaya lolos batas waktu minimum 90 dtk. */
// package.json wrangler tidak meng-export bin/, jadi cari lewat package.json-nya.
const wranglerBin = join(dirname(createRequire(import.meta.url).resolve('wrangler/package.json')), 'bin', 'wrangler.js');
const backdate = (runId) =>
  execFileSync(
    process.execPath,
    [wranglerBin, 'd1', 'execute', 'safety-hauler', '--local', '--command', `UPDATE runs SET started_at = started_at - 300000 WHERE id = '${runId}'`],
    { cwd: workerDir, stdio: 'pipe' },
  );

async function playRun(p, st, { wait = true } = {}) {
  const start = await call('POST', '/api/runs', { body: { phone: p } });
  if (start.status !== 200) return { start };
  if (wait) backdate(start.data.runId);
  const finish = await call('POST', `/api/runs/${start.data.runId}/finish`, { body: { token: start.data.token, stages: st } });
  return { start, finish };
}

// ---- dasar ----------------------------------------------------------------
check('health ok', (await call('GET', '/api/health')).data?.db === 'ok');
const cfg0 = await call('POST', '/api/admin/login', { body: { password: ADMIN_PASSWORD } });
const cookie = (cfg0.res.headers.get('set-cookie') ?? '').split(';')[0];
check('admin login ok + cookie HttpOnly/Strict', cfg0.status === 200 && /HttpOnly/i.test(cfg0.res.headers.get('set-cookie') ?? '') && /SameSite=Strict/i.test(cfg0.res.headers.get('set-cookie') ?? ''));
check('admin tanpa cookie ditolak', (await call('GET', '/api/admin/runs')).status === 401);
check('admin cookie palsu ditolak', (await call('GET', '/api/admin/runs', { cookie: 'admin_session=9999999999999.abc' })).status === 401);
check('login password salah = 401', (await call('POST', '/api/admin/login', { body: { password: 'salah' } })).status === 401);

// pastikan konfigurasi bersih: 2x main, event buka, ranking terbaik
const setCfg = await call('PUT', '/api/admin/config', { cookie, body: { maxRunsPerPlayer: 2, rankedRun: 'best', eventOpen: true } });
check('config diatur', setCfg.status === 200 && setCfg.data.maxRunsPerPlayer === 2);

// ---- registrasi -----------------------------------------------------------
const pa = phone();
const pb = phone();
const nameA = `Smoke A ${rnd()}`;
const nameB = `Smoke B ${rnd()}`;
const bad = await call('POST', '/api/players', { body: { phone: '123', name: nameA, division: 'Umum', avatar, consent: true } });
check('registrasi no HP salah = 400', bad.status === 400);
const noConsent = await call('POST', '/api/players', { body: { phone: pa, name: nameA, division: 'Umum', avatar, consent: false } });
check('registrasi tanpa consent = 400', noConsent.status === 400);
const regA = await call('POST', '/api/players', { body: { phone: pa, name: nameA, division: 'Arutmin', avatar, consent: true } });
check('registrasi A ok, jatah 2', regA.status === 200 && regA.data.runsLeft === 2 && regA.data.player.name === nameA);
const regA2 = await call('POST', '/api/players', { body: { phone: pa, name: 'Nama Lain', division: 'Umum', avatar, consent: true } });
check('daftar ulang no HP sama = akun yang sama (tidak ditimpa)', regA2.data.player.name === nameA && regA2.data.player.division === 'Arutmin');
const regB = await call('POST', '/api/players', { body: { phone: '+62' + pb.slice(1), name: nameB, division: 'Kontraktor', avatar, consent: true } });
check('format +62 dinormalisasi', regB.status === 200 && regB.data.player.phone === pb);

// ---- run: waktu terlalu singkat -> flagged; token sekali pakai ------------------
const r1 = await playRun(pa, stages(), { wait: false });
check('run terlalu cepat = flagged', r1.finish.data.status === 'flagged' && r1.finish.data.rank === null);
check('skor dihitung server (bukan dari HP)', r1.finish.data.score.total > 0 && r1.finish.data.runsLeft === 1);
const again = await call('POST', `/api/runs/${r1.start.data.runId}/finish`, { body: { token: r1.start.data.token, stages: stages() } });
check('finish kedua kali = 409', again.status === 409);

// ---- run valid ------------------------------------------------------------
const r2 = await playRun(pa, stages());
check('run wajar = valid + ada peringkat', r2.finish.data.status === 'valid' && typeof r2.finish.data.rank === 'number');
const q3 = await call('POST', '/api/runs', { body: { phone: pa } });
check('jatah habis = 403 quota_exceeded', q3.status === 403 && q3.data.error === 'quota_exceeded');

// token salah / klien mengirim skor sendiri
const s = await call('POST', '/api/runs', { body: { phone: pb } });
const wrongToken = await call('POST', `/api/runs/${s.data.runId}/finish`, { body: { token: 'x'.repeat(64), stages: stages() } });
check('token salah = 403', wrongToken.status === 403 && wrongToken.data.error === 'invalid_token');
const badShape = await call('POST', `/api/runs/${s.data.runId}/finish`, { body: { token: s.data.token, stages: { ...stages(), quiz: { correctCount: '3', durationMs: 1 } } } });
check('data tahap bentuk salah = 400', badShape.status === 400);
backdate(s.data.runId);
const weaker = stages({ hauling1: { speedingCount: 3, lvViolationCount: 1, radioCorrect: 0, hpLost: 40, durationMs: 48000 }, quiz: { correctCount: 0, durationMs: 15000 } });
const fB = await call('POST', `/api/runs/${s.data.runId}/finish`, { body: { token: s.data.token, stages: weaker, score: 99999, total: 99999 } });
check('skor palsu dari klien diabaikan', fB.data.status === 'valid' && fB.data.score.total < r2.finish.data.score.total);

// ---- leaderboard ------------------------------------------------------------
const lb = await call('GET', `/api/leaderboard?phone=${pb}`);
const names = lb.data.top.map((e) => e.name);
check('leaderboard memuat A di atas B', names.indexOf(nameA) !== -1 && names.indexOf(nameA) < names.indexOf(nameB), JSON.stringify(names));
check('leaderboard tidak membocorkan no HP', !JSON.stringify(lb.data).includes(pa));
check('posisi pemain sendiri (me)', lb.data.me?.name === nameB && lb.data.me.rank > lb.data.top.find((e) => e.name === nameA).rank - 1);
const tv = await call('GET', '/api/tv');
check('data TV ada', Array.isArray(tv.data.top) && tv.data.playersToday >= 2 && tv.data.topScore > 0);

// ---- admin ------------------------------------------------------------------
const list = await call('GET', '/api/admin/runs?limit=100', { cookie });
const mine = list.data.runs.filter((r) => r.name === nameA);
check('admin: daftar run, flagged paling atas', list.status === 200 && list.data.runs[0].status === 'flagged' || list.data.runs.every((r) => r.status !== 'flagged'));
check('admin: flag alasan terbaca', mine.some((r) => r.status === 'flagged' && r.flags.includes('total_time_too_short')));
const validRun = mine.find((r) => r.status === 'valid');
const dq = await call('POST', `/api/admin/runs/${validRun.id}/status`, { cookie, body: { status: 'dq' } });
const lb2 = await call('GET', '/api/leaderboard');
check('diskualifikasi: run keluar dari leaderboard', dq.status === 200 && !lb2.data.top.some((e) => e.name === nameA));
await call('POST', `/api/admin/runs/${validRun.id}/status`, { cookie, body: { status: 'valid' } });
check('dikembalikan valid: muncul lagi', (await call('GET', '/api/leaderboard')).data.top.some((e) => e.name === nameA));
check('admin: cari nama', (await call('GET', `/api/admin/runs?q=${encodeURIComponent(nameB)}`, { cookie })).data.runs.every((r) => r.name === nameB));
check('admin: cari dengan karakter % tidak error', (await call('GET', '/api/admin/runs?q=%25_%5C', { cookie })).status === 200);
const stats = await call('GET', '/api/admin/stats', { cookie });
check('admin: statistik', stats.data.players >= 2 && Array.isArray(stats.data.violations));
const csv = await call('GET', '/api/admin/export?type=players', { cookie });
const csvBytes = new Uint8Array(await (await fetch(`${BASE}/api/admin/export?type=players`, { headers: { cookie } })).arrayBuffer());
check('export CSV pemain (BOM UTF-8 + header)', csv.status === 200 && csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf && String(csv.data).startsWith('no_hp,nama'));
check('export CSV run', String((await call('GET', '/api/admin/export?type=runs', { cookie })).data).includes('run_id'));

// CSV injection: nama diawali "=" harus dinetralkan
const pe = phone();
await call('POST', '/api/players', { body: { phone: pe, name: '=HYPERLINK("x")', division: 'Umum', avatar, consent: true } });
const csv2 = await call('GET', '/api/admin/export?type=players', { cookie });
check('CSV: nama berawalan = dinetralkan', String(csv2.data).includes(`'=HYPERLINK`) && !/,=HYPERLINK/.test(String(csv2.data)));

// event ditutup
await call('PUT', '/api/admin/config', { cookie, body: { eventOpen: false } });
check('event ditutup = 403 event_closed', (await call('POST', '/api/runs', { body: { phone: pe } })).data.error === 'event_closed');
await call('PUT', '/api/admin/config', { cookie, body: { eventOpen: true } });
check('config tidak valid ditolak', (await call('PUT', '/api/admin/config', { cookie, body: { maxRunsPerPlayer: 0 } })).status === 400);

// CSRF: origin asing ditolak
check('origin asing ditolak (CSRF)', (await call('POST', '/api/admin/logout', { cookie, headers: { origin: 'http://evil.example' } })).status === 403);

// reset dua langkah
const step1 = await call('POST', '/api/admin/reset-leaderboard', { cookie, body: {} });
check('reset langkah 1 memberi token, belum eksekusi', step1.data.done === false && !!step1.data.confirmToken && (await call('GET', '/api/leaderboard')).data.top.length > 0);
check('reset dengan token palsu ditolak', (await call('POST', '/api/admin/reset-leaderboard', { cookie, body: { confirmToken: '1.abc' } })).status === 400);
const step2 = await call('POST', '/api/admin/reset-leaderboard', { cookie, body: { confirmToken: step1.data.confirmToken } });
check('reset langkah 2 mengosongkan leaderboard', step2.data.done === true && (await call('GET', '/api/leaderboard')).data.top.length === 0);

check('logout menghapus cookie', /Max-Age=0/.test((await call('POST', '/api/admin/logout', { cookie })).res.headers.get('set-cookie') ?? ''));

console.log(failures ? `\n${failures} GAGAL` : '\nSemua lolos');
process.exit(failures ? 1 : 0);
