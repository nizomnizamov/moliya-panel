// O'zgarishlar tarixi: barcha summa o'zgarishlari (bot, dashboard, tizim) — kim, qachon, nega; eski qiymatga qaytarish.

import { ol } from '../api.js';
import { guruh, sanaVaqt } from '../fmt.js';
import { MANBA_NOMI, JADVAL, ozgarishEl, qaytarBtn, qaytarsaBoladi } from '../tarix.js';
import { bosh, el, jadval, karta, pill, sarlavha, seg, tanlov } from '../ui.js';

const f = { jadval: '', kun: 30, sahifa: 1 };
export const sorov = () => ({ jadval: f.jadval, kun: f.kun, sahifa: f.sahifa, hajm: 50 });

export async function chiz(view, ctx) {
  const d = await ol('tarix', sorov());
  const tools = sarlavha(view, { eyebrow: 'Tizim', title: 'O\'zgarishlar tarixi',
    sub: 'Har bir summa o\'zgarishi alohida saqlanadi: eski va yangi qiymat, qayerdan (dashboard yoki bot) va sababi. Xato bo\'lsa — eski qiymatga qaytaring.' });
  const tur = tanlov(Object.entries(JADVAL).map(([qiymat, nom]) => ({ qiymat, nom })), f.jadval, 'Hammasi');
  tur.setAttribute('aria-label', 'Nima o\'zgargan');
  tur.addEventListener('change', () => { f.jadval = tur.value; f.sahifa = 1; ctx.yangila(); });
  tools.append(seg([[7, '7 kun'], [30, '30 kun'], [365, '1 yil'], [3650, 'Hammasi']], f.kun, (v) => { f.kun = v; f.sahifa = 1; ctx.yangila(); }),
    el('span', 'sp'), tur);

  const c = karta(`${guruh(d.jami)} ta o'zgarish`);
  if (!d.qatorlar.length) c.append(bosh('O\'zgarish yo\'q', 'Biror summa (yozuv, to\'lov, limit, maqsad…) o\'zgartirilsa, shu yerda ko\'rinadi.'));
  else {
    c.append(jadval([
      { nom: 'Vaqt', f: (t) => el('span', 'muted', sanaVaqt(t.vaqt)) },
      { nom: 'Nima', f: (t) => el('div', 'tavsif', el('div', null, el('b', null, t.nomi ?? '—'), el('small', null, `${JADVAL[t.jadval] ?? t.jadval}${t.maydon === 'ga_summa' ? ' · tushgan summa' : ''}`))) },
      { nom: 'O\'zgarish', f: ozgarishEl },
      { nom: 'Manba', f: (t) => pill(MANBA_NOMI[t.manba] ?? t.manba, t.manba === 'panel' ? 'blue' : '') },
      { nom: 'Sabab', f: (t) => el('span', 'muted small', t.sabab ?? '') },
      { nom: '', f: (t) => (qaytarsaBoladi(t) ? qaytarBtn(t, () => ctx.yangila()) : el('span')) },
    ], d.qatorlar));
  }
  const sahifalar = Math.max(1, Math.ceil(d.jami / d.hajm));
  if (sahifalar > 1) {
    const p = el('div', 'pager');
    const oldin = el('button', null, '‹'), keyin = el('button', null, '›');
    oldin.type = keyin.type = 'button';
    oldin.disabled = f.sahifa <= 1; keyin.disabled = f.sahifa >= sahifalar;
    oldin.addEventListener('click', () => { f.sahifa--; ctx.yangila(); scrollTo(0, 0); });
    keyin.addEventListener('click', () => { f.sahifa++; ctx.yangila(); scrollTo(0, 0); });
    p.append(oldin, el('span', null, `${f.sahifa} / ${sahifalar}`), keyin);
    c.append(el('div', 'cb row', el('span', 'sp'), p));
  }
  view.append(c);
}
