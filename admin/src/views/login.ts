import { adminApi, AdminApiError } from '../api';
import { h } from '../dom';
import { T } from '../labels';

/** Layar login. `onSuccess` dipanggil setelah cookie sesi diterima. */
export function loginView(root: HTMLElement, onSuccess: () => void): void {
  const error = h('p', { class: 'error', role: 'alert' });
  const input = h('input', { type: 'password', name: 'password', autocomplete: 'current-password', placeholder: T.password, required: true });
  const button = h('button', { type: 'submit', class: 'primary' }, T.login);
  const form = h(
    'form',
    {
      class: 'card login',
      onsubmit: (e: Event) => {
        e.preventDefault();
        button.disabled = true;
        error.textContent = '';
        adminApi.login(input.value).then(
          onSuccess,
          (err: unknown) => {
            button.disabled = false;
            error.textContent =
              err instanceof AdminApiError && err.status === 401 ? T.badLogin : err instanceof AdminApiError && err.status === 429 ? T.rateLimited : T.serverError;
          },
        );
      },
    },
    h('h1', {}, T.appName),
    h('h2', {}, T.loginTitle),
    input,
    error,
    button,
  );
  root.replaceChildren(h('main', { class: 'center' }, form));
  input.focus();
}
