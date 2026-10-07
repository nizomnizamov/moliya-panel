// Formatlash: so'm, dollar, sana (o'zbekcha). Hamma raqam bir xil ko'rinishda chiqsin.

export const OYLAR = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const OYLAR_Q = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];
export const HAFTA = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export function guruh(n, kasr = 0) {
  const [b, k] = Math.abs(n).toFixed(kasr).split('.');
  return (n < 0 ? '−' : '') + b.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (k && Number(k) ? ',' + k.replace(/0+$/, '') : '');
}
export const som = (n) => `${guruh(Math.round(n))} so'm`;

/** 1,25 mln · 850 ming · 4 500 */
export function qisqa(n) {
  const a = Math.abs(n), s = n < 0 ? '−' : '';
  if (a >= 1e9) return s + String(+(a / 1e9).toFixed(2)).replace('.', ',') + ' mlrd';
  if (a >= 1e6) return s + String(+(a / 1e6).toFixed(a >= 1e8 ? 0 : a >= 1e7 ? 1 : 2)).replace('.', ',') + ' mln';
  if (a >= 1e4) return s + Math.round(a / 1e3) + ' ming';
  return guruh(n);
}
/** O'q belgisi: 12m · 500k */
export function oq(n) {
  const a = Math.abs(n);
  if (a >= 1e6) return String(+(n / 1e6).toFixed(1)).replace('.', ',') + 'm';
  if (a >= 1e3) return String(+(n / 1e3).toFixed(0)) + 'k';
  return String(Math.round(n));
}
export function dollar(n, kasr) {
  const k = kasr ?? (Math.abs(n) < 100 && Math.round(n) !== n ? 2 : 0);
  return (n < 0 ? '−$' : '$') + guruh(Math.abs(n), k);
}
export function pul(n, v) {
  if (v === 'UZS') return som(n);
  if (v === 'USDT') return `${guruh(n, Math.abs(n) < 100 ? 2 : 0)} USDT`;
  return dollar(n);
}
export const qisqaPul = (n, v) => (v === 'UZS' ? `${qisqa(n)} so'm` : pul(n, v));
export const foiz = (n, kasr = 0) => `${String(+Number(n).toFixed(kasr)).replace('.', ',')}%`;
export const ishorali = (n, f = qisqa) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n))}`;

/** "2026-10-07" → "7-oktabr"; yil boshqa bo'lsa — yil bilan. */
export function sana(s, yil = false) {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  const bu = new Date().getFullYear();
  return `${d}-${OYLAR[m - 1]}${yil || y !== bu ? ` ${y}` : ''}`;
}
export function sanaVaqt(s) {
  return s && s.length > 10 ? `${sana(s)}, ${s.slice(11, 16)}` : sana(s);
}
export function oyNomi(ym, yil = true) {
  const [y, m] = ym.split('-').map(Number);
  const n = OYLAR[m - 1];
  return n[0].toUpperCase() + n.slice(1) + (yil ? ` ${y}` : '');
}
export const oyQisqa = (ym) => OYLAR_Q[Number(ym.slice(5, 7)) - 1];
export const sanaQisqa = (s) => `${Number(s.slice(8, 10))}-${OYLAR_Q[Number(s.slice(5, 7)) - 1]}`;

/** Toshkent bo'yicha bugun: "YYYY-MM-DD". */
export function bugun() {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}
export function oyQosh(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}
export function kunlarFarqi(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** O'zgarish yorlig'i. yaxshiYuqori=false — o'sish yomon (xarajat). */
export function ozgarish(joriy, oldin, yaxshiYuqori = true) {
  if (!oldin) return null;
  const f = Math.round((joriy / oldin - 1) * 100);
  if (!Number.isFinite(f)) return null;
  const yaxshi = f === 0 ? null : (f > 0) === yaxshiYuqori;
  return { t: `${f > 0 ? '↑' : f < 0 ? '↓' : ''}${Math.abs(f)}%`, cls: yaxshi == null ? '' : yaxshi ? 'up' : 'down', f };
}
