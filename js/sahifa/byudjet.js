// Byudjet: kategoriyalar bo'yicha oylik limitlar — sur'at bilan.

import { ol, yoz } from '../api.js';
import { foiz, oyNomi, qisqa } from '../fmt.js';
import { kategoriyaForma } from '../formalar.js';
import { btn, el, jadval, karta, kpi, pill, sarlavha, summaInp, toast, zolak } from '../ui.js';
import { joriyOy, oyTanlagich } from '../umumiy.js';

export async function chiz(view, ctx) {
  const oy = joriyOy();
  const d = await ol('byudjet', { oy });
  const sur = d.kunSoni / d.oyKunlari;   // oyning qancha qismi o'tdi
  const tools = sarlavha(view, { eyebrow: 'Pul', title: 'Byudjet', sub: `Har kategoriyaga oylik limit. Chiziqcha — bugungi kunga to'g'ri keladigan qism (${foiz(Math.round(sur * 100))}).` });
  const kirishlar = new Map();
  const saqla = btn('Saqlash', 'btn-pri', async () => {
    const qatorlar = [...kirishlar.entries()].filter(([, i]) => i.dataset.oz === '1').map(([id, i]) => ({ id, limit: i.son() }));
    if (!qatorlar.length) return toast('O\'zgarish yo\'q');
    saqla.disabled = true;
    try { await yoz('limitlar', { qatorlar }); toast(`${qatorlar.length} ta limit saqlandi`); ctx.yangila(); } catch (e) { toast(e.message, false); saqla.disabled = false; }
  });
  saqla.disabled = true;
  tools.append(oyTanlagich(oy, () => ctx.yangila()), el('span', 'sp'),
    btn('O\'rtacha asosida taklif', null, () => {
      for (const q of d.qatorlar) {
        const i = kirishlar.get(q.id);
        if (!i || !q.ortacha || q.turi === 'tizim') continue;
        const taklif = Math.ceil((q.ortacha * 1.05) / 50_000) * 50_000;
        i.value = String(taklif); i.dispatchEvent(new Event('blur')); i.dataset.oz = '1';
      }
      saqla.disabled = false;
      toast('Oxirgi 3 oy o\'rtachasi + 5% — tekshirib, «Saqlash»ni bosing');
    }),
    btn('+ Kategoriya', null, () => kategoriyaForma(ctx)), saqla);

  const limitli = d.qatorlar.filter((q) => q.limit);
  const oshgan = limitli.filter((q) => q.joriy > q.limit);
  const stats = el('div', 'stats');
  stats.append(
    kpi({ nom: `${oyNomi(d.oy, false)} chiqimi`, qiymat: qisqa(d.jami), birlik: 'so\'m' }),
    kpi({ nom: 'Limitlar jami', qiymat: d.limitJami ? qisqa(d.limitJami) : '—', birlik: d.limitJami ? 'so\'m' : '',
      zolak: d.limitJami ? (limitli.reduce((s, q) => s + q.joriy, 0) / d.limitJami) * 100 : null, belgi: sur * 100,
      izoh: d.limitJami ? `limitli kategoriyalarda ${qisqa(limitli.reduce((s, q) => s + q.joriy, 0))} ishlatildi` : 'Limit qo\'yilmagan' }),
    kpi({ nom: 'Limitdan oshgan', qiymat: String(oshgan.length), ton: oshgan.length ? 'red' : null, izoh: oshgan.map((q) => q.nomi).join(', ') || 'yo\'q' }),
    kpi({ nom: 'Oyning o\'tgan qismi', qiymat: foiz(Math.round(sur * 100)), zolak: sur * 100, zolakCls: 'gray', izoh: `${d.kunSoni} / ${d.oyKunlari} kun` }),
  );
  view.append(stats);

  const c = karta('Kategoriyalar', el('span', 's', 'limit — so\'mda, bo\'sh qoldirsa limit yo\'q'));
  c.append(jadval([
    { nom: 'Kategoriya', f: (q) => el('b', null, `${q.belgi} ${q.nomi}`) },
    { nom: 'Shu oy', num: true, f: (q) => el('span', q.limit && q.joriy > q.limit ? 'red' : null, q.joriy ? qisqa(q.joriy) : '—') },
    { nom: 'Limit', num: true, f: (q) => {
      if (q.turi === 'tizim') return el('span', 'faint small', 'qoldiq farqi');
      const i = summaInp(q.limit ?? '', { class: 'inp-sm', placeholder: '—', 'aria-label': `${q.nomi} limiti` });
      i.addEventListener('input', () => { i.dataset.oz = '1'; saqla.disabled = false; });
      i.addEventListener('click', (e) => e.stopPropagation());
      kirishlar.set(q.id, i);
      return i;
    } },
    { nom: 'Holat', f: (q) => {
      if (!q.limit) return el('span', 'faint small', '—');
      const ulush = q.joriy / q.limit;
      const kutilgan = q.limit * sur;
      const holat = q.joriy > q.limit ? pill('oshdi', 'red') : q.joriy > kutilgan * 1.1 && d.joriy ? pill('tez ketyapti', 'orange') : pill('me\'yorda');
      return el('div', 'row', el('div', null, zolak(ulush * 100, q.joriy > q.limit ? 'red' : q.joriy > kutilgan * 1.1 && d.joriy ? 'orange' : '', d.joriy ? sur * 100 : null)), holat);
    } },
    { nom: 'O\'tgan oy', num: true, f: (q) => el('span', 'muted', q.otgan ? qisqa(q.otgan) : '—') },
    { nom: 'O\'rtacha 3 oy', num: true, f: (q) => el('span', 'muted', q.ortacha ? qisqa(q.ortacha) : '—') },
  ], d.qatorlar.filter((q) => q.joriy || q.limit || q.ortacha || q.otgan || q.turi === 'chiqim'), {
    bos: (q) => kategoriyaForma(ctx, q),
    futer: ['Jami', qisqa(d.jami), d.limitJami ? qisqa(d.limitJami) : '', '', qisqa(d.qatorlar.reduce((s, q) => s + q.otgan, 0)), qisqa(d.qatorlar.reduce((s, q) => s + q.ortacha, 0))],
  }));
  c.querySelectorAll('td .bar').forEach((b) => { b.style.width = '120px'; });
  view.append(c);
  view.append(el('p', 'faint small', 'Qatorni bosing — nomi, belgisi va botdagi kalit so\'zlarini tahrirlash.'));
}
