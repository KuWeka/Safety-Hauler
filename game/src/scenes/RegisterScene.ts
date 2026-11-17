import Phaser from 'phaser';
import type { RegisterPlayerResponse } from '@shared/api';
import type { Player } from '@shared/types';
import { normalizeDivision, normalizeName, normalizePhone } from '@shared/validation';
import { DIVISION_OTHER, DIVISIONS, REGISTER_TEXT as T } from '../data/register';
import { errorMessage, NET_TEXT } from '../data/net';
import { api, ApiFailure } from '../systems/api';
import { nextStep } from '../systems/flow';
import { clearPlayer, loadPlayer, savePlayer } from '../systems/storage';
import { createButton } from '../ui/Button';
import { showLeaderboard } from '../ui/LeaderboardPanel';
import { label } from '../ui/text';

// Form pakai elemen HTML (DOM) di atas canvas: input teks + keyboard HP jauh lebih wajar daripada digambar di canvas.
const FORM_CSS = `
.reg{width:620px;font-family:sans-serif;color:#fff}
.reg label{display:block;font-size:30px;font-weight:bold;margin:22px 0 8px}
.reg input[type=text],.reg input[type=tel],.reg select{box-sizing:border-box;width:100%;height:96px;font-size:36px;
  padding:0 20px;border:4px solid #1b1f24;border-radius:16px;background:#fff;color:#111}
.reg .other{margin-top:14px;display:none}
.reg .consent{display:flex;gap:18px;align-items:center;font-size:28px;font-weight:normal;margin-top:28px}
.reg .consent input{width:52px;height:52px;flex:none}
.reg .err{min-height:40px;color:#ff8a7a;font-size:28px;font-weight:bold;margin-top:18px}
.reg button{width:100%;height:112px;margin-top:10px;font-size:46px;font-weight:bold;border:6px solid #1b1f24;
  border-radius:16px;background:#f2b705;color:#1b1f24}
.reg button:disabled{opacity:.6}
`;

const formHtml = (): string => `
<style>${FORM_CSS}</style>
<form class="reg" novalidate autocomplete="on">
  <label for="reg-name">${T.name}</label>
  <input id="reg-name" name="name" type="text" maxlength="30" placeholder="${T.namePlaceholder}" autocomplete="nickname">
  <label for="reg-div">${T.division}</label>
  <select id="reg-div" name="division">
    <option value="">${T.divisionPick}</option>
    ${[...DIVISIONS, DIVISION_OTHER].map((d) => `<option>${d}</option>`).join('')}
  </select>
  <input class="other" name="other" type="text" maxlength="40" placeholder="${T.otherPlaceholder}">
  <label for="reg-phone">${T.phone}</label>
  <input id="reg-phone" name="phone" type="tel" inputmode="tel" maxlength="18" placeholder="${T.phonePlaceholder}" autocomplete="tel">
  <label class="consent"><input name="consent" type="checkbox">${T.consent}</label>
  <div class="err" role="alert"></div>
  <button type="submit">${T.submit}</button>
</form>`;

/** Kode error server yang ditampilkan ke pemain; sisanya pesan umum. */
const messageFor = (e: unknown): string => errorMessage(e instanceof ApiFailure ? e.code : 'server_error');

export class RegisterScene extends Phaser.Scene {
  constructor() {
    super('Register');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x2b3138).setOrigin(0);
    label(this, width / 2, 90, T.title, 54, '#f2b705', true);
    label(this, width / 2, 160, T.subtitle, 30, '#9aa4ae');

    const saved = loadPlayer();
    if (saved) this.showWelcomeBack(saved);
    else this.showForm();
  }

  /** Daftar/ambil pemain di server lalu cek event dan jatah main. Server yang memutuskan, bukan HP. */
  private async checkIn(local: Player, input: { name: string; division: string }): Promise<RegisterPlayerResponse> {
    const res = await api.register({ phone: local.phone, name: input.name, division: input.division, avatar: local.avatar, consent: true });
    // Pakai data server (nama/divisi pertama kali daftar); avatar pilihan di HP ini tetap dipakai.
    savePlayer({ ...res.player, avatar: local.avatar });
    return res;
  }

  private proceed(res: RegisterPlayerResponse): void {
    if (!res.eventOpen) return this.showBlocked(NET_TEXT.eventClosed, false);
    if (res.runsLeft <= 0) return this.showBlocked(NET_TEXT.blockedQuota, true);
    nextStep(this);
  }

  private showWelcomeBack(player: Player): void {
    const { width, height } = this.scale;
    const objs: Phaser.GameObjects.GameObject[] = [
      label(this, width / 2, height * 0.38, T.welcomeBack(player.name), 52, '#ffffff', true),
      label(this, width / 2, height * 0.44, player.division, 34, '#9aa4ae'),
    ];
    const status = label(this, width / 2, height * 0.52, '', 30, '#ff8a7a', true, 600);
    let busy = false;
    const go = createButton(this, width / 2, height * 0.64, T.continue, () => {
      if (busy) return;
      busy = true;
      status.setText(NET_TEXT.checking).setColor('#9aa4ae');
      this.checkIn(player, { name: player.name, division: player.division }).then(
        (res) => this.proceed(res),
        (e: unknown) => {
          busy = false;
          status.setText(messageFor(e)).setColor('#ff8a7a');
        },
      );
    });
    const change = createButton(this, width / 2, height * 0.76, T.change, () => {
      clearPlayer();
      [...objs, status, go, change].forEach((o) => o.destroy());
      this.showForm();
    });
  }

  private showBlocked(message: string, canViewLeaderboard: boolean): void {
    const { width, height } = this.scale;
    this.children.removeAll(true);
    this.add.rectangle(0, 0, width, height, 0x2b3138).setOrigin(0);
    label(this, width / 2, height * 0.33, message, 40, '#ffffff', true, 600);
    if (canViewLeaderboard) {
      createButton(this, width / 2, height * 0.52, NET_TEXT.viewLeaderboard, () => showLeaderboard(this, loadPlayer()?.phone));
    }
    createButton(this, width / 2, height * 0.66, T.change, () => {
      clearPlayer();
      this.scene.restart();
    });
  }

  private showForm(): void {
    const dom = this.add.dom(this.scale.width / 2, 700).createFromHTML(formHtml());
    const form = dom.node.querySelector('form')!;
    const select = form.querySelector('select')!;
    const other = form.querySelector<HTMLInputElement>('.other')!;
    const err = form.querySelector<HTMLDivElement>('.err')!;
    const submit = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    select.addEventListener('change', () => {
      other.style.display = select.value === DIVISION_OTHER ? 'block' : 'none';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submit.disabled) return;
      const data = new FormData(form);
      const name = normalizeName(String(data.get('name') ?? ''));
      const picked = String(data.get('division') ?? '');
      const division = normalizeDivision(picked === DIVISION_OTHER ? String(data.get('other') ?? '') : picked);
      const phone = normalizePhone(String(data.get('phone') ?? ''));
      const error = !name ? T.errName : !division ? T.errDivision : !phone ? T.errPhone : !data.get('consent') ? T.errConsent : '';
      err.textContent = error;
      if (error || !name || !division || !phone) return;

      submit.disabled = true;
      err.style.color = '#9aa4ae';
      err.textContent = NET_TEXT.registering;
      const prev = loadPlayer();
      const local: Player = {
        phone,
        name,
        division,
        avatar: prev?.phone === phone ? prev.avatar : { gender: 'male', hair: 0, skin: 0 },
        consent: true,
        createdAt: Date.now(),
        playCount: 0,
      };
      this.checkIn(local, { name, division }).then(
        (res) => {
          (document.activeElement as HTMLElement | null)?.blur(); // tutup keyboard HP
          this.proceed(res);
        },
        (e2: unknown) => {
          submit.disabled = false;
          err.style.color = '';
          err.textContent = messageFor(e2);
        },
      );
    });
  }
}
