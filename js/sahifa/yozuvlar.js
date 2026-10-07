// Yozuvlar: barcha kirim-chiqimlar — filtr, qidiruv, tahrirlash, CSV.

import { ol } from '../api.js';
import { bugun, guruh, oyQosh, qisqa } from '../fmt.js';
import { yozuvForma } from '../formalar.js';
import { bosh, btn, el, inp, jadval, karta, sarlavha, seg, tanlov } from '../ui.js';
import { MANBA, sanaKatak, summaKatak, yozuvTavsif } from '../umumiy.js';

// Filtrlar sahifalar orasida yurganda saqlanadi.
const f = { davr: 'oy', dan: '', gacha: '', turi: '', kategoriya: '', hisob: '', holat: 'tasdiq', q: '', sahifa: 1 };

function davrChegarasi() {
  const b = bugun(), oy = b.slice(0, 7);
  if (f.davr === 'oy') return { dan: `${oy}-01`, gacha: b };
  if (f.davr === 'otgan') { const o = oyQosh(oy, -1); return { dan: `${o}-01`, gacha: `${oy}-01` > b ? b : new Date(Date.parse(`${oy}-01`) - 86_400_000).toISOString().slice(0, 10) }; }
  if (f.davr === '3oy') return { dan: `${oyQosh(oy, -2)}-01`, gacha: b };
  if (f.davr === 'tanlash') return { dan: f.dan, gacha: f.gacha };
  return { dan: '', gacha: '' };
}

export const sorov = (o = {}) => ({ ...davrChegarasi(), turi: f.turi, kategoriya: f.kategoriya, hisob: f.hisob, holat: f.holat, q: f.q, sahifa: f.sahifa, hajm: 50, ...o });

export async function chiz(view, ctx, param) {
  if (param && /^hisob-\d+$/.test(param)) { f.hisob = param.slice(6); f.davr = '3oy'; f.sahifa = 1; history.replaceState(null, '', '#/yozuvlar'); }
  const k = ctx.katalog;
  const d = await ol('yozuvlar', sorov());

  const tools = sarlavha(view, { eyebrow: 'Pul', title: 'Yozuvlar', sub: 'Barcha kirim, chiqim, o\'tkazma va qarzlar. Qatorni bosing — tahrirlash.' });
  tools.append(
    seg([['oy', 'Bu oy'], ['otgan', 'O\'tgan oy'], ['3oy', '3 oy'], ['hammasi', 'Hammasi'], ['tanlash', 'Tanlash…']], f.davr, (v) => { f.davr = v; f.sahifa = 1; ctx.yangila(); }),
    el('span', 'sp'),
    btn('CSV yuklab olish', null, async () => {
      const r = await ol('yozuvlar', sorov({ hajm: 5000, sahifa: 1 }));
      const qatorlar = [['Sana', 'Turi', 'Summa', 'Valyuta', 'Hisob', 'Qaysi hisobga', 'Kategoriya', 'Loyiha', 'Shaxs', 'Izoh', 'Manba', 'Holat'],
        ...r.qatorlar.map((y) => [y.sana.replace('T', ' '), y.turi, y.summa, y.valyuta, y.hisob, y.ga_hisob, y.kategoriya, y.loyiha, y.shaxs, y.izoh, MANBA[y.manba] ?? y.manba, y.holat])];
      const csv = '﻿' + qatorlar.map((q) => q.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const a = el('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = `moliya-yozuvlar-${bugun()}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }),
    btn('+ Yozuv', 'btn-pri', () => yozuvForma(ctx)));

  // ─── Filtrlar ───
  const filtr = el('div', 'filters');
  if (f.davr === 'tanlash') {
    const dan = inp(f.dan, { type: 'date', max: bugun(), 'aria-label': 'Dan' }), gacha = inp(f.gacha, { type: 'date', max: bugun(), 'aria-label': 'Gacha' });
    dan.addEventListener('change', () => { f.dan = dan.value; f.sahifa = 1; ctx.yangila(); });
    gacha.addEventListener('change', () => { f.gacha = gacha.value; f.sahifa = 1; ctx.yangila(); });
    filtr.append(dan, el('span', 'faint', '—'), gacha);
  }
  const ozgar = (kalit) => (e) => { f[kalit] = e.target.value; f.sahifa = 1; ctx.yangila(); };
  const turi = tanlov([{ qiymat: 'chiqim', nom: 'Chiqim' }, { qiymat: 'kirim', nom: 'Kirim' }, { qiymat: 'otkazma', nom: 'O\'tkazma' }, { qiymat: 'qarz', nom: 'Qarz' }], f.turi, 'Barcha turlar');
  turi.addEventListener('change', ozgar('turi'));
  const kat = tanlov(k.kategoriyalar.map((c) => ({ qiymat: c.id, nom: `${c.belgi} ${c.nomi}` })), f.kategoriya, 'Barcha kategoriyalar');
  kat.addEventListener('change', ozgar('kategoriya'));
  const hisob = tanlov(k.hisoblar.map((h) => ({ qiymat: h.id, nom: h.nomi })), f.hisob, 'Barcha hisoblar');
  hisob.addEventListener('change', ozgar('hisob'));
  const holat = tanlov([{ qiymat: 'tasdiq', nom: 'Tasdiqlangan' }, { qiymat: 'kutilmoqda', nom: 'Tasdiqlanmagan' }, { qiymat: 'bekor', nom: 'Bekor qilingan' }, { qiymat: 'hammasi', nom: 'Hammasi' }], f.holat);
  holat.addEventListener('change', ozgar('holat'));
  const q = inp(f.q, { type: 'search', placeholder: 'Qidirish: izoh, kategoriya, odam…', 'aria-label': 'Qidirish' });
  let t;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { f.q = q.value; f.sahifa = 1; ctx.yangila(); }, 350); });
  filtr.append(turi, kat, hisob, holat, q);
  if (f.turi || f.kategoriya || f.hisob || f.q || f.holat !== 'tasdiq') {
    filtr.append(btn('Tozalash', 'btn-sm btn-ghost', () => { Object.assign(f, { turi: '', kategoriya: '', hisob: '', holat: 'tasdiq', q: '', sahifa: 1 }); ctx.yangila(); }));
  }
  view.append(filtr);
  setTimeout(() => { if (f.q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 0);

  // ─── Jadval ───
  const c = karta(`${guruh(d.soni)} ta yozuv`,
    el('span', 's', `chiqim ${qisqa(d.jami.chiqim)} so'm · kirim ${qisqa(d.jami.kirim)} so'm`));
  if (!d.qatorlar.length) c.append(bosh('Hech narsa topilmadi', 'Filtrlarni o\'zgartirib ko\'ring.'));
  else {
    c.append(jadval([
      { nom: 'Sana', f: sanaKatak },
      { nom: 'Nima', f: yozuvTavsif },
      { nom: 'Hisob', f: (y) => el('span', 'muted', y.turi === 'otkazma' ? `${y.hisob} → ${y.ga_hisob}` : y.hisob ?? '—') },
      { nom: 'Manba', f: (y) => el('span', 'faint small', MANBA[y.manba] ?? y.manba) },
      { nom: 'Summa', num: true, f: summaKatak },
    ], d.qatorlar, { bos: (y) => yozuvForma(ctx, { yozuv: y }), qatorCls: (y) => (y.holat === 'bekor' ? 'bekor' : '') }));
  }
  if (d.sahifalar > 1) {
    const p = el('div', 'pager');
    const oldin = el('button', null, '‹'), keyin = el('button', null, '›');
    oldin.type = keyin.type = 'button';
    oldin.disabled = f.sahifa <= 1; keyin.disabled = f.sahifa >= d.sahifalar;
    oldin.addEventListener('click', () => { f.sahifa--; ctx.yangila(); scrollTo(0, 0); });
    keyin.addEventListener('click', () => { f.sahifa++; ctx.yangila(); scrollTo(0, 0); });
    p.append(oldin, el('span', null, `${f.sahifa} / ${d.sahifalar}`), keyin);
    c.append(el('div', 'cb row', el('span', 'sp'), p));
  }
  view.append(c);
}
