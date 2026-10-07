// Kripto: Bitget portfeli, dinamika, savdo jurnali, risk qoidalari.

import { ol, yoz } from '../api.js';
import { chiziq } from '../chart.js';
import { dollar, foiz, guruh, qisqa, sana, sanaQisqa } from '../fmt.js';
import { bosh, btn, drawer, el, faktlar, inp, jadval, karta, kpi, maydon, pill, sarlavha, summaInp, tanlov, torTo, toast } from '../ui.js';

const GURUH = [{ qiymat: 'asosiy', nom: 'Asosiy' }, { qiymat: 'swing', nom: 'Swing' }, { qiymat: 'memecoin', nom: 'Memecoin' }, { qiymat: 'stable', nom: 'Stable' }];
const ishora = (n, f) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n))}`;
const aniq = (n) => (Math.abs(n) >= 100 ? guruh(n, 2) : Number(n).toLocaleString('ru-RU', { maximumSignificantDigits: 6 }).replace(/ /g, ' '));

export async function chiz(view, ctx) {
  const d = await ol('kripto');
  sarlavha(view, { eyebrow: 'Kapital', title: 'Kripto', sub: d.oxirgiSinxron ? `Bitget · faqat o'qish · oxirgi sinxron ${sana(d.oxirgiSinxron.slice(0, 10))} ${d.oxirgiSinxron.slice(11, 16)}` : 'Bitget · faqat o\'qish' });
  const h = d.holat;
  if (!h) {
    const c = karta('Bitget hali ulanmagan');
    c.append(el('div', 'cb', el('p', 'muted', 'Kalit qo\'shilgach har soatda balans, aktivlar va savdolar o\'zi olinadi. Yangi savdodan keyin bot sababini so\'raydi.'),
      el('ol', 'muted', el('li', null, 'Bitget → Profil → API Management → Create API.'),
        el('li', null, 'Ruxsat: faqat Read (o\'qish). Trade va Withdraw belgilanmaydi.'),
        el('li', null, 'API Key, Secret va Passphrase\'ni .env ga qo\'shing va deploy qiling.'))));
    view.append(c);
    return;
  }

  const q = d.qoidalar;
  const stats = el('div', 'stats');
  stats.append(
    kpi({ nom: 'Jami', qiymat: guruh(Math.round(h.jami)), birlik: 'USDT', spark: d.tarix.slice(-30).map((t) => t.jami), izoh: `≈ ${qisqa(h.jami * d.kurs)} so'm` }),
    kpi({ nom: 'Bugun', qiymat: h.kun ? `${h.kun.foiz >= 0 ? '+' : '−'}${foiz(Math.abs(h.kun.foiz), 1)}` : '—', ton: h.kun && -h.kun.foiz > q.kunlik_zarar_foiz ? 'red' : null,
      izoh: h.kun ? `${ishora(h.kun.usdt, (n) => dollar(n, 0))} · qoida: kuniga −${q.kunlik_zarar_foiz}% gacha` : 'kechagi surat yo\'q' }),
    kpi({ nom: 'Oy boshidan', qiymat: h.oy ? `${h.oy.foiz >= 0 ? '+' : '−'}${foiz(Math.abs(h.oy.foiz), 1)}` : '—', izoh: h.oy ? `${ishora(h.oy.usdt, (n) => dollar(n, 0))} · kiritilgan pul hisobga olinmagan` : '' }),
    kpi({ nom: 'Memecoin ulushi', qiymat: foiz(h.memecoinFoiz, 1), ton: h.memecoinFoiz > q.memecoin_foiz ? 'red' : null,
      zolak: (h.memecoinFoiz / Math.max(q.memecoin_foiz, 0.01)) * 100, zolakCls: h.memecoinFoiz > q.memecoin_foiz ? 'red' : '', izoh: `qoida: ${q.memecoin_foiz}% gacha` }),
  );
  view.append(stats);

  const g1 = torTo(view);
  {
    const joy = el('div', 'chart');
    const c = karta('Balans dinamikasi', el('span', 's', `${d.tarix.length} kun · USDT`));
    c.append(el('div', 'cb', joy));
    if (d.tarix.length < 2) c.lastChild.replaceChildren(bosh('Tarix kam', 'Har kuni surat olinadi — bir necha kundan keyin grafik chiqadi.'));
    else chiziq(joy, { nom: 'Bitget balansi', h: 240, yorliqlar: d.tarix.map((t) => sanaQisqa(t.sana)), sarlavhalar: d.tarix.map((t) => sana(t.sana)),
      seriyalar: [{ nom: 'Balans', cls: 'c-s1', qiymatlar: d.tarix.map((t) => t.jami), maydon: true }], fmt: (n) => `${guruh(Math.round(n))} USDT`, fmtOq: (n) => guruh(n) });
    const u = el('div', 'c8 ust'); u.append(c); g1.append(u);
  }
  {
    const u = el('div', 'c4 ust');
    const c = karta('Hisob turlari');
    c.append(faktlar(Object.entries(h.hisoblar).filter(([, x]) => x >= 0.5).map(([t, x]) => [t, `${guruh(x, 0)} USDT`])));
    u.append(c);
    if (h.ogohlantirishlar.length) {
      const w = karta('Risk qoidalari buzilgan');
      w.append(el('div', 'cb', ...h.ogohlantirishlar.map((o) => el('p', 'note red', o.replace(/^⚠️\s*/, '')))));
      u.append(w);
    }
    // Risk qoidalari — tahrirlanadi.
    const r = karta('Risk qoidalari');
    const k = Object.fromEntries(['savdo_risk_foiz', 'kunlik_zarar_foiz', 'memecoin_foiz', 'portfel_risk_foiz'].map((x) => [x, inp(q[x], { type: 'number', min: 0, max: 100, step: 0.5 })]));
    r.append(el('div', 'cb', el('div', 'form', maydon('Bitta savdo riski, %', k.savdo_risk_foiz), maydon('Kunlik zarar chegarasi, %', k.kunlik_zarar_foiz),
      maydon('Memecoin ulushi, %', k.memecoin_foiz), maydon('Portfel riski, %', k.portfel_risk_foiz)),
      el('div', 'row', el('span', 'sp'), btn('Saqlash', 'btn-sm btn-pri', async () => {
        try { await yoz('risk', Object.fromEntries(Object.entries(k).map(([x, i]) => [x, Number(i.value)]))); toast('Qoidalar saqlandi'); ctx.yangila(); } catch (e) { toast(e.message, false); }
      }))));
    r.lastChild.lastChild.style.marginTop = '12px';
    u.append(r);
    g1.append(u);
  }

  // ─── Portfel ───
  const c = karta('Spot portfel', el('span', 's', 'o\'rtacha narx savdolardan hisoblanadi; bo\'lmasa — qo\'lda kiriting'));
  const aktivlar = d.aktivlar.filter((a) => a.miqdor > 0);
  const qiymat = (a) => a.miqdor * (a.guruh === 'stable' ? 1 : a.narx ?? 0);
  c.append(aktivlar.length ? jadval([
    { nom: 'Coin', f: (a) => el('b', null, a.coin) },
    { nom: 'Miqdor', num: true, f: (a) => aniq(a.miqdor) },
    { nom: 'Narx', num: true, f: (a) => (a.narx ? aniq(a.narx) : '—') },
    { nom: 'Qiymat', num: true, f: (a) => el('b', null, dollar(Math.round(qiymat(a)))) },
    { nom: 'O\'rtacha narx', num: true, f: (a) => {
      const i = summaInp(a.ortacha_narx ?? '', { class: 'inp-sm', placeholder: '—', 'aria-label': `${a.coin} o'rtacha narxi` });
      i.title = a.qolda ? 'Qo\'lda kiritilgan' : 'Savdolardan';
      i.addEventListener('change', async () => { try { await yoz('kripto/aktiv', { coin: a.coin, ortacha: i.son() }); toast(`${a.coin}: saqlandi`); ctx.yangila(); } catch (e) { toast(e.message, false); } });
      return i;
    } },
    { nom: 'Natija', num: true, f: (a) => {
      if (!a.ortacha_narx || !a.narx || a.guruh === 'stable') return el('span', 'faint', '—');
      const f = Math.round(((a.narx - a.ortacha_narx) / a.ortacha_narx) * 1000) / 10;
      return el('span', f >= 0 ? 'green' : 'red', `${f >= 0 ? '+' : '−'}${foiz(Math.abs(f), 1)}`);
    } },
    { nom: 'Guruh', f: (a) => {
      const s = tanlov(GURUH, a.guruh);
      s.style.width = '130px';
      s.addEventListener('change', async () => { try { await yoz('kripto/aktiv', { coin: a.coin, guruh: s.value }); toast(`${a.coin}: ${s.value}`); ctx.yangila(); } catch (e) { toast(e.message, false); } });
      return s;
    } },
  ], aktivlar.sort((a, b) => qiymat(b) - qiymat(a))) : bosh('Aktiv yo\'q', ''));
  view.append(c);

  // ─── Savdo jurnali ───
  view.append(el('div', 'sect', 'Savdo jurnali'));
  const j = karta(null, el('span', 's', 'qatorni bosing — sabab va saboqni yozing'));
  j.append(d.savdolar.length ? jadval([
    { nom: 'Vaqt', f: (s) => el('span', 'muted', `${sana(s.vaqt.slice(0, 10))} ${s.vaqt.slice(11, 16)}`) },
    { nom: 'Coin', f: (s) => el('b', null, s.coin) },
    { nom: 'Tomon', f: (s) => pill(s.tomon === 'buy' ? 'sotib oldim' : 'sotdim', s.tomon === 'buy' ? 'blue' : '') },
    { nom: 'Miqdor × narx', num: true, f: (s) => `${aniq(s.miqdor)} × ${aniq(s.narx)}` },
    { nom: 'Summa', num: true, f: (s) => dollar(s.summa_usdt, 2) },
    { nom: 'Natija', num: true, f: (s) => (s.natija == null ? el('span', 'faint', '—') : el('span', s.natija >= 0 ? 'green' : 'red', ishora(s.natija, (n) => dollar(n, 2)))) },
    { nom: 'Sabab / saboq', f: (s) => (s.izoh ? el('span', null, s.izoh) : el('span', 'orange small', 'yozilmagan')) },
  ], d.savdolar, { bos: (s) => {
    const t = el('textarea'); t.value = s.izoh ?? ''; t.placeholder = 'Nima uchun oldim/sotdim, natijadan qanday saboq…'; t.maxLength = 1000;
    drawer({ sarlavha: `${s.coin} · ${s.tomon === 'buy' ? 'sotib olish' : 'sotish'}`, tana: el('div', 'form', maydon('Sabab va saboq', t, `${sana(s.vaqt.slice(0, 10))} · ${aniq(s.miqdor)} × ${aniq(s.narx)}`, true)),
      saqla: async () => { await yoz('kripto/savdo', { savdo_id: s.savdo_id, izoh: t.value }); toast('Jurnalga yozildi'); ctx.yangila(); } });
  } }) : bosh('Savdo yo\'q', 'Bitget savdolari sinxron bilan shu yerga tushadi.'));
  view.append(j);
}
