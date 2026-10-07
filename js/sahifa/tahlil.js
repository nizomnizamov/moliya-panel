// Tahlil: pul qayerga ketyapti — kategoriyalar dinamikasi, jamg'arma darajasi, odatlar, xulosalar.

import { ol, yoz } from '../api.js';
import { almashtirgich, chiziq, legenda, ustunlar } from '../chart.js';
import { foiz, guruh, oyNomi, oyQisqa, ozgarish, qisqa, sana } from '../fmt.js';
import { bosh, btn, el, faktlar, jadval, karta, kpi, pill, sarlavha, seg, torTo, toast } from '../ui.js';

let oylarSoni = 6;
const BELGI = { qizil: '!', sariq: '!', info: 'i', yashil: '✓' };

export async function chiz(view, ctx) {
  const d = await ol('tahlil', { oylar: oylarSoni });
  const tools = sarlavha(view, { eyebrow: 'Tahlil', title: 'Pul qayerga ketyapti', sub: `Oxirgi ${oylarSoni} oy: kategoriyalar, tendensiya, odatlar va xulosalar` });
  const aiJoy = el('div');
  tools.append(seg([[3, '3 oy'], [6, '6 oy'], [12, '12 oy']], oylarSoni, (v) => { oylarSoni = v; ctx.yangila(); }), el('span', 'sp'),
    btn('✨ AI xulosa', null, async (e) => {
      const b = e.currentTarget; b.disabled = true;
      try {
        const r = await yoz('ai/xulosa', {});
        const c = karta('AI xulosasi', el('span', 's', `$${r.narx.toFixed(4)}`));
        c.append(el('div', 'cb', ...r.matn.split('\n').filter(Boolean).map((q) => el('p', null, q.replace(/^[-•]\s*/, '• ')))));
        aiJoy.replaceChildren(c);
      } catch (err) { toast(err.message, false); } finally { b.disabled = false; }
    }));
  view.append(aiJoy);

  // ─── KPI: o'rtachalar (joriy oy hisobga olinmaydi — to'liq emas) ───
  const toliq = d.pulOqimi.slice(0, -1).filter((m) => m.daromad || m.chiqim);
  const ort = (f) => (toliq.length ? Math.round(toliq.reduce((s, m) => s + f(m), 0) / toliq.length) : 0);
  const darajalar = toliq.map((m) => m.daraja).filter((x) => x != null);
  const stats = el('div', 'stats');
  stats.append(
    // To'liq oy hali yo'q bo'lsa — o'rtacha noma'lum ("0" emas).
    kpi({ nom: 'O\'rtacha oylik daromad', qiymat: toliq.length ? qisqa(ort((m) => m.daromad)) : '—', birlik: toliq.length ? 'so\'m' : null,
      spark: d.pulOqimi.map((m) => m.daromad), izoh: toliq.length ? `${toliq.length} ta to'liq oy bo'yicha` : 'to\'liq oy hali yo\'q — joriy oy hisobga olinmaydi' }),
    kpi({ nom: 'O\'rtacha oylik chiqim', qiymat: toliq.length ? qisqa(ort((m) => m.chiqim)) : '—', birlik: toliq.length ? 'so\'m' : null,
      spark: d.pulOqimi.map((m) => m.chiqim), yon: -1, izoh: toliq.length ? 'qarz to\'lovlarisiz' : 'to\'liq oy hali yo\'q' }),
    kpi({ nom: 'Jamg\'arma darajasi', qiymat: darajalar.length ? foiz(Math.round(darajalar.reduce((s, x) => s + x, 0) / darajalar.length)) : '—',
      ton: darajalar.length && darajalar.reduce((s, x) => s + x, 0) / darajalar.length < 0 ? 'red' : null, spark: d.pulOqimi.map((m) => m.daraja),
      izoh: 'Daromaddan qancha qismi ortib qoladi (o\'rtacha)' }),
    kpi({ nom: 'Shu oy prognozi', qiymat: qisqa(d.prognoz), birlik: 'so\'m',
      izoh: el('span', null, 'Hozircha ', el('b', null, qisqa(d.joriyChiqim)), ` · o'tgan oy jami ${qisqa(d.otganOyJami)}`) }),
  );
  view.append(stats);

  // ─── Kategoriyalar oylar bo'yicha (ustma-ust) + xulosalar ───
  const g1 = torTo(view);
  {
    const top = d.matritsa.qatorlar.filter((q) => q.nomi !== 'Yozilmagan').slice(0, 5);
    const qolgan = d.matritsa.qatorlar.filter((q) => !top.includes(q));
    const seriyalar = [...top.map((q, i) => ({ kalit: q.nomi, nom: `${q.belgi} ${q.nomi}`, cls: `c-s${i + 1}` })),
      ...(qolgan.length ? [{ kalit: '_boshqa', nom: `Boshqalar (${qolgan.length})`, cls: 'c-s0' }] : [])];
    const qatorlar = d.oylar.map((oy, i) => {
      const q = { yorliq: oyQisqa(oy), sarlavha: oyNomi(oy) };
      for (const t of top) q[t.nomi] = t.oylar[i];
      q._boshqa = qolgan.reduce((s, x) => s + x.oylar[i], 0);
      return q;
    });
    const joy = el('div', 'chart');
    const { tugma, jadvalJoy } = almashtirgich(joy, () => jadval([{ nom: 'Oy', f: (q) => q.sarlavha }, ...seriyalar.map((s) => ({ nom: s.nom, num: true, f: (q) => guruh(q[s.kalit]) }))],
      [...qatorlar].reverse(), { cls: 'tbl-sm' }));
    const c = karta('Chiqim tarkibi oylar bo\'yicha', el('span', 's', 'so\'mda'), tugma);
    c.append(el('div', 'cb', legenda(seriyalar.map((s) => [s.nom, s.cls.replace('c-', 'sw-')])), joy, jadvalJoy));
    ustunlar(joy, { nom: 'Chiqim tarkibi', h: 250, stack: true, qatorlar, seriyalar, fmt: (v) => `${qisqa(v)} so'm` });
    const u = el('div', 'c8 ust'); u.append(c); g1.append(u);
  }
  {
    const c = karta('Xulosalar', el('span', 's', `${d.xulosalar.length} ta`));
    if (!d.xulosalar.length) c.append(bosh('Hammasi joyida', 'Hozircha e\'tibor talab qiladigan narsa yo\'q.'));
    const roy = el('div', 'act');
    for (const x of d.xulosalar) {
      const b = el('button', `ar ${x.daraja}`, el('span', 'n', BELGI[x.daraja]), el('div', 'tx', el('div', 'tt', x.sarlavha), el('div', 'ss', x.matn)), el('span', 'go', '›'));
      b.type = 'button';
      b.addEventListener('click', () => ctx.bor(x.sahifa === 'loyiha' ? `loyiha/${ctx.katalog.loyihalar[0]?.id}` : x.sahifa ?? 'tahlil'));
      roy.append(b);
    }
    c.append(roy);
    const u = el('div', 'c4 ust'); u.append(c); g1.append(u);
  }

  // ─── Kategoriya × oy (issiqlik jadvali) ───
  {
    const g = torTo(view);
    const c = karta('Kategoriyalar × oylar', el('span', 's', 'rang qanchalik to\'q — shuncha ko\'p'));
    const max = Math.max(...d.matritsa.qatorlar.flatMap((q) => q.oylar), 1);
    const katak = (v) => {
      const td = el('span', null, v ? qisqa(v) : '—');
      return td;
    };
    const t = jadval([
      { nom: 'Kategoriya', f: (q) => el('b', null, `${q.belgi} ${q.nomi}`) },
      ...d.oylar.map((oy, i) => ({ nom: oyQisqa(oy), num: true, f: (q) => katak(q.oylar[i]) })),
      { nom: 'O\'rtacha oy', num: true, f: (q) => el('span', 'muted', q.ortacha ? qisqa(q.ortacha) : '—') },
      { nom: 'Shu kungacha', num: true, f: (q) => {
        // Joriy oy — oldingi 3 oyning shu kunlarigacha bo'lgan o'rtachasi bilan (to'liq oy bilan emas).
        const o = ozgarish(q.joriy, q.ortachaShuKungacha, false);
        const s2 = el('span', o ? `d ${o.cls}` : 'faint', o ? o.t : q.joriy ? 'yangi' : '—');
        s2.title = `Shu oy: ${qisqa(q.joriy)} · oldingi oylar shu kungacha o'rtacha: ${qisqa(q.ortachaShuKungacha)}`;
        return s2;
      } },
    ], d.matritsa.qatorlar, { cls: 'heat tbl-sm', futer: ['Jami', ...d.matritsa.jamlar.map((v) => qisqa(v)), '', ''] });
    // Kataklarni rang bilan to'ldirish: bitta rang, kattalikka qarab to'qlik (matn rangi o'zgarmaydi).
    t.querySelectorAll('tbody tr').forEach((tr, qi) => {
      const q = d.matritsa.qatorlar[qi];
      [...tr.children].slice(1, 1 + d.oylar.length).forEach((td, i) => {
        const v = q.oylar[i];
        td.classList.add('h');
        if (!v) { td.classList.add('nol'); return; }
        const fon = el('i');
        fon.style.opacity = String(0.06 + 0.42 * Math.sqrt(v / max));
        td.prepend(fon);
      });
    });
    c.append(el('div', 'cb np', t));
    const u = el('div', 'c12 ust'); u.append(c); g.append(u);
  }

  // ─── Jamg'arma darajasi + hafta kunlari ───
  const g3 = torTo(view);
  {
    const joy = el('div', 'chart');
    const c = karta('Jamg\'arma darajasi', el('span', 's', 'daromaddan ortib qolgan %'));
    c.append(el('div', 'cb', joy));
    const qiymatlar = d.pulOqimi.map((m) => m.daraja);
    if (qiymatlar.filter((x) => x != null).length < 2) c.lastChild.replaceChildren(bosh('Ma\'lumot kam', 'Kamida ikki oy daromad yozilgach ko\'rinadi.'));
    else chiziq(joy, { nom: 'Jamg\'arma darajasi', h: 200, yorliqlar: d.oylar.map(oyQisqa), sarlavhalar: d.oylar.map((o) => oyNomi(o)), nol: true,
      seriyalar: [{ nom: 'Jamg\'arma darajasi', cls: 'c-s1', qiymatlar, maydon: true }], fmt: (v) => foiz(v), fmtOq: (v) => `${v}%`,
      ref: { qiymat: 20, nom: 'tavsiya: 20%' } });
    const u = el('div', 'c6 ust'); u.append(c); g3.append(u);
  }
  {
    const joy = el('div', 'chart');
    const engKop = d.haftaKunlari.reduce((a, b) => (b.ortacha > a.ortacha ? b : a), d.haftaKunlari[0]);
    const c = karta('Hafta kunlari', el('span', 's', `oxirgi 90 kun · eng ko'p: ${engKop.kun}`));
    c.append(el('div', 'cb', joy));
    ustunlar(joy, { nom: 'Hafta kunlari', h: 200, fmt: (v) => `${qisqa(v)} so'm`, qatorlar: d.haftaKunlari.map((h) => ({ yorliq: h.kun, sarlavha: `${h.kun} — o'rtacha`, v: h.ortacha })),
      seriyalar: [{ kalit: 'v', nom: 'O\'rtacha chiqim', cls: 'c-s1' }] });
    const u = el('div', 'c6 ust'); u.append(c); g3.append(u);
  }

  // ─── Ko'p pul ketgan joylar + eng katta xarajatlar ───
  const g4 = torTo(view);
  {
    const c = karta('Ko\'p pul ketgan joylar', el('span', 's', 'izoh bo\'yicha'));
    const jami = d.izohlar.reduce((s, x) => s + x.som, 0) || 1;
    c.append(d.izohlar.length ? jadval([
      { nom: 'Joy / izoh', f: (x) => el('b', null, x.izoh) }, { nom: 'Necha marta', num: true, f: (x) => String(x.soni) },
      { nom: 'Summa', num: true, f: (x) => qisqa(x.som) }, { nom: 'Ulushi', num: true, f: (x) => el('span', 'muted', foiz(Math.round((x.som / jami) * 100))) },
    ], d.izohlar, { cls: 'tbl-sm' }) : bosh('Izohlar yo\'q', 'Botga yozganda joyni ham qo\'shing: "Korzinka 250".'));
    const u = el('div', 'c6 ust'); u.append(c); g4.append(u);
  }
  {
    const c = karta('Eng katta xarajatlar', el('span', 's', `${oylarSoni} oy`));
    c.append(d.engKatta.length ? jadval([
      { nom: 'Sana', f: (x) => el('span', 'muted', sana(x.sana)) }, { nom: 'Nima', f: (x) => el('div', 'tavsif', el('span', 'bel', x.belgi), el('div', null, el('b', null, x.kategoriya), x.izoh ? el('small', null, x.izoh) : null)) },
      { nom: 'Summa', num: true, f: (x) => x.valyuta === 'UZS' ? qisqa(x.summa) : `${guruh(x.summa)} ${x.valyuta}` },
    ], d.engKatta, { cls: 'tbl-sm' }) : bosh('Xarajat yo\'q', ''));
    const u = el('div', 'c6 ust'); u.append(c); g4.append(u);
  }

  // ─── Bozor va iqtisod: alohida so'rov — sekin bo'lsa ham sahifa kutmaydi ───
  view.append(el('div', 'sect', 'Bozor va iqtisod'));
  const bozorJoy = el('div', 'g');
  bozorJoy.append(el('div', 'c12 skel', 'Yuklanmoqda…'));
  view.append(bozorJoy);
  ol('bozor').then((b) => bozorJoy.replaceChildren(...bozorKartalari(b)))
    .catch((e) => bozorJoy.replaceChildren(el('div', 'c12', bosh('Bozor ma\'lumoti olinmadi', e.message))));
}

const ishorali = (x) => (x == null ? '—' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${foiz(Math.abs(x), 1)}`);
function havola(matn, url) {
  if (!url || !/^https?:\/\//.test(url)) return el('span', null, matn);
  const a = el('a', null, matn); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
}

/** Kunlik (CBU, Bitget) va haftalik (internet, manbali) bozor kartalari. */
function bozorKartalari(b) {
  const k = b.kunlik, h = b.haftalik;
  const chap = karta('Bugungi bozor', el('span', 's', 'CBU va Bitget · har kuni'));
  chap.append(k ? faktlar([
    ['Dollar', `${guruh(k.dollar_som)} so'm`],
    ['Dollar: 30 kunda / 1 yilda', `${ishorali(k.dollar_30_kunda_foiz)} / ${ishorali(k.dollar_1_yilda_foiz)}`],
    k.rubl_som && ['Rubl (o\'tkazmalar)', `${guruh(k.rubl_som, 2)} so'm · 1 yilda ${ishorali(k.rubl_1_yilda_foiz)}`],
    k.oltin_unsiya_usd && ['Oltin', `$${guruh(k.oltin_unsiya_usd)} / unsiya · 30 kunda ${ishorali(k.oltin_30_kunda_foiz)}`],
    k.oltin_quyma && [`CBU quyma ${k.oltin_quyma.gramm} g: sotish / qaytarib olish`, `${qisqa(k.oltin_quyma.sotish_som)} / ${qisqa(k.oltin_quyma.qaytarib_olish_som)} so'm`],
    k.oltin_quyma && ['Quyma spredi (darhol yo\'qotish)', `${foiz(k.oltin_quyma.spred_foiz, 1)}`, k.oltin_quyma.spred_foiz > 10 ? 'orange' : null],
    k.btc_usd && ['BTC', `$${guruh(k.btc_usd)} · 30 kunda ${ishorali(k.btc_30_kunda_foiz)}`],
    k.eth_usd && ['ETH', `$${guruh(k.eth_usd)} · 30 kunda ${ishorali(k.eth_30_kunda_foiz)}`],
  ]) : bosh('Ma\'lumot yo\'q', 'Har soatda yangilanadi.'));
  const ung = karta('Iqtisod: haftalik sharh', h ? (h.eskirgan ? pill(`${h.kun_oldin} kun oldin`, 'orange') : el('span', 's', `${sana(h.olindi)} · internet, manbalar bilan`)) : el('span', 's', 'har dushanba'));
  if (!h) ung.append(bosh('Hali yo\'q', 'Har dushanba ertalab internetdan yangilanadi: asosiy stavka, inflyatsiya, uy narxi, yangiliklar.'));
  else {
    const kor = (nom, x, fmt) => (x?.qiymat == null ? null : [nom, havola(`${fmt(x.qiymat)}${x.davr ? ` · ${x.davr}` : x.sana ? ` · ${sana(x.sana)}` : ''}`, x.manba)]);
    ung.append(faktlar([
      kor('Asosiy stavka (CBU)', h.asosiy_stavka, (q) => `${q}%`),
      kor('Inflyatsiya, yillik', h.inflyatsiya_yillik, (q) => `${q}%`),
      kor('Inflyatsiya prognozi', h.inflyatsiya_prognoz, (q) => `${q}%`),
      kor('Toshkent, 1 m²', h.toshkent_m2_usd, (q) => `$${guruh(q)}`),
      kor('AQSh Fed stavkasi', h.fed_stavka, (q) => `${q}%`),
    ]));
    const izohlar = [['O\'tkazmalar', h.otkazmalar], ['Islomiy moliya', h.islomiy_moliya], ['Umra', h.umra]].filter(([, x]) => x?.izoh);
    const yangi = h.yangiliklar ?? [];
    if (izohlar.length || yangi.length) {
      ung.append(el('div', 'cb', ...izohlar.map(([n, x]) => el('p', 'small', el('b', null, `${n}: `), havola(x.izoh, x.manba))),
        ...yangi.map((y) => el('p', 'small', havola(y.sarlavha, y.manba), el('span', 'muted', ` — ${y.tasir}`)))));
    }
  }
  const u1 = el('div', 'c6 ust'); u1.append(chap);
  const u2 = el('div', 'c6 ust'); u2.append(ung);
  return [u1, u2];
}

