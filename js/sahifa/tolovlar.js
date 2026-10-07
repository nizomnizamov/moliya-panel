// To'lovlar: doimiy to'lovlar va bo'lib to'lashlar — holat, tarix, to'lash.

import { ol, yoz } from '../api.js';
import { pul, qisqa, sana } from '../fmt.js';
import { doimiyForma, tolaForma } from '../formalar.js';
import { bosh, btn, el, jadval, karta, kpi, pill, sarlavha, toast } from '../ui.js';

const HOLAT = {
  tolandi: ['to\'landi', 'green'], otgan: ['muddati o\'tdi', 'red'], bugun: ['bugun', 'orange'], kutilmoqda: ['kutilmoqda', ''],
  sanasiz: ['sanasi yo\'q', ''], tugagan: ['tugagan', ''], nofaol: ['o\'chirilgan', ''],
};

export async function chiz(view, ctx) {
  const d = await ol('tolovlar');
  const k = ctx.katalog;
  const kurs = k.kurs;
  const tools = sarlavha(view, { eyebrow: 'Majburiyatlar', title: 'To\'lovlar', sub: 'Har oy takrorlanadigan va bo\'lib to\'lanadigan to\'lovlar. Muddati kelganda bot kechki xabarda eslatadi.' });
  tools.append(el('span', 'sp'), btn('+ To\'lov', 'btn-pri', () => doimiyForma(ctx)));

  const faol = d.tolovlar.filter((t) => t.faol && t.holat !== 'tugagan');
  const som = (t) => (t.valyuta === 'UZS' ? t.summa : t.summa * kurs);
  const oylik = faol.filter((t) => t.kun).reduce((s, t) => s + som(t), 0);
  const tolandi = faol.filter((t) => t.holat === 'tolandi');
  const qolgan = faol.filter((t) => ['kutilmoqda', 'bugun', 'otgan'].includes(t.holat));
  const otgan = faol.filter((t) => t.holat === 'otgan');
  const stats = el('div', 'stats');
  stats.append(
    kpi({ nom: 'Oylik majburiyat', qiymat: qisqa(oylik), birlik: 'so\'m', izoh: `${faol.filter((t) => t.kun).length} ta har oylik to'lov (shaxsiy + loyiha)` }),
    kpi({ nom: 'Shu oy to\'landi', qiymat: String(tolandi.length), izoh: tolandi.map((t) => t.nomi).join(', ') || '—' }),
    kpi({ nom: 'Kutilmoqda', qiymat: qisqa(qolgan.reduce((s, t) => s + som(t), 0)), birlik: 'so\'m', izoh: `${qolgan.length} ta to'lov` }),
    kpi({ nom: 'Muddati o\'tgan', qiymat: String(otgan.length), ton: otgan.length ? 'red' : null, izoh: otgan.map((t) => t.nomi).join(', ') || 'yo\'q' }),
  );
  view.append(stats);

  const amallar = (t) => {
    if (!['kutilmoqda', 'bugun', 'otgan'].includes(t.holat)) return el('span');
    const w = el('div', 'row amal');
    w.append(btn('To\'landi', 'btn-sm', (e) => { e.stopPropagation(); tolaForma(ctx, t); }),
      btn('⏭', 'btn-sm btn-ghost', async (e) => {
        e.stopPropagation();
        await yoz('doimiy/otkaz', { id: t.id, davr: t.davr });
        toast(`${t.nomi}: bu oy uchun belgilandi (pul yozilmadi)`); ctx.yangila();
      }));
    w.lastChild.title = 'Avval to\'langan / bu oy kerak emas — pul yozmasdan belgilash';
    return w;
  };
  const c = karta('Doimiy to\'lovlar');
  c.append(d.tolovlar.length ? jadval([
    { nom: 'To\'lov', f: (t) => el('div', 'tavsif', el('span', 'bel', t.turi === 'qarz_qaytardim' ? '🤝' : t.loyiha ? '🕌' : '⏰'),
      el('div', null, el('b', null, t.nomi), el('small', null, [t.kategoriya, t.shaxs && `qarz: ${t.shaxs}`, t.loyiha].filter(Boolean).join(' · ') || ' '))) },
    { nom: 'Summa', num: true, f: (t) => el('b', null, pul(t.summa, t.valyuta)) },
    { nom: 'Jadval', f: (t) => el('span', 'muted', t.kun ? `har oy ${t.kun}-sanada` : t.sana ? `bir marta, ${sana(t.sana)}` : '—') },
    { nom: 'Hisob', f: (t) => el('span', 'muted', t.hisob ?? 'har safar tanlanadi') },
    { nom: 'Keyingi muddat', f: (t) => el('span', t.holat === 'otgan' ? 'red' : null, t.muddat ? `${sana(t.muddat)}${t.farq != null && t.farq >= 0 && t.holat !== 'tolandi' ? ` · ${t.farq === 0 ? 'bugun' : `${t.farq} kunda`}` : ''}` : '—') },
    { nom: 'Holat', f: (t) => pill(...HOLAT[t.holat]) },
    { nom: 'Qolgan', num: true, f: (t) => el('span', 'muted', t.qolgan != null ? `${t.qolgan} ta` : '∞') },
    { nom: '', f: amallar },
  ], d.tolovlar, { bos: (t) => doimiyForma(ctx, t), qatorCls: (t) => (!t.faol ? 'bekor' : '') }) : bosh('To\'lov yo\'q', '«+ To\'lov» bilan qo\'shing.'));
  view.append(c);

  const tarix = d.tolovlar.flatMap((t) => t.tarix.map((x) => ({ ...x, nomi: t.nomi }))).sort((a, b) => b.sana.localeCompare(a.sana)).slice(0, 15);
  if (tarix.length) {
    view.append(el('div', 'sect', 'Oxirgi to\'lovlar'));
    const c2 = karta(null);
    c2.append(jadval([{ nom: 'Sana', f: (x) => el('span', 'muted', sana(x.sana)) }, { nom: 'To\'lov', f: (x) => el('b', null, x.nomi) },
      { nom: 'Hisob', f: (x) => el('span', 'muted', x.hisob ?? '—') }, { nom: 'Summa', num: true, f: (x) => pul(x.summa, x.valyuta) }], tarix, { cls: 'tbl-sm' }));
    view.append(c2);
  }
}
