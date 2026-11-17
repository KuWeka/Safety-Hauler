import type { AdminRunRow, AdminStatsResponse } from '../../../shared/api';
import type { GameConfig, RunStatus } from '../../../shared/types';
import { adminApi, type RunQuery } from '../api';
import { fmtDate, fmtNum, fmtSec, h } from '../dom';
import { FLAG_LABEL, STATUS_LABEL, VIOLATION_LABEL } from '../labels';

const PAGE_SIZE = 25;
const REFRESH_MS = 10_000;

const TX = {
  statPlayers: 'Pemain',
  statRuns: 'Run selesai',
  statFlagged: 'Perlu ditinjau',
  statAvg: 'Rata-rata skor',
  violations: 'Pelanggaran safety paling sering',
  noViolations: 'Belum ada data.',
  config: 'Pengaturan event',
  eventOpen: 'Event dibuka',
  maxRuns: 'Jatah main per pemain',
  ranked: 'Skor yang masuk leaderboard',
  rankedBest: 'Skor terbaik',
  rankedFirst: 'Percobaan pertama',
  save: 'Simpan',
  saved: 'Tersimpan.',
  saveFailed: 'Gagal menyimpan.',
  tools: 'Data & leaderboard',
  exportPlayers: 'Export pemain (CSV)',
  exportRuns: 'Export semua run (CSV)',
  reset: 'Reset leaderboard',
  resetConfirm: 'Yakin? Leaderboard dikosongkan. Data run dan pemain tetap tersimpan dan bisa di-export.',
  resetYes: 'Ya, reset sekarang',
  cancel: 'Batal',
  resetDone: 'Leaderboard sudah di-reset.',
  runs: 'Pemain & run',
  search: 'Cari nama / no HP / divisi',
  allDivisions: 'Semua divisi',
  allStatus: 'Semua status',
  sortNewest: 'Terbaru',
  sortScore: 'Skor tertinggi',
  sortTime: 'Waktu tercepat',
  empty: 'Tidak ada data.',
  prev: 'Sebelumnya',
  next: 'Berikutnya',
  page: (from: number, to: number, total: number) => `${from}–${to} dari ${total}`,
  colTime: 'Selesai',
  colName: 'Nama',
  colDivision: 'Divisi',
  colPhone: 'No HP',
  colScore: 'Skor',
  colDuration: 'Waktu main',
  colStatus: 'Status',
  colNote: 'Catatan',
  colAction: 'Aksi',
  dq: 'Diskualifikasi',
  approve: 'Setujui (valid)',
  restore: 'Pulihkan (valid)',
  confirmDq: (name: string) => `Diskualifikasi run milik ${name}? Skornya keluar dari leaderboard.`,
};

const card = (title: string, ...children: (Node | null)[]): HTMLElement => h('section', { class: 'card' }, h('h2', {}, title), ...children);

/** Mode Kelola: statistik, pengaturan, reset leaderboard, export, dan tabel run. Return fungsi pembersih. */
export function manageView(root: HTMLElement, onAuthLost: () => void): () => void {
  const query: RunQuery = { q: '', division: '', status: '', sort: 'newest', limit: PAGE_SIZE, offset: 0 };
  let timer = 0;
  let searchDebounce = 0;
  let disposed = false;

  const statsBox = h('div', { class: 'stats' });
  const violationsBox = h('div', { class: 'bars' });
  const configBox = h('div');
  const toolsMsg = h('p', { class: 'note' });
  const resetBox = h('div', { class: 'row' });
  const tableBox = h('div', { class: 'table-wrap' });
  const pager = h('div', { class: 'row pager' });
  const divisionSelect = h('select', {}, h('option', { value: '' }, TX.allDivisions));

  const guard = (err: unknown): void => {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) onAuthLost();
  };

  // ---- statistik ----
  const renderStats = (s: AdminStatsResponse): void => {
    const stat = (label: string, value: string): HTMLElement => h('div', { class: 'stat' }, h('b', {}, value), h('span', {}, label));
    statsBox.replaceChildren(stat(TX.statPlayers, fmtNum(s.players)), stat(TX.statRuns, fmtNum(s.finishedRuns)), stat(TX.statFlagged, fmtNum(s.flaggedRuns)), stat(TX.statAvg, fmtNum(s.averageScore)));
    const max = Math.max(1, ...s.violations.map((v) => v.count));
    violationsBox.replaceChildren(
      ...(s.violations.length
        ? s.violations.map((v) =>
            h('div', { class: 'bar' }, h('span', {}, VIOLATION_LABEL[v.type] ?? v.type), h('i', { style: `width:${Math.round((v.count / max) * 100)}%` }), h('b', {}, v.count)),
          )
        : [h('p', { class: 'note' }, TX.noViolations)]),
    );
    const known = new Set([...divisionSelect.options].map((o) => o.value));
    for (const d of s.divisions) if (!known.has(d)) divisionSelect.append(h('option', { value: d }, d));
  };

  // ---- pengaturan ----
  const renderConfig = (cfg: GameConfig): void => {
    const open = h('input', { type: 'checkbox', checked: cfg.eventOpen });
    const max = h('input', { type: 'number', min: 1, max: 100, value: cfg.maxRunsPerPlayer });
    const ranked = h('select', {}, h('option', { value: 'best' }, TX.rankedBest), h('option', { value: 'first' }, TX.rankedFirst));
    ranked.value = cfg.rankedRun;
    const msg = h('span', { class: 'note' });
    const save = h('button', { class: 'primary' }, TX.save);
    save.addEventListener('click', () => {
      msg.textContent = '';
      adminApi.saveConfig({ eventOpen: open.checked, maxRunsPerPlayer: Number(max.value), rankedRun: ranked.value as GameConfig['rankedRun'] }).then(
        (c) => {
          renderConfig(c);
          msg.textContent = TX.saved;
          void loadRuns();
        },
        (e: unknown) => {
          guard(e);
          msg.textContent = TX.saveFailed;
        },
      );
    });
    configBox.replaceChildren(
      h('label', { class: 'check' }, open, TX.eventOpen),
      h('label', {}, TX.maxRuns, max),
      h('label', {}, TX.ranked, ranked),
      h('div', { class: 'row' }, save, msg),
    );
  };

  // ---- reset dua langkah + export ----
  const showResetButton = (): void => {
    resetBox.replaceChildren(
      h('button', { class: 'danger', onclick: startReset }, TX.reset),
      h('a', { class: 'button', href: '/api/admin/export?type=players', download: '' }, TX.exportPlayers),
      h('a', { class: 'button', href: '/api/admin/export?type=runs', download: '' }, TX.exportRuns),
    );
  };
  const startReset = (): void => {
    adminApi.reset().then(
      ({ confirmToken }) => {
        resetBox.replaceChildren(
          h('p', { class: 'warn' }, TX.resetConfirm),
          h(
            'button',
            {
              class: 'danger',
              onclick: () =>
                adminApi.reset(confirmToken).then(
                  () => {
                    toolsMsg.textContent = TX.resetDone;
                    showResetButton();
                  },
                  (e: unknown) => {
                    guard(e);
                    showResetButton();
                  },
                ),
            },
            TX.resetYes,
          ),
          h('button', { onclick: showResetButton }, TX.cancel),
        );
      },
      guard,
    );
  };

  // ---- tabel run ----
  const setStatus = (run: AdminRunRow, status: Exclude<RunStatus, 'in_progress'>): void => {
    if (status === 'dq' && !window.confirm(TX.confirmDq(run.name))) return;
    adminApi.setStatus(run.id, status).then(() => void loadRuns(), guard);
  };

  const renderRuns = (runs: AdminRunRow[], total: number): void => {
    const head = [TX.colTime, TX.colName, TX.colDivision, TX.colPhone, TX.colScore, TX.colDuration, TX.colStatus, TX.colNote, TX.colAction];
    const rows = runs.map((r) => {
      const note = [...r.flags.map((f) => FLAG_LABEL[f] ?? f), ...r.violations.map((v) => `${VIOLATION_LABEL[v.type] ?? v.type} ×${v.count}`)];
      const actions: HTMLElement[] = [];
      if (r.status === 'flagged') actions.push(h('button', { onclick: () => setStatus(r, 'valid') }, TX.approve));
      if (r.status === 'dq') actions.push(h('button', { onclick: () => setStatus(r, 'valid') }, TX.restore));
      if (r.status !== 'dq') actions.push(h('button', { class: 'danger small', onclick: () => setStatus(r, 'dq') }, TX.dq));
      return h(
        'tr',
        { class: `status-${r.status}` },
        h('td', {}, fmtDate(r.finishedAt)),
        h('td', {}, r.name),
        h('td', {}, r.division),
        h('td', { class: 'mono' }, r.phone),
        h('td', { class: 'num' }, fmtNum(r.total)),
        h('td', { class: 'num' }, fmtSec(r.totalTimeMs)),
        h('td', {}, h('span', { class: `badge ${r.status}` }, STATUS_LABEL[r.status])),
        h('td', { class: 'notes' }, note.join(' · ')),
        h('td', { class: 'actions' }, ...actions),
      );
    });
    tableBox.replaceChildren(
      runs.length
        ? h('table', {}, h('thead', {}, h('tr', {}, ...head.map((c) => h('th', {}, c)))), h('tbody', {}, ...rows))
        : h('p', { class: 'note' }, TX.empty),
    );
    const from = total === 0 ? 0 : query.offset + 1;
    const to = Math.min(total, query.offset + runs.length);
    pager.replaceChildren(
      h('button', { disabled: query.offset === 0, onclick: () => ((query.offset = Math.max(0, query.offset - PAGE_SIZE)), void loadRuns()) }, TX.prev),
      h('span', { class: 'note' }, TX.page(from, to, total)),
      h('button', { disabled: to >= total, onclick: () => ((query.offset += PAGE_SIZE), void loadRuns()) }, TX.next),
    );
  };

  const loadRuns = async (): Promise<void> => {
    try {
      const data = await adminApi.runs(query);
      if (!disposed) renderRuns(data.runs, data.total);
    } catch (e) {
      guard(e);
    }
  };
  const loadAll = async (): Promise<void> => {
    await Promise.all([
      adminApi.stats().then((s) => !disposed && renderStats(s), guard),
      loadRuns(),
    ]);
  };

  // ---- filter ----
  const filter = (apply: () => void): void => {
    apply();
    query.offset = 0;
    void loadRuns();
  };
  const searchInput = h('input', { type: 'search', placeholder: TX.search });
  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => filter(() => (query.q = searchInput.value.trim())), 300);
  });
  divisionSelect.addEventListener('change', () => filter(() => (query.division = divisionSelect.value)));
  const statusSelect = h(
    'select',
    {},
    h('option', { value: '' }, TX.allStatus),
    h('option', { value: 'flagged' }, STATUS_LABEL.flagged),
    h('option', { value: 'valid' }, STATUS_LABEL.valid),
    h('option', { value: 'dq' }, STATUS_LABEL.dq),
  );
  statusSelect.addEventListener('change', () => filter(() => (query.status = statusSelect.value as RunQuery['status'])));
  const sortSelect = h('select', {}, h('option', { value: 'newest' }, TX.sortNewest), h('option', { value: 'score' }, TX.sortScore), h('option', { value: 'time' }, TX.sortTime));
  sortSelect.addEventListener('change', () => filter(() => (query.sort = sortSelect.value as RunQuery['sort'])));

  showResetButton();
  root.replaceChildren(
    h(
      'main',
      { class: 'manage' },
      statsBox,
      h('div', { class: 'grid2' }, card(TX.config, configBox), card(TX.tools, resetBox, toolsMsg)),
      card(TX.violations, violationsBox),
      card(TX.runs, h('div', { class: 'row filters' }, searchInput, divisionSelect, statusSelect, sortSelect), tableBox, pager),
    ),
  );

  adminApi.config().then((c) => !disposed && renderConfig(c), guard);
  void loadAll();
  timer = window.setInterval(() => void loadAll(), REFRESH_MS);
  return () => {
    disposed = true;
    window.clearInterval(timer);
    window.clearTimeout(searchDebounce);
  };
}

