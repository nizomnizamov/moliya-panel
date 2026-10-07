// Loyiha: kassa, kutilayotgan va tushgan to'lovlar (kechikish bilan), oylik natija, shartlar.

import { ol, yoz } from '../api.js';
import { almashtirgich, legenda, ustunlar } from '../chart.js';
import { oyNomi, oyQisqa, pul, sana } from '../fmt.js';
import { rejaForma, shartlarForma, sotuvForma, tolaForma, yozuvForma } from '../formalar.js';
import { bosh, btn, el, faktlar, jadval, karta, kpi, pill, sarlavha, torTo, toast, xavfliBtn } from '../ui.js';

export async function chiz(view, ctx, param) {
  const k = ctx.katalog;
  const id = param ?? k.loyihalar[0]?.id;
  const d = await ol('loyiha', { id });
  const l = d.loyiha, v = d.valyuta, sh = l.shartlar ?? {};
  const p = (n) => pul(n, v);
  const fiksMatn = (sh.fiks ?? []).map((f) => `${f.kun}`).join(' va ');
  const fiksJami = (sh.fiks ?? []).reduce((s, f) => s + f.summa, 0);
  const stavka = [...(sh.bonus ?? [])].reverse().find((b) => b.dan <= new Date().toISOString().slice(0, 7));
  const kassaHisob = k.hisoblar.find((h) => h.id === d.kassaId);
  const shaxsiy = k.standartId?.[v] ?? k.hisoblar.find((h) => h.valyuta === v && h.turi === 'naqd')?.id;
  const kat = (nom) => k.kategoriyalar.find((c) => c.nomi === nom)?.id;

  const tools = sarlavha(view, { eyebrow: 'Loyiha', title: l.nomi,
    sub: `Sherik: ${l.sherik ?? '—'} · ulushingiz ${Math.round(l.mening_ulushim * 100)}% · fiks ${p(fiksJami)}/oy (${fiksMatn}-sanada)${stavka ? ` · bonus ${p(stavka.summa)}/sotuv` : ''}` });
  tools.append(
    btn('Tushum', 'btn-pri', () => yozuvForma(ctx, { preset: { turi: 'kirim', hisob_id: d.kassaId, kategoriya_id: kat('Fiks') } })),
    btn('Xarajat', null, () => yozuvForma(ctx, { preset: { turi: 'chiqim', hisob_id: d.kassaId, kategoriya_id: kat('Mayda xarajat') } })),
    btn('Ulushimni olish', null, () => yozuvForma(ctx, { preset: { turi: 'otkazma', hisob_id: d.kassaId, ga_hisob_id: shaxsiy, izoh: 'ulushim', summa: Math.max(0, Math.floor(d.holat.menga)) || '' } })),
    btn('Sherik ulushi', null, () => yozuvForma(ctx, { preset: { turi: 'chiqim', hisob_id: d.kassaId, kategoriya_id: kat('Sherik ulushi'), izoh: l.sherik, summa: Math.max(0, Math.floor(d.holat.sherikka)) || '' } })),
    btn('Sotuvlar soni', null, () => sotuvForma(ctx, l)),
    el('span', 'sp'),
    btn('Shartlar', 'btn-ghost', () => shartlarForma(ctx, l)));

  const h = d.holat;
  const stats = el('div', 'stats k5');
  stats.append(
    kpi({ nom: 'Kassada', qiymat: kassaHisob?.boshlangich_sana || h.kassa ? p(h.kassa) : '—', izoh: kassaHisob?.boshlangich_sana ? 'hozir kassadagi pul' : 'kassa qoldig\'i kiritilmagan' }),
    kpi({ nom: 'Sizga tegishli', qiymat: p(Math.max(0, h.menga)), izoh: el('span', null, `${l.sherik ?? 'Sherik'}ga: `, el('b', null, p(Math.max(0, h.sherikka)))) }),
    kpi({ nom: `${oyNomi(d.oylar[d.oylar.length - 1].oy, false)}: tushum`, qiymat: p(h.oy.tushum), spark: d.oylar.map((m) => m.tushum), izoh: `xarajat ${p(h.oy.xarajat)}` }),
    kpi({ nom: 'Mijoz qarzi', qiymat: p(h.mijozQarzi), ton: h.mijozQarzi > 0 ? 'red' : null, izoh: h.mijozQarzi > 0 ? 'muddati o\'tgan, tushmagan' : 'muddati o\'tganlar tushgan' }),
    kpi({ nom: 'O\'rtacha kechikish', qiymat: h.ortachaKechikish != null ? `${h.ortachaKechikish}` : '—', birlik: h.ortachaKechikish != null ? 'kun' : '', ton: h.ortachaKechikish > 7 ? 'orange' : null, izoh: 'tushgan to\'lovlar bo\'yicha' }),
  );
  view.append(stats);

  const g1 = torTo(view);
  {
    let c;
    if (!d.oylar.some((m) => m.tushum || m.xarajat)) {
      c = karta('Tushum va xarajat — 6 oy');
      c.append(el('div', 'cb', bosh('Hali tushum yo\'q', 'Fiks yoki bonus tushganda oyma-oy grafik shu yerda chiqadi.')));
    } else {
      const joy = el('div', 'chart');
      const { tugma, jadvalJoy } = almashtirgich(joy, () => jadval([{ nom: 'Oy', f: (m) => oyNomi(m.oy) }, { nom: 'Tushum', num: true, f: (m) => p(m.tushum) },
        { nom: 'Xarajat', num: true, f: (m) => p(m.xarajat) }, { nom: 'Sof', num: true, f: (m) => p(m.sof) }], [...d.oylar].reverse(), { cls: 'tbl-sm' }));
      c = karta('Tushum va xarajat — 6 oy', tugma);
      c.append(el('div', 'cb', legenda([['Tushum', 'sw-s1'], ['Xarajat', 'sw-s2']]), joy, jadvalJoy));
      ustunlar(joy, { nom: 'Tushum va xarajat', h: 220, fmt: p, qatorlar: d.oylar.map((m) => ({ yorliq: oyQisqa(m.oy), sarlavha: oyNomi(m.oy), tushum: m.tushum, xarajat: m.xarajat })),
        seriyalar: [{ kalit: 'tushum', nom: 'Tushum', cls: 'c-s1' }, { kalit: 'xarajat', nom: 'Xarajat', cls: 'c-s2' }] });
    }
    const u = el('div', 'c8 ust'); u.append(c); g1.append(u);
  }
  {
    const u = el('div', 'c4 ust');
    const c = karta('Kassadan to\'lovlar');
    if (!d.tolovlar.length) c.append(bosh('Yaqin 31 kunda yo\'q', ''));
    for (const t of d.tolovlar) {
      const r = el('div', 'rw', el('div', 'tx', el('div', 't', t.nomi), el('div', 's', sana(t.muddat))),
        el('div', 'r', el('b', null, p(t.summa)), el('span', null, t.holat === 'otgan' ? `${-t.farq} kun o'tdi` : t.farq === 0 ? 'bugun' : `${t.farq} kunda`)));
      if (t.holat !== 'yaqin') r.append(btn('To\'landi', 'btn-sm', () => tolaForma(ctx, { ...t, valyuta: v, hisob_id: d.kassaId })));
      c.append(r);
    }
    u.append(c);
    const c2 = karta('Shu oy xarajatlari');
    c2.append(d.xarajatlar.length ? faktlar(d.xarajatlar.map((x) => [x.nomi, p(x.summa)])) : bosh('Xarajat yo\'q', ''));
    u.append(c2);
    g1.append(u);
  }

  // ─── Kutilayotgan va tushgan to'lovlar ───
  {
    const holat = (r) => {
      if (r.holat === 'tushdi') return r.kechikish > 0 ? pill(`${sana(r.yopildi)} · ${r.kechikish} kun kech`, r.kechikish > 7 ? 'orange' : '') : pill(`${sana(r.yopildi)} · o'z vaqtida`, 'green');
      if (r.holat === 'kechikmoqda') return pill(`${r.kechikish} kun kechikmoqda`, 'red');
      if (r.holat === 'qisman') return pill(`qisman: ${p(r.tushgan)}`, 'orange');
      return pill('kutilmoqda', 'blue');
    };
    const c = karta('Mijoz to\'lovlari', el('span', 's', 'tushumlar muddat tartibida rejaga taqsimlanadi'), btn('+ Reja', 'btn-sm btn-ghost', () => rejaForma(ctx, l)));
    c.append(d.rejalar.length ? jadval([
      { nom: 'To\'lov', f: (r) => el('b', null, r.nomi) },
      { nom: 'Turi', f: (r) => el('span', 'muted', r.turi === 'fiks' ? 'Fiks' : 'Bonus') },
      { nom: 'Muddat', f: (r) => sana(r.muddat) },
      { nom: 'Summa', num: true, f: (r) => p(r.summa) },
      { nom: 'Holat', f: holat },
      { nom: '', f: (r) => r.holat === 'tushdi' || !r.id ? el('span') : xavfliBtn('O\'chirish', async () => { await yoz('reja/ochir', { id: r.id }); toast('Reja o\'chirildi'); ctx.yangila(); }, 'btn-sm btn-ghost') },
    ], [...d.rejalar].reverse(), { bos: (r) => r.id && rejaForma(ctx, l, r) }) : bosh('Reja yo\'q', 'Fiks rejalari har oy shartlardan o\'zi yaratiladi.'));
    view.append(c);
  }

  // ─── Oylik natija (faqat harakat bo'lgan oylar) ───
  view.append(el('div', 'sect', 'Oylik natija'));
  const c = karta(null);
  const harakatli = d.oylar.filter((m) => m.fiks || m.bonus || m.xarajat || m.men || m.sherik);
  if (!harakatli.length) {
    c.append(bosh('Hali natija yo\'q', 'Fiks, bonus va xarajatlar yozilgach har oyning foydasi va ulushlar shu yerda chiqadi.'));
    view.append(c);
    return;
  }
  c.append(jadval([
    { nom: 'Oy', f: (m) => el('b', null, oyNomi(m.oy)) },
    { nom: 'Fiks', num: true, f: (m) => p(m.fiks) },
    { nom: 'Bonus', num: true, f: (m) => p(m.bonus) },
    { nom: 'Xarajat', num: true, f: (m) => p(m.xarajat) },
    { nom: 'Sof foyda', num: true, f: (m) => el('b', m.sof < 0 ? 'red' : null, p(m.sof)) },
    { nom: 'Ulushim', num: true, f: (m) => p(m.ulushim) },
    { nom: 'Men oldim', num: true, f: (m) => el('span', 'muted', p(m.men)) },
    { nom: `${l.sherik ?? 'Sherik'} oldi`, num: true, f: (m) => el('span', 'muted', p(m.sherik)) },
  ], [...harakatli].reverse(), { futer: ['Jami', ...['fiks', 'bonus', 'xarajat', 'sof', 'ulushim', 'men', 'sherik'].map((x) => p(d.oylar.reduce((s, m) => s + m[x], 0)))] }));
  view.append(c);
}
