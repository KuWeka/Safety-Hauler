import qrcode from 'qrcode-generator';
import type { LeaderboardEntry, TvResponse } from '../../../shared/api';
import { adminApi } from '../api';
import { h, fmtNum } from '../dom';
import { T } from '../labels';

const POLL_MS = 3000;

/** QR ke halaman game, digambar ke canvas dari modul QR (tanpa innerHTML). */
function qrCanvas(url: string): HTMLCanvasElement {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const cell = 8;
  const margin = 4; // zona tenang 4 modul supaya terbaca scanner
  const size = (count + margin * 2) * cell;
  const canvas = h('canvas', { width: size, height: size, class: 'qr' });
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
  }
  return canvas;
}

const entryKey = (e: LeaderboardEntry): string => `${e.name}|${e.division}|${e.total}`;

/** Nada pendek lewat WebAudio (tanpa file audio). Browser baru mengizinkan suara setelah ada klik. */
function chime(ctx: AudioContext): void {
  [880, 1175, 1568].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    const t = ctx.currentTime + i * 0.13;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/** Mode TV: leaderboard layar penuh, update otomatis tiap 3 detik. Return fungsi pembersih. */
export function tvView(root: HTMLElement): () => void {
  const list = h('ol', { class: 'tv-list' });
  const ticker = h('div', { class: 'tv-ticker' });
  const status = h('span', { class: 'tv-status' });
  let audio: AudioContext | null = null;
  let previous: Set<string> | null = null;
  let timer = 0;

  const soundBtn = h('button', { class: 'ghost' }, T.tvSoundOff);
  soundBtn.addEventListener('click', () => {
    if (audio) {
      void audio.close();
      audio = null;
      soundBtn.textContent = T.tvSoundOff;
      return;
    }
    audio = new AudioContext();
    chime(audio); // klik ini sekaligus izin autoplay dan tes suara
    soundBtn.textContent = T.tvSoundOn;
  });
  const fsBtn = h('button', { class: 'ghost' }, T.tvFullscreen);
  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  });

  root.replaceChildren(
    h(
      'main',
      { class: 'tv' },
      h('div', { class: 'tv-controls' }, status, soundBtn, fsBtn, h('a', { href: '#/manage', class: 'ghost' }, T.navManage)),
      h('header', {}, h('h1', {}, T.appName), h('h2', {}, T.tvTitle)),
      h('div', { class: 'tv-body' }, list, h('aside', { class: 'tv-qr' }, qrCanvas(`${location.origin}/`), h('p', {}, T.tvScan))),
      ticker,
    ),
  );

  const render = (data: TvResponse): void => {
    const keys = new Set(data.top.map(entryKey));
    const fresh = previous ? data.top.filter((e) => !previous!.has(entryKey(e))) : [];
    previous = keys;
    if (fresh.length && audio) chime(audio);

    list.replaceChildren(
      ...(data.top.length === 0
        ? [h('li', { class: 'tv-empty' }, T.tvEmpty)]
        : data.top.map((e) =>
            h(
              'li',
              { class: `tv-row rank-${Math.min(e.rank, 4)}${fresh.includes(e) ? ' flash' : ''}` },
              h('span', { class: 'rank' }, e.rank),
              h('span', { class: 'who' }, h('strong', {}, e.name), h('small', {}, e.division)),
              h('span', { class: 'score' }, fmtNum(e.total)),
            ),
          )),
    );
    const items = [
      h('span', {}, `${T.tvPlayersToday}: `, h('b', {}, fmtNum(data.playersToday))),
      h('span', {}, `${T.tvTopScore}: `, h('b', {}, fmtNum(data.topScore))),
    ];
    if (data.last) items.push(h('span', {}, `${T.tvLast}: `, h('b', {}, `${data.last.name} – ${fmtNum(data.last.total)}`)));
    ticker.replaceChildren(...items);
  };

  const poll = (): void => {
    adminApi.tv().then(
      (data) => {
        status.textContent = '';
        render(data);
      },
      () => {
        status.textContent = T.tvOffline;
      },
    );
  };
  poll();
  timer = window.setInterval(poll, POLL_MS);

  return () => {
    window.clearInterval(timer);
    void audio?.close();
    if (document.fullscreenElement) void document.exitFullscreen();
  };
}
