/*! Decreto Real FX Studio G3 — fx-core.js
 * Motor de efectos 2D (Canvas + DOM/SVG/CSS). Sin dependencias.
 * API pública: DecretoFX.playFX(id, options) · stopAll · clear · sequence · on · audio · preload
 * Los efectos son solo representación visual: nunca leen ni modifican el estado del juego. */
(function (root) {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  /** Sub-progreso: 0 antes de a, 1 después de b. */
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const E = {
    lin: t => t,
    in: t => t * t * t,
    out: t => 1 - Math.pow(1 - t, 3),
    out5: t => 1 - Math.pow(1 - t, 5),
    io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bell: t => Math.sin(PI * clamp(t)),
    elastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  };
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    const f = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.range = (a, b) => a + (b - a) * f();
    f.pick = arr => arr[(f() * arr.length) | 0];
    return f;
  }

  /* ───────────── Configuración y paletas ───────────── */
  const CONFIG = {
    font: '"Cinzel","Trajan Pro","Palatino Linotype","Book Antiqua",Georgia,serif',
    maxDpr: 2,
    quality: 'auto',          // 'auto' | 'high' | 'medium' | 'low'
    reducedMotion: 'auto',    // 'auto' | true | false
    zIndex: 60,
    maxParticles: 700,
  };
  const GOLD = '#ffd76a';
  const GOLD_GRAD = ['#fff8d2', '#ffd76a', '#c98a1a', '#ffe9a0'];
  const PALETTES = {
    carmesi: { a: '#ff2b45', b: '#a80a1e', c: '#ffd76a', core: '#fff3ea', dark: '#2a0208' },
    azul: { a: '#2f8dff', b: '#0b3bd6', c: '#7df0ff', core: '#f1fbff', dark: '#02103a' },
    defensa: { a: '#2fa8ff', b: '#0b48d6', c: '#7df6ff', core: '#ffffff', dark: '#021238' },
    orden: { a: '#a26bff', b: '#4a1fa6', c: '#ffd76a', core: '#fbf3ff', dark: '#1a0a3a' },
    vida: { a: '#49f08a', b: '#0e9a4c', c: '#ffe27a', core: '#f4fff0', dark: '#032612' },
    oro: { a: '#ffcf4a', b: '#b87a10', c: '#fff1b8', core: '#fffbe8', dark: '#2a1a02' },
    impacto: { a: '#b05cff', b: '#ff3b5c', c: '#3fa9ff', core: '#ffffff', dark: '#14062a' },
    hierro: { a: '#8fb4d9', b: '#2c5f8f', c: '#d8ecff', core: '#ffffff', dark: '#07182a' },
    sangre: { a: '#ff2038', b: '#7a0010', c: '#ff8a6a', core: '#fff0ea', dark: '#240004' },
    azogue: { a: '#d5dde6', b: '#7d8a99', c: '#ffd76a', core: '#ffffff', dark: '#14181e' },
    legado: { a: '#ffd24d', b: '#c8841a', c: '#fff3c2', core: '#fffdf0', dark: '#2a1900' },
    ceniza: { a: '#9aa3b5', b: '#4a5266', c: '#d9deea', core: '#f2f4fa', dark: '#0a0c14' },
    tormenta: { a: '#ffe14d', b: '#5b6cff', c: '#ffffff', core: '#ffffff', dark: '#0a0c2a' },
    selva: { a: '#3ddc84', b: '#0c6b4a', c: '#b6ff7a', core: '#f2fff0', dark: '#03180f' },
    sombra: { a: '#8a5cff', b: '#2a1060', c: '#ff6ad5', core: '#f6eaff', dark: '#0a0418' },
    celeste: { a: '#7fd8ff', b: '#2a7fd6', c: '#fff1b8', core: '#ffffff', dark: '#04162a' },
  };
  const hexCache = new Map();
  function rgb(hex) {
    let v = hexCache.get(hex);
    if (!v) {
      let h = String(hex).replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const n = parseInt(h, 16) || 0;
      v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      hexCache.set(hex, v);
    }
    return v;
  }
  const rgba = (hex, a = 1) => { const c = rgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const mix = (h1, h2, t) => { const a = rgb(h1), b = rgb(h2); const f = i => Math.round(lerp(a[i], b[i], t)).toString(16).padStart(2, '0'); return '#' + f(0) + f(1) + f(2); };
  function paletteFrom(color) { return { a: color, b: mix(color, '#000000', 0.5), c: GOLD, core: mix(color, '#ffffff', 0.88), dark: mix(color, '#000000', 0.85) }; }
  function resolvePalette(def, o) {
    let p = null;
    if (o.palette) p = typeof o.palette === 'string' ? PALETTES[o.palette] : Object.assign({}, PALETTES[def.pal || 'oro'], o.palette);
    else if (o.color) p = paletteFrom(o.color);
    else if (def.byFaction && o.faction && PALETTES[o.faction]) p = PALETTES[o.faction];
    return p || PALETTES[def.pal] || PALETTES.oro;
  }

  /* ───────────── Kit de dibujo ───────────── */
  let baseAlpha = 1, reducedNow = false;
  const K = {};
  K.alpha = (g, a) => { g.globalAlpha = clamp(baseAlpha * a); };
  K.add = g => { g.globalCompositeOperation = 'lighter'; };
  K.over = g => { g.globalCompositeOperation = 'source-over'; };
  const glowCache = new Map();
  function glowSprite(col) {
    let c = glowCache.get(col);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = 96;
      const g = c.getContext('2d'), gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(0.22, rgba(col, 0.6)); gr.addColorStop(0.55, rgba(col, 0.16)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96); glowCache.set(col, c);
    }
    return c;
  }
  K.glow = (g, x, y, r, col, a = 1) => { if (a <= 0.003 || r <= 0.2) return; K.alpha(g, a); g.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); };
  K.ring = (g, x, y, r, w, col, a = 1, sy = 1) => {
    if (a <= 0.003 || r <= 0 || w <= 0) return;
    g.beginPath(); g.ellipse(x, y, r, r * sy, 0, 0, TAU);
    g.strokeStyle = col; K.alpha(g, a * 0.35); g.lineWidth = w * 3; g.stroke();
    K.alpha(g, a); g.lineWidth = w; g.stroke();
  };
  /** Anillo dentado eléctrico (referencia aprobada de Ataque/Defensa). */
  K.spikeRing = (g, x, y, r, amp, n, rot, col, a, w, rnd) => {
    if (a <= 0.003 || r <= 0) return;
    g.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const ang = rot + (i / (n * 2)) * TAU, rr = r + (i % 2 ? amp * (0.5 + (rnd ? rnd() : 0.5)) : -amp * 0.25);
      const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath(); g.lineJoin = 'miter'; g.strokeStyle = col;
    K.alpha(g, a * 0.4); g.lineWidth = w * 3.2; g.stroke(); K.alpha(g, a); g.lineWidth = w; g.stroke();
  };
  /** Rayos de impacto estilo anime. */
  K.burst = (g, x, y, r0, r1, n, rot, col, a, wide = 0.05, rnd) => {
    if (a <= 0.003) return;
    g.fillStyle = col; K.alpha(g, a); g.beginPath();
    for (let i = 0; i < n; i++) {
      const ang = rot + (i / n) * TAU + (rnd ? (rnd() - 0.5) * 0.25 : 0), len = r1 * (rnd ? 0.55 + rnd() * 0.45 : i % 2 ? 0.7 : 1);
      g.moveTo(x + Math.cos(ang - wide) * r0, y + Math.sin(ang - wide) * r0);
      g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      g.lineTo(x + Math.cos(ang + wide) * r0, y + Math.sin(ang + wide) * r0);
    }
    g.fill();
  };
  K.bolt = (g, x1, y1, x2, y2, jag, rnd, col, w, a = 1, core = '#ffffff') => {
    if (a <= 0.003) return;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, n = Math.max(3, Math.min(14, (len / (jag * 2.2)) | 0));
    const nx = -dy / len, ny = dx / len;
    g.beginPath(); g.moveTo(x1, y1);
    for (let i = 1; i < n; i++) { const t = i / n, o = (rnd() - 0.5) * 2 * jag; g.lineTo(x1 + dx * t + nx * o, y1 + dy * t + ny * o); }
    g.lineTo(x2, y2); g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = col; K.alpha(g, a * 0.45); g.lineWidth = w * 3; g.stroke();
    g.strokeStyle = core; K.alpha(g, a); g.lineWidth = w; g.stroke();
  };
  /** Hoja de tajo: banda afilada entre s0..s1 sobre una curva cuadrática. */
  K.blade = (g, P0, C, P1, s0, s1, width, cols, a = 1) => {
    if (s1 - s0 < 0.01 || a <= 0.003) return;
    const N = 22, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const k = i / N, s = lerp(s0, s1, k), m = 1 - s;
      const x = m * m * P0.x + 2 * m * s * C.x + s * s * P1.x, y = m * m * P0.y + 2 * m * s * C.y + s * s * P1.y;
      let tx = 2 * m * (C.x - P0.x) + 2 * s * (P1.x - C.x), ty = 2 * m * (C.y - P0.y) + 2 * s * (P1.y - C.y);
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const w = width * Math.pow(Math.sin(PI * k), 0.75) * (0.25 + 0.75 * k);
      L.push([x - ty * w, y + tx * w, x, y]); R.push([x + ty * w * 0.55, y - tx * w * 0.55]);
    }
    cols.forEach(([col, sc, al]) => {
      g.beginPath();
      for (let i = 0; i <= N; i++) { const l = L[i], x = lerp(l[2], l[0], sc), y = lerp(l[3], l[1], sc); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      for (let i = N; i >= 0; i--) { const l = L[i], r = R[i]; g.lineTo(lerp(l[2], r[0], sc), lerp(l[3], r[1], sc)); }
      g.closePath(); g.fillStyle = col; K.alpha(g, a * al); g.fill();
    });
  };
  K.dim = (g, W, H, a, col = '#000000') => { if (a <= 0.003) return; g.save(); K.over(g); K.alpha(g, a); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); };
  K.flash = (g, W, H, a, col = '#ffffff') => { if (a <= 0.003) return; g.save(); K.add(g); K.alpha(g, a * (reducedNow ? 0.3 : 1)); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); };
  K.vignette = (g, W, H, col, a) => {
    if (a <= 0.003) return;
    const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.55);
    gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, rgba(col, 0.85));
    g.save(); K.over(g); K.alpha(g, a); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  };
  K.fit = (g, s, size, maxW, o = {}) => {
    g.save(); g.font = `${o.weight || 900} ${size}px ${o.font || CONFIG.font}`;
    if ('letterSpacing' in g) g.letterSpacing = ((o.ls || 0) * size) + 'px';
    const w = g.measureText(s).width; g.restore();
    return w > maxW ? size * maxW / w : size;
  };
  K.text = (g, s, x, y, size, o = {}) => {
    const a = o.a == null ? 1 : o.a; if (a <= 0.003 || size < 1) return;
    g.save(); K.over(g); K.alpha(g, a);
    g.font = `${o.weight || 900} ${size}px ${o.font || CONFIG.font}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = ((o.ls || 0) * size) + 'px';
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * (o.blur || 0.45); }
    if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = size * (o.sw || 0.14); g.strokeStyle = o.stroke; g.strokeText(s, x, y); }
    let fill = o.fill || '#ffffff';
    if (Array.isArray(fill)) { const gr = g.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5); fill.forEach((c, i) => gr.addColorStop(i / (fill.length - 1), c)); fill = gr; }
    g.fillStyle = fill; g.fillText(s, x, y); g.restore();
  };
  /** Número flotante (los valores los entrega el motor de combate). q: 0..1 */
  K.floatText = (g, s, x, y, size, q, col, stroke = '#1a0508') => {
    if (q <= 0 || q >= 1 || s == null || s === '') return;
    const sc = 0.6 + 0.4 * E.back(seg(q, 0, 0.25)), a = seg(q, 0, 0.12) * (1 - seg(q, 0.7, 1));
    K.text(g, String(s), x, y - size * 1.4 * E.out(q), size * sc, { fill: [mix(col, '#ffffff', 0.7), col, mix(col, '#000000', 0.25)], stroke, sw: 0.2, a });
  };
  /** Greca escalonada andina (ornamento). */
  K.fret = (g, x, y, s, rot) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
    g.moveTo(-s, s * 0.6); g.lineTo(-s, 0); g.lineTo(-s * 0.33, 0); g.lineTo(-s * 0.33, -s * 0.6); g.lineTo(s * 0.33, -s * 0.6); g.lineTo(s * 0.33, 0); g.lineTo(s, 0); g.lineTo(s, s * 0.6);
    g.stroke(); g.restore();
  };
  K.sun = (g, x, y, r, rays, rot, col, a) => {
    if (a <= 0.003) return;
    g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; K.alpha(g, a);
    g.beginPath(); g.arc(0, 0, r * 0.52, 0, TAU); g.fill(); g.beginPath();
    for (let i = 0; i < rays; i++) { const an = (i / rays) * TAU, w = (TAU / rays) * 0.3, r1 = i % 2 ? r * 0.82 : r; g.moveTo(Math.cos(an - w) * r * 0.6, Math.sin(an - w) * r * 0.6); g.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); g.lineTo(Math.cos(an + w) * r * 0.6, Math.sin(an + w) * r * 0.6); }
    g.fill(); g.restore();
  };
  /** Círculo mágico virreinal-andino. draw: 0..1 trazo progresivo; sy: achatado (perspectiva). */
  K.magicCircle = (g, x, y, r, rot, pal, a, o = {}) => {
    if (a <= 0.003 || r <= 1) return;
    const draw = o.draw == null ? 1 : clamp(o.draw), sy = o.sy || 1, c1 = o.c1 || pal.c, c2 = o.c2 || pal.a, lw = Math.max(1, r * 0.018);
    g.save(); g.translate(x, y); g.scale(1, sy); g.lineCap = 'round';
    g.strokeStyle = c2; K.alpha(g, a * 0.3); g.lineWidth = lw * 5; g.beginPath(); g.arc(0, 0, r, rot, rot + TAU * draw); g.stroke();
    g.strokeStyle = c1; K.alpha(g, a); g.lineWidth = lw * 1.4; g.beginPath(); g.arc(0, 0, r, rot, rot + TAU * draw); g.stroke();
    g.lineWidth = lw; g.beginPath(); g.arc(0, 0, r * 0.88, -rot, -rot + TAU * draw); g.stroke();
    const ticks = 48; g.beginPath();
    for (let i = 0; i < ticks * draw; i++) { const an = rot + (i / ticks) * TAU, r0 = r * (i % 4 ? 0.9 : 0.885), r1 = r * (i % 4 ? 0.935 : 0.975); g.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); g.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); }
    g.stroke();
    const glyphs = o.glyphs || 12; g.strokeStyle = c2; g.lineWidth = lw * 1.2; K.alpha(g, a * seg(draw, 0.3, 0.8));
    for (let i = 0; i < glyphs; i++) { const an = -rot * 1.4 + (i / glyphs) * TAU; K.fret(g, Math.cos(an) * r * 0.76, Math.sin(an) * r * 0.76, r * 0.06, an + PI / 2); }
    const pts = o.points || 8, step = o.step || 3, q = seg(draw, 0.2, 1); g.strokeStyle = c1; g.lineWidth = lw * 1.2; K.alpha(g, a * q);
    g.beginPath();
    for (let i = 0; i <= pts * q + 0.001; i++) { const an = rot * 0.6 + ((i * step) % pts) / pts * TAU - PI / 2; const px = Math.cos(an) * r * 0.64, py = Math.sin(an) * r * 0.64; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
    g.beginPath(); g.arc(0, 0, r * 0.64, 0, TAU); g.stroke();
    g.strokeStyle = c2; g.beginPath(); g.arc(0, 0, r * 0.3, 0, TAU); g.stroke();
    if (!o.noSun) K.sun(g, 0, 0, r * 0.24, 16, -rot * 2, c1, a * q * 0.9);
    g.restore();
  };
  K.shieldPath = (g, w, h) => {
    g.beginPath(); g.moveTo(-w, -h * 0.78); g.quadraticCurveTo(0, -h * 1.06, w, -h * 0.78); g.lineTo(w, h * 0.05);
    g.quadraticCurveTo(w * 0.95, h * 0.68, 0, h); g.quadraticCurveTo(-w * 0.95, h * 0.68, -w, h * 0.05); g.closePath();
  };
  /** Cristal multicolor facetado. */
  const CRYSTAL_COLS = ['#b05cff', '#ff3b5c', '#3fa9ff', '#ffd76a', '#7df0ff', '#ff6ad5'];
  K.crystal = (g, x, y, s, rot, tcol, a, crack = 0) => {
    if (a <= 0.003 || s <= 0.5) return;
    const P = [[0, -1.45], [0.72, -0.5], [0.72, 0.5], [0, 1.45], [-0.72, 0.5], [-0.72, -0.5]], c = [0.08, -0.12];
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.lineJoin = 'round';
    for (let i = 0; i < 6; i++) {
      const p0 = P[i], p1 = P[(i + 1) % 6], col = CRYSTAL_COLS[(i + (tcol | 0)) % 6], col2 = CRYSTAL_COLS[(i + 1 + (tcol | 0)) % 6];
      const gr = g.createLinearGradient(c[0], c[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, mix(col, col2, tcol % 1)); gr.addColorStop(1, mix(col, '#12052a', 0.45));
      g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.closePath();
      g.fillStyle = gr; K.alpha(g, a * 0.92); g.fill();
    }
    g.lineWidth = 0.05; g.strokeStyle = '#ffffff'; K.alpha(g, a * 0.9); g.beginPath();
    P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    P.forEach(p => { g.moveTo(c[0], c[1]); g.lineTo(p[0], p[1]); }); g.stroke();
    if (crack > 0) {
      g.strokeStyle = '#ffffff'; g.lineWidth = 0.09; K.alpha(g, a * crack); g.beginPath();
      g.moveTo(-0.5, -0.9); g.lineTo(-0.1, -0.35); g.lineTo(-0.34, 0.1); g.lineTo(0.12, 0.42); g.lineTo(-0.05, 1.0);
      g.moveTo(-0.1, -0.35); g.lineTo(0.5, -0.2); g.moveTo(0.12, 0.42); g.lineTo(0.6, 0.3); g.stroke();
    }
    g.restore();
  };
  /** Reverso de carta (decreto) genérico. */
  K.cardBack = (g, x, y, w, h, rot, sx, pal, a) => {
    if (a <= 0.003) return;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sx, 1); K.over(g);
    const r = w * 0.09, gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
    gr.addColorStop(0, mix(pal.b, '#000000', 0.25)); gr.addColorStop(0.5, pal.dark || '#14062a'); gr.addColorStop(1, mix(pal.b, '#000000', 0.4));
    K.alpha(g, a); g.fillStyle = gr; rrect(g, -w / 2, -h / 2, w, h, r); g.fill();
    g.strokeStyle = GOLD; g.lineWidth = w * 0.045; g.stroke();
    g.lineWidth = w * 0.02; rrect(g, -w * 0.39, -h * 0.42, w * 0.78, h * 0.84, r * 0.6); g.stroke();
    K.sun(g, 0, 0, w * 0.26, 12, 0, GOLD, a);
    g.fillStyle = pal.dark || '#14062a'; K.alpha(g, a); g.beginPath(); g.arc(0, 0, w * 0.075, 0, TAU); g.fill();
    g.restore();
  };
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  K.rrect = rrect;
  /** León heráldico luminoso (emblema del Edicto). tint: color de destello opcional. */
  K.lion = (g, x, y, s, a, pal, t = 0, hurt = 0) => {
    if (a <= 0.003 || s <= 1) return;
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; K.over(g);
    const main = hurt > 0 ? mix(pal.a, '#ff2038', hurt) : pal.a, deep = hurt > 0 ? mix(pal.b, '#7a0010', hurt) : pal.b;
    for (let layer = 0; layer < 2; layer++) {
      const n = 16, ro = layer ? 0.86 : 1.02, ri = layer ? 0.56 : 0.7, off = layer ? PI / n : 0, wob = Math.sin(t * 3 + layer) * 0.02;
      g.beginPath();
      for (let i = 0; i < n * 2; i++) { const an = off + (i / (n * 2)) * TAU - PI / 2, rr = (i % 2 ? ri : ro + wob * (i % 4 ? 1 : -1)); const px = Math.cos(an) * rr, py = Math.sin(an) * rr * 1.02 + 0.04; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath();
      const gr = g.createRadialGradient(0, 0, 0.2, 0, 0, 1.05); gr.addColorStop(0, layer ? pal.c : main); gr.addColorStop(1, layer ? main : deep);
      g.fillStyle = gr; K.alpha(g, a * (layer ? 0.95 : 0.9)); g.fill();
      g.strokeStyle = pal.core; g.lineWidth = 0.02; K.alpha(g, a * 0.8); g.stroke();
    }
    K.alpha(g, a); const fg = g.createLinearGradient(0, -0.5, 0, 0.6); fg.addColorStop(0, pal.c); fg.addColorStop(1, deep);
    g.fillStyle = fg; g.beginPath(); g.moveTo(-0.44, -0.3); g.quadraticCurveTo(0, -0.56, 0.44, -0.3); g.lineTo(0.37, 0.2); g.quadraticCurveTo(0.2, 0.52, 0, 0.58); g.quadraticCurveTo(-0.2, 0.52, -0.37, 0.2); g.closePath(); g.fill();
    g.strokeStyle = pal.dark; g.lineWidth = 0.03; g.stroke();
    g.fillStyle = main; [[-1], [1]].forEach(([m]) => { g.beginPath(); g.moveTo(m * 0.3, -0.4); g.lineTo(m * 0.52, -0.62); g.lineTo(m * 0.5, -0.3); g.closePath(); g.fill(); g.stroke(); });
    g.strokeStyle = pal.dark; g.lineWidth = 0.075; g.lineCap = 'round'; g.beginPath(); g.moveTo(-0.36, -0.2); g.lineTo(-0.08, -0.06); g.moveTo(0.36, -0.2); g.lineTo(0.08, -0.06); g.stroke();
    g.fillStyle = '#ffffff'; g.shadowColor = pal.core; g.shadowBlur = 8;
    [[-1], [1]].forEach(([m]) => { g.beginPath(); g.moveTo(m * 0.32, -0.1); g.lineTo(m * 0.1, 0.0); g.lineTo(m * 0.14, 0.06); g.lineTo(m * 0.3, 0.0); g.closePath(); g.fill(); });
    g.shadowBlur = 0; g.fillStyle = pal.dark; g.beginPath(); g.moveTo(-0.11, 0.17); g.lineTo(0.11, 0.17); g.lineTo(0, 0.3); g.closePath(); g.fill();
    g.lineWidth = 0.03; g.beginPath(); g.moveTo(0, 0.3); g.lineTo(0, 0.38); g.quadraticCurveTo(-0.08, 0.46, -0.18, 0.4); g.moveTo(0, 0.38); g.quadraticCurveTo(0.08, 0.46, 0.18, 0.4); g.stroke();
    g.fillStyle = GOLD; g.strokeStyle = pal.dark; g.lineWidth = 0.025; g.beginPath();
    g.moveTo(-0.3, -1.02); g.lineTo(-0.34, -1.3); g.lineTo(-0.16, -1.14); g.lineTo(0, -1.36); g.lineTo(0.16, -1.14); g.lineTo(0.34, -1.3); g.lineTo(0.3, -1.02); g.closePath(); g.fill(); g.stroke();
    g.restore();
  };
  /** Cinta con colas de golondrina. */
  K.ribbon = (g, x, y, w, h, pal, a, skew = 0) => {
    if (a <= 0.003 || w <= 2) return;
    g.save(); g.translate(x, y); g.transform(1, 0, skew, 1, 0, 0); K.over(g); K.alpha(g, a);
    const n = h * 0.42, gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
    gr.addColorStop(0, mix(pal.a, '#ffffff', 0.25)); gr.addColorStop(0.5, pal.a); gr.addColorStop(1, pal.b);
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2 - n, 0); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.lineTo(-w / 2 + n, 0); g.closePath();
    g.fillStyle = gr; g.fill(); g.strokeStyle = GOLD; g.lineWidth = Math.max(1.5, h * 0.05); g.lineJoin = 'miter'; g.stroke();
    g.lineWidth = Math.max(1, h * 0.022); g.strokeStyle = rgba(GOLD, 0.8); g.beginPath();
    g.moveTo(-w / 2 + n * 1.2, -h * 0.36); g.lineTo(w / 2 - n * 1.2, -h * 0.36); g.moveTo(-w / 2 + n * 1.2, h * 0.36); g.lineTo(w / 2 - n * 1.2, h * 0.36); g.stroke();
    g.restore();
  };

  /* ───────────── Partículas ───────────── */
  class Particles {
    constructor(fx) { this.fx = fx; this.a = []; }
    /** o: {x,y,n,angle,spread,speed:[a,b],life:[a,b],size:[a,b],colors|color,type,gravity,drag,to:{x,y},jitter} (unidades u, u/s) */
    emit(o) {
      const fx = this.fx, u = fx.u, rnd = fx.rnd, cap = CONFIG.maxParticles * fx.density;
      const n = Math.max(o.n > 0 ? 1 : 0, Math.round(o.n * fx.density));
      for (let i = 0; i < n && this.a.length < cap; i++) {
        const an = (o.angle == null ? rnd() * TAU : o.angle) + (rnd() - 0.5) * (o.spread == null ? (o.angle == null ? 0 : 0.6) : o.spread);
        const sp = (o.speed ? rnd.range(o.speed[0], o.speed[1]) : 0) * u, j = (o.jitter || 0) * u;
        const life = o.life ? rnd.range(o.life[0], o.life[1]) : 0.6;
        const x = o.x + (rnd() - 0.5) * 2 * j, y = o.y + (rnd() - 0.5) * 2 * j;
        this.a.push({
          x, y, x0: x, y0: y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life, max: life,
          size: (o.size ? rnd.range(o.size[0], o.size[1]) : 0.6) * u, col: o.colors ? rnd.pick(o.colors) : (o.color || '#ffffff'),
          type: o.type || 'spark', g: (o.gravity || 0) * u, drag: o.drag == null ? 1.5 : o.drag, rot: rnd() * TAU, vr: (rnd() - 0.5) * 9,
          to: o.to || null, ph: rnd() * TAU, delay: o.stagger ? rnd() * o.stagger : 0,
        });
      }
    }
    step(dt) {
      const a = this.a;
      for (let i = a.length - 1; i >= 0; i--) {
        const p = a[i];
        if (p.delay > 0) { p.delay -= dt; continue; }
        p.life -= dt;
        if (p.life <= 0) { a[i] = a[a.length - 1]; a.pop(); continue; }
        if (p.to) { const k = E.in(1 - p.life / p.max); p.x = lerp(p.x0, p.to.x, k) + Math.sin(p.ph + k * 5) * (1 - k) * p.size * 3; p.y = lerp(p.y0, p.to.y, k) + Math.cos(p.ph + k * 4) * (1 - k) * p.size * 3; continue; }
        const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy = p.vy * d + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.type === 'mote' || p.type === 'flake') p.x += Math.sin(p.ph + p.life * 4) * p.size * 0.12;
      }
    }
    draw(g) {
      this.fx._psDrawn = true;
      const a = this.a; if (!a.length) return;
      g.save(); K.add(g); g.lineCap = 'round';
      for (let i = 0; i < a.length; i++) {
        const p = a[i]; if (p.delay > 0) continue;
        const k = p.life / p.max, al = k < 0.5 ? k * 2 : 1;
        switch (p.type) {
          case 'spark': {
            const sp = Math.hypot(p.vx, p.vy) || 1, len = Math.min(p.size * 9, sp * 0.06) + p.size;
            g.strokeStyle = p.col; g.lineWidth = p.size * (0.4 + 0.6 * k); K.alpha(g, al);
            g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - (p.vx / sp) * len, p.y - (p.vy / sp) * len); g.stroke(); break;
          }
          case 'shard': {
            K.alpha(g, al); g.fillStyle = p.col; const s = p.size, c = Math.cos(p.rot), sn = Math.sin(p.rot);
            g.beginPath(); g.moveTo(p.x + c * s * 1.6, p.y + sn * s * 1.6); g.lineTo(p.x - sn * s * 0.6, p.y + c * s * 0.6); g.lineTo(p.x - c * s, p.y - sn * s); g.lineTo(p.x + sn * s * 0.5, p.y - c * s * 0.5); g.closePath(); g.fill(); break;
          }
          case 'flake': {
            K.alpha(g, al); g.fillStyle = p.col; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.ph + p.life * 7)); g.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2); g.restore(); break;
          }
          case 'ash': {
            g.globalCompositeOperation = 'source-over'; K.alpha(g, al * 0.8); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.size * (0.5 + 0.5 * k), 0, TAU); g.fill(); g.globalCompositeOperation = 'lighter'; break;
          }
          case 'ember': K.glow(g, p.x, p.y, p.size * (0.8 + 2.2 * k), p.col, al); break;
          default: K.glow(g, p.x, p.y, p.size * 2.6, p.col, al * (p.type === 'mote' ? 0.5 + 0.5 * Math.sin(p.ph + p.life * 9) : 1));
        }
      }
      g.restore();
    }
  }

  /* ───────────── Escenario por contenedor ───────────── */
  const DEFAULT_ANCHORS = {
    center: { x: 0.5, y: 0.5 }, player: { x: 0.25, y: 0.7 }, rival: { x: 0.75, y: 0.3 },
    deck: { x: 0.88, y: 0.62 }, rivalDeck: { x: 0.12, y: 0.38 }, hand: { x: 0.5, y: 0.9 }, rivalHand: { x: 0.5, y: 0.1 },
    playerBar: { x: 0.25, y: 0.88, w: 0.3, h: 0.035 }, rivalBar: { x: 0.75, y: 0.12, w: 0.3, h: 0.035 },
    seal: { x: 0.5, y: 0.56 }, summon: { x: 0.5, y: 0.54 }, top: { x: 0.5, y: 0.08 },
  };
  const stages = new Map();
  class Stage {
    constructor(container) {
      this.el = container; this.isBody = container === document.body || container === document.documentElement;
      this.effects = []; this.anchors = {}; this.W = 1; this.H = 1; this.dpr = 1; this.dirty = true;
      if (!this.isBody && getComputedStyle(container).position === 'static') container.style.position = 'relative';
      const c = this.canvas = document.createElement('canvas');
      c.className = 'drfx-canvas'; c.setAttribute('aria-hidden', 'true');
      c.style.cssText = `position:${this.isBody ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:${CONFIG.zIndex};display:block;background:transparent`;
      container.appendChild(c); this.g = c.getContext('2d');
      this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { this.dirty = true; }) : null;
      if (this.ro) this.ro.observe(this.isBody ? document.documentElement : container);
      this.onWin = () => { this.dirty = true; }; root.addEventListener('resize', this.onWin);
    }
    domLayer() {
      if (!this.dom) {
        const d = this.dom = document.createElement('div'); d.className = 'drfx-dom'; d.setAttribute('aria-hidden', 'true');
        d.style.cssText = `position:${this.isBody ? 'fixed' : 'absolute'};left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:${CONFIG.zIndex + 1}`;
        this.el.appendChild(d);
      }
      return this.dom;
    }
    resize() {
      const W = this.isBody ? root.innerWidth : this.el.clientWidth, H = this.isBody ? root.innerHeight : this.el.clientHeight;
      const dpr = Math.min(root.devicePixelRatio || 1, QUALITY.dpr);
      this.W = Math.max(1, W); this.H = Math.max(1, H); this.dpr = dpr; this.dirty = false;
      const cw = Math.round(this.W * dpr), ch = Math.round(this.H * dpr);
      if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
    }
    frame(dt) {
      if (this.dirty || this.qv !== QUALITY.v) { this.qv = QUALITY.v; this.resize(); }
      const g = this.g; g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, this.W, this.H); this.rect = null;
      const list = this.effects;
      for (let i = 0; i < list.length; i++) { const f = list[i]; if (f.alive && !(f.def.passive && f.started)) f._step(g, dt); }
      if (list.some(f => !f.alive)) this.effects = list.filter(f => f.alive);
      if (!this.effects.length) g.clearRect(0, 0, this.W, this.H);
      /* Los efectos pasivos (DOM/CSS persistentes) no mantienen vivo el bucle de animación. */
      return this.effects.some(f => !f.def.passive || !f.started);
    }
    resolve(spec, fx) {
      const W = this.W, H = this.H;
      if (typeof spec === 'string') spec = (fx && fx.o.anchors && fx.o.anchors[spec]) || this.anchors[spec] || DEFAULT_ANCHORS[spec] || DEFAULT_ANCHORS.center;
      if (spec && spec.nodeType === 1) {
        if (!this.rect) this.rect = this.canvas.getBoundingClientRect();
        const r = spec.getBoundingClientRect(), sx = W / (this.rect.width || W), sy = H / (this.rect.height || H);
        return { x: (r.left + r.width / 2 - this.rect.left) * sx, y: (r.top + r.height / 2 - this.rect.top) * sy, w: r.width * sx, h: r.height * sy, el: spec };
      }
      const s = spec || DEFAULT_ANCHORS.center;
      return { x: s.x * W, y: s.y * H, w: (s.w || 0) * W, h: (s.h || 0) * H };
    }
    destroy() {
      this.effects.slice().forEach(f => f.stop());
      if (this.ro) this.ro.disconnect(); root.removeEventListener('resize', this.onWin);
      this.canvas.remove(); if (this.dom) this.dom.remove(); stages.delete(this.el);
    }
  }
  function stageFor(container) {
    const el = container || document.body; let s = stages.get(el);
    if (!s) { s = new Stage(el); stages.set(el, s); }
    return s;
  }

  /* ───────────── Bucle global, FPS y calidad adaptativa ───────────── */
  const QUALITY = { tier: 0, density: 1, dpr: CONFIG.maxDpr, v: 0 };
  const TIERS = [{ density: 1, dpr: 2 }, { density: 0.6, dpr: 1.5 }, { density: 0.35, dpr: 1 }];
  function setQuality(q) {
    CONFIG.quality = q; const t = q === 'low' ? 2 : q === 'medium' ? 1 : 0; applyTier(t);
  }
  function applyTier(t) { QUALITY.tier = t; QUALITY.density = TIERS[t].density; QUALITY.dpr = Math.min(CONFIG.maxDpr, TIERS[t].dpr); QUALITY.v++; }
  const stats = { fps: 60, active: 0, particles: 0, tier: 0 };
  let raf = 0, last = 0, lowT = 0;
  const mq = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const isReduced = () => (CONFIG.reducedMotion === 'auto' ? !!(mq && mq.matches) : !!CONFIG.reducedMotion);
  function tick(now) {
    raf = 0; let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 1 / 60;
    if (dt < 0.25) stats.fps = lerp(stats.fps, 1 / dt, 0.08);
    if (CONFIG.quality === 'auto' && dt < 0.25) {
      lowT = stats.fps < 42 ? lowT + dt : Math.max(0, lowT - dt * 0.5);
      if (lowT > 1.2 && QUALITY.tier < 2) { applyTier(QUALITY.tier + 1); lowT = 0; emitGlobal('quality', { tier: QUALITY.tier }); }
    }
    dt = Math.min(dt, 0.05); reducedNow = isReduced();
    let active = 0, parts = 0;
    let running = false;
    stages.forEach(s => { if (!s.effects.length) return; if (s.frame(dt)) running = true; active += s.effects.length; s.effects.forEach(f => { parts += f.ps.a.length; }); });
    stats.active = active; stats.particles = parts; stats.tier = QUALITY.tier;
    if (running) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  /* ───────────── Eventos y audio ───────────── */
  const listeners = {};
  function on(name, fn) { (listeners[name] = listeners[name] || new Set()).add(fn); return () => listeners[name].delete(fn); }
  function emitGlobal(name, data) { const l = listeners[name]; if (l) l.forEach(fn => { try { fn(data); } catch (e) { console.error('[DecretoFX]', e); } }); }
  const audio = {
    enabled: false, synth: true, volume: 0.5, bindings: new Map(), ctx: null,
    /** bind('impact', fn | url) o bind('A01:impact', …): enlaza sonidos existentes a un cue. */
    bind(key, target) {
      if (typeof target === 'string') { const pool = [new Audio(target), new Audio(target)]; let i = 0; pool.forEach(a => { a.preload = 'auto'; }); target = () => { const a = pool[i++ % 2]; a.volume = audio.volume; a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); }; }
      this.bindings.set(key, target); return this;
    },
    unbind(key) { this.bindings.delete(key); return this; },
    fire(id, cue) {
      if (!this.enabled) return;
      const b = this.bindings.get(id + ':' + cue) || this.bindings.get(cue);
      if (b) { try { b({ id, cue }); } catch (e) { console.error('[DecretoFX]', e); } } else if (this.synth) synth(cue);
    },
    unlock() { try { if (!this.ctx) { const AC = root.AudioContext || root.webkitAudioContext; if (AC) this.ctx = new AC(); } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { /* sin audio */ } },
  };
  /* Sintetizador mínimo de respaldo para la galería (reemplazable con audio.bind). */
  const SYN = {
    whoosh: ['n', 300, 2600, 0.28, 0.5], slash: ['n', 900, 5200, 0.16, 0.6], impact: ['t', 150, 40, 0.3, 0.9, 'n'], boom: ['t', 110, 28, 0.7, 1, 'n'],
    shield: ['t', 320, 660, 0.45, 0.4, 0, 'triangle'], chime: ['t', 880, 1320, 0.5, 0.3, 0, 'sine'], heal: ['t', 520, 1040, 0.6, 0.3, 0, 'sine'],
    charge: ['t', 120, 720, 0.6, 0.3, 0, 'sawtooth'], paper: ['n', 1800, 700, 0.3, 0.3], card: ['n', 2400, 1200, 0.12, 0.35], coin: ['t', 1760, 2100, 0.35, 0.3, 0, 'sine'],
    fanfare: ['t', 392, 784, 0.9, 0.35, 0, 'triangle'], fall: ['t', 330, 82, 1.1, 0.35, 0, 'triangle'], tick: ['t', 1200, 1200, 0.05, 0.2, 0, 'square'],
    roar: ['t', 95, 60, 0.7, 0.7, 'n', 'sawtooth'], shatter: ['n', 6000, 1500, 0.35, 0.6], hum: ['t', 180, 240, 0.8, 0.25, 0, 'sine'], door: ['t', 70, 45, 0.5, 0.8, 'n'], reveal: ['t', 660, 990, 0.4, 0.3, 0, 'triangle'],
  };
  function synth(cue) {
    const s = SYN[cue], ac = audio.ctx; if (!s || !ac || ac.state !== 'running') return;
    const t = ac.currentTime, dur = s[3], out = ac.createGain(); out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(s[4] * audio.volume, t + 0.012); out.gain.exponentialRampToValueAtTime(0.0001, t + dur); out.connect(ac.destination);
    const noise = () => {
      const len = Math.ceil(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = buf; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(s[0] === 'n' ? s[1] : 900, t); f.frequency.exponentialRampToValueAtTime(s[0] === 'n' ? s[2] : 200, t + dur); src.connect(f); f.connect(out); src.start(t); src.stop(t + dur);
    };
    if (s[0] === 'n') noise();
    else { const o = ac.createOscillator(); o.type = s[6] || 'sine'; o.frequency.setValueAtTime(s[1], t); o.frequency.exponentialRampToValueAtTime(Math.max(20, s[2]), t + dur * 0.9); o.connect(out); o.start(t); o.stop(t + dur); if (s[5] === 'n') noise(); }
  }

  /* ───────────── Instancia de efecto ───────────── */
  const defs = new Map();
  let uid = 0;
  class FXInstance {
    constructor(stage, def, o) {
      this.stage = stage; this.def = def; this.o = o; this.id = def.id; this.uid = ++uid;
      this.dur = Math.max(60, o.duration || def.dur || 1000); this.speed = o.speed > 0 ? o.speed : 1;
      this.intensity = o.intensity == null ? 1 : Math.max(0, o.intensity); this.scale = o.scale > 0 ? o.scale : 1;
      this.rnd = rng(o.seed || ((Math.random() * 1e9) | 0)); this.params = Object.assign({}, def.defaults, o.params);
      this.pal = resolvePalette(def, o); this.side = o.side === 'rival' ? 'rival' : 'player'; this.foe = this.side === 'rival' ? 'player' : 'rival';
      this.t = 0; this.clock = 0; this.p = 0; this.alive = true; this.started = false; this.released = !o.hold; this.layer = o.layer === undefined ? def.layer : o.layer;
      this.ps = new Particles(this); this._fired = new Set(); this._cueI = 0; this._ls = {}; this._clean = []; this._shake = 0; this._shakeT = 0;
      this.finished = new Promise(res => { this._res = res; });
      this.draw = def.make(this);
    }
    get W() { return this.stage.W; } get H() { return this.stage.H; }
    get u() { return Math.min(this.stage.W, this.stage.H) / 100 * this.scale; }
    get density() { return this.intensity * QUALITY.density * (reducedNow ? 0.3 : 1); }
    get reduced() { return reducedNow; }
    pt(spec) { return this.stage.resolve(spec, this); }
    /** true una sola vez cuando el progreso cruza th. */
    hit(th) { if (this.p >= th && !this._fired.has(th)) { this._fired.add(th); return true; } return false; }
    cue(name) { this._emit('cue', { cue: name }); emitGlobal('cue', { id: this.id, cue: name, handle: this }); if (!this.o.silent) audio.fire(this.id, name); }
    shake(mag = 1, dur = 0.25) { if (reducedNow || this.o.shake === false) return; this._shake = mag * this.u; this._shakeT = this._shakeD = dur; }
    /** Sacude un elemento del anfitrión sin tocar su estilo (Web Animations; se cancela al limpiar). */
    shakeEl(el, mag = 6, ms = 320) {
      if (!el || !el.animate || reducedNow || this.o.shake === false) return;
      const r = this.rnd, kf = [{ transform: 'translate(0,0)' }];
      for (let i = 0; i < 6; i++) { const k = 1 - i / 6; kf.push({ transform: `translate(${((r() - 0.5) * 2 * mag * k).toFixed(1)}px,${((r() - 0.5) * 2 * mag * k).toFixed(1)}px)` }); }
      kf.push({ transform: 'translate(0,0)' });
      const an = el.animate(kf, { duration: ms / this.speed, easing: 'linear', composite: 'add' }); this._clean.push(() => an.cancel());
    }
    onCleanup(fn) { this._clean.push(fn); }
    on(name, fn) { (this._ls[name] = this._ls[name] || []).push(fn); return this; }
    _emit(name, data) { const d = Object.assign({ id: this.id, handle: this }, data); (this._ls[name] || []).forEach(fn => { try { fn(d); } catch (e) { console.error('[DecretoFX]', e); } }); }
    then(a, b) { return this.finished.then(a, b); }
    update(params) { Object.assign(this.params, params); this._emit('update', { params: this.params }); return this; }
    /** Libera un efecto en espera (hold) para que complete su salida. */
    release() { this.released = true; return this; }
    finish() { this._end(true); }
    stop() { this._end(false); return this; }
    restart() { this.stop(); return playFX(this.id, this.o); }
    _step(g, dt) {
      if (!this.started) { this.started = true; this._emit('start', {}); emitGlobal('start', { id: this.id, handle: this }); }
      const sdt = dt * this.speed, def = this.def; this.clock += sdt;
      let p = 0;
      if (!def.manual) {
        this.t += sdt; p = this.t * 1000 / this.dur;
        if (!this.released && def.holdAt != null && p >= def.holdAt) { p = def.holdAt; this.t = p * this.dur / 1000; }
        p = Math.min(1, p);
        const cues = def.cues; if (cues) while (this._cueI < cues.length && p >= cues[this._cueI][0]) this.cue(cues[this._cueI++][1]);
      }
      this.p = p; this._psDrawn = false;
      g.save(); baseAlpha = def.manual || def.noFade ? 1 : Math.min(1, (1 - p) / 0.08); g.globalAlpha = baseAlpha;
      if (this._shakeT > 0) { this._shakeT -= sdt; const k = Math.max(0, this._shakeT / this._shakeD) * this._shake; g.translate((this.rnd() - 0.5) * 2 * k, (this.rnd() - 0.5) * 2 * k); }
      try { this.draw(g, p, sdt, this.clock); this.ps.step(sdt); if (!this._psDrawn) this.ps.draw(g); }
      catch (e) { g.restore(); baseAlpha = 1; console.error('[DecretoFX] ' + this.id, e); emitGlobal('error', { id: this.id, error: e }); this._end(false, e); return; }
      g.restore(); baseAlpha = 1;
      if (!def.manual && p >= 1) this._end(true);
    }
    _end(completed, error) {
      if (!this.alive) return; this.alive = false;
      this._clean.splice(0).forEach(fn => { try { fn(); } catch (e) { /* limpieza */ } });
      this.ps.a.length = 0;
      const res = { id: this.id, completed: !!completed, error: error || null };
      this._emit(completed ? 'end' : 'stop', res); emitGlobal(completed ? 'end' : 'stop', Object.assign({ handle: this }, res));
      if (typeof this.o.onComplete === 'function') { try { this.o.onComplete(res); } catch (e) { console.error('[DecretoFX]', e); } }
      this._res(res); kick();
    }
  }

  /* ───────────── API pública ───────────── */
  function define(id, def) { def.id = id; def.status = def.status || 'completo'; defs.set(id, def); return def; }
  /**
   * Reproduce un efecto. options: { container, faction, palette, color, side, at, from, to, anchors, target,
   *   scale, duration, speed, intensity, params, hold, layer, silent, shake, seed, signal, onComplete }
   * Devuelve un controlador «thenable»: await playFX(…) → { id, completed }.
   */
  function playFX(id, options) {
    const def = defs.get(id); if (!def) throw new Error('[DecretoFX] Efecto desconocido: ' + id);
    const o = Object.assign({}, options), stage = stageFor(o.container);
    if (stage.dirty) stage.resize();
    reducedNow = isReduced();
    const fx = new FXInstance(stage, def, o);
    if (fx.layer) stage.effects.forEach(f => { if (f.layer === fx.layer) f.stop(); });
    stage.effects = stage.effects.filter(f => f.alive); stage.effects.push(fx);
    if (o.signal) { if (o.signal.aborted) fx.stop(); else { const ab = () => fx.stop(); o.signal.addEventListener('abort', ab, { once: true }); fx.onCleanup(() => o.signal.removeEventListener('abort', ab)); } }
    kick(); return fx;
  }
  /** Detiene los efectos activos (de un contenedor o de todos). */
  function stopAll(container) { (container ? [stages.get(container)] : Array.from(stages.values())).forEach(s => s && s.effects.slice().forEach(f => f.stop())); }
  /** Detiene y elimina lienzos y capas DOM: no queda ningún recurso del motor en el contenedor. */
  function clear(container) { (container ? [stages.get(container)] : Array.from(stages.values())).forEach(s => s && s.destroy()); }
  function setAnchors(container, map) { const s = stageFor(container); s.anchors = Object.assign({}, map); return s; }
  /**
   * Secuencia controlada. steps: [{ id, options, delay, wait, until }, [paralelos…], número(ms de pausa)]
   *  wait:false → no espera el final · until:'impact' → continúa cuando se emite ese cue.
   */
  function sequence(steps, shared) {
    let cancelled = false; const live = new Set(), timers = new Set();
    const sleep = ms => new Promise(res => { const t = setTimeout(() => { timers.delete(t); res(); }, ms); timers.add(t); });
    const run = step => {
      if (cancelled) return Promise.resolve();
      if (typeof step === 'number') return sleep(step);
      if (typeof step === 'function') { const r = step(); return r instanceof Promise ? r : Promise.resolve(); } // un controlador devuelto no bloquea la secuencia
      if (Array.isArray(step)) return Promise.all(step.map(run));
      return (step.delay ? sleep(step.delay) : Promise.resolve()).then(() => {
        if (cancelled) return null;
        const h = playFX(step.id, Object.assign({}, shared, step.options)); live.add(h); h.then(() => live.delete(h));
        if (step.wait === false) return null;
        if (step.until) return new Promise(res => { h.on('cue', e => { if (e.cue === step.until) res(); }); h.then(res); });
        return h.finished;
      });
    };
    const finished = (async () => { for (const s of steps) { if (cancelled) break; await run(s); } return { completed: !cancelled }; })();
    return { finished, then: (a, b) => finished.then(a, b), stop() { cancelled = true; timers.forEach(clearTimeout); timers.clear(); live.forEach(h => h.stop()); } };
  }
  /** Precarga REAL de recursos. Devuelve promesa; onProgress(loaded/total, detalle). */
  function preload(urls, onProgress) {
    const list = (urls || []).slice(), total = list.length, failed = []; let done = 0;
    const one = url => new Promise(res => {
      const fin = ok => { if (!ok) failed.push(url); done++; if (onProgress) onProgress(total ? done / total : 1, { url, ok, done, total }); res(); };
      const clean = String(url).split('?')[0].toLowerCase();
      if (/\.(png|jpe?g|webp|avif|gif|svg)$/.test(clean)) { const im = new Image(); im.onload = () => (im.decode ? im.decode().then(() => fin(true), () => fin(true)) : fin(true)); im.onerror = () => fin(false); im.src = url; }
      else if (/\.(mp3|ogg|wav|m4a|webm|mp4)$/.test(clean)) { const m = document.createElement(/\.(webm|mp4)$/.test(clean) ? 'video' : 'audio'); m.preload = 'auto'; m.oncanplaythrough = () => fin(true); m.onerror = () => fin(false); m.src = url; m.load(); }
      else fetch(url).then(r => (r.ok ? r.arrayBuffer() : Promise.reject())).then(() => fin(true), () => fin(false));
    });
    if (onProgress) onProgress(total ? 0 : 1, { done: 0, total });
    return Promise.all(list.map(one)).then(() => ({ total, failed }));
  }
  function manifest() {
    return Array.from(defs.values()).sort((a, b) => a.id.localeCompare(b.id)).map(d => ({
      id: d.id, name: d.name, category: d.cat, status: d.status, durationMs: d.manual ? null : d.dur, persistent: !!d.manual, holdable: d.holdAt != null,
      palette: d.pal || null, usesFaction: !!d.byFaction, layer: d.layer || null, anchors: d.anchors || [], cues: (d.cues || []).map(c => c[1]).concat(d.extraCues || []).filter((c, i, a) => a.indexOf(c) === i),
      params: d.paramInfo || {}, options: d.paramOptions || {}, presets: d.presets || null, defaults: d.defaults || {}, description: d.desc || '',
    }));
  }
  const CATEGORIES = { A: 'Combate y cartas', B: 'Daño, vida y combos', C: 'Interfaz y transiciones', D: 'Cartas místicas y habilidades' };

  root.DecretoFX = {
    version: '3.0.0', playFX, play: playFX, stopAll, clear, sequence, preload, define, setAnchors, setQuality, manifest, on, audio, stats,
    config: CONFIG, palettes: PALETTES, categories: CATEGORIES, defs, GOLD, GOLD_GRAD,
    util: { K, E, clamp, lerp, seg, rgba, mix, rng, TAU, PI, paletteFrom },
    get reducedMotion() { return isReduced(); },
  };
})(typeof window !== 'undefined' ? window : this);
