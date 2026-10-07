// API bilan aloqa: seans tokeni, so'rovlar, xatolar.

const meta = document.querySelector('meta[name="api"]');
export const API = (meta && meta.content) || 'https://rrinmhowgjxqftbwzpus.supabase.co/functions/v1/api';
const KALIT = 'moliya-sessiya';
export const KATALOG = 'moliya-katalog';   // oxirgi katalog — keyingi ochilishda darhol chizish uchun

export class KirishKerak extends Error {}

export function sessiya() {
  try {
    const s = JSON.parse(localStorage.getItem(KALIT) || 'null');
    if (s && s.token && s.exp > Date.now()) return s.token;
  } catch { /* brauzer xotirasi yopiq bo'lishi mumkin */ }
  return null;
}

export function chiqish() {
  try { localStorage.removeItem(KALIT); localStorage.removeItem(KATALOG); } catch { /* */ }
}

// Funksiya bazaga yaqin mintaqada ishlasin (baza — Singapur). Aks holda har so'rov qit'alararo boradi: 5–8 s o'rniga ~1 s.
const MINTAQA = API.includes('localhost') ? '' : '?forceFunctionRegion=ap-southeast-1';

/**
 * Hamma so'rov — "oddiy" POST (text/plain, sarlavhasiz): brauzer CORS oldindan so'rovini yubormaydi.
 * Token tanada ketadi (manzilda emas — loglarga tushmaydi).
 * O'qish (amal 'ol') aloqa yoki server xatosida bir marta qayta urinadi; yozish — yo'q (ikki marta yozilmasin).
 */
async function sorov(yol, amal, p, qayta = amal === 'ol') {
  const r = await fetch(`${API}/${yol}${MINTAQA}`, {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ t: sessiya(), amal, p }),
  }).catch(() => null);
  if ((!r || r.status >= 500) && qayta) {
    await new Promise((ok) => setTimeout(ok, 800));
    return sorov(yol, amal, p, false);
  }
  if (!r) throw new Error('Internet yoki server bilan aloqa yo\'q');
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && yol !== 'kirish') { chiqish(); throw new KirishKerak(j.xato || 'Kirish kerak'); }
  if (!r.ok) throw new Error(j.xato || `Server javobi: ${r.status}`);
  return j;
}

// ─── Kesh: qaytib kelganda sahifa darhol chiqadi, ma'lumot fonda yangilanadi ───
const kesh = new Map();          // kalit → { vaqt, j }
const YANGI = 20_000, ESKI = 15 * 60_000;
export const hodisa = { yangilandi: null };   // fonda yangi ma'lumot kelsa — sahifani qayta chizish

const kalit = (yol, p) => yol + '?' + new URLSearchParams(Object.entries(p ?? {}).filter(([, v]) => v != null && v !== '').map(([a, b]) => [a, String(b)])).toString();

export async function ol(yol, p) {
  const k = kalit(yol, p);
  const x = kesh.get(k);
  if (x && Date.now() - x.vaqt < ESKI) {
    if (Date.now() - x.vaqt > YANGI && !x.yuklanmoqda) {
      x.yuklanmoqda = true;
      sorov(yol, 'ol', p).then((j) => {
        const ozgardi = JSON.stringify(j) !== JSON.stringify(x.j);
        kesh.set(k, { vaqt: Date.now(), j });
        if (ozgardi) hodisa.yangilandi?.(k);
      }).catch(() => { x.yuklanmoqda = false; });
    }
    return x.j;
  }
  const j = await sorov(yol, 'ol', p);
  kesh.set(k, { vaqt: Date.now(), j });
  return j;
}

/** Fonda oldindan yuklash (sahifalar orasida yurish darhol bo'lsin). Xatolar e'tiborsiz. */
export async function oldindan(royxat) {
  for (const [yol, p] of royxat) {
    if (kesh.has(kalit(yol, p))) continue;
    try { kesh.set(kalit(yol, p), { vaqt: Date.now(), j: await sorov(yol, 'ol', p) }); } catch { return; }
  }
}

export async function yoz(yol, body) {
  const j = await sorov(yol, 'yoz', body ?? {});
  kesh.clear();   // ma'lumot o'zgardi — keshdagi hamma narsa eskirdi
  return j;
}

export async function kirish(kod) {
  const j = await sorov('kirish', 'kirish', { kod });
  try { localStorage.setItem(KALIT, JSON.stringify({ token: j.sessiya, exp: Date.now() + j.muddat * 1000 - 60_000 })); } catch { /* */ }
  // Kirish javobida katalog ham bor — birinchi sahifa uni qayta so'ramaydi.
  if (j.katalog) {
    kesh.set(kalit('katalog'), { vaqt: Date.now(), j: j.katalog });
    try { localStorage.setItem(KATALOG, JSON.stringify(j.katalog)); } catch { /* */ }
  }
  return j;
}
