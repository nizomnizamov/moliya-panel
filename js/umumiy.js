// Sahifalarda takrorlanadigan qismlar: oy tanlagich, yozuv tavsifi, summa katagi.

import { bugun, oyNomi, oyQosh, pul, sana } from './fmt.js';
import { el } from './ui.js';

const OY = 'moliya-oy';
export function joriyOy() {
  try { const v = sessionStorage.getItem(OY); if (v && v <= bugun().slice(0, 7)) return v; } catch { /* */ }
  return bugun().slice(0, 7);
}
export function oyTanla(v) { try { sessionStorage.setItem(OY, v); } catch { /* */ } }

/** ‹ Oktabr 2026 › — kelajak oyga o'tmaydi. */
export function oyTanlagich(oy, ozgardi) {
  const p = el('div', 'pager');
  const ol = el('button', null, '‹'), ke = el('button', null, '›');
  ol.type = ke.type = 'button';
  ol.title = 'Oldingi oy'; ke.title = 'Keyingi oy';
  ke.disabled = oy >= bugun().slice(0, 7);
  ol.addEventListener('click', () => { const v = oyQosh(oy, -1); oyTanla(v); ozgardi(v); });
  ke.addEventListener('click', () => { const v = oyQosh(oy, 1); oyTanla(v); ozgardi(v); });
  p.append(ol, el('span', null, oyNomi(oy)), ke);
  return p;
}

const KIRIM = new Set(['kirim', 'qarz_oldim', 'qarz_qaytdi']);
const QARZ_NOMI = { qarz_berdim: 'Qarz berdim', qarz_oldim: 'Qarz oldim', qarz_qaytardim: 'Qarzimni qaytardim', qarz_qaytdi: 'Qarzni qaytardi' };

/** Jadvaldagi "Nima" ustuni: belgi + nom + izoh. */
export function yozuvTavsif(y) {
  let bel = y.belgi || '•', nom = y.kategoriya || (y.turi === 'kirim' ? 'Kirim' : 'Chiqim');
  if (y.turi === 'otkazma') { bel = '🔁'; nom = `${y.hisob} → ${y.ga_hisob}`; }
  else if (y.turi?.startsWith('qarz')) { bel = '🤝'; nom = `${QARZ_NOMI[y.turi]} · ${y.shaxs ?? ''}`; }
  else if (y.loyiha) nom = `${y.loyiha} · ${nom}`;
  return el('div', 'tavsif', el('span', 'bel', bel), el('div', null, el('b', null, nom), y.izoh ? el('small', null, y.izoh) : null));
}

export function summaKatak(y) {
  // Pul harakatisiz yozilgan qarz (boshlang'ich) — kirim ham, chiqim ham emas.
  if (y.turi?.startsWith('qarz') && !y.hisob_id) return el('span', 'neytral', pul(y.summa, y.valyuta));
  const plus = KIRIM.has(y.turi);
  const t = y.turi === 'otkazma' ? pul(y.summa, y.valyuta) : `${plus ? '+' : '−'}${pul(y.summa, y.valyuta)}`;
  return el('span', plus ? 'plus' : null, t);
}

export function sanaKatak(y) {
  return el('span', 'muted', `${sana(y.sana)}${y.sana?.length > 10 ? ' · ' + y.sana.slice(11, 16) : ''}`);
}

export const MANBA = { matn: 'Bot · matn', ovoz: 'Bot · ovoz', rasm: 'Bot · skrinshot', doimiy: 'Doimiy to\'lov', qoldiq: 'Qoldiq farqi', boshlangich: 'Boshlang\'ich', panel: 'Dashboard' };
