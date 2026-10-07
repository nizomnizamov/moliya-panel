// Grafiklar: SVG, haqiqiy kenglikda chiziladi (matn kichrayib ketmaydi), o'lcham o'zgarsa qayta chiziladi.
// Qoidalar: ingichka belgilar, 4px yumaloq uch, 2px oraliq, bitta o'q, tooltip har doim, legenda ≥2 seriyada.

import { el, svg } from './ui.js';
import { oq } from './fmt.js';

let tipEl = null;
export function tipKorsat(e, sarlavha, qatorlar) {
  if (!tipEl) { tipEl = el('div', 'tip'); tipEl.setAttribute('role', 'status'); document.body.append(tipEl); }
  tipEl.replaceChildren(el('div', 'tt', sarlavha), ...qatorlar.map(([cls, nom, qiymat]) =>
    el('div', 'tr', el('span', null, cls ? el('i', `k ${cls}`) : null, nom), el('b', null, qiymat))));
  tipEl.hidden = false;
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = e.clientX + 14, y = e.clientY - h - 12;
  if (x + w > innerWidth - 8) x = e.clientX - w - 14;
  if (y < 8) y = e.clientY + 16;
  tipEl.style.left = `${x}px`; tipEl.style.top = `${y}px`;
}
export function tipYashir() { if (tipEl) tipEl.hidden = true; }
addEventListener('scroll', tipYashir, { passive: true });

/** Toza bo'linmalar: 0 dan (yoki manfiydan) yuqoriga 3–5 ta. */
export function shkala(min, max, n = 4) {
  if (max === min) { max = max === 0 ? 1 : max * 1.1; min = Math.min(0, min); }
  const taxmin = (max - min) / n, mag = Math.pow(10, Math.floor(Math.log10(taxmin)));
  const qadam = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((s) => s >= taxmin);
  const lo = Math.floor(min / qadam) * qadam, hi = Math.ceil(max / qadam) * qadam;
  const ticks = [];
  for (let t = lo; t <= hi + qadam / 1e6; t += qadam) ticks.push(Math.round(t * 1e6) / 1e6);
  return { lo, hi, ticks };
}

/** Joyga grafikni joylaydi va kenglik o'zgarsa qayta chizadi. */
export function joyla(joy, chiz) {
  let oxirgi = 0;
  const r = () => {
    const w = Math.round(joy.clientWidth || 600);
    if (Math.abs(w - oxirgi) < 8) return;
    oxirgi = w;
    joy.replaceChildren(chiz(w));
  };
  requestAnimationFrame(r);
  if ('ResizeObserver' in window) {
    let t;
    new ResizeObserver(() => { clearTimeout(t); t = setTimeout(r, 120); }).observe(joy);
  }
}

function yumaloq(x, y, w, h, r, yuqori = true) {
  if (h <= 0.5) return '';
  r = Math.min(r, w / 2, h);
  return yuqori
    ? `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
    : `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w - r}Q${x + w},${y + h} ${x + w},${y + h - r}V${y}Z`;
}

/**
 * Ustunlar: guruhlangan yoki ustma-ust (stack).
 * o: { qatorlar: [{yorliq, sarlavha?, ...qiymatlar}], seriyalar: [{kalit, nom, cls}], stack, fmt, h, belgilash: (i) => bool }
 */
export function ustunlar(joy, o) {
  joyla(joy, (W) => {
    const H = o.h ?? 220, chap = 48, past = 24, tepa = 14, ong = 8;
    const n = o.qatorlar.length;
    const jamlar = o.qatorlar.map((q) => o.seriyalar.reduce((s, x) => s + Math.max(0, q[x.kalit] || 0), 0));
    const qiymatlar = o.qatorlar.flatMap((q) => o.seriyalar.map((x) => q[x.kalit] || 0));
    const { lo, hi, ticks } = shkala(Math.min(0, ...qiymatlar), o.stack ? Math.max(...jamlar, 1) : Math.max(...qiymatlar, 1));
    const y = (v) => tepa + (H - tepa - past) * (1 - (v - lo) / (hi - lo));
    const s = svg('svg', { class: 'chsvg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': o.nom || 'grafik' });
    for (const t of ticks) {
      s.append(svg('line', { x1: chap, x2: W - ong, y1: y(t), y2: y(t), class: t === 0 ? 'ch-axis' : 'ch-grid' }));
      s.append(svg('text', { x: chap - 8, y: y(t) + 4, 'text-anchor': 'end', class: 'ch-t ch-tick' }, oq(t)));
    }
    const band = (W - chap - ong) / n;
    const guruhSoni = o.stack ? 1 : o.seriyalar.length;
    const bw = Math.max(3, Math.min(24, (band * 0.72 - 2 * (guruhSoni - 1)) / guruhSoni));
    const jamiW = bw * guruhSoni + 2 * (guruhSoni - 1);
    const qadamX = n > 16 ? Math.ceil(n / 12) : 1;
    o.qatorlar.forEach((q, i) => {
      const x0 = chap + band * i + (band - jamiW) / 2;
      const g = svg('g', { class: 'ch-mk' });
      if (o.stack) {
        let ost = 0;
        const bor = o.seriyalar.filter((x) => (q[x.kalit] || 0) > 0);
        bor.forEach((x, j) => {
          const v = q[x.kalit];
          const y1 = y(ost + v), y0 = y(ost);
          const oxirgi = j === bor.length - 1;
          const h = Math.max(0, y0 - y1 - (oxirgi ? 0 : 2));
          if (h > 0) g.append(svg('path', { d: oxirgi ? yumaloq(x0, y1, bw, h, 4) : `M${x0},${y1 + 2}h${bw}v${h}h${-bw}Z`, class: x.cls }));
          ost += v;
        });
      } else {
        o.seriyalar.forEach((x, j) => {
          const v = q[x.kalit] || 0;
          const xx = x0 + j * (bw + 2);
          if (v >= 0) g.append(svg('path', { d: yumaloq(xx, y(v), bw, y(0) - y(v), 4), class: x.cls }));
          else g.append(svg('path', { d: yumaloq(xx, y(0), bw, y(v) - y(0), 4, false), class: x.cls }));
        });
      }
      s.append(g);
      if (i % qadamX === 0 || i === n - 1) {
        s.append(svg('text', { x: chap + band * i + band / 2, y: H - 7, 'text-anchor': 'middle', class: 'ch-t ch-tick' }, q.yorliq));
      }
      const hit = svg('rect', { x: chap + band * i, y: tepa, width: band, height: H - tepa - past, class: 'ch-hit', tabindex: 0 });
      const korsat = (e) => {
        s.classList.add('ch-on');
        s.querySelectorAll('.ch-mk.on').forEach((m) => m.classList.remove('on'));
        g.classList.add('on');
        const qator = o.seriyalar.map((x) => [x.cls.replace('c-', 'sw-'), x.nom, (o.fmt || oq)(q[x.kalit] || 0)]);
        if (o.stack && o.seriyalar.length > 1) qator.push([null, 'Jami', (o.fmt || oq)(jamlar[i])]);
        tipKorsat(e, q.sarlavha || q.yorliq, qator);
      };
      hit.addEventListener('pointermove', korsat);
      hit.addEventListener('focus', () => { const b = hit.getBoundingClientRect(); korsat({ clientX: b.left + b.width / 2, clientY: b.top + 40 }); });
      const ket = () => { tipYashir(); s.classList.remove('ch-on'); g.classList.remove('on'); };
      hit.addEventListener('pointerleave', ket);
      hit.addEventListener('blur', ket);
      if (o.bos) { hit.style.cursor = 'pointer'; hit.addEventListener('click', () => o.bos(q, i)); }
      s.append(hit);
    });
    if (o.ref != null) {
      s.append(svg('line', { x1: chap, x2: W - ong, y1: y(o.ref.qiymat), y2: y(o.ref.qiymat), class: 'ch-ref' }));
      s.append(svg('text', { x: W - ong, y: y(o.ref.qiymat) - 5, 'text-anchor': 'end', class: 'ch-t ch-tick' }, o.ref.nom));
    }
    return s;
  });
}

/**
 * Chiziq (bir yoki bir nechta seriya), kursor chizig'i bilan.
 * o: { yorliqlar: [..], sarlavhalar?: [..], seriyalar: [{nom, cls, qiymatlar, maydon?}], fmt, h, ref?: {qiymat, nom}, nol?: bool }
 */
export function chiziq(joy, o) {
  joyla(joy, (W) => {
    const H = o.h ?? 200, chap = 52, past = 24, tepa = 18, ong = 14;
    const n = o.yorliqlar.length;
    const hamma = o.seriyalar.flatMap((x) => x.qiymatlar).filter((v) => v != null);
    if (o.ref) hamma.push(o.ref.qiymat);
    const { lo, hi, ticks } = shkala(o.nol ? Math.min(0, ...hamma) : Math.min(...hamma), Math.max(...hamma), 3);
    const x = (i) => chap + (W - chap - ong) * (n === 1 ? 1 : i / (n - 1));
    const y = (v) => tepa + (H - tepa - past) * (1 - (v - lo) / (hi - lo || 1));
    const s = svg('svg', { class: 'chsvg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': o.nom || 'grafik' });
    for (const t of ticks) {
      s.append(svg('line', { x1: chap, x2: W - ong, y1: y(t), y2: y(t), class: t === lo ? 'ch-axis' : 'ch-grid' }));
      s.append(svg('text', { x: chap - 8, y: y(t) + 4, 'text-anchor': 'end', class: 'ch-t ch-tick' }, (o.fmtOq || oq)(t)));
    }
    if (o.ref) {
      s.append(svg('line', { x1: chap, x2: W - ong, y1: y(o.ref.qiymat), y2: y(o.ref.qiymat), class: 'ch-ref' }));
      s.append(svg('text', { x: W - ong, y: y(o.ref.qiymat) - 6, 'text-anchor': 'end', class: 'ch-t ch-tick' }, o.ref.nom));
    }
    const qadamX = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - chap) / 70))));
    o.yorliqlar.forEach((l, i) => {
      if (i % qadamX && i !== n - 1) return;
      if (i !== n - 1 && n - 1 - i < qadamX * 0.6) return;
      s.append(svg('text', { x: x(i), y: H - 7, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', class: 'ch-t ch-tick' }, l));
    });
    o.seriyalar.forEach((sr) => {
      const nuqtalar = sr.qiymatlar.map((v, i) => [i, v]).filter(([, v]) => v != null);
      if (!nuqtalar.length) return;
      const d = nuqtalar.map(([i, v], j) => `${j ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
      if (sr.maydon && nuqtalar.length > 1) {
        const [f] = nuqtalar, l = nuqtalar[nuqtalar.length - 1];
        s.append(svg('path', { d: `${d}L${x(l[0])},${y(lo)}L${x(f[0])},${y(lo)}Z`, class: `ch-area ${sr.cls}` }));
      }
      s.append(svg('path', { d, class: `ch-ln ${sr.cls}` }));
      const [li, lv] = nuqtalar[nuqtalar.length - 1];
      s.append(svg('circle', { cx: x(li), cy: y(lv), r: 4, class: `ch-dot ${sr.cls}` }));
    });
    if (o.oxirgiYorliq !== false && o.seriyalar[0]) {
      const sr = o.seriyalar[0];
      const nuqtalar = sr.qiymatlar.map((v, i) => [i, v]).filter(([, v]) => v != null);
      if (nuqtalar.length) {
        const [li, lv] = nuqtalar[nuqtalar.length - 1];
        s.append(svg('text', { x: x(li) - 8, y: y(lv) - 10, 'text-anchor': 'end', class: 'ch-t ch-val' }, (o.fmt || oq)(lv)));
      }
    }
    const xh = svg('line', { y1: tepa, y2: H - past, class: 'ch-xh', visibility: 'hidden' });
    const nuqtaKor = o.seriyalar.map((sr) => svg('circle', { r: 4, class: `ch-dot ${sr.cls}`, visibility: 'hidden' }));
    s.append(xh, ...nuqtaKor);
    const hit = svg('rect', { x: chap, y: 0, width: W - chap - ong + 6, height: H - past, class: 'ch-hit', tabindex: 0 });
    const korsat = (e, iMajburiy) => {
      const b = s.getBoundingClientRect();
      const px = (e.clientX - b.left) * (W / b.width);
      const i = iMajburiy ?? Math.max(0, Math.min(n - 1, Math.round(((px - chap) / (W - chap - ong)) * (n - 1))));
      xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('visibility', 'visible');
      o.seriyalar.forEach((sr, j) => {
        const v = sr.qiymatlar[i];
        if (v == null) { nuqtaKor[j].setAttribute('visibility', 'hidden'); return; }
        nuqtaKor[j].setAttribute('cx', x(i)); nuqtaKor[j].setAttribute('cy', y(v)); nuqtaKor[j].setAttribute('visibility', 'visible');
      });
      tipKorsat(e, (o.sarlavhalar || o.yorliqlar)[i], o.seriyalar.filter((sr) => sr.qiymatlar[i] != null)
        .map((sr) => [sr.cls.replace('c-', 'sw-'), sr.nom, (o.fmt || oq)(sr.qiymatlar[i])]));
    };
    hit.addEventListener('pointermove', (e) => korsat(e));
    hit.addEventListener('pointerleave', () => { tipYashir(); xh.setAttribute('visibility', 'hidden'); nuqtaKor.forEach((c) => c.setAttribute('visibility', 'hidden')); });
    s.append(hit);
    return s;
  });
}

export function legenda(elementlar) {
  return el('div', 'leg', elementlar.map(([nom, cls, chiziqmi]) => el('span', null, el('i', `${cls}${chiziqmi ? ' ln' : ''}`), nom)));
}

/** Grafik kartasi: sarlavhada "Jadval" tugmasi — grafik ↔ jadval (rangsiz ham o'qiladi). */
export function almashtirgich(grafikJoy, jadvalFn) {
  let jadvalda = false;
  const jadvalJoy = el('div');
  jadvalJoy.hidden = true;
  const b = el('button', 'btn btn-sm btn-ghost', 'Jadval');
  b.type = 'button';
  b.addEventListener('click', () => {
    jadvalda = !jadvalda;
    if (jadvalda && !jadvalJoy.childNodes.length) jadvalJoy.append(jadvalFn());
    jadvalJoy.hidden = !jadvalda;
    grafikJoy.hidden = jadvalda;
    b.textContent = jadvalda ? 'Grafik' : 'Jadval';
  });
  return { tugma: b, jadvalJoy };
}
