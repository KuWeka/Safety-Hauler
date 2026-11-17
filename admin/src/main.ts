import './style.css';
import { adminApi, AdminApiError } from './api';
import { h } from './dom';
import { T } from './labels';
import { loginView } from './views/login';
import { manageView } from './views/manage';
import { tvView } from './views/tv';

const app = document.getElementById('app')!;
let dispose: (() => void) | null = null;

function nav(active: 'tv' | 'manage'): HTMLElement {
  return h(
    'nav',
    { class: 'nav' },
    h('strong', {}, `${T.appName} · Admin`),
    h('a', { href: '#/tv', class: active === 'tv' ? 'active' : '' }, T.navTv),
    h('a', { href: '#/manage', class: active === 'manage' ? 'active' : '' }, T.navManage),
    h('span', { class: 'spacer' }),
    h('button', { onclick: () => void adminApi.logout().finally(route) }, T.logout),
  );
}

async function route(): Promise<void> {
  dispose?.();
  dispose = null;

  try {
    await adminApi.me();
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 401) return loginView(app, () => void route());
    app.replaceChildren(h('main', { class: 'center' }, h('div', { class: 'card' }, h('p', {}, T.serverError), h('button', { onclick: () => void route() }, 'Coba lagi'))));
    return;
  }

  if (location.hash === '#/tv') {
    dispose = tvView(app);
    return;
  }
  const content = h('div');
  app.replaceChildren(nav('manage'), content);
  dispose = manageView(content, () => void route());
}

window.addEventListener('hashchange', () => void route());
void route();
