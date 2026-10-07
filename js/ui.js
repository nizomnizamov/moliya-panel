// Interfeys qurilish bloklari. Matn faqat textContent orqali (XSS yo'q).

export function el(tag, cls, ...bolalar) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const b of bolalar.flat(Infinity)) {
    if (b == null || b === false) continue;
    e.append(b instanceof Node ? b : document.createTextNode(String(b)));
  }
  return e;
}

export function svg(tag, attr = {}, matn) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attr)) if (v != null) e.setAttribute(k, v);
  if (matn != null) e.textContent = matn;
  return e;
}

export function btn(matn, cls, fn) {
  const b = el('button', 'btn' + (cls ? ' ' + cls : ''), matn);
  b.type = 'button';
  if (fn) b.addEventListener('click', fn);
  return b;
}

/** Ikki bosqichli tasdiqlash: birinchi bosishda "Aniqmi?" ga aylanadi. */
export function xavfliBtn(matn, fn, cls = 'btn-bad') {
  const b = btn(matn, cls);
  let qurolli = false, t;
  b.addEventListener('click', () => {
    if (!qurolli) {
      qurolli = true; b.textContent = 'Aniqmi? Yana bosing';
      t = setTimeout(() => { qurolli = false; b.textContent = matn; }, 3500);
      return;
    }
    clearTimeout(t);
    fn();
  });
  return b;
}

export const IKON = {
  bosh: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5',
  tahlil: 'M4 19V11M10 19V5M16 19v-6M22 19H2',
  yozuvlar: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  hisoblar: 'M3 7h18v12H3zM3 11h18M7 15h3',
  byudjet: 'M12 21a9 9 0 1 1 9-9h-9z M14 3.2A9 9 0 0 1 20.8 10H14z',
  tolovlar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  qarzlar: 'M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11ZM3 19.5c0-3 2.7-4.8 6-4.8s6 1.8 6 4.8M16.5 11.2a3 3 0 0 0 0-5.9M18 19.5c0-2.2-.9-3.6-2.3-4.4',
  loyiha: 'M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5',
  maqsad: 'M12 21a9 9 0 1 0-9-9M12 16a4 4 0 1 0-4-4M12 12l7-7M16 5h3v3',
  kripto: 'M8 4v16M12 4v2M12 18v2M8 7h6a2.5 2.5 0 0 1 0 5H8M8 12h7a2.5 2.5 0 0 1 0 5H8',
  sozlamalar: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z',
};

export function ikon(k) {
  const s = svg('svg', { class: 'ico', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
  s.append(svg('path', { d: IKON[k] || IKON.bosh }));
  return s;
}

/** Sahifa sarlavhasi + asboblar qatori (qaytaradi). */
export function sarlavha(view, { eyebrow, title, sub }, ...asboblar) {
  view.append(el('div', 'head', el('div', null, eyebrow ? el('div', 'eyebrow', eyebrow) : null, el('h1', 'title', title), sub ? el('p', 'sub', sub) : null)));
  const t = el('div', 'tools', ...asboblar);
  view.append(t);
  return t;
}

export function karta(sarlavha, ...ong) {
  const c = el('section', 'card');
  if (sarlavha) c.append(el('div', 'ch', el('span', 't', sarlavha), ...ong));
  return c;
}

export function torTo(view) { const g = el('div', 'g'); view.append(g); return g; }
export function ust(g, n) { const c = el('div', `c${n} ust`); g.append(c); return c; }

/** KPI kartochkasi: nom + o'zgarish, katta raqam + sparkline, zolak (maqsad belgisi bilan), izoh. */
export function kpi(o) {
  const k = el(o.bos ? 'button' : 'div', 'kpi');
  if (o.bos) { k.type = 'button'; k.addEventListener('click', o.bos); }
  const k1 = el('div', 'k1', el('span', 'nm', o.nom));
  if (o.delta) { const d = el('span', `d ${o.delta.cls || ''}`, o.delta.t); if (o.delta.title) d.title = o.delta.title; k1.append(d); }
  k.append(k1);
  const v = el('div', 'v' + (o.ton ? ' ' + o.ton : ''), o.qiymat);
  if (o.birlik) v.append(el('small', null, o.birlik));
  const k2 = el('div', 'k2', v);
  if (o.spark && o.spark.filter((x) => x != null).length > 1) k2.append(el('span', 'sp', spark(o.spark, o.yon ?? 1)));
  k.append(k2);
  if (o.zolak != null) {
    const b = el('div', 'bar'), f = el('i', o.zolakCls || '');
    f.style.width = `${Math.max(0, Math.min(100, o.zolak))}%`;
    b.append(f);
    if (o.belgi != null) { const u = el('u'); u.style.left = `${Math.max(0, Math.min(100, o.belgi))}%`; u.title = o.belgiNom || ''; b.append(u); }
    k.append(el('div', 'k3', b));
  }
  if (o.izoh) k.append(el('div', 'h', o.izoh));
  return k;
}

/** Sparkline: yo'nalish yaxshi bo'lsa yashil, yomon bo'lsa qizil (yon=-1 — kamayish yaxshi). */
export function spark(qiymatlar, yon = 1) {
  const W = 84, H = 30, pts = [];
  qiymatlar.forEach((v, i) => { if (v != null && Number.isFinite(v)) pts.push([i, v]); });
  const s = svg('svg', { class: 'spk', width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' });
  if (pts.length < 2) return s;
  let mn = Math.min(...pts.map((p) => p[1])), mx = Math.max(...pts.map((p) => p[1]));
  if (mn === mx) { mn -= 1; mx += 1; }
  const n = qiymatlar.length - 1 || 1;
  const X = (i) => 2 + (i / n) * (W - 6), Y = (v) => H - 4 - ((v - mn) / (mx - mn)) * (H - 9);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
  const f = pts[0], l = pts[pts.length - 1];
  const yaxshi = (l[1] - f[1]) * yon;
  s.setAttribute('class', 'spk' + (yaxshi > 0 ? ' up' : yaxshi < 0 ? ' down' : ''));
  s.append(svg('path', { class: 'ar', d: `${d}L${X(l[0]).toFixed(1)} ${H}L${X(f[0]).toFixed(1)} ${H}Z` }));
  s.append(svg('path', { class: 'ln', d }));
  s.append(svg('circle', { cx: X(l[0]), cy: Y(l[1]), r: 2.4 }));
  return s;
}

export function pill(matn, cls) { return el('span', 'pill' + (cls ? ' ' + cls : ''), matn); }

export function zolak(foizi, cls, belgi) {
  const b = el('div', 'bar'), f = el('i', cls || '');
  f.style.width = `${Math.max(0, Math.min(100, foizi))}%`;
  b.append(f);
  if (belgi != null) { const u = el('u'); u.style.left = `${Math.max(0, Math.min(100, belgi))}%`; b.append(u); }
  return b;
}

export function bosh(sarlavha, matn) {
  return el('div', 'empty', el('b', null, sarlavha), matn);
}

export function faktlar(juftlar) {
  return el('div', 'facts', juftlar.filter(Boolean).map(([a, b, cls]) => el('div', null, el('span', null, a), el('b', cls || null, b))));
}

let toastT;
export function toast(matn, yaxshi = true) {
  let t = document.getElementById('toast');
  if (!t) { t = el('div', 'toast'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = matn;
  t.className = 'toast' + (yaxshi ? '' : ' bad');
  t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.hidden = true; }, yaxshi ? 2600 : 6000);
}

/** Segmentli tanlov. */
export function seg(variantlar, qiymat, ozgardi) {
  const s = el('div', 'seg');
  for (const [v, n] of variantlar) {
    const b = el('button', v === qiymat ? 'on' : null, n);
    b.type = 'button';
    b.addEventListener('click', () => {
      s.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      ozgardi(v);
    });
    s.append(b);
  }
  return s;
}

// ─── Forma maydonlari ───────────────────────────────────────────

export function maydon(nom, kirish, izoh, toliq) {
  // label ichida tugma (seg) bo'lsa, bosish birinchi tugmaga ketadi — shunday maydonlar div bo'ladi.
  const yorliq = kirish instanceof HTMLInputElement || kirish instanceof HTMLSelectElement || kirish instanceof HTMLTextAreaElement;
  return el(yorliq ? 'label' : 'div', 'fld' + (toliq ? ' full' : ''), el('span', null, nom), kirish, izoh ? el('small', null, izoh) : null);
}

export function inp(qiymat, o = {}) {
  const i = el('input');
  i.type = o.type || 'text';
  if (qiymat != null) i.value = qiymat;
  for (const [k, v] of Object.entries(o)) if (k !== 'type' && v != null) i.setAttribute(k, v);
  return i;
}

/** Summa: "1 250 000" ko'rinishida yoziladi, qiymati son. */
export function summaInp(qiymat, o = {}) {
  const i = inp(qiymat == null ? '' : String(qiymat).replace('.', ','), { inputmode: 'decimal', autocomplete: 'off', ...o });
  const tozala = () => i.value.replace(/\s/g, '').replace(',', '.');
  i.addEventListener('blur', () => {
    const n = Number(tozala());
    if (i.value && Number.isFinite(n)) i.value = n.toLocaleString('ru-RU', { maximumFractionDigits: 8 }).replace(/ /g, ' ');
  });
  i.son = () => (i.value.trim() === '' ? null : Number(tozala()));
  if (qiymat != null && qiymat !== '') i.dispatchEvent(new Event('blur'));
  return i;
}

export function tanlov(variantlar, qiymat, bosh) {
  const s = el('select');
  if (bosh != null) { const o = el('option', null, bosh); o.value = ''; s.append(o); }
  for (const v of variantlar) {
    if (v.guruh) {
      const g = el('optgroup'); g.label = v.guruh;
      for (const x of v.variantlar) { const o = el('option', null, x.nom); o.value = x.qiymat; g.append(o); }
      s.append(g);
      continue;
    }
    const o = el('option', null, v.nom); o.value = v.qiymat; s.append(o);
  }
  if (qiymat != null) s.value = String(qiymat);
  return s;
}

// ─── Drawer (o'ng tomondan ochiladigan tahrirlash oynasi) ───────

let ochiq = null;
export function drawer({ sarlavha, tana, saqla, saqlaNom = 'Saqlash', qoshimcha = [] }) {
  yop();
  const oldingiFokus = document.activeElement;
  const scrim = el('div', 'scrim');
  const d = el('aside', 'drawer');
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-label', sarlavha);
  const xato = el('div', 'err');
  xato.hidden = true;
  const yopBtn = el('button', 'x', '✕');
  yopBtn.type = 'button';
  yopBtn.setAttribute('aria-label', 'Yopish');
  const saqlaBtn = saqla ? btn(saqlaNom, 'btn-pri') : null;
  d.append(el('div', 'dh', el('h2', null, sarlavha), yopBtn), el('div', 'db', tana, xato),
    el('div', 'df', ...qoshimcha, el('span', 'sp'), btn('Bekor', null, () => yop()), saqlaBtn));
  document.body.append(scrim, d);
  requestAnimationFrame(() => { scrim.classList.add('on'); d.classList.add('on'); });
  const fokus = d.querySelector('input:not([type=hidden]),select,textarea');
  // Kechiktirilgan fokus — oyna hali ochiq bo'lsagina (tez saqlansa, yopilgan oynaga fokus qaytmasin).
  setTimeout(() => { if (fokus && ochiq?.d === d) fokus.focus(); }, 60);
  const kalit = (e) => { if (e.key === 'Escape') yop(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && saqlaBtn) saqlaBtn.click(); };
  document.addEventListener('keydown', kalit);
  scrim.addEventListener('click', () => yop());
  yopBtn.addEventListener('click', () => yop());
  ochiq = { d, scrim, kalit, oldingiFokus };
  if (saqlaBtn) {
    saqlaBtn.addEventListener('click', async () => {
      xato.hidden = true;
      saqlaBtn.disabled = true;
      try {
        await saqla();
        yop();
      } catch (e) {
        xato.textContent = e.message || String(e);
        xato.hidden = false;
      } finally {
        saqlaBtn.disabled = false;
      }
    });
  }
  return { yop, xato: (m) => { xato.textContent = m; xato.hidden = false; } };
}

export function yop() {
  if (!ochiq) return;
  const { d, scrim, kalit, oldingiFokus } = ochiq;
  ochiq = null;
  document.removeEventListener('keydown', kalit);
  // Kursor yopilgan oyna ichida qolmasin — ochilishidan oldingi joyiga qaytadi.
  if (d.contains(document.activeElement)) document.activeElement.blur();
  if (oldingiFokus && oldingiFokus !== document.body && oldingiFokus.isConnected) oldingiFokus.focus({ preventScroll: true });
  d.classList.remove('on'); scrim.classList.remove('on');
  setTimeout(() => { d.remove(); scrim.remove(); }, 220);
}

// ─── Jadval ─────────────────────────────────────────────────────

/** ustunlar: [{nom, num?, f: (qator) => Node|string}], qatorlar, o: {bos, cls, futer} */
export function jadval(ustunlar, qatorlar, o = {}) {
  const t = el('table', o.cls || null);
  t.append(el('thead', null, el('tr', null, ustunlar.map((u) => el('th', u.num ? 'num' : null, u.nom)))));
  const tb = el('tbody');
  for (const q of qatorlar) {
    const tr = el('tr', [o.bos ? 'click' : '', o.qatorCls ? o.qatorCls(q) : ''].filter(Boolean).join(' ') || null,
      ustunlar.map((u) => el('td', u.num ? 'num' : null, u.f(q))));
    if (o.bos) {
      tr.tabIndex = 0;
      tr.addEventListener('click', () => o.bos(q));
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') o.bos(q); });
    }
    tb.append(tr);
  }
  t.append(tb);
  if (o.futer) t.append(el('tfoot', null, el('tr', null, o.futer.map((x, i) => el('td', ustunlar[i]?.num ? 'num' : null, x)))));
  return el('div', 'tbl-wrap', t);
}
