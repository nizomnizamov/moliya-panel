// API bilan aloqa: seans tokeni, so'rovlar, xatolar.

const meta = document.querySelector('meta[name="api"]');
export const API = (meta && meta.content) || 'https://rrinmhowgjxqftbwzpus.supabase.co/functions/v1/api';
const KALIT = 'moliya-sessiya';

export class KirishKerak extends Error {}

export function sessiya() {
  try {
    const s = JSON.parse(localStorage.getItem(KALIT) || 'null');
    if (s && s.token && s.exp > Date.now()) return s.token;
  } catch { /* brauzer xotirasi yopiq bo'lishi mumkin */ }
  return null;
}

export function chiqish() {
  try { localStorage.removeItem(KALIT); } catch { /* */ }
}

// Funksiya bazaga yaqin mintaqada ishlasin (baza — Singapur). Aks holda har so'rov qit'alararo boradi: 5–8 s o'rniga ~1 s.
const MINTAQA = 'forceFunctionRegion=ap-southeast-1';

async function sorov(yol, opt = {}) {
  const token = sessiya();
  const r = await fetch(`${API}/${yol}${yol.includes('?') ? '&' : '?'}${API.includes('localhost') ? '' : MINTAQA}`, {
    ...opt,
    headers: { ...(opt.body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
  }).catch(() => { throw new Error('Internet yoki server bilan aloqa yo\'q'); });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && yol !== 'kirish') { chiqish(); throw new KirishKerak(j.xato || 'Kirish kerak'); }
  if (!r.ok) throw new Error(j.xato || `Server javobi: ${r.status}`);
  return j;
}

export function ol(yol, params) {
  const q = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString() : '';
  return sorov(yol + q);
}

export function yoz(yol, body) {
  return sorov(yol, { method: 'POST', body: JSON.stringify(body ?? {}) });
}

export async function kirish(kod) {
  const j = await sorov('kirish', { method: 'POST', body: JSON.stringify({ kod }) });
  try { localStorage.setItem(KALIT, JSON.stringify({ token: j.sessiya, exp: Date.now() + j.muddat * 1000 - 60_000 })); } catch { /* */ }
  return j;
}
