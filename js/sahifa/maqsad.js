// Maqsad va mulk: uy uchun yig'ish sur'ati, prognoz; mol-mulk ro'yxati.

import { ol } from '../api.js';
import { chiziq, legenda } from '../chart.js';
import { dollar, foiz, oyNomi, oyQisqa, pul, sana } from '../fmt.js';
import { maqsadForma, mulkForma, yozuvForma } from '../formalar.js';
import { bosh, btn, el, faktlar, jadval, karta, sarlavha, svg, torTo } from '../ui.js';

function halqa(foizi, yomon) {
  const r = 52, c = 2 * Math.PI * r;
  const s = svg('svg', { viewBox: '0 0 128 128', width: 128, height: 128, role: 'img', 'aria-label': `${foizi}%` });
  s.append(svg('circle', { cx: 64, cy: 64, r, fill: 'none', class: 'halqa-bg' }));
  s.append(svg('circle', { cx: 64, cy: 64, r, fill: 'none', class: `halqa-fg${yomon ? ' yomon' : ''}`,
    'stroke-dasharray': `${((c * Math.max(0, Math.min(100, foizi))) / 100).toFixed(1)} ${c.toFixed(1)}`, transform: 'rotate(-90 64 64)' }));
  s.append(svg('text', { x: 64, y: 70, 'text-anchor': 'middle', class: 'halqa-t' }, `${foizi}%`));
  return s;
}

export async function chiz(view, ctx) {
  const d = await ol('maqsad');
  const tools = sarlavha(view, { eyebrow: 'Kapital', title: 'Maqsad va mulk', sub: 'Uy uchun yig\'ish sur\'ati, muddatga yetish prognozi va mol-mulk.' });
  const asosiy = d.maqsadlar.find((m) => m.faol);
  tools.append(el('span', 'sp'),
    asosiy?.hisob_id ? btn('Jamg\'armaga qo\'shish', 'btn-pri', () => yozuvForma(ctx, { preset: { turi: 'kirim', hisob_id: asosiy.hisob_id, kategoriya_id: ctx.katalog.kategoriyalar.find((c) => c.nomi === 'Boshqa kirim')?.id, izoh: 'jamg\'arma' } })) : null,
    btn('+ Maqsad', null, () => maqsadForma(ctx)));

  for (const m of d.maqsadlar.filter((x) => x.faol)) {
    const h = m.holat, val = (n) => (m.valyuta === 'UZS' ? pul(n, 'UZS') : dollar(Math.round(n)));
    const surat = m.oyigaJamgarildi;
    const yetadi = surat && surat > 0 ? Math.ceil(h.qolgan / surat) : null;
    const yomon = h.oylar > 0 && surat != null && surat < h.oyiga * 0.9;
    const g = torTo(view);
    {
      const c = karta(m.nomi, btn('Tahrirlash', 'btn-sm btn-ghost', () => maqsadForma(ctx, m)));
      c.append(el('div', 'cb row', halqa(h.foiz, yomon), el('div', null,
        el('div', 'faint small', 'Yig\'ilgan'), el('div', 'hero-v', val(h.yigilgan)), el('div', 'muted small', `maqsad ${val(h.maqsad)}`))));
      c.append(faktlar([
        ['Qolgan', val(h.qolgan)],
        ['Muddat', m.muddat ? `${sana(m.muddat, true)} · ${String(h.oylar).replace('.', ',')} oy qoldi` : 'belgilanmagan'],
        h.oylar > 0 ? ['Oyiga kerak', val(h.oyiga), yomon ? 'red' : null] : null,
        ['Hozirgi sur\'at', surat != null ? `${val(surat)} / oy` : 'tarix 1 oydan kam'],
        yetadi != null ? ['Shu sur\'atda yetadi', `${yetadi} oyda`, h.oylar && yetadi > h.oylar ? 'red' : 'green'] : null,
        ['Pul turgan joy', m.hisob ?? '—'],
      ]));
      if (m.izoh) c.append(el('div', 'cb', el('p', 'note', m.izoh)));
      const u = el('div', 'c4 ust'); u.append(c); g.append(u);
    }
    {
      const joy = el('div', 'chart');
      const c = karta('Yig\'ilgan summa dinamikasi', el('span', 's', m.valyuta === 'UZS' ? 'so\'mda' : 'dollarda'));
      c.append(el('div', 'cb', legenda([['Yig\'ilgan', 'sw-s1'], ['Maqsad', 'sw-ref']]), joy));
      if (m.tarix.filter((x) => x != null).length < 2) c.lastChild.replaceChildren(bosh('Tarix kam', 'Kamida ikki oy yig\'ilgach grafik chiqadi.'));
      else chiziq(joy, { nom: 'Maqsad dinamikasi', h: 240, yorliqlar: d.oylar.map(oyQisqa), sarlavhalar: d.oylar.map((o) => oyNomi(o)),
        seriyalar: [{ nom: 'Yig\'ilgan', cls: 'c-s1', qiymatlar: m.tarix, maydon: true }], fmt: val, nol: true,
        ref: { qiymat: h.maqsad, nom: `maqsad ${val(h.maqsad)}` } });
      if (h.oylar > 0) c.append(el('div', 'cb', el('div', `note${yomon ? ' red' : ''}`,
        yomon ? `Muddatga yetish uchun oyiga ${val(h.oyiga)} kerak, hozir ~${val(surat)}. Farq: ${val(h.oyiga - surat)} har oy.`
          : surat != null ? `Sur'at yetarli: oyiga ~${val(surat)} (kerak ${val(h.oyiga)}).` : `Oyiga ${val(h.oyiga)} kerak — ${foiz(h.foiz)} yig'ildi.`)));
      const u = el('div', 'c8 ust'); u.append(c); g.append(u);
    }
  }
  if (!d.maqsadlar.length) { const c = karta('Maqsad'); c.append(bosh('Maqsad yo\'q', '«+ Maqsad» bilan qo\'shing.')); view.append(c); }

  view.append(el('div', 'sect', 'Mol-mulk'));
  const c = karta(null, btn('+ Mulk', 'btn-sm btn-ghost', () => mulkForma(ctx)));
  c.append(d.mulklar.length ? jadval([
    { nom: 'Nomi', f: (x) => el('b', null, x.nomi) },
    { nom: 'Izoh', f: (x) => el('span', 'muted', x.izoh ?? '') },
    { nom: 'Qiymati', num: true, f: (x) => pul(x.qiymat, x.valyuta) },
  ], d.mulklar, { bos: (x) => mulkForma(ctx, x), qatorCls: (x) => (x.faol ? '' : 'bekor') }) : bosh('Mulk yo\'q', ''));
  view.append(c);
}
