// Qarzlar: kim kimga qancha qarzdor, tarix, tez yozish.

import { ol } from '../api.js';
import { kunlarFarqi, bugun, pul, qisqa, sana } from '../fmt.js';
import { shaxsForma, yozuvForma } from '../formalar.js';
import { bosh, btn, drawer, el, jadval, karta, kpi, sarlavha, torTo } from '../ui.js';

const TURI = { qarz_berdim: 'Qarz berdim', qarz_oldim: 'Qarz oldim', qarz_qaytardim: 'Qarzimni qaytardim', qarz_qaytdi: 'Menga qaytardi' };

function tarixOyna(ctx, s) {
  const tana = el('div');
  const qoldiq = s.qoldiqlar.length ? s.qoldiqlar.map((q) => `${q.qoldiq > 0 ? 'sizga qarzdor' : 'siz qarzdorsiz'}: ${pul(Math.abs(q.qoldiq), q.valyuta)}`).join(' · ') : 'qarz yo\'q';
  tana.append(el('p', 'muted', qoldiq), s.izoh ? el('p', 'note', s.izoh) : null,
    el('div', 'row', btn('Menga qaytardi', 'btn-sm', () => yozuvForma(ctx, { preset: { turi: 'qarz_qaytdi', shaxs_id: s.id } })),
      btn('Qarz berdim', 'btn-sm', () => yozuvForma(ctx, { preset: { turi: 'qarz_berdim', shaxs_id: s.id } })),
      btn('Qarzimni qaytardim', 'btn-sm', () => yozuvForma(ctx, { preset: { turi: 'qarz_qaytardim', shaxs_id: s.id } })),
      btn('Qarz oldim', 'btn-sm', () => yozuvForma(ctx, { preset: { turi: 'qarz_oldim', shaxs_id: s.id } }))),
    el('div', 'sect', 'Tarix'),
    s.tarix.length ? jadval([{ nom: 'Sana', f: (y) => el('span', 'muted', sana(y.sana)) }, { nom: 'Amal', f: (y) => TURI[y.turi] },
      { nom: 'Summa', num: true, f: (y) => pul(y.summa, y.valyuta) }], s.tarix, { cls: 'tbl-sm' }) : bosh('Tarix yo\'q', ''));
  drawer({ sarlavha: s.ism, tana, qoshimcha: [btn('Tahrirlash', 'btn-ghost', () => shaxsForma(ctx, s))] });
}

export async function chiz(view, ctx) {
  const d = await ol('qarzlar');
  const tools = sarlavha(view, { eyebrow: 'Majburiyatlar', title: 'Qarzlar', sub: 'Oldi-berdi: kim sizga, siz kimga qancha qarzdorsiz. Ismni bosing — tarix va tez yozish.' });
  tools.append(el('span', 'sp'), btn('+ Odam', null, () => shaxsForma(ctx)), btn('+ Qarz yozish', 'btn-pri', () => yozuvForma(ctx, { preset: { turi: 'qarz_berdim' } })));

  const stats = el('div', 'stats k3');
  stats.append(
    kpi({ nom: 'Sizga qarzdor', qiymat: qisqa(d.menga), birlik: 'so\'m', izoh: `${d.shaxslar.filter((s) => s.som > 0).length} kishi` }),
    kpi({ nom: 'Siz qarzdorsiz', qiymat: qisqa(d.mendan), birlik: 'so\'m', ton: d.mendan > 0 ? 'red' : null, izoh: `${d.shaxslar.filter((s) => s.som < 0).length} ta` }),
    kpi({ nom: 'Sof', qiymat: `${d.menga - d.mendan >= 0 ? '+' : '−'}${qisqa(Math.abs(d.menga - d.mendan))}`, birlik: 'so\'m', ton: d.menga - d.mendan < 0 ? 'red' : null, izoh: 'olishingiz − berishingiz' }),
  );
  view.append(stats);

  const g = torTo(view);
  for (const [nomi, filtr] of [['Sizga qarzdor', (s) => s.som > 0], ['Siz qarzdorsiz', (s) => s.som < 0]]) {
    const roy = d.shaxslar.filter(filtr);
    const c = karta(nomi, el('span', 's', `${roy.length} ta`));
    if (!roy.length) c.append(bosh('Yo\'q', ''));
    for (const s of roy) {
      const oxirgi = s.tarix[0];
      const kun = oxirgi ? kunlarFarqi(s.tarix[s.tarix.length - 1].sana, bugun()) : null;
      const b = el('button', 'rw', el('span', 'ic', s.ism[0]), el('div', 'tx', el('div', 't', s.ism),
        el('div', 's', oxirgi ? `oxirgi: ${TURI[oxirgi.turi].toLowerCase()} · ${sana(oxirgi.sana)}${kun && kun >= 30 && s.som > 0 ? ` · ${kun} kundan beri` : ''}` : s.izoh ?? '')),
      el('div', 'r', ...s.qoldiqlar.map((q) => el('b', s.som < 0 ? 'red' : null, pul(Math.abs(q.qoldiq), q.valyuta))), el('span', null, s.qoldiqlar.length > 1 ? `≈ ${qisqa(Math.abs(s.som))} so'm` : '')));
      b.type = 'button';
      b.addEventListener('click', () => tarixOyna(ctx, s));
      c.append(b);
    }
    const u = el('div', 'c6 ust'); u.append(c); g.append(u);
  }
  // Qarzi yo'q, lekin tarixi bor odamlar (yozuvi umuman yo'qlar — faqat formadagi ro'yxatda).
  const yopilgan = d.shaxslar.filter((s) => s.som === 0 && s.tarix.length);
  if (yopilgan.length) {
    view.append(el('div', 'sect', 'Qarzi yo\'q'));
    const c = karta(null);
    for (const s of yopilgan) {
      const b = el('button', 'rw', el('span', 'ic', s.ism[0]), el('div', 'tx', el('div', 't', s.ism), el('div', 's', s.izoh ?? (s.tarix.length ? `${s.tarix.length} ta yozuv` : 'yozuv yo\'q'))), el('span', 'faint', '›'));
      b.type = 'button';
      b.addEventListener('click', () => tarixOyna(ctx, s));
      c.append(b);
    }
    view.append(c);
  }
}
