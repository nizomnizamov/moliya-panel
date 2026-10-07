// Bosh sahifa: oy natijasi, pul oqimi, xulosalar, sof boylik, chiqim tarkibi, yaqin to'lovlar.

import { ol, yoz } from '../api.js';
import { almashtirgich, legenda, ustunlar } from '../chart.js';
import { dollar, foiz, guruh, oyNomi, oyQisqa, ozgarish, pul, qisqa, sana } from '../fmt.js';
import { tolaForma, yozuvForma } from '../formalar.js';
import { bosh as boshQ, btn, el, faktlar, jadval, karta, kpi, sarlavha, torTo, toast } from '../ui.js';
import { joriyOy, oyTanlagich, sanaKatak, summaKatak, yozuvTavsif } from '../umumiy.js';

const SAHIFA = { hisoblar: 'hisoblar', byudjet: 'byudjet', tahlil: 'tahlil', maqsad: 'maqsad', loyiha: 'loyiha', tolovlar: 'tolovlar', qarzlar: 'qarzlar', yozuvlar: 'yozuvlar', kripto: 'kripto' };
const BELGI = { qizil: '!', sariq: '!', info: 'i', yashil: '✓' };
const sarlavhali = (o, t) => (o ? { ...o, title: t } : null);

export async function chiz(view, ctx) {
  const oy = joriyOy();
  const d = await ol('bosh', { oy });
  const k = ctx.katalog;

  const tools = sarlavha(view, {
    eyebrow: d.joriy ? `Bugun, ${sana(d.bugun)}` : 'Oy natijasi',
    title: 'Moliyaviy holat',
    sub: d.joriy ? `${oyNomi(d.oy, false)}ning ${d.kunSoni}-kuni · ${d.oyKunlari - d.kunSoni} kun qoldi` : `${oyNomi(d.oy)} — yakunlangan oy`,
  });
  const aiJoy = el('div');
  tools.append(oyTanlagich(oy, () => ctx.yangila()), el('span', 'sp'),
    btn('✨ AI xulosa', null, async (e) => {
      e.currentTarget.disabled = true;
      try {
        const r = await yoz('ai/xulosa', {});
        const c = karta('AI xulosasi', el('span', 's', `$${r.narx.toFixed(4)}`));
        c.append(el('div', 'cb', ...r.matn.split('\n').filter(Boolean).map((q) => el('p', null, q.replace(/^[-•]\s*/, '• ')))));
        aiJoy.replaceChildren(c);
      } catch (err) { toast(err.message, false); } finally { e.currentTarget.disabled = false; }
    }),
    btn('+ Yozuv', 'btn-pri', () => yozuvForma(ctx)));
  view.append(aiJoy);

  // ─── KPI ───
  const oldingi = d.pulOqimi[d.pulOqimi.length - 2];
  // Grafikda ma'lumot boshlangan oydan (kamida 3 oy) — bo'sh oylar ko'rsatilmaydi.
  const birinchi = d.pulOqimi.findIndex((m) => m.daromad || m.chiqim);
  const oq = d.pulOqimi.slice(Math.max(0, Math.min(birinchi < 0 ? d.pulOqimi.length : birinchi, d.pulOqimi.length - 3)));
  const ortdi = d.oyJami.daromad - d.oyJami.chiqim - d.oyJami.qarzTolov;
  const stats = el('div', 'stats');
  stats.append(
    kpi({ nom: `${oyNomi(d.oy, false)} daromadi`, qiymat: qisqa(d.oyJami.daromad), birlik: 'so\'m', spark: oq.slice(-6).map((m) => m.daromad),
      izoh: el('span', null, 'O\'tgan oy: ', el('b', null, `${qisqa(oldingi.daromad)} so'm`)), bos: () => ctx.bor('tahlil') }),
    kpi({ nom: `${oyNomi(d.oy, false)} chiqimi`, qiymat: qisqa(d.oyJami.chiqim), birlik: 'so\'m', spark: oq.slice(-6).map((m) => m.chiqim), yon: -1,
      delta: d.joriy ? sarlavhali(ozgarish(d.oyJami.chiqim, d.oyJami.otganShuKungacha, false), 'O\'tgan oyning shu kunlariga nisbatan') : ozgarish(d.oyJami.chiqim, oldingi.chiqim, false),
      izoh: d.joriy ? el('span', null, 'Oy oxiriga ~', el('b', null, `${qisqa(d.oyJami.prognoz)} so'm`), ` (o'tgan oy ${qisqa(d.oyJami.otganOyJami)})`) : null,
      bos: () => ctx.bor('byudjet') }),
    // Oy boshida daromad hali tushmagan bo'lsa — qizil "minus" ko'rsatmaymiz (bu muammo emas, hali erta).
    d.joriy && d.oyJami.daromad === 0
      ? kpi({ nom: 'Ortib qoldi', qiymat: '—', spark: oq.slice(-6).map((m) => m.ortdi),
        izoh: el('span', null, 'Bu oy daromad hali yozilmagan · chiqim ', el('b', null, `${qisqa(d.oyJami.chiqim)} so'm`)), bos: () => ctx.bor('tahlil') })
      : kpi({ nom: 'Ortib qoldi', qiymat: qisqa(ortdi), birlik: 'so\'m', ton: ortdi < 0 ? 'red' : null, spark: oq.slice(-6).map((m) => m.ortdi),
      izoh: d.oyJami.daromad > 0 ? el('span', null, 'Daromadning ', el('b', null, foiz(Math.round((ortdi / d.oyJami.daromad) * 100))), ' i',
        d.oyJami.qarzTolov ? ` · qarz to'lovi ${qisqa(d.oyJami.qarzTolov)}` : '') : 'Bu oy daromad yozilmagan', bos: () => ctx.bor('tahlil') }),
    d.maqsad
      ? kpi({ nom: d.maqsad.nomi, qiymat: dollar(Math.round(d.maqsad.yigilgan)), birlik: `/ ${dollar(d.maqsad.maqsad)}`,
        zolak: d.maqsad.foiz, belgi: d.maqsad.belgi, belgiNom: 'Vaqt bo\'yicha shu yerda bo\'lishi kerak',
        zolakCls: d.maqsad.belgi != null && d.maqsad.foiz < d.maqsad.belgi - 5 ? 'red' : '',
        izoh: d.maqsad.oylar > 0 ? el('span', null, 'Oyiga ', el('b', null, `~${dollar(Math.round(d.maqsad.oyiga / 50) * 50)}`), ' kerak',
          d.maqsad.oyigaJamgarildi != null ? ` · hozir ~${dollar(Math.round(d.maqsad.oyigaJamgarildi))}` : '') : 'Muddat tugagan', bos: () => ctx.bor('maqsad') })
      : kpi({ nom: 'Maqsad', qiymat: '—', izoh: 'Maqsad qo\'shing', bos: () => ctx.bor('maqsad') }),
  );
  view.append(stats);

  // ─── Pul oqimi + xulosalar ───
  const g1 = torTo(view);
  {
    const joy = el('div', 'chart');
    const { tugma, jadvalJoy } = almashtirgich(joy, () => jadval(
      [{ nom: 'Oy', f: (m) => oyNomi(m.oy) }, { nom: 'Daromad', num: true, f: (m) => guruh(m.daromad) }, { nom: 'Chiqim', num: true, f: (m) => guruh(m.chiqim) },
        { nom: 'Qarz to\'lovi', num: true, f: (m) => guruh(m.qarzTolov) }, { nom: 'Ortib qoldi', num: true, f: (m) => el('span', m.ortdi < 0 ? 'red' : null, guruh(m.ortdi)) }],
      [...oq].reverse(), { cls: 'tbl-sm' }));
    const c = karta(`Pul oqimi — ${oq.length} oy`, el('span', 's', 'so\'mda'), tugma);
    c.append(el('div', 'cb', legenda([['Daromad', 'sw-s1'], ['Chiqim', 'sw-s2']]), joy, jadvalJoy));
    ustunlar(joy, {
      nom: 'Pul oqimi', h: 230, fmt: (v) => `${qisqa(v)} so'm`,
      qatorlar: oq.map((m) => ({ yorliq: oyQisqa(m.oy), sarlavha: oyNomi(m.oy), daromad: m.daromad, chiqim: m.chiqim, oy: m.oy })),
      seriyalar: [{ kalit: 'daromad', nom: 'Daromad', cls: 'c-s1' }, { kalit: 'chiqim', nom: 'Chiqim', cls: 'c-s2' }],
      bos: (q) => { sessionStorage.setItem('moliya-oy', q.oy); ctx.yangila(); },
    });
    const u = el('div', 'c8 ust'); u.append(c); g1.append(u);
  }
  {
    const c = karta('Xulosalar', el('span', 's', d.joriy ? `${d.xulosalar.length} ta` : 'faqat joriy oy uchun'));
    if (!d.xulosalar.length) c.append(boshQ(d.joriy ? 'Hammasi joyida' : 'O\'tgan oy', d.joriy ? 'Hozircha e\'tibor talab qiladigan narsa yo\'q.' : 'Xulosalar joriy holat bo\'yicha chiqadi.'));
    const roy = el('div', 'act');
    for (const x of d.xulosalar.slice(0, 7)) {
      const b = el('button', `ar ${x.daraja}`, el('span', 'n', BELGI[x.daraja]), el('div', 'tx', el('div', 'tt', x.sarlavha), el('div', 'ss', x.matn)), el('span', 'go', '›'));
      b.type = 'button';
      b.addEventListener('click', () => ctx.bor(SAHIFA[x.sahifa] === 'loyiha' ? `loyiha/${k.loyihalar[0]?.id}` : SAHIFA[x.sahifa] ?? 'tahlil'));
      roy.append(b);
    }
    if (d.xulosalar.length > 7) { const b = el('button', 'ar info', el('div', 'tx', el('div', 'ss', `Yana ${d.xulosalar.length - 7} ta — Tahlil sahifasida`))); b.type = 'button'; b.addEventListener('click', () => ctx.bor('tahlil')); roy.append(b); }
    c.append(roy);
    const u = el('div', 'c4 ust'); u.append(c); g1.append(u);
  }

  // ─── Sof boylik + chiqim tarkibi ───
  const g2 = torTo(view);
  {
    const c = el('section', 'card');
    const s = d.sof;
    c.append(el('div', 'hero',
      el('div', 'lbl', 'Sof boylik'),
      el('div', 'val', qisqa(s.jami), el('small', null, 'so\'m')),
      el('div', 'sub2', `${dollar(Math.round(s.jami / d.kurs))} · 1$ = ${guruh(d.kurs)} so'm`)));
    c.append(faktlar([
      ['Pul (hisoblarda)', `${qisqa(s.pul)} so'm`],
      s.loyiha ? ['Loyihadagi ulushim', `${qisqa(s.loyiha)} so'm`] : null,
      ['Mulk', `${qisqa(s.mulk)} so'm`],
      ['Sizga qarzdor', `+${qisqa(s.menga)} so'm`],
      ['Siz qarzdorsiz', `−${qisqa(s.mendan)} so'm`, s.mendan > 0 ? 'red' : null],
    ]));
    if (s.kiritilmagan.length) c.append(el('div', 'cb', el('div', 'note orange', `Qoldig'i kiritilmagan: ${s.kiritilmagan.join(', ')}. `,
      Object.assign(el('a', null, 'Hisoblar →'), { href: '#/hisoblar' }))));
    const u = el('div', 'c4 ust'); u.append(c);
    // Hisoblar qoldig'i — sof boylikning "pul" qismi qayerda turgani.
    const h = karta('Hisoblarda', Object.assign(el('a', 'btn btn-sm btn-ghost', 'Hisoblar'), { href: '#/hisoblar' }));
    h.append(faktlar(k.hisoblar.filter((x) => x.faol && x.turi !== 'loyiha').map((x) =>
      [x.nomi, x.boshlangich_sana ? pul(x.qoldiq, x.valyuta) : 'kiritilmagan', x.boshlangich_sana ? null : 'orange'])));
    u.append(h);
    g2.append(u);
  }
  {
    const c = karta(`Chiqim tarkibi — ${oyNomi(d.oy, false)}`, el('span', 's', `${qisqa(d.oyJami.chiqim)} so'm`),
      Object.assign(el('a', 'btn btn-sm btn-ghost', 'Limitlar'), { href: '#/byudjet' }));
    if (!d.kategoriyalar.length) c.append(boshQ('Chiqim yo\'q', 'Bu oy hali xarajat yozilmagan.'));
    const roy = d.kategoriyalar.slice(0, 9);
    const max = Math.max(...roy.map((x) => Math.max(x.som, x.limit ?? 0)), 1);
    const hb = el('div', 'hb');
    for (const x of roy) {
      const oshdi = x.limit && x.som >= x.limit, yaqin = x.limit && x.som >= x.limit * 0.8;
      const fill = el('div', `fill${oshdi ? ' red' : yaqin ? ' orange' : ''}`);
      fill.style.width = `${(x.som / max) * 100}%`;
      const track = el('div', 'track', fill);
      if (x.limit) { const u = el('u'); u.style.left = `${Math.min(100, (x.limit / max) * 100)}%`; u.title = `Limit: ${qisqa(x.limit)}`; track.append(u); }
      const dl = ozgarish(x.som, x.otgan, false);
      hb.append(el('div', 'hbr',
        el('div', 'l', el('b', null, `${x.belgi} ${x.nomi}`), el('span', `r${oshdi ? ' red' : ''}`, qisqa(x.som), el('small', null, `${foiz(Math.round((x.som / (d.oyJami.chiqim || 1)) * 100))}`))),
        track,
        el('div', 'fx', x.limit ? `limit ${qisqa(x.limit)} · ` : '', x.otgan ? `o'tgan oy shu kungacha ${qisqa(x.otgan)}` : 'o\'tgan oy shu kunlarda yo\'q',
          dl ? el('span', dl.cls === 'down' ? 'red' : dl.cls === 'up' ? 'green' : null, ` · ${dl.t}`) : null)));
    }
    if (d.kategoriyalar.length > roy.length) hb.append(el('div', 'fx', `Yana ${d.kategoriyalar.length - roy.length} ta kategoriya — `, Object.assign(el('a', null, 'Byudjet'), { href: '#/byudjet' })));
    c.append(hb);
    const u = el('div', 'c8 ust'); u.append(c); g2.append(u);
  }

  // ─── Kunlik chiqim + yaqin to'lovlar ───
  const g3 = torTo(view);
  {
    const joy = el('div', 'chart');
    const ortacha = d.kunlar.length ? Math.round(d.kunlar.reduce((s, x) => s + x.som, 0) / d.kunlar.length) : 0;
    const { tugma, jadvalJoy } = almashtirgich(joy, () => jadval([{ nom: 'Kun', f: (x) => sana(x.kun) }, { nom: 'Chiqim', num: true, f: (x) => guruh(x.som) }],
      d.kunlar.filter((x) => x.som > 0).reverse(), { cls: 'tbl-sm' }));
    const c = karta(`Kunlik chiqim — ${oyNomi(d.oy, false)}`, el('span', 's', `o'rtacha ${qisqa(ortacha)}/kun`), tugma);
    c.append(el('div', 'cb', joy, jadvalJoy));
    ustunlar(joy, { nom: 'Kunlik chiqim', h: 190, fmt: (v) => `${qisqa(v)} so'm`, ref: ortacha ? { qiymat: ortacha, nom: 'o\'rtacha' } : null,
      qatorlar: d.kunlar.map((x) => ({ yorliq: String(Number(x.kun.slice(8))), sarlavha: sana(x.kun), som: x.som })),
      seriyalar: [{ kalit: 'som', nom: 'Chiqim', cls: 'c-s1' }] });
    const u = el('div', 'c7 ust'); u.append(c); g3.append(u);
  }
  {
    const c = karta('Yaqin to\'lovlar va tushumlar', Object.assign(el('a', 'btn btn-sm btn-ghost', 'Hammasi'), { href: '#/tolovlar' }));
    const roy = el('div');
    for (const t of d.tolovlar) {
      const qachon = t.holat === 'otgan' ? el('span', 'pill red', `${-t.farq} kun o'tdi`) : t.holat === 'bugun' ? el('span', 'pill orange', 'bugun')
        : el('span', 'pill', t.farq === 1 ? 'ertaga' : `${t.farq} kunda`);
      const r = el('div', 'rw', el('span', 'ic', '⏰'), el('div', 'tx', el('div', 't', t.nomi), el('div', 's', sana(t.muddat))),
        el('div', 'r', el('b', null, pul(t.summa, t.valyuta)), qachon));
      if (t.holat !== 'yaqin') { const b = btn('To\'landi', 'btn-sm', () => tolaForma(ctx, t)); r.append(b); }
      roy.append(r);
    }
    for (const l of d.loyihalar) {
      for (const t of l.kutilmoqda) {
        const kech = t.kechikish > 0;
        roy.append(el('div', 'rw', el('span', 'ic', '📥'), el('div', 'tx', el('div', 't', `${l.nomi}: ${t.nomi.replace(/ \d{4}-\d{2}.*/, '')}`), el('div', 's', `muddat ${sana(t.muddat)}`)),
          el('div', 'r', el('b', null, pul(t.qolgan, l.valyuta)), el('span', `pill ${kech ? 'red' : ''}`, kech ? `${t.kechikish} kun kechikmoqda` : t.kechikish === 0 ? 'bugun' : `${-t.kechikish} kunda`))));
      }
    }
    if (!roy.childNodes.length) roy.append(boshQ('Yaqin 14 kunda to\'lov yo\'q', 'Doimiy to\'lovlar va mijoz to\'lovlari shu yerda chiqadi.'));
    c.append(roy);
    const u = el('div', 'c5 ust'); u.append(c); g3.append(u);
  }

  // ─── Oxirgi yozuvlar + loyiha va kripto ───
  const g4 = torTo(view);
  {
    const c = karta('Oxirgi yozuvlar', Object.assign(el('a', 'btn btn-sm btn-ghost', 'Barchasi'), { href: '#/yozuvlar' }));
    c.append(d.oxirgi.length ? jadval([
      { nom: 'Sana', f: sanaKatak }, { nom: 'Nima', f: yozuvTavsif }, { nom: 'Hisob', f: (y) => el('span', 'muted', y.hisob ?? '—') }, { nom: 'Summa', num: true, f: summaKatak },
    ], d.oxirgi, { bos: (y) => yozuvForma(ctx, { yozuv: y }) })
      : boshQ('Hali yozuv yo\'q', 'Botga yozing yoki «+ Yozuv» tugmasini bosing.'));
    const u = el('div', 'c8 ust'); u.append(c); g4.append(u);
  }
  {
    const u = el('div', 'c4 ust');
    for (const l of d.loyihalar) {
      const c = karta(`🕌 ${l.nomi}`, Object.assign(el('a', 'btn btn-sm btn-ghost', 'Ochish'), { href: `#/loyiha/${k.loyihalar.find((x) => x.nomi === l.nomi)?.id}` }));
      c.append(faktlar([
        ['Kassada', pul(l.kassa, l.valyuta)],
        ['Sizga tegishli', pul(Math.max(0, l.menga), l.valyuta)],
        ['Mijoz qarzi', pul(l.mijozQarzi, l.valyuta), l.mijozQarzi > 0 ? 'red' : null],
        l.ortachaKechikish != null ? ['O\'rtacha kechikish', `${l.ortachaKechikish} kun`, l.ortachaKechikish > 7 ? 'red' : null] : null,
      ]));
      u.append(c);
    }
    if (d.kripto) {
      const kr = d.kripto;
      const c = karta('₿ Bitget', Object.assign(el('a', 'btn btn-sm btn-ghost', 'Ochish'), { href: '#/kripto' }));
      c.append(faktlar([
        ['Jami', `${guruh(Math.round(kr.jami))} USDT`],
        kr.kun ? ['Bugun', `${kr.kun.foiz >= 0 ? '+' : ''}${foiz(kr.kun.foiz, 1)}`, kr.kun.foiz < 0 ? 'red' : null] : null,
        kr.oy ? ['Oy boshidan', `${kr.oy.foiz >= 0 ? '+' : ''}${foiz(kr.oy.foiz, 1)}`, kr.oy.foiz < 0 ? 'red' : null] : null,
        ['Memecoin ulushi', foiz(kr.memecoinFoiz, 1), kr.ogohlantirishlar.some((o) => o.includes('Memecoin')) ? 'red' : null],
      ]));
      u.append(c);
    }
    g4.append(u);
  }
}
