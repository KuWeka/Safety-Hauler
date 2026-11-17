// Pembuat elemen DOM kecil. Semua teks lewat textContent: nama pemain diisi bebas, jangan pernah innerHTML.
type Child = Node | string | number | null | false | undefined;
type Props = Record<string, string | number | boolean | EventListener | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = String(v);
    else if (k === 'value') (el as unknown as HTMLInputElement).value = String(v);
    else if (k === 'checked') (el as unknown as HTMLInputElement).checked = v === true;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

export function append(el: Element, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === false || c === undefined) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const clear = (el: Element): void => el.replaceChildren();

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Makassar', // WITA, zona waktu event
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
export const fmtDate = (ms: number | null): string => (ms ? dateFmt.format(ms) : '-');
export const fmtNum = (n: number | null | undefined): string => (n === null || n === undefined ? '-' : n.toLocaleString('id-ID'));
export const fmtSec = (ms: number | null): string => (ms === null ? '-' : `${(ms / 1000).toFixed(1)} dtk`);
