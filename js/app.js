// Dashboard karkasi: kirish, menyu, mavzu, sahifalar orasida yurish (#/manzil).

import { chiqish, hodisa, KATALOG, kirish, KirishKerak, ol, oldindan, sessiya } from './api.js';
import { bugun, guruh, sana } from './fmt.js';
import { btn, el, ikon } from './ui.js';
import { tipYashir } from './chart.js';

const SAHIFALAR = {
  bosh: () => import('./sahifa/bosh.js'),
  tahlil: () => import('./sahifa/tahlil.js'),
  yozuvlar: () => import('./sahifa/yozuvlar.js'),
  hisoblar: () => import('./sahifa/hisoblar.js'),
  byudjet: () => import('./sahifa/byudjet.js'),
  tolovlar: () => import('./sahifa/tolovlar.js'),
  qarzlar: () => import('./sahifa/qarzlar.js'),
  loyiha: () => import('./sahifa/loyiha.js'),
  maqsad: () => import('./sahifa/maqsad.js'),
  kripto: () => import('./sahifa/kripto.js'),
  sozlamalar: () => import('./sahifa/sozlamalar.js'),
};

/** Sahifalar umumiy holati: katalog (hisoblar, kategoriyalar, ...) va qayta chizish. */
export const ctx = {
  katalog: null,
  async katalogYangila() {
    ctx.katalog = await ol('katalog');
    try { localStorage.setItem(KATALOG, JSON.stringify(ctx.katalog)); } catch { /* */ }
    menyu(); kursYoz(); return ctx.katalog;
  },
  yangila: () => chiz(),
  bor: (yol) => { location.hash = `#/${yol}`; },
};

function manzil() {
  const [nom, param] = location.hash.replace(/^#\/?/, '').split('/');
  return { nom: SAHIFALAR[nom] ? nom : 'bosh', param };
}

function menyu() {
  const nav = document.getElementById('nav');
  const { nom, param } = manzil();
  const loyihalar = (ctx.katalog?.loyihalar ?? []).filter((l) => l.faol);
  const guruhlar = [
    ['Umumiy', [['bosh', 'Bosh sahifa'], ['tahlil', 'Tahlil']]],
    ['Pul', [['yozuvlar', 'Yozuvlar'], ['hisoblar', 'Hisoblar'], ['byudjet', 'Byudjet']]],
    ['Majburiyatlar', [['tolovlar', 'To\'lovlar'], ['qarzlar', 'Qarzlar']]],
    ['Loyihalar', loyihalar.map((l) => [`loyiha/${l.id}`, l.nomi])],
    ['Kapital', [['maqsad', 'Maqsad va mulk'], ['kripto', 'Kripto']]],
    ['Tizim', [['sozlamalar', 'Sozlamalar']]],
  ];
  nav.replaceChildren();
  for (const [g, roy] of guruhlar) {
    if (!roy.length) continue;
    nav.append(el('div', 'snav', g));
    for (const [yol, nomi] of roy) {
      const [n, p] = yol.split('/');
      const faol = n === nom && (!p || p === (param ?? String(loyihalar[0]?.id)));
      const a = el('a', 'it' + (faol ? ' on' : ''), ikon(n), nomi);
      a.href = `#/${yol}`;
      if (faol) a.setAttribute('aria-current', 'page');
      nav.append(a);
    }
  }
}

function kursYoz() {
  const k = ctx.katalog;
  document.getElementById('kurs').textContent = k ? `1$ = ${guruh(k.kurs)} so'm · ${sana(k.kursSana)}` : '';
}

// ─── Mavzu: ☀ kunduzgi · ◐ tizim bo'yicha · ☾ tungi ───
const TEMA = 'moliya-tema';
function tema(t) {
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
  try { localStorage.setItem(TEMA, t); } catch { /* */ }
  document.querySelectorAll('#tema button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
}
function temaTugmalari() {
  const host = document.getElementById('tema');
  for (const [t, belgi, nom] of [['light', '☀', 'Kunduzgi'], ['auto', '◐', 'Tizim bo\'yicha'], ['dark', '☾', 'Tungi']]) {
    const b = el('button', null, belgi);
    b.type = 'button'; b.dataset.t = t; b.title = nom; b.setAttribute('aria-label', nom);
    b.addEventListener('click', () => tema(t));
    host.append(b);
  }
  let t = 'auto';
  try { t = localStorage.getItem(TEMA) || 'auto'; } catch { /* */ }
  tema(t);
}

// ─── Kirish ekrani ───
function kirishEkrani(xabar) {
  document.getElementById('shell').hidden = true;
  const k = document.getElementById('kirish');
  k.hidden = false;
  k.replaceChildren(el('div', 'kirish', el('div', 'card',
    el('div', 'eyebrow', 'Shaxsiy moliya'),
    el('h1', null, 'Moliya paneliga kirish'),
    xabar ? el('p', 'note orange', xabar) : null,
    el('p', null, 'Parol yo\'q — kirish Telegram orqali, faqat sizning botingizdan:'),
    el('ol', null, el('li', null, 'Telegram\'da botga ', el('code', null, '/dashboard'), ' yozing (yoki «💻 Dashboard» tugmasi).'),
      el('li', null, 'Kelgan havolani shu kompyuterda oching — havola 10 daqiqa amal qiladi.'),
      el('li', null, 'Brauzer 30 kun eslab qoladi.')),
    (() => { const a = el('a', 'btn btn-pri', 'Telegram\'da botni ochish'); a.href = 'https://t.me/bismillahaibot'; a.target = '_blank'; a.rel = 'noopener'; return a; })(),
  )));
}

/** Katalog oxirgi ochilishdan eslab qolingan bo'lsa — sahifa kutmasdan chiziladi, yangisi fonda keladi (o'zgarsa qayta chiziladi). */
async function katalogTayyorla() {
  let eski = null;
  try { eski = JSON.parse(localStorage.getItem(KATALOG) || 'null'); } catch { /* */ }
  if (!eski) return ctx.katalogYangila();
  ctx.katalog = eski; menyu(); kursYoz();
  const avval = JSON.stringify(eski);
  ctx.katalogYangila().then((k) => { if (JSON.stringify(k) !== avval) hodisa.yangilandi?.(); }).catch(() => {});
}

let chizilmoqda = 0;
async function chiz() {
  tipYashir();
  const view = document.getElementById('view');
  const { nom, param } = manzil();
  menyu();
  const navbat = ++chizilmoqda;
  if (view.childNodes.length) view.classList.add('yuk');
  else view.replaceChildren(el('div', 'skel', 'Yuklanmoqda…'));
  try {
    if (!ctx.katalog) await katalogTayyorla();
    const modul = await SAHIFALAR[nom]();
    const yangi = el('div');
    await modul.chiz(yangi, ctx, param);
    if (navbat !== chizilmoqda) return;
    view.replaceChildren(...yangi.childNodes);
    document.title = `${view.querySelector('h1')?.textContent ?? 'Moliya'} — Moliya`;
  } catch (e) {
    if (e instanceof KirishKerak) return kirishEkrani('Seans tugagan. Qaytadan kiring.');
    console.error(e);
    if (navbat === chizilmoqda) view.replaceChildren(el('div', 'empty', el('b', null, 'Yuklab bo\'lmadi'), e.message || String(e), el('div', null, el('br'), btn('Qayta urinish', 'btn-pri', () => chiz()))));
  } finally {
    view.classList.remove('yuk');
  }
}

async function boshlash() {
  temaTugmalari();
  const m = location.hash.match(/kirish=([A-Za-z0-9_-]{20,100})/);
  if (m) {
    // Havola ma'lum sahifaga olib borishi mumkin: ?yol=kripto#kirish=…
    const yol = new URLSearchParams(location.search).get('yol');
    const keyin = yol && SAHIFALAR[yol.split('/')[0]] && /^[a-z]+(\/\d+)?$/.test(yol) ? yol : 'bosh';
    history.replaceState(null, '', `${location.pathname}#/${keyin}`);
    try { await kirish(m[1]); } catch (e) { return kirishEkrani(e.message); }
  }
  if (!sessiya()) return kirishEkrani();
  document.getElementById('kirish').hidden = true;
  document.getElementById('shell').hidden = false;
  document.getElementById('chiqish').addEventListener('click', () => { chiqish(); kirishEkrani('Chiqdingiz.'); });
  addEventListener('hashchange', () => { chiz(); scrollTo(0, 0); });
  // Fonda yangi ma'lumot kelsa — joriy sahifa jimgina qayta chiziladi (aylantirish joyi saqlanadi).
  hodisa.yangilandi = () => { const y = scrollY; chiz().then(() => scrollTo(0, y)); };
  await chiz();
  // Qolgan sahifalar ma'lumoti fonda: keyingi bosishlar darhol ochiladi.
  const oy = bugun().slice(0, 7);
  setTimeout(async () => {
    const yozuvlar = await SAHIFALAR.yozuvlar().catch(() => null);   // so'rov parametrlari sahifaning o'zidan (kesh kaliti bir xil bo'lsin)
    oldindan([
      ['hisoblar'], ...(yozuvlar ? [['yozuvlar', yozuvlar.sorov()]] : []), ['byudjet', { oy }], ['tolovlar'], ['qarzlar'], ['tahlil', { oylar: 6 }],
      ['loyiha', { id: ctx.katalog?.loyihalar?.[0]?.id }], ['maqsad'], ['kripto'], ['sozlamalar'],
    ]);
  }, 800);
}

// Global yorliq: "n" — yangi yozuv (forma maydonida emas).
addEventListener('keydown', async (e) => {
  if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey || /input|select|textarea/i.test(document.activeElement?.tagName ?? '')) return;
  if (document.querySelector('.drawer.on') || !sessiya() || !ctx.katalog) return;
  const { yozuvForma } = await import('./formalar.js');
  yozuvForma(ctx);
});

boshlash();
