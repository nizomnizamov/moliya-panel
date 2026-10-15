// Sozlamalar: AI (chegara, modellar, sarf), bot uchun standart hisoblar, kalitlar holati, xavfsizlik.

import { chiqish, ol, yoz } from '../api.js';
import { guruh, sana } from '../fmt.js';
import { loyihaMalumotForma, loyihaYangiForma } from '../formalar.js';
import { btn, el, faktlar, inp, jadval, karta, maydon, pill, sarlavha, tanlov, toast, torTo, xavfliBtn } from '../ui.js';

export async function chiz(view, ctx) {
  const d = await ol('sozlamalar');
  const k = ctx.katalog;
  sarlavha(view, { eyebrow: 'Tizim', title: 'Sozlamalar', sub: 'AI xarajati, bot uchun standart hisoblar, ulanishlar va xavfsizlik.' });
  const saqla = async (kalit, qiymat, matn = 'Saqlandi') => {
    try { await yoz('sozlama', { kalit, qiymat }); toast(matn); await ctx.katalogYangila(); ctx.yangila(); } catch (e) { toast(e.message, false); }
  };

  const g1 = torTo(view);
  {
    const c = karta('AI', pill(d.kalitlar.openrouter ? 'ulangan' : 'ulanmagan', d.kalitlar.openrouter ? 'green' : 'orange'));
    const chegara = inp(d.aiChegara, { type: 'number', min: 0, max: 100, step: 0.5 });
    const m = Object.fromEntries(['matn', 'rasm', 'ovoz', 'tahlil'].map((x) => [x, inp(d.modellar[x] ?? '', { maxlength: 100 })]));
    c.append(el('div', 'cb',
      d.kalitlar.openrouter ? null : el('p', 'note orange', 'OpenRouter kaliti hali qo\'shilmagan: ovoz, skrinshot, erkin savol va AI xulosa ishlamaydi. Oddiy matn bot qoidalari bilan ishlayveradi.'),
      el('div', 'form',
        maydon('Oylik chegara ($)', chegara, `Shu oy sarflandi: $${d.aiOyJami.toFixed(4)}`),
        el('div', 'fld', el('span', null, ' '), btn('Chegarani saqlash', 'btn-sm', () => saqla('ai_oylik_chegara_usd', Number(chegara.value), 'AI chegarasi saqlandi'))),
        maydon('Matn tahlili', m.matn), maydon('Skrinshot', m.rasm), maydon('Ovoz', m.ovoz), maydon('Maslahat va tahlil', m.tahlil),
        el('div', 'row full', el('span', 'faint small', 'OpenRouter model nomlari. Ovoz uchun audio qabul qiladigan model kerak.'), el('span', 'sp'),
          btn('Modellarni saqlash', 'btn-sm', () => saqla('modellar', Object.fromEntries(Object.entries(m).map(([x, i]) => [x, i.value.trim()])), 'Modellar saqlandi'))))));
    if (d.aiSarf.length) {
      c.append(jadval([{ nom: 'Vazifa', f: (x) => x.vazifa }, { nom: 'Model', f: (x) => el('span', 'muted small', x.model) },
        { nom: 'So\'rov', num: true, f: (x) => String(x.soni) }, { nom: 'Narx', num: true, f: (x) => `$${x.narx.toFixed(4)}` }], d.aiSarf, { cls: 'tbl-sm' }));
    }
    const u = el('div', 'c6 ust'); u.append(c);
    // Maslahatchi: halol tartibi va kripto chegarasi — AI maslahati va dashboard xulosalari shunga qarab.
    const halol = tanlov([{ qiymat: 'faqat', nom: 'Faqat halol' }, { qiymat: 'belgi', nom: 'Ikkalasi — foizlisi belgi bilan' }, { qiymat: 'farqsiz', nom: 'Farqi yo\'q' }], d.afzalliklar.halol);
    const krChegara = inp(d.afzalliklar.kripto_max_foiz, { type: 'number', min: 0, max: 50, step: 1 });
    const msl = karta('Maslahatchi', el('span', 's', `bilim: ${sana(d.bilimVersiya)}`));
    msl.append(el('div', 'cb',
      el('p', 'muted small', 'Bilimi: moliyaviy boshqaruv, investitsiya, treyding intizomi, O\'zbekiston va mintaqa iqtisodiyoti. Raqamlarni kod hisoblaydi; bozor ma\'lumoti har kuni (CBU, Bitget) va har dushanba (internet) yangilanadi. Aniq coin/aksiya bo\'yicha "sotib ol/sot" demaydi.'),
      el('div', 'form', maydon('Halol tartibi', halol), maydon('Kripto chegarasi — sof boylikdan, %', krChegara),
        el('div', 'fld', el('span', null, ' '), btn('Saqlash', 'btn-sm', () => saqla('afzalliklar', { halol: halol.value, kripto_max_foiz: Number(krChegara.value) }, 'Maslahatchi sozlamalari saqlandi'))))));
    u.append(msl);
    g1.append(u);
  }
  {
    const u = el('div', 'c6 ust');
    const c = karta('Bot uchun standart hisoblar');
    const s = Object.fromEntries(['UZS', 'USD', 'USDT'].map((v) => [v, tanlov(k.hisoblar.filter((h) => h.faol && h.valyuta === v && h.turi !== 'loyiha').map((h) => ({ qiymat: h.nomi, nom: h.nomi })), d.standart[v] ?? '', '—')]));
    c.append(el('div', 'cb', el('p', 'muted small', 'Botga hisob aytilmasa ("taksi 30"), yozuv shu hisobga tushadi.'),
      el('div', 'form', maydon('So\'m', s.UZS), maydon('Dollar', s.USD), maydon('USDT', s.USDT),
        el('div', 'fld', el('span', null, ' '), btn('Saqlash', 'btn-sm', () => saqla('standart_hisob', Object.fromEntries(Object.entries(s).filter(([, x]) => x.value).map(([v, x]) => [v, x.value])), 'Standart hisoblar saqlandi'))))));
    u.append(c);
    const c2 = karta('Ulanishlar');
    c2.append(faktlar([
      ['OpenRouter (AI)', d.kalitlar.openrouter ? 'ulangan' : 'ulanmagan', d.kalitlar.openrouter ? 'green' : null],
      ['Bitget (faqat o\'qish)', d.kalitlar.bitget ? 'ulangan' : 'ulanmagan', d.kalitlar.bitget ? 'green' : null],
      ['Valyuta kursi', `1$ = ${guruh(d.kurs)} so'm · ${sana(d.kursSana)} (Markaziy bank)`],
    ]));
    u.append(c2);
    const c3 = karta('Xavfsizlik');
    c3.append(el('div', 'cb', el('p', 'muted small', 'Kirish faqat botdagi bir martalik havola orqali. Seans 30 kun saqlanadi. Telefon yoki kompyuter yo\'qolsa — hamma joydan chiqing.'),
      el('div', 'row', btn('Shu brauzerdan chiqish', 'btn-sm', () => { chiqish(); location.reload(); }), el('span', 'sp'),
        xavfliBtn('Barcha qurilmalardan chiqish', async () => { await yoz('chiqish-hammasi', {}); chiqish(); location.reload(); }, 'btn-sm btn-bad'))));
    u.append(c3);
    // Tizim holati: rejali xabarlar rostdan ketdimi, xato bo'ldimi (bot va funksiya loglari tez o'chadi — bu jurnal saqlanadi).
    const t = d.tizim;
    const oxirgi = (nom) => t.oxirgi.find((x) => x.vazifa === nom);
    const vaqt = (v) => `${v.slice(8, 10)}.${v.slice(5, 7)} ${v.slice(11)}`;   // "2026-10-15 22:00" → "15.10 22:00"
    const qator = (nom, sarlavha) => {
      const x = oxirgi(nom);
      return [sarlavha, x ? `${vaqt(x.vaqt)} · ${x.holat === 'ok' ? 'ketdi' : 'xato'}` : 'hali ishlamagan', x ? (x.holat === 'ok' ? 'green' : 'red') : null];
    };
    const c4 = karta('Tizim holati', t.xatolar.length ? pill(`${t.xatolar.length} ta xato`, 'orange') : pill('xatosiz', 'green'));
    c4.append(faktlar([
      qator('kechki', `Kechki xabar (${String(d.xabarlar.kechki_soat).padStart(2, '0')}:00)`),
      qator('haftalik', 'Haftalik tahlil (yakshanba)'),
      qator('bozor', 'Bozor sharhi (dushanba)'),
      ['Bitget sinxroni (har soat)', t.kripto ? vaqt(t.kripto) : '—', t.kripto ? 'green' : null],
    ]));
    if (t.xatolar.length) {
      c4.append(jadval([{ nom: 'Vaqt', f: (x) => el('span', 'muted small', vaqt(x.vaqt)) }, { nom: 'Qayerda', f: (x) => x.vazifa },
        { nom: 'Xato', f: (x) => el('span', 'small', x.tafsilot ?? '') }], t.xatolar, { cls: 'tbl-sm' }));
    }
    u.append(c4);
    g1.append(u);
  }

  // ─── Xabarlar, loyihalar, ma'lumotlar ───
  const g2 = torTo(view);
  {
    const x = d.xabarlar;
    const quti = (v) => { const q = inp(null, { type: 'checkbox' }); q.checked = v; return q; };
    const kechki = quti(x.kechki), haftalik = quti(x.haftalik), jurnal = quti(x.jurnal), bozor = quti(x.bozor);
    const soat = tanlov(Array.from({ length: 24 }, (_, h) => ({ qiymat: h, nom: `${String(h).padStart(2, '0')}:00` })), x.kechki_soat);
    const c = karta('Xabarlar', el('span', 's', 'Telegram bot'));
    c.append(el('div', 'cb', el('div', 'form',
      el('label', 'row full', kechki, 'Kechki xabar (kun xulosasi, yaqin to\'lovlar tugmalari bilan)'),
      maydon('Kechki xabar vaqti (Toshkent)', soat),
      el('label', 'row full', haftalik, 'Yakshanba — haftalik tahlil (AI, ~$0.01)'),
      el('label', 'row full', jurnal, 'Yangi kripto savdodan keyin sababini so\'rash'),
      el('label', 'row full', bozor, 'Dushanba — bozor sharhi internetdan (AI, ~$0.02)'),
      el('div', 'fld', el('span', null, ' '), btn('Saqlash', 'btn-sm', () => saqla('xabarlar', {
        kechki: kechki.checked, kechki_soat: Number(soat.value), haftalik: haftalik.checked, jurnal: jurnal.checked, bozor: bozor.checked,
      }, 'Xabar sozlamalari saqlandi'))))));
    const u = el('div', 'c6 ust'); u.append(c); g2.append(u);
  }
  {
    const u = el('div', 'c6 ust');
    const c = karta('Loyihalar', btn('+ Yangi loyiha', 'btn-sm btn-ghost', () => loyihaYangiForma(ctx)));
    c.append(k.loyihalar.length ? jadval([
      { nom: 'Loyiha', f: (l) => el('b', null, l.nomi) },
      { nom: 'Holat', f: (l) => pill(l.faol ? 'faol' : 'arxivda', l.faol ? 'green' : '') },
      { nom: '', f: (l) => btn('Ochish', 'btn-sm btn-ghost', (e) => { e.stopPropagation(); ctx.bor(`loyiha/${l.id}`); }) },
    ], k.loyihalar, { bos: (l) => loyihaMalumotForma(ctx, l), cls: 'tbl-sm' }) : el('div', 'cb', el('p', 'muted small', 'Loyiha yo\'q.')));
    u.append(c);
    const m = karta('Ma\'lumotlar');
    const sinx = btn('Bitgetni hozir sinxronlash', 'btn-sm', async () => {
      sinx.disabled = true;
      try { const r = await yoz('kripto/sinxron', {}); toast(`Bitget yangilandi${r.olindi ? `: ${r.olindi.slice(11)}` : ''}`); } catch (e) { toast(e.message, false); } finally { sinx.disabled = false; }
    });
    const bozorB = xavfliBtn('Bozor sharhini hozir yangilash (~$0.02)', async () => {
      try { await yoz('bozor/yangila', {}); toast('Bozor sharhi yangilandi — Tahlil sahifasida va Telegram\'da'); } catch (e) { toast(e.message, false); }
    }, 'btn-sm');
    const zaxira = btn('To\'liq zaxira (JSON) yuklab olish', 'btn-sm', async () => {
      try {
        const z = await ol('eksport');
        const a = el('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(z, null, 1)], { type: 'application/json' }));
        a.download = `moliya-zaxira-${z.olindi.slice(0, 10)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      } catch (e) { toast(e.message, false); }
    });
    m.append(el('div', 'cb', el('p', 'muted small', 'Zaxirada hamma narsa bor: yozuvlar, hisoblar, to\'lovlar, loyihalar, kripto, summa tarixi va sozlamalar (kalitlarsiz).'),
      el('div', 'row', sinx, bozorB), el('div', 'row', zaxira, btn('O\'zgarishlar tarixi', 'btn-sm btn-ghost', () => ctx.bor('tarix')))));
    u.append(m);
    g2.append(u);
  }
}
