// Hisoblar: qoldiqlar, oylik harakat, qoldiqni tekshirish.

import { ol } from '../api.js';
import { guruh, oyQisqa, pul, qisqa, sana } from '../fmt.js';
import { hisobForma, qoldiqForma, yozuvForma } from '../formalar.js';
import { btn, el, faktlar, karta, kpi, pill, sarlavha, spark, torTo } from '../ui.js';

const TUR = { karta: 'Karta', naqd: 'Naqd', birja: 'Birja', jamgarma: 'Jamg\'arma', loyiha: 'Loyiha kassasi' };

export async function chiz(view, ctx) {
  const d = await ol('hisoblar');
  const tools = sarlavha(view, { eyebrow: 'Pul', title: 'Hisoblar', sub: 'Har bir karta, naqd va jamg\'arma qoldig\'i. Haftada bir marta haqiqiy qoldiq bilan solishtiring — farqni tizim o\'zi yozadi.' });
  tools.append(el('span', 'sp'), btn('O\'tkazma', null, () => yozuvForma(ctx, { preset: { turi: 'otkazma' } })), btn('+ Hisob', 'btn-pri', () => hisobForma(ctx)));

  const faol = d.hisoblar.filter((h) => h.faol);
  const jam = (f) => faol.filter((h) => f(h) && h.boshlangich_sana).reduce((s, h) => s + h.som, 0);
  const stats = el('div', 'stats');
  stats.append(
    kpi({ nom: 'Jami (shaxsiy)', qiymat: qisqa(jam((h) => h.turi !== 'loyiha')), birlik: 'so\'m', izoh: `${guruh(Math.round(jam((h) => h.turi !== 'loyiha') / d.kurs))} $ ekvivalent` }),
    kpi({ nom: 'Kartalarda', qiymat: qisqa(jam((h) => h.turi === 'karta')), birlik: 'so\'m' }),
    kpi({ nom: 'Naqd', qiymat: qisqa(jam((h) => h.turi === 'naqd')), birlik: 'so\'m', izoh: 'so\'m va dollar' }),
    kpi({ nom: 'Jamg\'arma va birja', qiymat: qisqa(jam((h) => h.turi === 'jamgarma' || h.turi === 'birja')), birlik: 'so\'m' }),
  );
  view.append(stats);

  for (const [guruhNomi, filtr] of [['Shaxsiy hisoblar', (h) => h.turi !== 'loyiha'], ['Loyiha kassalari', (h) => h.turi === 'loyiha']]) {
    const roy = faol.filter(filtr);
    if (!roy.length) continue;
    view.append(el('div', 'sect', guruhNomi));
    const g = torTo(view);
    for (const h of roy) {
      const kiritilgan = !!h.boshlangich_sana;
      const joriy = h.oylik[h.oylik.length - 1];
      const a = el('a', 'btn btn-sm btn-ghost', 'Yozuvlar');
      a.href = `#/yozuvlar/hisob-${h.id}`;
      const c = karta(h.nomi, pill(TUR[h.turi] ?? h.turi), a);
      c.classList.add('hisob');
      const manfiy = kiritilgan && h.qoldiq < 0 && h.turi !== 'birja';
      const sp = h.qoldiqlar && h.qoldiqlar.filter((x) => x != null).length > 1 ? spark(h.qoldiqlar, 1) : null;
      const birlik = h.valyuta === 'UZS' ? 'so\'m' : h.valyuta;
      c.append(el('div', 'hero', el('div', 'lbl', 'Qoldiq'),
        el('div', 'row', el('div', `val${manfiy ? ' red' : ''}`, kiritilgan ? (h.valyuta === 'UZS' ? qisqa(h.qoldiq) : guruh(h.qoldiq, Math.abs(h.qoldiq) < 100 ? 2 : 0)) : '—',
          kiritilgan ? el('small', null, birlik) : null), el('span', 'sp'), sp),
        kiritilgan && h.valyuta !== 'UZS' ? el('div', 'sub2', `≈ ${qisqa(h.som)} so'm`) : null));
      if (!kiritilgan) c.append(el('div', 'cb', el('div', 'note orange', 'Qoldiq hali kiritilmagan — hozir qancha borligini yozing.')));
      if (manfiy) c.append(el('div', 'cb', el('div', 'note red', 'Qoldiq minusda: yozilmagan kirim bor yoki xarajat boshqa hisobga yozilgan. Haqiqiy qoldiqni tekshiring.')));
      const imzo = (n, ish) => (n ? `${ish}${pul(n, h.valyuta)}` : pul(0, h.valyuta));
      c.append(faktlar([
        [`${oyQisqa(joriy.oy)}: kirdi`, imzo(joriy.kirdi, '+')],
        [`${oyQisqa(joriy.oy)}: chiqdi`, imzo(joriy.chiqdi, '−')],
        ['Oxirgi tekshiruv', h.oxirgiTuzatish ? sana(h.oxirgiTuzatish) : kiritilgan ? `boshlang'ich: ${sana(h.boshlangich_sana)}` : '—'],
      ]));
      c.append(el('div', 'cb row', btn(kiritilgan ? 'Qoldiqni tekshirish' : 'Qoldiqni kiritish', kiritilgan && !manfiy ? 'btn-sm' : 'btn-sm btn-pri', () => qoldiqForma(ctx, h)),
        h.turi !== 'loyiha' ? btn('Tahrirlash', 'btn-sm btn-ghost', () => hisobForma(ctx, h)) : null));
      const u = el('div', 'c4 ust'); u.append(c); g.append(u);
    }
  }
  const nofaol = d.hisoblar.filter((h) => !h.faol);
  if (nofaol.length) {
    view.append(el('div', 'sect', 'O\'chirilgan hisoblar'));
    const c = karta(null);
    for (const h of nofaol) c.append(el('div', 'rw', el('div', 'tx', el('div', 't', h.nomi), el('div', 's', TUR[h.turi])), btn('Tiklash', 'btn-sm', () => hisobForma(ctx, h))));
    view.append(c);
  }
}
