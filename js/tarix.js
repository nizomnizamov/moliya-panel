// Summa tarixi: qiymatlarni ko'rsatish va tahrirlash oynalariga qo'yiladigan "Summa tarixi" bo'limi.

import { ol, yoz } from './api.js';
import { pul, sanaVaqt } from './fmt.js';
import { el, pill, toast, xavfliBtn } from './ui.js';

export const JADVAL = {
  yozuvlar: 'Yozuv', hisoblar: 'Boshlang\'ich qoldiq', doimiy_tolovlar: 'Doimiy to\'lov', tushum_rejasi: 'Loyiha rejasi',
  maqsadlar: 'Maqsad', mulklar: 'Mulk', kategoriyalar: 'Oylik limit', loyihalar: 'Loyiha shartlari', sozlamalar: 'AI chegarasi',
};
const MAYDON = { ga_summa: 'tushgan summa' };
export const MANBA_NOMI = { panel: 'Dashboard', bot: 'Bot / tizim' };

/** Bitta qiymat: son — pul ko'rinishida; loyiha shartlari — fiks va bonus summalari. */
export function tarixQiymat(t, v) {
  if (v == null) return t.jadval === 'kategoriyalar' ? 'limit yo\'q' : '—';
  if (t.maydon === 'shartlar') {
    const val = t.valyuta || 'USD';
    const fiks = (v.fiks ?? []).map((f) => `${f.kun}-sana ${pul(f.summa, val)}`).join(' + ') || 'yo\'q';
    const bonus = (v.bonus ?? []).map((b) => `${b.dan} dan ${pul(b.summa, val)}`).join(', ') || 'yo\'q';
    return `Fiks: ${fiks}; bonus: ${bonus}`;
  }
  return pul(Number(v), t.valyuta || 'UZS');
}

/** "eski → yangi" va farq (+/−). */
export function ozgarishEl(t) {
  const w = el('span', null, el('span', 'muted', tarixQiymat(t, t.eski)), ' → ', el('b', null, t.yangi == null && t.jadval === 'tushum_rejasi' ? 'o\'chirildi' : tarixQiymat(t, t.yangi)));
  if (t.maydon !== 'shartlar' && t.eski != null && t.yangi != null) {
    const f = Number(t.yangi) - Number(t.eski);
    if (f) w.append(' ', el('span', 'muted small', `(${f > 0 ? '+' : '−'}${pul(Math.abs(f), t.valyuta || 'UZS')})`));
  }
  return w;
}

export const qaytarsaBoladi = (t) => !(t.jadval === 'tushum_rejasi' && t.yangi == null);

/** Qaytarish tugmasi (ikki bosqichli): eski qiymat tiklanadi, bu ham tarixga yoziladi. */
export function qaytarBtn(t, keyin) {
  return xavfliBtn('↩︎ Qaytarish', async () => {
    try {
      await yoz('tarix/qaytar', { id: t.id });
      toast(`Qaytarildi: ${tarixQiymat(t, t.eski)}`);
      keyin?.();
    } catch (e) { toast(e.message, false); }
  }, 'btn-sm btn-ghost');
}

/** Tahrirlash oynasidagi "Summa tarixi" (oxirgi 10 ta). O'zgarish bo'lmasa — hech narsa ko'rinmaydi. */
export function summaTarixi(jadval, qatorId, keyin) {
  const joy = el('div', 'full');
  if (!qatorId) return joy;
  ol('tarix', { jadval, qator_id: qatorId, hajm: 10 }).then((r) => {
    if (!r.qatorlar.length) return;
    joy.append(el('div', 'sect', `Summa tarixi · ${r.jami} ta o'zgarish`), ...r.qatorlar.map((t) => el('div', 'tq',
      el('span', 'muted small', sanaVaqt(t.vaqt)),
      el('span', 'o', ozgarishEl(t), MAYDON[t.maydon] ? el('span', 'muted small', ` · ${MAYDON[t.maydon]}`) : null),
      pill(MANBA_NOMI[t.manba] ?? t.manba, t.manba === 'panel' ? 'blue' : ''),
      t.sabab ? el('span', 's', t.sabab) : null)));
    if (keyin) joy.append(el('p', 'muted small', 'Eski qiymatga qaytarish — «O\'zgarishlar tarixi» sahifasida.'));
  }).catch(() => {});
  return joy;
}
