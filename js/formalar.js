// Tahrirlash oynalari (drawer). Har biri saqlangach — toast va sahifa yangilanadi.

import { yoz } from './api.js';
import { bugun, pul, sana } from './fmt.js';
import { drawer, el, inp, maydon, seg, summaInp, tanlov, toast, xavfliBtn } from './ui.js';

const TUR_NOMI = { karta: 'Kartalar', naqd: 'Naqd', birja: 'Birja', jamgarma: 'Jamg\'arma', loyiha: 'Loyiha kassalari' };

/** Hisoblar ro'yxati — turi bo'yicha guruhlangan. */
function hisobVariantlari(k, filtr = () => true) {
  const guruhlar = {};
  for (const h of k.hisoblar.filter((x) => x.faol && filtr(x))) {
    (guruhlar[h.turi] ??= []).push({ qiymat: h.id, nom: `${h.nomi} · ${h.valyuta === 'UZS' ? 'so\'m' : h.valyuta}` });
  }
  return Object.entries(guruhlar).map(([t, v]) => ({ guruh: TUR_NOMI[t] ?? t, variantlar: v }));
}

const saqlandi = async (ctx, matn, katalog = false) => {
  toast(matn);
  if (katalog) await ctx.katalogYangila();
  ctx.yangila();
};

// ─── Yozuv (chiqim, kirim, o'tkazma, qarz) ──────────────────────

const QARZ = [['qarz_berdim', 'Qarz berdim'], ['qarz_oldim', 'Qarz oldim'], ['qarz_qaytardim', 'Qarzimni qaytardim'], ['qarz_qaytdi', 'Menga qaytardi']];

export function yozuvForma(ctx, { yozuv = null, preset = {} } = {}) {
  const k = ctx.katalog;
  const y = { turi: 'chiqim', sana: bugun(), ...preset, ...(yozuv ?? {}) };
  let turi = y.turi.startsWith('qarz') ? 'qarz' : y.turi;
  let qarzTuri = y.turi.startsWith('qarz') ? y.turi : 'qarz_berdim';
  const standartUZS = k.standartId?.UZS;

  const summa = summaInp(y.summa ?? '', { placeholder: '0' });
  const birlik = el('span', 'faint small');
  const sanaI = inp((y.sana ?? bugun()).slice(0, 10), { type: 'date', max: bugun() });
  const vaqtI = inp(y.sana && y.sana.length > 10 ? y.sana.slice(11, 16) : '', { type: 'time' });
  const hisob = tanlov(hisobVariantlari(k), y.hisob_id ?? standartUZS, null);
  const hisobQarz = tanlov([{ qiymat: '', nom: 'Pul harakatisiz (faqat qarzni yozish)' }, ...hisobVariantlari(k, (h) => h.turi !== 'loyiha')], y.hisob_id ?? '', null);
  const ga = tanlov(hisobVariantlari(k), y.ga_hisob_id ?? '', 'Tanlang…');
  const gaSumma = summaInp(y.ga_summa ?? '', { placeholder: 'tushgan summa' });
  const kat = el('select');
  const shaxs = tanlov([...k.shaxslar.map((s) => ({ qiymat: s.id, nom: s.ism })), { qiymat: 'yangi', nom: '+ Yangi odam…' }], y.shaxs_id ?? '', 'Tanlang…');
  const yangiShaxs = inp('', { placeholder: 'Ism' });
  const izoh = inp(y.izoh ?? '', { placeholder: 'Masalan: Korzinka, taksi', maxlength: 200 });

  const hisobOl = (id) => k.hisoblar.find((h) => String(h.id) === String(id));
  const katToldir = () => {
    const h = hisobOl(hisob.value);
    const kassa = h?.turi === 'loyiha';
    const turlar = turi === 'kirim' ? (kassa ? ['loyiha_kirim'] : ['kirim']) : (kassa ? ['loyiha_chiqim'] : ['chiqim', 'tizim']);
    const eski = kat.value || y.kategoriya_id;
    kat.replaceChildren(el('option', null, '—'));
    kat.firstChild.value = '';
    for (const c of k.kategoriyalar.filter((x) => turlar.includes(x.turi))) {
      const o = el('option', null, `${c.belgi} ${c.nomi}`);
      o.value = c.id;
      kat.append(o);
    }
    if (eski && [...kat.options].some((o) => o.value === String(eski))) kat.value = String(eski);
  };

  const f = {
    qarzTuri: maydon('Qarz turi', seg(QARZ, qarzTuri, (v) => { qarzTuri = v; }), null, true),
    summa: maydon('Summa', summa),
    birlik,
    sana: el('div', 'fld', el('span', null, 'Sana va vaqt'), el('div', 'sana-vaqt', sanaI, vaqtI)),
    hisob: maydon('Hisob', hisob, null, true),
    hisobQarz: maydon('Hisob', hisobQarz, 'Pul qaysi hisobdan chiqdi yoki qaysi hisobga kirdi', true),
    ga: maydon('Qaysi hisobga', ga, null, true),
    gaSumma: maydon('Tushgan summa', gaSumma, 'Hisoblar valyutasi har xil — qancha tushganini yozing', true),
    kat: maydon('Kategoriya', kat, null, true),
    shaxs: maydon('Kim', shaxs),
    yangiShaxs: maydon('Yangi odam ismi', yangiShaxs),
    izoh: maydon('Izoh', izoh, null, true),
  };
  const yangilaKorinish = () => {
    const h = turi === 'qarz' ? hisobOl(hisobQarz.value) : hisobOl(hisob.value);
    birlik.textContent = h ? (h.valyuta === 'UZS' ? 'so\'m' : h.valyuta) : 'so\'m / $';
    f.summa.querySelector('span').textContent = `Summa (${birlik.textContent})`;
    f.qarzTuri.hidden = turi !== 'qarz';
    f.hisob.hidden = turi === 'qarz';
    f.hisobQarz.hidden = turi !== 'qarz';
    f.ga.hidden = turi !== 'otkazma';
    const g = hisobOl(ga.value);
    f.gaSumma.hidden = !(turi === 'otkazma' && g && h && g.valyuta !== h.valyuta);
    f.kat.hidden = !(turi === 'chiqim' || turi === 'kirim');
    f.shaxs.hidden = turi !== 'qarz';
    f.yangiShaxs.hidden = !(turi === 'qarz' && shaxs.value === 'yangi');
    f.hisob.querySelector('span').textContent = turi === 'otkazma' ? 'Qaysi hisobdan' : 'Hisob';
    katToldir();
  };
  hisob.addEventListener('change', yangilaKorinish);
  hisobQarz.addEventListener('change', yangilaKorinish);
  ga.addEventListener('change', yangilaKorinish);
  shaxs.addEventListener('change', yangilaKorinish);

  const turSeg = seg([['chiqim', 'Chiqim'], ['kirim', 'Kirim'], ['otkazma', 'O\'tkazma'], ['qarz', 'Qarz']], turi, (v) => { turi = v; yangilaKorinish(); });
  const tana = el('div', 'form', maydon('Turi', turSeg, null, true), f.qarzTuri, f.summa, f.sana, f.hisob, f.hisobQarz, f.ga, f.gaSumma,
    f.kat, f.shaxs, f.yangiShaxs, f.izoh);
  yangilaKorinish();

  const qoshimcha = [];
  if (yozuv?.id) {
    qoshimcha.push(yozuv.holat === 'bekor'
      ? el('button', 'btn', 'Qayta tiklash')
      : xavfliBtn('Bekor qilish', async () => {
        await yoz('yozuv/holat', { id: yozuv.id, holat: 'bekor' });
        oyna.yop(); saqlandi(ctx, 'Yozuv bekor qilindi');
      }));
    if (yozuv.holat === 'bekor') qoshimcha[0].addEventListener('click', async () => { await yoz('yozuv/holat', { id: yozuv.id, holat: 'tasdiq' }); oyna.yop(); saqlandi(ctx, 'Tiklandi'); });
  }
  const sarlavha = yozuv?.id ? 'Yozuvni tahrirlash' : 'Yangi yozuv';
  const oyna = drawer({
    sarlavha, tana, qoshimcha,
    saqla: async () => {
      const qiymat = summa.son();
      if (!qiymat || qiymat <= 0) throw new Error('Summani kiriting');
      const body = {
        id: yozuv?.id, turi: turi === 'qarz' ? qarzTuri : turi, summa: qiymat,
        sana: vaqtI.value ? `${sanaI.value}T${vaqtI.value}` : sanaI.value,
        hisob_id: turi === 'qarz' ? (hisobQarz.value || null) : hisob.value,
        izoh: izoh.value,
      };
      if (turi === 'qarz' && !hisobQarz.value) body.valyuta = 'UZS';
      if (turi === 'otkazma') { body.ga_hisob_id = ga.value; if (!f.gaSumma.hidden) body.ga_summa = gaSumma.son(); }
      if (turi === 'chiqim' || turi === 'kirim') body.kategoriya_id = kat.value || null;
      if (turi === 'qarz') {
        if (shaxs.value === 'yangi') body.yangi_shaxs = yangiShaxs.value; else body.shaxs_id = shaxs.value || null;
        if (!body.shaxs_id && !body.yangi_shaxs) throw new Error('Kim bilan — tanlang');
      }
      await yoz('yozuv', body);
      await saqlandi(ctx, yozuv?.id ? 'O\'zgartirildi' : 'Yozildi', turi === 'qarz' && shaxs.value === 'yangi');
    },
  });
  return oyna;
}

// ─── Hisob ──────────────────────────────────────────────────────

export function qoldiqForma(ctx, h) {
  const s = summaInp(h.qoldiq ?? '', {});
  drawer({
    sarlavha: `Qoldiqni tekshirish — ${h.nomi}`,
    tana: el('div', 'form', maydon(`Hozir haqiqatda qancha bor (${h.valyuta === 'UZS' ? 'so\'m' : h.valyuta})`, s,
      h.boshlangich_sana ? `Hisob bo'yicha: ${pul(h.qoldiq ?? 0, h.valyuta)}. Farq «Yozilmagan» bo'lib yoziladi.` : 'Birinchi marta — boshlang\'ich qoldiq bo\'ladi.', true)),
    saqlaNom: 'Tekshirish',
    saqla: async () => {
      const v = s.son();
      if (v == null) throw new Error('Qoldiqni kiriting');
      const r = await yoz('hisob/qoldiq', { id: h.id, summa: v });
      await saqlandi(ctx, r.birinchi ? 'Boshlang\'ich qoldiq yozildi' : r.farq === 0 ? 'Hammasi yozilgan 👍' : `Farq: ${pul(Math.abs(r.farq), h.valyuta)} — «Yozilmagan» bo'lib yozildi`, true);
    },
  });
}

export function hisobForma(ctx, h = null) {
  const nomi = inp(h?.nomi ?? '', { maxlength: 60 });
  const turi = tanlov(Object.entries(TUR_NOMI).filter(([t]) => t !== 'loyiha').map(([qiymat, nom]) => ({ qiymat, nom })), h?.turi ?? 'karta');
  const valyuta = tanlov([{ qiymat: 'UZS', nom: 'So\'m' }, { qiymat: 'USD', nom: 'Dollar' }, { qiymat: 'USDT', nom: 'USDT' }], h?.valyuta ?? 'UZS');
  const kal = inp((h?.kalitlar ?? []).join(', '), { placeholder: 'kapital, uzcard' });
  const faol = inp(null, { type: 'checkbox' }); faol.checked = h?.faol ?? true;
  if (h) turi.disabled = true;
  drawer({
    sarlavha: h ? `Hisob — ${h.nomi}` : 'Yangi hisob',
    tana: el('div', 'form', maydon('Nomi', nomi, null, true), maydon('Turi', turi), maydon('Valyuta', valyuta),
      maydon('Botdagi kalit so\'zlar', kal, 'Vergul bilan. Botga "taksi 30 kapital" deb yozilsa, shu hisob tanlanadi.', true),
      el('label', 'row full', faol, 'Faol (o\'chirilsa — hisobotlarda ko\'rinmaydi)')),
    saqla: async () => {
      await yoz('hisob', { id: h?.id, nomi: nomi.value, turi: turi.value, valyuta: valyuta.value, kalitlar: kal.value, faol: faol.checked });
      await saqlandi(ctx, 'Saqlandi', true);
    },
  });
}

// ─── Kategoriya ─────────────────────────────────────────────────

export function kategoriyaForma(ctx, c = null) {
  const nomi = inp(c?.nomi ?? '', { maxlength: 40 });
  const belgi = inp(c?.belgi ?? '', { maxlength: 8, placeholder: '🛒' });
  const limit = summaInp(c?.limit ?? '', { placeholder: 'limit yo\'q' });
  const kal = el('textarea');
  kal.value = (c?.kalitlar ?? []).join(', ');
  kal.placeholder = 'bozor, magazin, korzinka';
  drawer({
    sarlavha: c ? `Kategoriya — ${c.nomi}` : 'Yangi kategoriya',
    tana: el('div', 'form', maydon('Nomi', nomi), maydon('Belgi (emoji)', belgi), maydon('Oylik limit (so\'m)', limit, 'Bo\'sh — limit yo\'q', true),
      maydon('Botdagi kalit so\'zlar', kal, 'Vergul bilan. "taksi 30" — "taksi" shu ro\'yxatda bo\'lsa, bot AI\'siz tanib oladi.', true)),
    saqla: async () => {
      await yoz('kategoriya', { id: c?.id, nomi: nomi.value, belgi: belgi.value, oylik_limit: limit.son(), kalitlar: kal.value });
      await saqlandi(ctx, 'Saqlandi', true);
    },
  });
}

// ─── Doimiy to'lov ──────────────────────────────────────────────

export function doimiyForma(ctx, d = null) {
  const k = ctx.katalog;
  const nomi = inp(d?.nomi ?? '', { maxlength: 60, placeholder: 'Internet' });
  const summa = summaInp(d?.summa ?? '', {});
  const valyuta = tanlov([{ qiymat: 'UZS', nom: 'So\'m' }, { qiymat: 'USD', nom: 'Dollar' }], d?.valyuta ?? 'UZS');
  let jadval = d?.sana ? 'bir' : 'oylik';
  const kun = inp(d?.kun ?? '', { type: 'number', min: 1, max: 31, placeholder: '1–31' });
  const sanaI = inp(d?.sana ?? '', { type: 'date' });
  let turi = d?.turi ?? 'chiqim';
  const kat = tanlov(k.kategoriyalar.filter((c) => c.turi === 'chiqim' || c.turi === 'loyiha_chiqim').map((c) => ({ qiymat: c.id, nom: `${c.belgi} ${c.nomi}` })), d?.kategoriya_id ?? '', '—');
  const shaxs = tanlov(k.shaxslar.map((s) => ({ qiymat: s.id, nom: s.ism })), d?.shaxs_id ?? '', 'Tanlang…');
  const hisob = tanlov(hisobVariantlari(k), d?.hisob_id ?? '', 'Har safar so\'ralsin');
  const qolgan = inp(d?.qolgan_marta ?? '', { type: 'number', min: 0, placeholder: 'cheksiz' });
  const faol = inp(null, { type: 'checkbox' }); faol.checked = d?.faol ?? true;
  const fKun = maydon('Har oyning nechanchi sanasida', kun), fSana = maydon('Sana', sanaI);
  const fKat = maydon('Kategoriya', kat), fShaxs = maydon('Kimga (qarz)', shaxs);
  const korinish = () => { fKun.hidden = jadval !== 'oylik'; fSana.hidden = jadval !== 'bir'; fKat.hidden = turi !== 'chiqim'; fShaxs.hidden = turi === 'chiqim'; };
  const tana = el('div', 'form', maydon('Nomi', nomi, null, true), maydon('Summa', summa), maydon('Valyuta', valyuta),
    maydon('Jadval', seg([['oylik', 'Har oy'], ['bir', 'Bir martalik']], jadval, (v) => { jadval = v; korinish(); }), null, true), fKun, fSana,
    maydon('Turi', seg([['chiqim', 'Xarajat'], ['qarz_qaytardim', 'Qarz to\'lovi']], turi, (v) => { turi = v; korinish(); }), null, true), fKat, fShaxs,
    maydon('Qaysi hisobdan', hisob, 'Belgilansa — kechki xabarda bitta "To\'landi" tugmasi', true),
    maydon('Necha marta qoldi', qolgan, 'Masalan, bo\'lib to\'lashda — qolgan to\'lovlar soni'), el('label', 'row', faol, 'Faol'));
  korinish();
  drawer({
    sarlavha: d ? `To'lov — ${d.nomi}` : 'Yangi doimiy to\'lov', tana,
    saqla: async () => {
      await yoz('doimiy', { id: d?.id, nomi: nomi.value, summa: summa.son(), valyuta: valyuta.value,
        kun: jadval === 'oylik' ? kun.value : null, sana: jadval === 'bir' ? sanaI.value : null, turi,
        kategoriya_id: turi === 'chiqim' ? kat.value || null : null, shaxs_id: turi === 'chiqim' ? null : shaxs.value || null,
        hisob_id: hisob.value || null, qolgan_marta: qolgan.value === '' ? null : qolgan.value, faol: faol.checked });
      await saqlandi(ctx, 'Saqlandi');
    },
  });
}

export function tolaForma(ctx, d) {
  const k = ctx.katalog;
  const mos = k.hisoblar.filter((h) => h.faol && h.valyuta === d.valyuta && (d.hisob_id ? h.id === d.hisob_id : h.turi !== 'loyiha' && h.turi !== 'jamgarma'));
  const hisob = tanlov(mos.map((h) => ({ qiymat: h.id, nom: `${h.nomi} · ${pul(h.qoldiq ?? 0, h.valyuta)}` })), d.hisob_id ?? k.standartId?.[d.valyuta] ?? mos[0]?.id);
  drawer({
    sarlavha: `To'landi — ${d.nomi}`,
    tana: el('div', 'form', el('div', 'fld full', el('span', null, 'Summa'), el('b', 'num', pul(d.summa, d.valyuta))), maydon('Qaysi hisobdan', hisob, null, true)),
    saqlaNom: 'To\'landi',
    saqla: async () => {
      await yoz('doimiy/tola', { id: d.id, davr: d.davr, hisob_id: hisob.value });
      await saqlandi(ctx, `${d.nomi} — yozildi`, true);
    },
  });
}

// ─── Shaxs, maqsad, mulk ────────────────────────────────────────

export function shaxsForma(ctx, s = null) {
  const ism = inp(s?.ism ?? '', { maxlength: 60 });
  const izoh = inp(s?.izoh ?? '', { maxlength: 200 });
  drawer({
    sarlavha: s ? s.ism : 'Yangi odam',
    tana: el('div', 'form', maydon('Ism', ism, null, true), maydon('Izoh', izoh, null, true)),
    saqla: async () => { await yoz('shaxs', { id: s?.id, ism: ism.value, izoh: izoh.value }); await saqlandi(ctx, 'Saqlandi', true); },
  });
}

export function maqsadForma(ctx, m = null) {
  const k = ctx.katalog;
  const nomi = inp(m?.nomi ?? '', { maxlength: 80 });
  const summa = summaInp(m?.summa ?? '', {});
  const valyuta = tanlov([{ qiymat: 'USD', nom: 'Dollar' }, { qiymat: 'UZS', nom: 'So\'m' }], m?.valyuta ?? 'USD');
  const muddat = inp(m?.muddat ?? '', { type: 'date' });
  const hisob = tanlov(hisobVariantlari(k, (h) => h.turi !== 'loyiha'), m?.hisob_id ?? '', 'Tanlanmagan');
  const izoh = inp(m?.izoh ?? '', { maxlength: 200 });
  drawer({
    sarlavha: m ? m.nomi : 'Yangi maqsad',
    tana: el('div', 'form', maydon('Nomi', nomi, null, true), maydon('Kerakli summa', summa), maydon('Valyuta', valyuta), maydon('Muddat', muddat),
      maydon('Pul qaysi hisobda yig\'iladi', hisob, 'Yig\'ilgan summa shu hisob qoldig\'idan olinadi'), maydon('Izoh', izoh, null, true)),
    saqla: async () => {
      await yoz('maqsad', { id: m?.id, nomi: nomi.value, summa: summa.son(), valyuta: valyuta.value, muddat: muddat.value, hisob_id: hisob.value || null, izoh: izoh.value, faol: true });
      await saqlandi(ctx, 'Saqlandi');
    },
  });
}

export function mulkForma(ctx, m = null) {
  const nomi = inp(m?.nomi ?? '', { maxlength: 80 });
  const qiymat = summaInp(m?.qiymat ?? '', {});
  const valyuta = tanlov([{ qiymat: 'USD', nom: 'Dollar' }, { qiymat: 'UZS', nom: 'So\'m' }], m?.valyuta ?? 'USD');
  const izoh = inp(m?.izoh ?? '', { maxlength: 200 });
  const faol = inp(null, { type: 'checkbox' }); faol.checked = m?.faol ?? true;
  drawer({
    sarlavha: m ? m.nomi : 'Yangi mulk',
    tana: el('div', 'form', maydon('Nomi', nomi, null, true), maydon('Qiymati', qiymat), maydon('Valyuta', valyuta), maydon('Izoh', izoh, null, true),
      el('label', 'row', faol, 'Hisobga olinsin (sotilgan bo\'lsa — belgini oling)')),
    saqla: async () => { await yoz('mulk', { id: m?.id, nomi: nomi.value, qiymat: qiymat.son(), valyuta: valyuta.value, izoh: izoh.value, faol: faol.checked }); await saqlandi(ctx, 'Saqlandi'); },
  });
}

// ─── Loyiha ─────────────────────────────────────────────────────

export function shartlarForma(ctx, l) {
  const sh = l.shartlar ?? {};
  const fiks = (sh.fiks ?? []).map((f) => ({ ...f }));
  const bonus = (sh.bonus ?? []).map((b) => ({ ...b }));
  const sherik = inp(l.sherik ?? '', { maxlength: 60 });
  const ulush = inp(Math.round(Number(l.mening_ulushim) * 100), { type: 'number', min: 1, max: 100 });
  const bonusKuni = inp(sh.bonus_kuni ?? 5, { type: 'number', min: 1, max: 31 });
  const fiksJoy = el('div', 'full'), bonusJoy = el('div', 'full');
  const qator = (roy, i, maydonlar, joy, chiz) => {
    const x = el('button', 'x', '✕'); x.type = 'button'; x.title = 'Olib tashlash';
    x.addEventListener('click', () => { roy.splice(i, 1); chiz(); });
    return el('div', 'row', ...maydonlar, x);
  };
  const fiksChiz = () => {
    fiksJoy.replaceChildren(el('div', 'fld', el('span', null, 'Fiks to\'lovlar (har oy)')),
      ...fiks.map((f, i) => {
        const kun = inp(f.kun, { type: 'number', min: 1, max: 31, class: 'inp-sm', 'aria-label': 'Kun' });
        const s = summaInp(f.summa, { class: 'inp-sm', 'aria-label': 'Summa' });
        kun.addEventListener('input', () => { f.kun = Number(kun.value); });
        s.addEventListener('input', () => { f.summa = s.son(); });
        return qator(fiks, i, [el('span', 'muted small', 'har oy'), kun, el('span', 'muted small', '-sanada'), s, el('span', 'muted small', sh.valyuta ?? 'USD')], fiksJoy, fiksChiz);
      }),
      el('button', 'link', '+ Qism qo\'shish'));
    fiksJoy.lastChild.type = 'button';
    fiksJoy.lastChild.addEventListener('click', () => { fiks.push({ kun: 1, summa: 0 }); fiksChiz(); });
  };
  const bonusChiz = () => {
    bonusJoy.replaceChildren(el('div', 'fld', el('span', null, 'Bonus stavkasi (har bir sotuvdan)')),
      ...bonus.map((b, i) => {
        const dan = inp(b.dan, { type: 'month', class: 'inp-sm', 'aria-label': 'Qaysi oydan' });
        const s = summaInp(b.summa, { class: 'inp-sm', 'aria-label': 'Stavka' });
        dan.addEventListener('input', () => { b.dan = dan.value; });
        s.addEventListener('input', () => { b.summa = s.son(); });
        return qator(bonus, i, [dan, el('span', 'muted small', 'oydan boshlab'), s, el('span', 'muted small', `${sh.valyuta ?? 'USD'} / sotuv`)], bonusJoy, bonusChiz);
      }),
      el('button', 'link', '+ Stavka qo\'shish'));
    bonusJoy.lastChild.type = 'button';
    bonusJoy.lastChild.addEventListener('click', () => { bonus.push({ dan: bugun().slice(0, 7), summa: 0 }); bonusChiz(); });
  };
  fiksChiz(); bonusChiz();
  drawer({
    sarlavha: `${l.nomi} — shartlar`,
    tana: el('div', 'form', maydon('Sherik', sherik), maydon('Mening ulushim (%)', ulush), fiksJoy, bonusJoy,
      maydon('Bonus keyingi oyning nechanchi sanasida', bonusKuni),
      el('p', 'note full', 'Shu oydan boshlab kutilayotgan fiks to\'lovlar yangi shartlarga moslanadi. O\'tgan oylar tarixi o\'zgarmaydi.')),
    saqla: async () => {
      await yoz('loyiha', { id: l.id, sherik: sherik.value, mening_ulushim: Number(ulush.value) / 100,
        shartlar: { valyuta: sh.valyuta ?? 'USD', fiks, bonus, bonus_kuni: Number(bonusKuni.value) } });
      await saqlandi(ctx, 'Shartlar saqlandi', true);
    },
  });
}

export function sotuvForma(ctx, l) {
  const oy = inp(bugun().slice(0, 7), { type: 'month', max: bugun().slice(0, 7) });
  const soni = inp('', { type: 'number', min: 0, placeholder: '18' });
  drawer({
    sarlavha: `${l.nomi} — sotuvlar soni`,
    tana: el('div', 'form', maydon('Oy', oy), maydon('Nechta sotuv', soni), el('p', 'note full', 'Bonus shu oy stavkasi bo\'yicha hisoblanadi va kutilayotgan tushumlarga qo\'shiladi.')),
    saqla: async () => {
      const r = await yoz('loyiha/sotuv', { loyiha_id: l.id, oy: oy.value, soni: soni.value });
      await saqlandi(ctx, `Bonus: ${pul(r.summa, l.shartlar?.valyuta ?? 'USD')} — ${sana(r.muddat)} gacha kutiladi`);
    },
  });
}

export function rejaForma(ctx, l, r = null) {
  const nomi = inp(r?.nomi ?? '', { maxlength: 60 });
  const turi = tanlov([{ qiymat: 'fiks', nom: 'Fiks' }, { qiymat: 'bonus', nom: 'Bonus' }], r?.turi ?? 'fiks');
  const summa = summaInp(r?.summa ?? '', {});
  const muddat = inp(r?.muddat ?? bugun(), { type: 'date' });
  drawer({
    sarlavha: r ? r.nomi : 'Kutilayotgan to\'lov qo\'shish',
    tana: el('div', 'form', maydon('Nomi', nomi, null, true), maydon('Turi', turi), maydon(`Summa (${l.shartlar?.valyuta ?? 'USD'})`, summa), maydon('Muddat', muddat)),
    saqla: async () => {
      await yoz('reja', { id: r?.id, loyiha_id: l.id, nomi: nomi.value, turi: turi.value, summa: summa.son(), valyuta: l.shartlar?.valyuta ?? 'USD', muddat: muddat.value });
      await saqlandi(ctx, 'Saqlandi');
    },
  });
}

