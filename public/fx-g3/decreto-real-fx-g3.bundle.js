/* Decreto Real FX Studio G3 — original Claude FX modules, concatenated for production. */
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

// temporary-staging-probe

;
/*! Decreto Real FX Studio G3 — fx-combat.js · A01–A12 Combate y cartas */
(function (D) {
  'use strict';
  const { K, E, clamp, lerp, seg, mix, TAU, PI } = D.util, GOLD = D.GOLD, P = D.palettes;

  /* ── A01 / A02 · Tajo diagonal con núcleo blanco, estela, chispas y explosión ── */
  function slashFX(fx) {
    const pal = fx.pal, rnd = fx.rnd, ang = (fx.params.angle * PI) / 180, dx = Math.cos(ang), dy = Math.sin(ang);
    const cols = [[pal.b, 1, 0.55], [pal.a, 0.72, 0.9], [pal.c, 0.42, 0.85], [pal.core, 0.24, 1]];
    return (g, p) => {
      const u = fx.u, A = fx.pt(fx.o.from || fx.side), B = fx.pt(fx.o.to || fx.o.at || fx.foe), L = 44 * u;
      const P0 = { x: B.x - dx * L, y: B.y - dy * L }, P1 = { x: B.x + dx * L, y: B.y + dy * L }, C = { x: B.x - dy * 9 * u, y: B.y + dx * 9 * u };
      K.add(g);
      // 1 · Anticipación: destello que viaja del atacante al objetivo
      const q0 = seg(p, 0, 0.3);
      if (q0 > 0 && q0 < 1) {
        const k = E.io(q0), x = lerp(A.x, P0.x, k), y = lerp(A.y, P0.y, k), k2 = E.io(clamp(q0 - 0.18)), x2 = lerp(A.x, P0.x, k2), y2 = lerp(A.y, P0.y, k2);
        g.lineCap = 'round'; g.strokeStyle = pal.a; g.lineWidth = 2.2 * u; K.alpha(g, 0.55); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke();
        g.strokeStyle = pal.core; g.lineWidth = 0.8 * u; K.alpha(g, 0.95); g.stroke();
        K.glow(g, x, y, 9 * u, pal.a, 0.9); K.glow(g, x, y, 4 * u, pal.core, 1);
        if (rnd() < 0.7) fx.ps.emit({ x, y, n: 1, speed: [4, 14], life: [0.2, 0.4], size: [0.3, 0.6], colors: [pal.a, pal.c], type: 'spark' });
      }
      // 2 · Tajo
      const head = E.out(seg(p, 0.28, 0.47)), tail = E.io(seg(p, 0.36, 0.66));
      if (head > tail) {
        K.blade(g, P0, C, P1, tail, head, 9 * u, cols, 1);
        const m = 1 - head, hx = m * m * P0.x + 2 * m * head * C.x + head * head * P1.x, hy = m * m * P0.y + 2 * m * head * C.y + head * head * P1.y;
        K.glow(g, hx, hy, 12 * u, pal.a, 0.8 * (1 - seg(p, 0.47, 0.6))); K.glow(g, hx, hy, 5 * u, pal.core, 1 - seg(p, 0.47, 0.6));
        if (p < 0.5) fx.ps.emit({ x: hx, y: hy, n: 2, angle: ang + PI, spread: 1.2, speed: [20, 60], life: [0.25, 0.5], size: [0.3, 0.7], colors: [pal.a, pal.c, pal.core], type: 'spark', gravity: 30 });
      }
      // cicatriz luminosa
      const sc = seg(p, 0.44, 0.86);
      if (sc > 0 && sc < 1) {
        g.lineCap = 'round'; g.beginPath(); g.moveTo(P0.x, P0.y); g.quadraticCurveTo(C.x, C.y, P1.x, P1.y);
        g.strokeStyle = pal.a; g.lineWidth = 2.4 * u * (1 - sc); K.alpha(g, 0.6 * (1 - sc)); g.stroke();
        g.strokeStyle = pal.core; g.lineWidth = 0.7 * u * (1 - sc); K.alpha(g, 1 - sc); g.stroke();
      }
      // 3 · Impacto
      if (fx.hit(0.45)) {
        fx.cue('impact'); fx.shake(1.6, 0.3); if (B.el) fx.shakeEl(B.el, 7, 300);
        fx.ps.emit({ x: B.x, y: B.y, n: 46, speed: [30, 120], life: [0.35, 0.8], size: [0.35, 0.9], colors: [pal.a, pal.c, pal.core, GOLD], type: 'spark', gravity: 60, drag: 2.2 });
        fx.ps.emit({ x: B.x, y: B.y, n: 12, speed: [20, 70], life: [0.5, 0.9], size: [0.8, 1.6], colors: [pal.a, pal.b, pal.core], type: 'shard', gravity: 90, drag: 1.6 });
        fx.ps.emit({ x: B.x, y: B.y, n: 14, speed: [4, 20], life: [0.6, 1.1], size: [0.8, 1.6], colors: [pal.a, GOLD], type: 'ember', jitter: 5 });
      }
      const im = seg(p, 0.45, 0.82);
      if (im > 0 && im < 1) {
        const e = E.out5(im), f = 1 - im;
        K.glow(g, B.x, B.y, (16 + 30 * e) * u, pal.a, 0.75 * f); K.glow(g, B.x, B.y, (8 + 12 * e) * u, pal.core, f * f);
        K.burst(g, B.x, B.y, 3 * u, (14 + 30 * e) * u, 14, ang, pal.core, f * f * 0.95, 0.045, D.util.rng(7));
        K.spikeRing(g, B.x, B.y, (6 + 26 * e) * u, 4.5 * u * f, 18, im * 1.5, pal.a, f, 0.7 * u, D.util.rng(((p * 30) | 0) + 3));
        K.ring(g, B.x, B.y, (4 + 36 * e) * u, 0.5 * u * f, pal.c, f * 0.8);
      }
      K.flash(g, fx.W, fx.H, 0.1 * E.bell(seg(p, 0.44, 0.56)), pal.core);
    };
  }
  const slashInfo = { angle: 'Ángulo del tajo en grados (38 = diagonal descendente).' };
  D.define('A01', { name: 'Ataque carmesí', cat: 'A', dur: 900, pal: 'carmesi', defaults: { angle: 38 }, paramInfo: slashInfo, anchors: ['from', 'to'], cues: [[0, 'whoosh'], [0.28, 'slash']], extraCues: ['impact'], make: slashFX, desc: 'Tajo diagonal rojo con núcleo blanco, chispas, estela y explosión al contacto.' });
  D.define('A02', { name: 'Ataque de facción azul', cat: 'A', dur: 900, pal: 'azul', defaults: { angle: 38 }, paramInfo: slashInfo, anchors: ['from', 'to'], cues: [[0, 'whoosh'], [0.28, 'slash']], extraCues: ['impact'], make: slashFX, desc: 'Variante azul del tajo; misma dirección visual y calidad.' });

  /* ── A03 · Decreto de Defensa: escudo energético ── */
  D.define('A03', {
    name: 'Decreto de Defensa', cat: 'A', dur: 1100, pal: 'defensa', anchors: ['at'], cues: [[0, 'charge'], [0.3, 'shield'], [0.62, 'chime']],
    desc: 'Escudo energético azul que se invoca, se expande, brilla y se desvanece.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd;
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || fx.side), R = 21 * u;
        const grow = E.back(seg(p, 0.22, 0.52)), orb = seg(p, 0, 0.3), out = seg(p, 0.78, 1), life = 1 - E.in(out), s = Math.max(0.001, grow * (1 + 0.12 * E.in(out)));
        K.add(g);
        // orbe inicial con rayos (referencia aprobada)
        if (orb < 1) {
          const r = (3 + 8 * E.out(orb)) * u;
          K.glow(g, c.x, c.y, r * 3, pal.a, 0.8); K.glow(g, c.x, c.y, r * 1.5, pal.core, 1);
          const br = D.util.rng(((t * 24) | 0) + 11);
          for (let i = 0; i < 4; i++) { const an = br() * TAU; K.bolt(g, c.x, c.y, c.x + Math.cos(an) * r * 2.6, c.y + Math.sin(an) * r * 2.6, 1.4 * u, br, pal.c, 0.35 * u, 0.9); }
          if (rnd() < 0.8) { const an = rnd() * TAU; fx.ps.emit({ x: c.x + Math.cos(an) * 26 * u, y: c.y + Math.sin(an) * 26 * u, n: 1, to: c, life: [0.2, 0.35], size: [0.4, 0.8], colors: [pal.c, pal.a], type: 'dot' }); }
        }
        if (grow > 0) {
          // aura y remolino
          K.glow(g, c.x, c.y, R * 2.4 * s, pal.b, 0.55 * life); K.glow(g, c.x, c.y, R * 1.6 * s, pal.a, 0.35 * life);
          g.lineCap = 'round';
          for (let i = 0; i < 3; i++) {
            const a0 = t * 4.2 + (i * TAU) / 3, rr = R * (1.22 + 0.06 * i) * s;
            g.beginPath(); g.arc(c.x, c.y, rr, a0, a0 + 1.5); g.strokeStyle = pal.b; g.lineWidth = 3.2 * u * s; K.alpha(g, 0.5 * life); g.stroke();
            g.strokeStyle = pal.c; g.lineWidth = 0.9 * u * s; K.alpha(g, 0.95 * life); g.stroke();
          }
          // cuerpo del escudo
          g.save(); g.translate(c.x, c.y + R * 0.06 * s); g.scale(s, s);
          K.shieldPath(g, R * 0.78, R);
          const gr = g.createRadialGradient(0, -R * 0.3, R * 0.1, 0, 0, R * 1.2);
          gr.addColorStop(0, D.util.rgba(pal.core, 0.75)); gr.addColorStop(0.35, D.util.rgba(pal.a, 0.5)); gr.addColorStop(1, D.util.rgba(pal.b, 0.3));
          g.fillStyle = gr; K.alpha(g, 0.9 * life); g.fill();
          g.save(); g.clip();
          // retícula hexagonal
          g.strokeStyle = pal.c; g.lineWidth = 0.25 * u; K.alpha(g, 0.5 * life * (0.6 + 0.4 * Math.sin(t * 6)));
          const hs = R * 0.19; g.beginPath();
          for (let row = -6; row <= 6; row++) for (let col = -5; col <= 5; col++) {
            const hx = col * hs * 1.732 + (row & 1 ? hs * 0.866 : 0), hy = row * hs * 1.5;
            for (let k = 0; k < 6; k++) { const a1 = (k / 6) * TAU + PI / 6, px = hx + Math.cos(a1) * hs, py = hy + Math.sin(a1) * hs; k ? g.lineTo(px, py) : g.moveTo(px, py); }
            g.closePath();
          }
          g.stroke();
          // barrido de brillo
          const sh = seg(p, 0.5, 0.78);
          if (sh > 0 && sh < 1) {
            const sx = lerp(-R * 1.6, R * 1.6, E.io(sh)), lg = g.createLinearGradient(sx - R * 0.5, 0, sx + R * 0.5, 0);
            lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = lg; K.alpha(g, life); g.transform(1, 0, -0.5, 1, 0, 0); g.fillRect(-R * 3, -R * 1.5, R * 6, R * 3);
          }
          g.restore();
          K.shieldPath(g, R * 0.78, R); g.lineJoin = 'round';
          g.strokeStyle = pal.a; g.lineWidth = 2.6 * u; K.alpha(g, 0.5 * life); g.stroke();
          g.strokeStyle = GOLD; g.lineWidth = 0.9 * u; K.alpha(g, life); g.stroke();
          K.shieldPath(g, R * 0.62, R * 0.8); g.strokeStyle = pal.core; g.lineWidth = 0.35 * u; K.alpha(g, 0.8 * life); g.stroke();
          K.sun(g, 0, -R * 0.08, R * 0.3, 12, t * 0.8, GOLD, 0.9 * life); K.glow(g, 0, -R * 0.08, R * 0.5, pal.core, 0.7 * life);
          g.restore();
        }
        if (fx.hit(0.3)) { fx.ps.emit({ x: c.x, y: c.y, n: 26, speed: [25, 70], life: [0.3, 0.6], size: [0.3, 0.7], colors: [pal.c, pal.core, pal.a], type: 'spark' }); }
        const pr = seg(p, 0.3, 0.75); if (pr > 0 && pr < 1) { K.ring(g, c.x, c.y, R * (0.6 + 1.5 * E.out(pr)), 0.7 * u * (1 - pr), pal.c, 1 - pr); K.ring(g, c.x, c.y, R * (0.3 + 2.1 * E.out(pr)), 0.4 * u * (1 - pr), GOLD, (1 - pr) * 0.7); }
        if (fx.hit(0.8)) fx.ps.emit({ x: c.x, y: c.y, n: 24, jitter: 16, angle: -PI / 2, spread: 1.4, speed: [4, 18], life: [0.3, 0.6], size: [0.5, 1], colors: [pal.c, pal.a, GOLD], type: 'mote' });
      };
    },
  });

  /* ── A04 · Recuperación de vida ── */
  D.define('A04', {
    name: 'Recuperación de vida', cat: 'A', dur: 1100, pal: 'vida', anchors: ['at'], defaults: { amount: null }, paramInfo: { amount: 'Valor a mostrar (lo entrega el motor). null = sin número.' }, cues: [[0, 'heal'], [0.45, 'chime']],
    desc: 'Luz verde y dorada ascendente, partículas suaves y pulso de curación.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd;
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || fx.side), env = E.bell(seg(p, 0, 0.95)), base = c.y + 14 * u;
        K.add(g);
        K.glow(g, c.x, c.y, 34 * u, pal.b, 0.5 * env); K.glow(g, c.x, c.y, 20 * u, pal.a, 0.35 * env);
        // columna de luz
        for (let i = 0; i < 5; i++) {
          const ox = (i - 2) * 5 * u + Math.sin(t * 2 + i) * 1.2 * u, h = (42 + 10 * Math.sin(i * 2.1)) * u * E.out(seg(p, 0.02 + i * 0.03, 0.5)), w = (2.2 + (i % 2) * 1.6) * u;
          const lg = g.createLinearGradient(0, base, 0, base - h); lg.addColorStop(0, D.util.rgba(i % 2 ? GOLD : pal.a, 0.75)); lg.addColorStop(1, D.util.rgba(pal.a, 0));
          g.fillStyle = lg; K.alpha(g, env * 0.8); g.fillRect(c.x + ox - w / 2, base - h, w, h);
        }
        // anillos de curación en la base
        for (let i = 0; i < 3; i++) { const q = seg(p, 0.05 + i * 0.16, 0.6 + i * 0.16); if (q > 0 && q < 1) K.ring(g, c.x, base, (4 + 24 * E.out(q)) * u, 0.6 * u * (1 - q), i === 1 ? GOLD : pal.a, 1 - q, 0.32); }
        if (p < 0.8 && rnd() < 0.9) fx.ps.emit({ x: c.x + (rnd() - 0.5) * 30 * u, y: base - rnd() * 6 * u, n: 2, angle: -PI / 2, spread: 0.3, speed: [14, 34], life: [0.5, 1], size: [0.4, 1.1], colors: [pal.a, pal.c, GOLD, pal.core], type: 'mote', drag: 0.4 });
        // rombos ascendentes (hojas de luz)
        for (let i = 0; i < 4; i++) {
          const q = seg(p, 0.1 + i * 0.12, 0.7 + i * 0.1); if (q <= 0 || q >= 1) continue;
          const x = c.x + (i - 1.5) * 7 * u, y = base - 8 * u - 30 * u * E.out(q), s = (1.6 + (i % 2)) * u * E.bell(q);
          g.fillStyle = i % 2 ? GOLD : pal.core; K.alpha(g, E.bell(q)); g.beginPath(); g.moveTo(x, y - s * 1.6); g.lineTo(x + s * 0.7, y); g.lineTo(x, y + s * 1.6); g.lineTo(x - s * 0.7, y); g.closePath(); g.fill();
        }
        const pulse = seg(p, 0.4, 0.75); if (pulse > 0 && pulse < 1) { K.glow(g, c.x, c.y, (10 + 26 * pulse) * u, pal.core, (1 - pulse) * 0.8); K.ring(g, c.x, c.y, (6 + 30 * E.out(pulse)) * u, 0.5 * u, pal.c, 1 - pulse); }
        fx.ps.draw(g);
        if (fx.params.amount != null) K.floatText(g, '+' + fx.params.amount, c.x, c.y - 4 * u, 9 * u, seg(p, 0.3, 0.98), pal.a, '#032612');
      };
    },
  });

  /* ── A05–A08 · Impactos de cristal multicolor (niveles I, II, III y Final) ── */
  const IC = ['#b05cff', '#ff3b5c', '#3fa9ff', '#ffd76a', '#7df0ff'];
  function impactFX(level) {
    return fx => {
      const rnd = fx.rnd, fin = level === 4, rings = [1, 2, 4, 6][level - 1], size = [7, 9, 11, 15][level - 1], boom = fin ? 0.56 : 0.55;
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || fx.o.to || fx.foe), W = fx.W, H = fx.H;
        if (fin) K.dim(g, W, H, 0.6 * E.bell(seg(p, 0, 1)));
        K.add(g);
        const ch = seg(p, 0, boom), after = seg(p, boom, 1);
        // concentración de energía
        if (ch < 1) {
          const s = size * u * E.back(seg(ch, 0, 0.35)) * (1 + 0.06 * Math.sin(t * 30) * ch), wob = (rnd() - 0.5) * ch * ch * 0.8 * u;
          K.glow(g, c.x, c.y, s * (3 + 2 * ch), IC[((t * 6) | 0) % 5], 0.5 + 0.4 * ch); K.glow(g, c.x, c.y, s * 1.6, '#ffffff', 0.35 + 0.5 * ch * ch);
          if (level >= 2) K.ring(g, c.x, c.y, s * (3.2 - 1.6 * ch), 0.4 * u, IC[1], 0.6 * ch);
          if (level >= 3) { K.magicCircle(g, c.x, c.y, s * 2.6, t * 2, P.impacto, 0.7 * seg(ch, 0.1, 0.5), { draw: seg(ch, 0.05, 0.6), noSun: true, c1: IC[3], c2: IC[0] }); }
          if (level >= 3 || ch > 0.5) { const br = D.util.rng(((t * 22) | 0) + 5); for (let i = 0; i < level; i++) { const an = br() * TAU, r = s * (2 + br() * 2); K.bolt(g, c.x + Math.cos(an) * r, c.y + Math.sin(an) * r, c.x, c.y, 1.2 * u, br, IC[i % 5], 0.3 * u, 0.5 + 0.5 * ch); } }
          K.over(g); K.crystal(g, c.x + wob, c.y - wob, s, Math.sin(t * 2.4) * 0.18 + (fin ? ch * 0.6 : 0), t * 3, 1, seg(ch, 0.6, 1)); K.add(g);
          if (rnd() < 0.5 + level * 0.15) { const an = rnd() * TAU, r = (22 + rnd() * 16 + level * 4) * u; fx.ps.emit({ x: c.x + Math.cos(an) * r, y: c.y + Math.sin(an) * r, n: 1 + (level > 2 ? 1 : 0), to: c, life: [0.25, 0.45], size: [0.4, 0.9], colors: IC, type: 'dot' }); }
        }
        // descarga (solo Impacto Final): columna de energía
        if (fin) {
          const bq = seg(p, 0.5, 0.86);
          if (bq > 0 && bq < 1) {
            const w = (2 + 16 * E.bell(bq)) * u, lg = g.createLinearGradient(c.x - w, 0, c.x + w, 0);
            lg.addColorStop(0, 'rgba(176,92,255,0)'); lg.addColorStop(0.3, 'rgba(176,92,255,0.8)'); lg.addColorStop(0.5, 'rgba(255,255,255,1)'); lg.addColorStop(0.7, 'rgba(63,169,255,0.8)'); lg.addColorStop(1, 'rgba(63,169,255,0)');
            g.fillStyle = lg; K.alpha(g, E.bell(bq)); g.fillRect(c.x - w, 0, w * 2, H);
            const br = D.util.rng(((t * 20) | 0) + 9); for (let i = 0; i < 3; i++) K.bolt(g, c.x + (br() - 0.5) * w * 2, 0, c.x + (br() - 0.5) * w, H, 3 * u, br, IC[i], 0.4 * u, E.bell(bq));
          }
        }
        // explosión
        if (fx.hit(boom)) {
          fx.cue(fin ? 'boom' : 'impact'); fx.shake([0.8, 1.4, 2.2, 3.6][level - 1], fin ? 0.6 : 0.3); if (c.el) fx.shakeEl(c.el, 4 + level * 2, 260 + level * 60);
          fx.ps.emit({ x: c.x, y: c.y, n: [22, 44, 70, 120][level - 1], speed: [20, 70 + level * 28], life: [0.35, 0.6 + level * 0.14], size: [0.35, 0.9], colors: IC.concat('#ffffff'), type: 'spark', gravity: 40, drag: 2 });
          fx.ps.emit({ x: c.x, y: c.y, n: [6, 14, 20, 34][level - 1], speed: [16, 50 + level * 20], life: [0.5, 0.8 + level * 0.12], size: [0.8, 1.4 + level * 0.3], colors: IC, type: 'shard', gravity: 70, drag: 1.5 });
          if (level >= 3) fx.ps.emit({ x: c.x, y: c.y, n: 20 * (level - 2), speed: [4, 22], life: [0.7, 1.3], size: [0.8, 1.8], colors: IC, type: 'ember', jitter: 8 });
        }
        if (after > 0 && after < 1) {
          const f = 1 - after, e = E.out5(after), R = (18 + level * 12) * u;
          K.glow(g, c.x, c.y, R * (0.8 + 1.6 * e), IC[level % 5], 0.7 * f); K.glow(g, c.x, c.y, R * (0.4 + 0.7 * e), '#ffffff', f * f);
          K.burst(g, c.x, c.y, 2 * u, R * (0.8 + 1.3 * e), 10 + level * 4, 0.3 + level, '#ffffff', f * f, 0.04, D.util.rng(level * 13));
          for (let i = 0; i < rings; i++) { const q = seg(after, i * 0.09, 0.55 + i * 0.09); if (q > 0 && q < 1) K.ring(g, c.x, c.y, R * (0.3 + (1.3 + i * 0.28) * E.out(q)), (0.9 - i * 0.08) * u * (1 - q), IC[i % 5], 1 - q); }
          if (level >= 2) K.spikeRing(g, c.x, c.y, R * (0.3 + 1.1 * e), 3.5 * u * f, 16 + level * 2, after * 2, IC[2], f, 0.6 * u, D.util.rng(((p * 30) | 0) + 1));
          if (fin) { K.ring(g, c.x, c.y, R * (0.2 + 3.4 * e), 1.4 * u * f, '#ffffff', f * 0.9, 0.28); K.ring(g, c.x, c.y, R * (0.2 + 2.6 * e), 0.8 * u * f, IC[3], f * 0.8, 0.28); }
        }
        K.flash(g, W, H, [0.08, 0.14, 0.24, 0.8][level - 1] * (1 - E.out(seg(p, boom, boom + (fin ? 0.22 : 0.14)))) * (p >= boom ? 1 : 0), '#ffffff');
      };
    };
  }
  const impCues = [[0, 'charge']];
  D.define('A05', { name: 'Impacto I', cat: 'A', dur: 800, pal: 'impacto', anchors: ['at'], cues: impCues, extraCues: ['impact'], make: impactFX(1), desc: 'Cristal multicolor que concentra energía y libera una explosión pequeña.' });
  D.define('A06', { name: 'Impacto II', cat: 'A', dur: 1000, pal: 'impacto', anchors: ['at'], cues: impCues, extraCues: ['impact'], make: impactFX(2), desc: 'Cristal con mayor intensidad, ondas expansivas y fragmentos.' });
  D.define('A07', { name: 'Impacto III', cat: 'A', dur: 1200, pal: 'impacto', anchors: ['at'], cues: impCues, extraCues: ['impact'], make: impactFX(3), desc: 'Explosión mística de alta intensidad y varios anillos luminosos.' });
  D.define('A08', { name: 'Impacto Final', cat: 'A', dur: 2400, pal: 'impacto', anchors: ['at'], cues: [[0, 'charge'], [0.3, 'hum']], extraCues: ['boom'], make: impactFX(4), desc: 'Gran cristal multicolor, descarga energética y explosión cinematográfica.' });

  /* ── A09 · Decreto de Orden: pergamino violeta y dorado ── */
  D.define('A09', {
    name: 'Decreto de Orden', cat: 'A', dur: 1200, pal: 'orden', anchors: ['at'], cues: [[0, 'paper'], [0.5, 'chime']],
    desc: 'Pergamino violeta y dorado que aparece, se despliega e ilumina.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd, lines = Array.from({ length: 7 }, () => 0.55 + rnd() * 0.4);
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || 'center'), w = 34 * u, hMax = 44 * u;
        const ap = E.back(seg(p, 0, 0.2)), open = E.io(seg(p, 0.14, 0.5)), out = seg(p, 0.84, 1), life = 1 - out, h = Math.max(2 * u, hMax * open), rod = 2.6 * u;
        K.add(g); K.glow(g, c.x, c.y, 40 * u * ap, pal.b, 0.6 * life); K.glow(g, c.x, c.y, 26 * u * open, pal.a, 0.35 * life);
        g.save(); g.translate(c.x, c.y - out * 4 * u); g.scale(ap * (1 + out * 0.06), ap); K.over(g);
        // hoja
        const pg = g.createLinearGradient(0, -h / 2, 0, h / 2); pg.addColorStop(0, '#3a1c7a'); pg.addColorStop(0.5, '#6a3fc4'); pg.addColorStop(1, '#3a1c7a');
        K.alpha(g, life); g.fillStyle = pg; g.fillRect(-w / 2, -h / 2, w, h);
        g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip();
        g.strokeStyle = GOLD; g.lineWidth = 0.45 * u; g.strokeRect(-w / 2 + 1.6 * u, -hMax / 2 + 1.6 * u, w - 3.2 * u, hMax - 3.2 * u);
        g.lineWidth = 0.3 * u; for (let i = 0; i < 8; i++) { K.fret(g, -w / 2 + 4.5 * u + i * (w - 9 * u) / 7, -hMax / 2 + 4.6 * u, 1.1 * u, 0); K.fret(g, -w / 2 + 4.5 * u + i * (w - 9 * u) / 7, hMax / 2 - 4.6 * u, 1.1 * u, PI); }
        // escritura dorada progresiva
        g.lineCap = 'round'; g.lineWidth = 0.55 * u;
        lines.forEach((len, i) => {
          const q = seg(p, 0.4 + i * 0.045, 0.55 + i * 0.045); if (q <= 0) return;
          const y = -hMax / 2 + 9.5 * u + i * 3.3 * u, x0 = -w / 2 + 5 * u;
          g.strokeStyle = GOLD; K.alpha(g, life * 0.9); g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + (w - 10 * u) * len * q, y); g.stroke();
        });
        // sello
        const sq = E.back(seg(p, 0.62, 0.8));
        if (sq > 0) { K.sun(g, 0, hMax / 2 - 10.5 * u, 4.4 * u * sq, 12, t, GOLD, life); g.fillStyle = '#4a1fa6'; K.alpha(g, life); g.beginPath(); g.arc(0, hMax / 2 - 10.5 * u, 1.3 * u * sq, 0, TAU); g.fill(); }
        // barrido de luz
        const sh = seg(p, 0.5, 0.8);
        if (sh > 0 && sh < 1) { const y = lerp(-hMax / 2, hMax / 2, sh), lg = g.createLinearGradient(0, y - 6 * u, 0, y + 6 * u); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,240,200,0.75)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); K.add(g); g.fillStyle = lg; K.alpha(g, life); g.fillRect(-w / 2, y - 6 * u, w, 12 * u); K.over(g); }
        g.restore();
        // varillas doradas
        [-1, 1].forEach(m => {
          const y = m * h / 2, rg = g.createLinearGradient(0, y - rod / 2, 0, y + rod / 2); rg.addColorStop(0, '#fff3c2'); rg.addColorStop(0.5, GOLD); rg.addColorStop(1, '#9a6a12');
          K.alpha(g, life); g.fillStyle = rg; K.rrect(g, -w / 2 - 2.4 * u, y - rod / 2, w + 4.8 * u, rod, rod / 2); g.fill();
          g.fillStyle = '#a26bff'; [-1, 1].forEach(n => { g.beginPath(); g.arc(n * (w / 2 + 2.6 * u), y, rod * 0.72, 0, TAU); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 0.35 * u; g.stroke(); });
        });
        g.restore(); K.add(g);
        if (fx.hit(0.5)) fx.ps.emit({ x: c.x, y: c.y, n: 26, jitter: 16, angle: -PI / 2, spread: 2.4, speed: [6, 26], life: [0.5, 0.9], size: [0.4, 0.9], colors: [GOLD, pal.a, pal.core], type: 'mote' });
        const il = seg(p, 0.62, 0.9); if (il > 0 && il < 1) { K.ring(g, c.x, c.y, (10 + 34 * E.out(il)) * u, 0.5 * u * (1 - il), GOLD, 1 - il); K.glow(g, c.x, c.y + hMax / 2 - 10.5 * u, 14 * u * E.bell(il), GOLD, 0.8 * E.bell(il)); }
      };
    },
  });

  /* ── A10 · Robar carta ── */
  D.define('A10', {
    name: 'Robar carta', cat: 'A', dur: 800, pal: 'orden', byFaction: true, anchors: ['from', 'to'], defaults: { count: 1 }, paramInfo: { count: 'Cantidad de cartas a mostrar (la decide el motor; «Roba 1 carta» = 1).' }, cues: [[0, 'card']], extraCues: ['card'],
    desc: 'Destello en el mazo y viaje visual de una carta hacia la mano.',
    make(fx) {
      const pal = fx.pal, n = Math.max(1, Math.min(5, fx.params.count | 0 || 1)), span = 0.72;
      return (g, p) => {
        const u = fx.u, rivalSide = fx.side === 'rival', A = fx.pt(fx.o.from || (rivalSide ? 'rivalDeck' : 'deck')), B = fx.pt(fx.o.to || (rivalSide ? 'rivalHand' : 'hand'));
        const cw = (A.w || 9 * u), chh = (A.h || cw * 1.42), dir = B.y < A.y ? 1 : -1;
        K.add(g);
        const fl = seg(p, 0, 0.3); if (fl < 1) { K.glow(g, A.x, A.y, (10 + 16 * E.out(fl)) * u, GOLD, 1 - fl); K.ring(g, A.x, A.y, (4 + 16 * E.out(fl)) * u, 0.5 * u * (1 - fl), pal.core, 1 - fl); K.burst(g, A.x, A.y, 2 * u, (8 + 12 * fl) * u, 8, 0.4, pal.core, (1 - fl) * 0.8, 0.05); }
        for (let i = 0; i < n; i++) {
          const st = n === 1 ? 0.06 : 0.04 + (i * (1 - span - 0.06)) / (n - 1), q = seg(p, st, st + span); if (q <= 0 || q >= 1) continue;
          if (i > 0 && fx.hit(st + 0.0001 * i)) fx.cue('card');
          const k = E.io(q), off = (i - (n - 1) / 2) * (B.w ? Math.min(cw * 0.8, B.w / (n + 1)) : cw * 0.8);
          const cx = (A.x + B.x + off) / 2 + (A.y - B.y) * 0.25 * dir, cy = Math.min(A.y, B.y) - 16 * u, m = 1 - k;
          const x = m * m * A.x + 2 * m * k * cx + k * k * (B.x + off), y = m * m * A.y + 2 * m * k * cy + k * k * B.y;
          // estela
          for (let j = 1; j <= 4; j++) { const kk = E.io(clamp(q - j * 0.035)), mm = 1 - kk; K.glow(g, mm * mm * A.x + 2 * mm * kk * cx + kk * kk * (B.x + off), mm * mm * A.y + 2 * mm * kk * cy + kk * kk * B.y, cw * (0.9 - j * 0.12), j % 2 ? GOLD : pal.a, 0.28 * E.bell(q)); }
          const sc = 1 + 0.35 * E.bell(q), a = seg(q, 0, 0.08) * (1 - seg(q, 0.86, 1));
          K.cardBack(g, x, y, cw * sc, chh * sc, lerp(-0.5, 0, k) * dir, Math.cos(k * PI * 2) * 0.35 + 0.65, pal, a); K.add(g);
          if (fx.rnd() < 0.6) fx.ps.emit({ x, y, n: 1, speed: [2, 10], life: [0.25, 0.5], size: [0.3, 0.7], colors: [GOLD, pal.core], type: 'mote' });
          if (q > 0.84) { const e = seg(q, 0.84, 1); K.glow(g, B.x + off, B.y, (6 + 12 * e) * u, GOLD, 1 - e); K.ring(g, B.x + off, B.y, (3 + 10 * e) * u, 0.4 * u, pal.core, 1 - e); }
        }
      };
    },
  });

  /* ── A11 · Activación mística genérica ── */
  D.define('A11', {
    name: 'Activación mística genérica', cat: 'A', dur: 1200, pal: 'orden', anchors: ['at'], defaults: { label: '' }, paramInfo: { label: 'Nombre de la habilidad a revelar (texto entregado por el juego).' }, cues: [[0, 'hum'], [0.55, 'reveal']],
    desc: 'Sello mágico, círculo de energía y revelación de habilidad.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd;
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || 'center'), R = 26 * u, draw = E.io(seg(p, 0, 0.45)), out = seg(p, 0.82, 1), life = 1 - out, rev = seg(p, 0.5, 0.8);
        K.add(g); K.glow(g, c.x, c.y, R * 2, pal.b, 0.55 * draw * life);
        K.magicCircle(g, c.x, c.y, R * (0.8 + 0.2 * E.out(draw) + 0.25 * E.in(out)), t * 1.2, pal, life, { draw });
        K.magicCircle(g, c.x, c.y, R * 1.32 * (0.9 + 0.1 * draw), -t * 0.7, pal, life * 0.5 * seg(p, 0.2, 0.5), { draw: seg(p, 0.15, 0.55), noSun: true, glyphs: 20, points: 12, step: 5 });
        if (p < 0.6 && rnd() < 0.8) { const an = rnd() * TAU; fx.ps.emit({ x: c.x + Math.cos(an) * R, y: c.y + Math.sin(an) * R, n: 1, angle: -PI / 2, spread: 0.6, speed: [6, 22], life: [0.4, 0.8], size: [0.4, 0.9], colors: [pal.a, pal.c, pal.core], type: 'mote' }); }
        if (rev > 0) {
          const w = R * 0.5 * E.bell(rev) + R * 0.08 * life, lg = g.createLinearGradient(c.x - w, 0, c.x + w, 0);
          lg.addColorStop(0, D.util.rgba(pal.a, 0)); lg.addColorStop(0.5, D.util.rgba(pal.core, 0.95)); lg.addColorStop(1, D.util.rgba(pal.a, 0));
          const vg = g.createLinearGradient(0, c.y - R * 2.4, 0, c.y + R * 0.4); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.5, '#fff'); vg.addColorStop(1, '#fff');
          g.fillStyle = lg; K.alpha(g, life * (0.5 + 0.5 * E.bell(rev))); g.fillRect(c.x - w, c.y - R * 2.2 * E.out(rev), w * 2, R * 2.2 * E.out(rev) + R * 0.2);
          K.glow(g, c.x, c.y, R * (0.5 + 1.2 * E.bell(rev)), pal.core, E.bell(rev)); K.ring(g, c.x, c.y, R * (0.4 + 1.6 * E.out(rev)), 0.6 * u * (1 - rev), pal.c, 1 - rev);
        }
        if (fx.hit(0.55)) fx.ps.emit({ x: c.x, y: c.y, n: 36, speed: [20, 70], life: [0.4, 0.8], size: [0.35, 0.8], colors: [pal.a, pal.c, pal.core], type: 'spark' });
        fx.ps.draw(g);
        const label = fx.params.label; if (label) { const q = seg(p, 0.55, 0.7), size = K.fit(g, label, 6.5 * u, fx.W * 0.86, { ls: 0.08 }); K.text(g, label, c.x, c.y + R * 1.5, size * (1.3 - 0.3 * E.out(q)), { fill: D.GOLD_GRAD, stroke: pal.dark, ls: 0.08, a: q * life, glow: pal.a }); }
      };
    },
  });

  /* ── A12 · Colisión de efectos ── */
  D.define('A12', {
    name: 'Colisión de efectos', cat: 'A', dur: 1200, pal: 'oro', anchors: ['from', 'to', 'at'],
    defaults: { attack: 'carmesi', defense: 'defensa', winner: 'draw' }, paramOptions: { winner: ['draw', 'attack', 'defense'], attack: ['carmesi', 'azul', 'oro', 'orden', 'sangre', 'tormenta'], defense: ['defensa', 'azul', 'carmesi', 'oro', 'hierro', 'selva'] },
    paramInfo: { attack: 'Paleta de la energía atacante (nombre o color hex).', defense: 'Paleta de la energía defensora.', winner: "Quién prevalece visualmente: 'attack' | 'defense' | 'draw' (lo decide el motor)." },
    cues: [[0, 'whoosh']], extraCues: ['impact', 'boom'], desc: 'Dos energías chocan y generan una onda expansiva; configurable según ataque y defensa.',
    make(fx) {
      const res = v => (typeof v === 'string' && v[0] === '#' ? D.util.paletteFrom(v) : P[v] || P.oro), pa = res(fx.params.attack), pd = res(fx.params.defense), rnd = fx.rnd;
      const bias = fx.params.winner === 'attack' ? 1 : fx.params.winner === 'defense' ? -1 : 0;
      return (g, p, dt, t) => {
        const u = fx.u, A = fx.pt(fx.o.from || fx.side), B = fx.pt(fx.o.to || fx.foe), at = fx.o.at ? fx.pt(fx.o.at) : null;
        const dxl = B.x - A.x, dyl = B.y - A.y, len = Math.hypot(dxl, dyl) || 1, nx = dxl / len, ny = dyl / len;
        const push = bias * 7 * u * E.io(seg(p, 0.3, 0.62)), M = { x: (at ? at.x : (A.x + B.x) / 2) + nx * push, y: (at ? at.y : (A.y + B.y) / 2) + ny * push };
        K.add(g);
        const tr = E.in(seg(p, 0, 0.28)), hold = seg(p, 0.28, 0.62), ex = seg(p, 0.62, 1);
        [[A, pa, 1], [B, pd, -1]].forEach(([S, pal, sgn]) => {
          if (ex >= 0.4) return;
          const hx = lerp(S.x, M.x, tr), hy = lerp(S.y, M.y, tr), tk = clamp(tr - 0.35 + hold * 0.35), tx = lerp(S.x, M.x, tk), ty = lerp(S.y, M.y, tk), f = 1 - seg(ex, 0, 0.4);
          const jx = (rnd() - 0.5) * hold * 1.4 * u, jy = (rnd() - 0.5) * hold * 1.4 * u;
          g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy);
          g.strokeStyle = pal.b; g.lineWidth = 7 * u; K.alpha(g, 0.4 * f); g.stroke(); g.strokeStyle = pal.a; g.lineWidth = 3.4 * u; K.alpha(g, 0.85 * f); g.stroke(); g.strokeStyle = pal.core; g.lineWidth = 1.1 * u; K.alpha(g, f); g.stroke();
          K.glow(g, hx + jx, hy + jy, (9 + 5 * hold) * u, pal.a, 0.9 * f); K.glow(g, hx + jx, hy + jy, 4.5 * u, pal.core, f);
          if (hold > 0 && hold < 1) fx.ps.emit({ x: M.x, y: M.y, n: 2, angle: Math.atan2(-ny * sgn, -nx * sgn), spread: 2.2, speed: [30, 90], life: [0.2, 0.45], size: [0.3, 0.7], colors: [pal.a, pal.c, pal.core], type: 'spark' });
        });
        if (fx.hit(0.28)) { fx.cue('impact'); fx.shake(1.2, 0.3); }
        if (hold > 0 && ex < 0.3) {
          const br = D.util.rng(((t * 26) | 0) + 3), f = 1 - seg(ex, 0, 0.3);
          K.glow(g, M.x, M.y, (10 + 8 * hold + 3 * Math.sin(t * 40)) * u, '#ffffff', 0.9 * f);
          g.strokeStyle = '#ffffff'; g.lineWidth = (0.6 + hold) * u; K.alpha(g, f); g.beginPath(); g.moveTo(M.x - ny * 14 * u * hold, M.y + nx * 14 * u * hold); g.lineTo(M.x + ny * 14 * u * hold, M.y - nx * 14 * u * hold); g.stroke();
          for (let i = 0; i < 4; i++) { const an = br() * TAU, r = (8 + br() * 12) * u; K.bolt(g, M.x, M.y, M.x + Math.cos(an) * r, M.y + Math.sin(an) * r, 1.3 * u, br, i % 2 ? pa.a : pd.a, 0.3 * u, f); }
          K.spikeRing(g, M.x, M.y, (7 + 4 * hold) * u, 3 * u, 14, t * 3, i2(pa, pd, t), f * 0.9, 0.5 * u, br);
        }
        if (fx.hit(0.62)) {
          fx.cue('boom'); fx.shake(2.4, 0.4);
          [[pa, PI + Math.atan2(ny, nx)], [pd, Math.atan2(ny, nx)]].forEach(([pal, an]) => fx.ps.emit({ x: M.x, y: M.y, n: 40, angle: an, spread: 2.6, speed: [30, 130], life: [0.35, 0.8], size: [0.35, 0.9], colors: [pal.a, pal.c, pal.core], type: 'spark', gravity: 30, drag: 2 }));
          fx.ps.emit({ x: M.x, y: M.y, n: 14, speed: [20, 70], life: [0.5, 0.9], size: [0.8, 1.5], colors: [pa.a, pd.a, '#ffffff'], type: 'shard', gravity: 60 });
        }
        if (ex > 0 && ex < 1) {
          const f = 1 - ex, e = E.out5(ex), win = bias > 0 ? pa : bias < 0 ? pd : null;
          K.glow(g, M.x, M.y, (20 + 40 * e) * u, win ? win.a : '#ffffff', 0.7 * f); K.glow(g, M.x, M.y, (10 + 16 * e) * u, '#ffffff', f * f);
          K.burst(g, M.x, M.y, 3 * u, (16 + 34 * e) * u, 16, 0.2, '#ffffff', f * f, 0.04, D.util.rng(21));
          K.ring(g, M.x, M.y, (6 + 44 * e) * u, 1 * u * f, pa.a, f); K.ring(g, M.x, M.y, (4 + 36 * e) * u, 0.8 * u * f, pd.a, f); K.ring(g, M.x, M.y, (2 + 56 * e) * u, 0.5 * u * f, GOLD, f * 0.8);
        }
        K.flash(g, fx.W, fx.H, 0.2 * E.bell(seg(p, 0.6, 0.74)), '#ffffff');
      };
      function i2(a, b, t) { return ((t * 12) | 0) % 2 ? a.c : b.c; }
    },
  });
})(window.DecretoFX);

;
/*! Decreto Real FX Studio G3 — fx-health-combos.js · B01–B07 Daño, vida y combos
 * Solo representación: las cantidades (amount, from, to, max) las entrega el motor de combate. */
(function (D) {
  'use strict';
  const { K, E, clamp, lerp, seg, mix, TAU, PI } = D.util, GOLD = D.GOLD, P = D.palettes;

  const hpColor = k => (k > 0.5 ? mix('#f2b632', '#3ddc6a', seg(k, 0.5, 0.75)) : k > 0.25 ? mix('#ff3340', '#f2b632', seg(k, 0.25, 0.5)) : '#ff3340');
  /** Barra de vida superpuesta (no sustituye la barra real del juego: la cubre durante el efecto). */
  function drawBar(g, r, k, col, o = {}) {
    const x = r.x - r.w / 2, y = r.y - r.h / 2, rad = Math.min(r.h / 2, r.w / 2);
    g.save(); K.over(g);
    K.alpha(g, o.a == null ? 1 : o.a); g.fillStyle = '#12080a'; K.rrect(g, x, y, r.w, r.h, rad); g.fill();
    g.save(); K.rrect(g, x, y, r.w, r.h, rad); g.clip();
    if (o.ghost != null && o.ghost > k) { g.fillStyle = o.ghostCol || '#ffffff'; K.alpha(g, (o.a == null ? 1 : o.a) * 0.75); g.fillRect(x, y, r.w * o.ghost, r.h); }
    const gr = g.createLinearGradient(0, y, 0, y + r.h); gr.addColorStop(0, mix(col, '#ffffff', 0.45)); gr.addColorStop(0.5, col); gr.addColorStop(1, mix(col, '#000000', 0.35));
    g.fillStyle = gr; K.alpha(g, o.a == null ? 1 : o.a); g.fillRect(x, y, r.w * clamp(k), r.h);
    if (o.white > 0) { g.fillStyle = '#ffffff'; K.alpha(g, o.white); g.fillRect(x, y, r.w * clamp(k), r.h); }
    if (o.sweep != null && o.sweep > 0 && o.sweep < 1) { const sx = x + r.w * clamp(k) * o.sweep, lg = g.createLinearGradient(sx - r.h * 2, 0, sx + r.h * 2, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; K.alpha(g, 1); g.fillRect(x, y, r.w * clamp(k), r.h); }
    g.restore();
    g.strokeStyle = GOLD; g.lineWidth = Math.max(1, r.h * 0.14); K.alpha(g, o.a == null ? 1 : o.a); K.rrect(g, x, y, r.w, r.h, rad); g.stroke();
    g.restore();
  }
  function barRect(fx, who) {
    const r = fx.pt(fx.o.bar || (who === 'rival' ? 'rivalBar' : 'playerBar')), u = fx.u;
    if (!r.w) { r.w = 34 * u; r.h = 3.4 * u; }
    return r;
  }

  /* ── B01 / B02 · Daño recibido por jugador / rival ── */
  function damageFX(defaultSide) {
    return fx => {
      const who = fx.o.side || defaultSide, pal = fx.pal, rnd = fx.rnd, isPlayer = who === 'player', dir = isPlayer ? 1 : -1;
      const cracks = Array.from({ length: 5 }, () => [rnd() * TAU, 0.6 + rnd() * 0.5, rnd]);
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || fx.o.target || who), hw = (c.w || 22 * u) / 2, hh = (c.h || 26 * u) / 2, R = Math.max(hw, hh);
        if (fx.hit(0.02)) {
          fx.cue('impact'); fx.shake(isPlayer ? 1.4 : 0.9, 0.3); fx.shakeEl(fx.o.target || c.el, isPlayer ? 8 : 6, 340);
          fx.ps.emit({ x: c.x, y: c.y, n: 34, angle: dir > 0 ? PI * 0.65 : -PI * 0.35, spread: 2.6, speed: [30, 110], life: [0.3, 0.7], size: [0.35, 0.85], colors: [pal.a, pal.c, pal.core, '#ffffff'], type: 'spark', gravity: 80 * dir, drag: 2 });
          fx.ps.emit({ x: c.x, y: c.y, n: 10, angle: dir > 0 ? PI * 0.6 : -PI * 0.4, spread: 2.4, speed: [20, 60], life: [0.5, 0.9], size: [0.7, 1.4], colors: [pal.a, pal.b], type: 'shard', gravity: 110 * dir });
        }
        const f = 1 - E.out(seg(p, 0, 0.7)), e = E.out5(seg(p, 0, 0.5));
        if (isPlayer) K.vignette(g, fx.W, fx.H, pal.b, 0.75 * E.bell(seg(p, 0, 0.85)));
        K.add(g);
        // destello sobre el retrato
        g.save(); K.rrect(g, c.x - hw, c.y - hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.2); g.fillStyle = pal.a; K.alpha(g, 0.55 * f * (fx.reduced ? 0.4 : 1)); g.fill();
        g.strokeStyle = pal.core; g.lineWidth = 0.9 * u; K.alpha(g, f); g.stroke(); g.strokeStyle = pal.a; g.lineWidth = 3 * u; K.alpha(g, 0.4 * f); g.stroke(); g.restore();
        K.glow(g, c.x, c.y, R * (1.6 + 0.8 * e), pal.a, 0.6 * f); K.glow(g, c.x, c.y, R * 0.9, pal.core, f * f * 0.9);
        K.burst(g, c.x, c.y, R * 0.2, R * (0.9 + 0.9 * e), 12, 0.3, pal.core, f * f * 0.9, 0.05, D.util.rng(5));
        K.spikeRing(g, c.x, c.y, R * (0.5 + 0.8 * e), 3 * u * f, 14, p * 2 * dir, pal.a, f, 0.55 * u, D.util.rng(((p * 30) | 0) + 2));
        // grietas de impacto
        const cq = seg(p, 0.02, 0.2), cf = 1 - seg(p, 0.45, 0.9);
        cracks.forEach(([an, len], i) => { const r = D.util.rng(i * 17 + 3); K.bolt(g, c.x, c.y, c.x + Math.cos(an) * R * len * cq, c.y + Math.sin(an) * R * len * cq, 1.6 * u, r, pal.a, 0.35 * u, cf); });
        fx.ps.draw(g);
        if (fx.params.amount != null) K.floatText(g, '−' + fx.params.amount, c.x, c.y - hh * 0.4, 10 * u, seg(p, 0.05, 1), '#ff4a5a');
      };
    };
  }
  const dmgInfo = { amount: 'Daño a mostrar (lo entrega el motor). null = sin número.' };
  D.define('B01', { name: 'Daño recibido por jugador', cat: 'B', dur: 800, pal: 'sangre', anchors: ['at', 'target'], defaults: { amount: null }, paramInfo: dmgInfo, extraCues: ['impact'], make: damageFX('player'), desc: 'Destello, sacudida pequeña del retrato, viñeta y partículas.' });
  D.define('B02', { name: 'Daño recibido por rival', cat: 'B', dur: 800, pal: 'sangre', anchors: ['at', 'target'], defaults: { amount: null }, paramInfo: dmgInfo, extraCues: ['impact'], make: damageFX('rival'), desc: 'Equivalente adaptado a la posición contraria (sin viñeta de pantalla).' });

  /* ── B03 · Recuperación de puntos de vida (pulso + transición de barra) ── */
  D.define('B03', {
    name: 'Recuperación de puntos de vida', cat: 'B', dur: 1100, pal: 'vida', anchors: ['bar', 'at'], defaults: { from: 8, to: 12, max: 20 },
    paramInfo: { from: 'PV antes (motor).', to: 'PV después (motor).', max: 'PV máximos.' }, cues: [[0, 'heal'], [0.6, 'chime']],
    desc: 'Pulso luminoso y transición visible de la barra.',
    make(fx) {
      const pal = fx.pal, who = fx.side, rnd = fx.rnd;
      return (g, p) => {
        const u = fx.u, r = barRect(fx, who), q = fx.params, max = q.max || 20, k0 = clamp(q.from / max), k1 = clamp(q.to / max), k = lerp(k0, k1, E.io(seg(p, 0.12, 0.62)));
        const a = seg(p, 0, 0.08), left = r.x - r.w / 2, tipX = left + r.w * k;
        K.add(g); K.glow(g, r.x, r.y, r.w * 0.75, pal.b, 0.5 * E.bell(seg(p, 0, 0.9)));
        drawBar(g, r, k, hpColor(k), { a, sweep: seg(p, 0.55, 0.85), white: 0.5 * E.bell(seg(p, 0.1, 0.5)) });
        K.add(g);
        if (p > 0.1 && p < 0.64) { K.glow(g, tipX, r.y, r.h * 2.6, pal.core, 0.95); if (rnd() < 0.9) fx.ps.emit({ x: tipX, y: r.y, n: 1, angle: -PI / 2, spread: 1.6, speed: [6, 24], life: [0.3, 0.7], size: [0.3, 0.8], colors: [pal.a, GOLD, pal.core], type: 'mote' }); }
        const pu = seg(p, 0.58, 0.95);
        if (pu > 0 && pu < 1) { g.strokeStyle = pal.a; g.lineWidth = r.h * 0.5 * (1 - pu); K.alpha(g, 1 - pu); const gx = r.h * 2.4 * E.out(pu); K.rrect(g, left - gx, r.y - r.h / 2 - gx, r.w + gx * 2, r.h + gx * 2, r.h / 2 + gx); g.stroke(); }
        fx.ps.draw(g);
        const diff = q.to - q.from; if (diff) K.floatText(g, (diff > 0 ? '+' : '−') + Math.abs(diff), tipX, r.y - r.h * 1.4, Math.max(5 * u, r.h * 1.7), seg(p, 0.2, 1), pal.a, '#032612');
      };
    },
  });

  /* ── B04 · Vida crítica ── */
  D.define('B04', {
    name: 'Vida crítica', cat: 'B', dur: 2000, holdAt: 0.8, pal: 'sangre', anchors: ['bar'], defaults: { from: 14, to: 3, max: 20, threshold: 0.25 },
    paramInfo: { from: 'PV antes (motor).', to: 'PV después (motor).', max: 'PV máximos.', threshold: 'Fracción bajo la cual hay parpadeo blanco (≤ 2,5 destellos/s).' },
    cues: [[0.12, 'fall']], extraCues: ['tick'], desc: 'Transición verde → ámbar → rojo con parpadeo blanco controlado. Con hold:true queda latente.',
    make(fx) {
      const who = fx.side; let lastBeat = -1;
      return (g, p, dt, t) => {
        const u = fx.u, r = barRect(fx, who), q = fx.params, max = q.max || 20, k0 = clamp(q.from / max), k1 = clamp(q.to / max), tr = E.io(seg(p, 0.1, 0.5)), k = lerp(k0, k1, tr);
        const crit = k1 <= q.threshold, a = seg(p, 0, 0.06) * (1 - seg(p, 0.88, 1)), col = hpColor(k);
        // Parpadeo controlado: 2,5 Hz, pulso corto, nunca más de 3 destellos por segundo.
        const beatT = t * 2.5, ph = beatT % 1, blink = crit && tr >= 1 && !fx.reduced ? Math.pow(1 - ph, 4) * 0.85 : 0;
        if (crit && tr >= 1 && (beatT | 0) !== lastBeat) { lastBeat = beatT | 0; fx.cue('tick'); }
        if (crit) K.vignette(g, fx.W, fx.H, '#7a0010', a * seg(tr, 0.6, 1) * (0.35 + 0.3 * Math.pow(1 - ph, 2)));
        K.add(g); K.glow(g, r.x, r.y, r.w * 0.7, col, 0.45 * a);
        drawBar(g, r, k, col, { a, ghost: lerp(k0, k1, E.io(seg(p, 0.3, 0.75))), ghostCol: '#ffe9e0', white: blink });
        K.add(g);
        if (crit && tr >= 1) { g.strokeStyle = '#ff3340'; g.lineWidth = r.h * 0.35; K.alpha(g, a * (0.3 + 0.7 * Math.pow(1 - ph, 2))); const gx = r.h * (0.6 + 1.2 * ph); K.rrect(g, r.x - r.w / 2 - gx, r.y - r.h / 2 - gx, r.w + gx * 2, r.h + gx * 2, r.h / 2 + gx); g.stroke(); }
        if (tr > 0 && tr < 1 && fx.rnd() < 0.8) fx.ps.emit({ x: r.x - r.w / 2 + r.w * k, y: r.y, n: 1, angle: PI / 2, spread: 1.4, speed: [8, 30], life: [0.3, 0.6], size: [0.3, 0.7], colors: [col, '#ffffff'], type: 'spark', gravity: 60 });
      };
    },
  });

  /* ── B05 / B06 · Combo ×2 y ×3 ── */
  function comboFX(level) {
    return fx => {
      const big = level === 3, q = fx.params, kind = q.kind, acc = kind === 'heal' ? P.vida : kind === 'damage' ? P.carmesi : fx.pal, rnd = fx.rnd;
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || 'center'), W = fx.W, slam = seg(p, 0.06, 0.26), out = seg(p, 0.84, 1), life = 1 - out, size = (big ? 26 : 20) * u;
        if (big) K.dim(g, W, fx.H, 0.4 * E.bell(seg(p, 0, 1)));
        K.add(g);
        K.glow(g, c.x, c.y, size * (big ? 3.2 : 2.4), acc.b, 0.5 * E.bell(seg(p, 0, 0.95))); K.glow(g, c.x, c.y, size * 1.6, GOLD, 0.35 * life * seg(p, 0.1, 0.3));
        // rayos giratorios dorados
        K.burst(g, c.x, c.y, size * 0.5, size * (big ? 3 : 2.1), big ? 18 : 12, t * (big ? 1.4 : 0.8), GOLD, 0.22 * life * seg(p, 0.1, 0.3), 0.07);
        if (big) { K.burst(g, c.x, c.y, size * 0.5, size * 2.4, 9, -t * 1.1, acc.a, 0.2 * life * seg(p, 0.1, 0.3), 0.09); const br = D.util.rng(((t * 20) | 0) + 1); if (p > 0.2 && p < 0.7) for (let i = 0; i < 3; i++) { const an = br() * TAU; K.bolt(g, c.x + Math.cos(an) * size * 0.8, c.y + Math.sin(an) * size * 0.8, c.x + Math.cos(an) * size * 2.2, c.y + Math.sin(an) * size * 2.2, 1.5 * u, br, GOLD, 0.35 * u, 0.9); } }
        if (fx.hit(0.2)) {
          fx.cue('impact'); fx.shake(big ? 2.2 : 0.9, big ? 0.4 : 0.22);
          fx.ps.emit({ x: c.x, y: c.y, n: big ? 80 : 40, speed: [30, big ? 140 : 90], life: [0.4, 0.9], size: [0.35, 0.9], colors: [GOLD, '#fff3c2', acc.a, '#ffffff'], type: 'spark', gravity: 40, drag: 1.8 });
          if (big) fx.ps.emit({ x: c.x, y: c.y, n: 26, speed: [20, 70], life: [0.7, 1.3], size: [0.6, 1.2], colors: [GOLD, acc.a, '#ffffff'], type: 'flake', gravity: 50, drag: 1.2 });
        }
        for (let i = 0; i < (big ? 3 : 1); i++) { const rq = seg(p, 0.2 + i * 0.07, 0.62 + i * 0.07); if (rq > 0 && rq < 1) K.ring(g, c.x, c.y, size * (0.6 + (2 + i * 0.5) * E.out(rq)), (0.8 - i * 0.15) * u * (1 - rq), i % 2 ? acc.a : GOLD, 1 - rq); }
        fx.ps.draw(g);
        // placa y texto «×N»
        const sc = slam <= 0 ? 0 : (3 - 2 * E.out5(slam)) * (1 + (big ? 0.04 : 0.02) * Math.sin(t * 9)) * (1 + 0.15 * E.in(out)), a = seg(slam, 0, 0.3) * life;
        if (sc > 0) {
          K.ribbon(g, c.x, c.y + size * 0.72, size * (big ? 3.3 : 2.8) * Math.min(1, E.out(seg(p, 0.2, 0.4)) + 0.001), size * 0.36, { a: acc.a, b: acc.b }, a * seg(p, 0.2, 0.3), -0.18);
          const lab = q.label || 'COMBO'; K.text(g, lab, c.x, c.y + size * 0.72, K.fit(g, lab, size * 0.2, size * 2.2, { ls: 0.18 }), { fill: '#fff8e0', stroke: 'rgba(20,6,2,0.85)', sw: 0.16, ls: 0.18, a: a * seg(p, 0.28, 0.4) });
          K.text(g, '×' + level, c.x, c.y - size * 0.08, size * sc, { fill: D.GOLD_GRAD, stroke: '#2a1202', sw: 0.11, glow: acc.a, blur: 0.35, a });
          const sh = seg(p, 0.36, 0.62); if (sh > 0 && sh < 1) { K.add(g); K.glow(g, c.x + lerp(-size, size, sh), c.y - size * 0.1, size * 0.7, '#ffffff', 0.55 * E.bell(sh)); }
          if (q.detail) K.text(g, q.detail, c.x, c.y + size * 1.22, K.fit(g, q.detail, size * 0.17, W * 0.8, { weight: 700 }), { weight: 700, fill: '#fff3c2', stroke: 'rgba(10,4,2,0.8)', sw: 0.2, a: a * seg(p, 0.34, 0.46) });
        }
      };
    };
  }
  const comboOpts = { kind: ['', 'damage', 'heal'] }, comboInfo = { kind: "'damage' | 'heal' | null: tinte de acento según lo que determine el motor.", label: "Texto de la placa (por defecto «COMBO»).", detail: 'Línea secundaria opcional (p. ej. el efecto que el motor aplicó).' };
  D.define('B05', { name: 'Combo ×2', cat: 'B', dur: 1000, pal: 'oro', anchors: ['at'], defaults: { kind: null, label: 'COMBO', detail: '' }, paramInfo: comboInfo, paramOptions: comboOpts, cues: [[0, 'whoosh'], [0.3, 'chime']], extraCues: ['impact'], make: comboFX(2), desc: 'Activación breve, elegante y legible con indicador dorado.' });
  D.define('B06', { name: 'Combo ×3', cat: 'B', dur: 1300, pal: 'oro', anchors: ['at'], defaults: { kind: null, label: 'COMBO', detail: '' }, paramInfo: comboInfo, paramOptions: comboOpts, cues: [[0, 'charge'], [0.3, 'fanfare']], extraCues: ['impact'], make: comboFX(3), desc: 'Versión más intensa y espectacular.' });

  /* ── B07 · Agotamiento de mazo (cierre de partida) ── */
  D.define('B07', {
    name: 'Agotamiento de mazo', cat: 'B', dur: 2800, holdAt: 0.8, layer: 'screen', pal: 'ceniza', anchors: ['deck', 'rivalDeck', 'at'],
    defaults: { sides: 'both', title: 'MAZO AGOTADO', subtitle: '' }, paramOptions: { sides: ['both', 'player', 'rival'] },
    paramInfo: { sides: "'both' | 'player' | 'rival': mazos que se consumen.", title: 'Título.', subtitle: 'Resolución simétrica definida por el motor (texto libre).' },
    cues: [[0, 'paper'], [0.3, 'fall'], [0.52, 'door']], desc: 'Los mazos se deshacen en ceniza dorada, sello de balanza y cierre de partida.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd, q = fx.params, decks = q.sides === 'player' ? ['deck'] : q.sides === 'rival' ? ['rivalDeck'] : ['deck', 'rivalDeck'];
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, c = fx.pt(fx.o.at || 'center'), out = seg(p, 0.88, 1), life = 1 - out;
        K.dim(g, W, H, 0.72 * E.out(seg(p, 0, 0.5)) * life);
        // telones de cierre
        const bar = H * 0.13 * E.io(seg(p, 0.45, 0.62)) * (1 - E.in(out));
        if (bar > 0.5) { g.save(); K.over(g); K.alpha(g, 1); g.fillStyle = '#05060a'; g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar); g.fillStyle = GOLD; K.alpha(g, 0.9 * life); g.fillRect(0, bar - 0.4 * u, W, 0.4 * u); g.fillRect(0, H - bar, W, 0.4 * u); g.restore(); }
        K.add(g);
        decks.forEach((name, di) => {
          const d = fx.pt(fx.o[name] || name), cw = d.w || 9 * u, ch = d.h || cw * 1.42, dis = seg(p, 0.06 + di * 0.04, 0.5 + di * 0.04);
          for (let i = 0; i < 4; i++) { const a = 1 - seg(dis, i * 0.2, i * 0.2 + 0.3); if (a > 0) { K.cardBack(g, d.x - i * 0.35 * u, d.y - i * 0.5 * u, cw, ch, 0, 1, P.orden, a * life); K.add(g); } }
          if (dis > 0 && dis < 1) {
            K.glow(g, d.x, d.y, cw * 1.6, GOLD, 0.5 * E.bell(dis));
            fx.ps.emit({ x: d.x + (rnd() - 0.5) * cw, y: d.y + (rnd() - 0.5) * ch, n: 3, to: { x: c.x + (rnd() - 0.5) * 6 * u, y: c.y + (rnd() - 0.5) * 6 * u }, life: [0.7, 1.2], size: [0.4, 1], colors: [GOLD, pal.a, pal.c, '#ffffff'], type: 'dot' });
            fx.ps.emit({ x: d.x + (rnd() - 0.5) * cw, y: d.y + (rnd() - 0.5) * ch, n: 1, angle: -PI / 2, spread: 1.2, speed: [4, 16], life: [0.6, 1.2], size: [0.3, 0.7], colors: [pal.a, pal.b], type: 'ash', drag: 0.5 });
          }
        });
        // sello de balanza: dos mitades equilibradas
        const sq = E.io(seg(p, 0.3, 0.62)), R = 17 * u;
        if (sq > 0) {
          K.glow(g, c.x, c.y, R * 2.4, pal.b, 0.5 * sq * life);
          K.magicCircle(g, c.x, c.y, R * (0.9 + 0.1 * sq), t * 0.35, { a: pal.a, c: GOLD }, sq * life, { draw: sq, noSun: true, points: 6, step: 2 });
          g.strokeStyle = GOLD; g.lineWidth = 0.5 * u; g.lineCap = 'round'; K.alpha(g, sq * life); const tilt = Math.sin(t * 1.3) * 0.05 * (1 - seg(p, 0.6, 0.8));
          g.save(); g.translate(c.x, c.y); g.beginPath(); g.moveTo(0, -R * 0.42); g.lineTo(0, R * 0.36); g.moveTo(-R * 0.2, R * 0.36); g.lineTo(R * 0.2, R * 0.36); g.stroke();
          g.translate(0, -R * 0.36); g.rotate(tilt); g.beginPath(); g.moveTo(-R * 0.42, 0); g.lineTo(R * 0.42, 0); g.stroke();
          [-1, 1].forEach(m => { g.beginPath(); g.moveTo(m * R * 0.42, 0); g.lineTo(m * R * 0.42, R * 0.26); g.stroke(); g.beginPath(); g.arc(m * R * 0.42, R * 0.26, R * 0.13, 0, PI); g.stroke(); });
          g.restore();
        }
        if (fx.hit(0.62)) { fx.ps.emit({ x: c.x, y: c.y, n: 50, speed: [14, 60], life: [0.6, 1.3], size: [0.35, 0.9], colors: [GOLD, pal.c, '#ffffff'], type: 'spark', drag: 1.4 }); }
        const rq = seg(p, 0.62, 0.92); if (rq > 0 && rq < 1) K.ring(g, c.x, c.y, R * (1 + 2.6 * E.out(rq)), 0.6 * u * (1 - rq), GOLD, 1 - rq);
        if (p > 0.5 && rnd() < 0.5) fx.ps.emit({ x: rnd() * W, y: -2 * u, n: 1, angle: PI / 2, spread: 0.5, speed: [6, 16], life: [1.4, 2.4], size: [0.3, 0.7], colors: [pal.a, pal.b, pal.c], type: 'ash', drag: 0.1 });
        fx.ps.draw(g);
        const tq = seg(p, 0.56, 0.72), ts = K.fit(g, q.title, 8.5 * u, W * 0.9, { ls: 0.14 });
        K.text(g, q.title, c.x, c.y + R * 1.55, ts * (1.25 - 0.25 * E.out(tq)), { fill: ['#ffffff', pal.c, pal.a], stroke: '#05060a', sw: 0.16, ls: 0.14, a: tq * life, glow: GOLD, blur: 0.25 });
        if (q.subtitle) K.text(g, q.subtitle, c.x, c.y + R * 1.55 + ts * 1.05, K.fit(g, q.subtitle, 3.6 * u, W * 0.9, { weight: 700 }), { weight: 700, fill: '#fff3c2', stroke: '#05060a', sw: 0.2, a: seg(p, 0.66, 0.8) * life });
      };
    },
  });

  D.util.hpColor = hpColor; D.util.drawBar = drawBar;
})(window.DecretoFX);

;
/*! Decreto Real FX Studio G3 — fx-ui.js · C01–C08 Interfaz y transiciones */
(function (D) {
  'use strict';
  const { K, E, clamp, lerp, seg, mix, rgba, TAU, PI } = D.util, GOLD = D.GOLD, P = D.palettes;

  /* ── C01 · Lanzamiento de moneda ── */
  D.define('C01', {
    name: 'Lanzamiento de moneda', cat: 'C', dur: 2000, holdAt: 0.82, layer: 'screen', pal: 'oro', anchors: ['at'],
    defaults: { result: 'player', labelPlayer: 'COMIENZAS TÚ', labelRival: 'COMIENZA EL RIVAL', playerPalette: 'azul', rivalPalette: 'carmesi' },
    paramOptions: { result: ['player', 'rival'] }, paramInfo: { result: "'player' | 'rival': resultado decidido por el motor.", labelPlayer: 'Texto si gana el jugador.', labelRival: 'Texto si gana el rival.', playerPalette: 'Paleta del jugador.', rivalPalette: 'Paleta del rival.' },
    cues: [[0, 'coin'], [0.2, 'whoosh'], [0.56, 'impact'], [0.6, 'reveal']], desc: 'Moneda dorada giratoria, destello y revelación del resultado.',
    make(fx) {
      const q = fx.params, isP = q.result !== 'rival', rp = P[isP ? q.playerPalette : q.rivalPalette] || P.oro, rnd = fx.rnd, turns = 5;
      function face(g, R, front, tint) {
        const gr = g.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(0.45, '#ffd04a'); gr.addColorStop(1, '#a86c0c');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
        g.strokeStyle = tint || '#7a4a06'; g.lineWidth = R * 0.07; g.beginPath(); g.arc(0, 0, R * 0.9, 0, TAU); g.stroke();
        g.strokeStyle = '#7a4a06'; g.lineWidth = R * 0.025; for (let i = 0; i < 24; i++) { const an = (i / 24) * TAU; g.beginPath(); g.moveTo(Math.cos(an) * R * 0.78, Math.sin(an) * R * 0.78); g.lineTo(Math.cos(an) * R * 0.84, Math.sin(an) * R * 0.84); g.stroke(); }
        if (front) { K.sun(g, 0, 0, R * 0.62, 16, 0, '#8a5608', g.globalAlpha); g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(0, 0, R * 0.26, 0, TAU); g.fill(); }
        else { g.fillStyle = '#8a5608'; g.beginPath(); g.moveTo(-R * 0.46, R * 0.3); g.lineTo(-R * 0.54, -R * 0.26); g.lineTo(-R * 0.24, 0); g.lineTo(0, -R * 0.42); g.lineTo(R * 0.24, 0); g.lineTo(R * 0.54, -R * 0.26); g.lineTo(R * 0.46, R * 0.3); g.closePath(); g.fill(); g.fillRect(-R * 0.46, R * 0.36, R * 0.92, R * 0.1); }
      }
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || 'center'), W = fx.W, H = fx.H, out = seg(p, 0.88, 1), life = 1 - out, fl = seg(p, 0.04, 0.56), R = 11 * u;
        K.dim(g, W, H, 0.6 * seg(p, 0, 0.12) * life);
        const y = c.y - 30 * u * Math.sin(PI * fl) - (fl >= 1 ? 2 * u * E.out(seg(p, 0.56, 0.7)) : 0), ang = E.out(fl) * turns * TAU + (isP ? 0 : PI);
        const cs = Math.cos(ang), sy = Math.max(0.05, Math.abs(cs)), front = cs >= 0, land = seg(p, 0.56, 0.86), sc = 1 + 0.35 * E.back(seg(p, 0.56, 0.72));
        K.add(g); K.glow(g, c.x, y, R * 3 * sc, GOLD, 0.45 * life);
        if (land > 0) { K.glow(g, c.x, y, R * (2.6 + 1.6 * E.out(land)), rp.a, 0.55 * life); K.burst(g, c.x, y, R * 1.1, R * (2.4 + 1.2 * E.out(land)), 16, t * 0.5, GOLD, 0.3 * life, 0.06); for (let i = 0; i < 2; i++) { const rq = seg(land, i * 0.2, 0.7 + i * 0.2); if (rq > 0 && rq < 1) K.ring(g, c.x, y, R * (1 + 2.6 * E.out(rq)), 0.7 * u * (1 - rq), i ? GOLD : rp.a, 1 - rq); } }
        if (fl < 1 && rnd() < 0.7) fx.ps.emit({ x: c.x, y, n: 1, jitter: 6, speed: [2, 12], life: [0.3, 0.6], size: [0.3, 0.8], colors: [GOLD, '#fff3c2'], type: 'mote' });
        if (fx.hit(0.56)) { fx.shake(0.8, 0.2); fx.ps.emit({ x: c.x, y: c.y, n: 46, speed: [30, 110], life: [0.4, 0.9], size: [0.35, 0.9], colors: [GOLD, '#fff3c2', rp.a, '#ffffff'], type: 'spark', gravity: 50 }); }
        fx.ps.draw(g);
        g.save(); K.over(g); K.alpha(g, life); g.translate(c.x, y); g.scale(sc, sc);
        g.fillStyle = '#8a5608'; g.beginPath(); g.ellipse(0, R * 0.09 * (1 - sy), R, R * sy, 0, 0, TAU); g.fill();
        g.scale(1, sy); face(g, R, isP ? front : !front, land > 0 ? rp.a : null); g.restore();
        K.add(g); K.flash(g, W, H, 0.16 * E.bell(seg(p, 0.55, 0.66)), '#fff3c2');
        const sh = seg(p, 0.6, 0.8); if (sh > 0 && sh < 1) K.glow(g, c.x + lerp(-R, R, sh) * sc, y - R * 0.3, R * 0.9, '#ffffff', 0.7 * E.bell(sh));
        const lab = isP ? q.labelPlayer : q.labelRival, tq = seg(p, 0.62, 0.76), size = K.fit(g, lab, 7 * u, W * 0.88, { ls: 0.1 });
        K.ribbon(g, c.x, c.y + R * 2.5, Math.min(W * 0.96, size * lab.length * 0.9 + 16 * u) * E.out(tq), size * 1.9, rp, tq * life, -0.15);
        K.text(g, lab, c.x, c.y + R * 2.5, size * (1.3 - 0.3 * E.out(tq)), { fill: '#ffffff', stroke: rp.dark, sw: 0.18, ls: 0.1, a: seg(p, 0.66, 0.78) * life });
      };
    },
  });

  /* ── C02 / C03 · Inicio de turno (cinta cinematográfica a pantalla completa) ── */
  function turnFX(fromLeft) {
    return fx => {
      const pal = fx.pal, q = fx.params, rnd = fx.rnd, dir = fromLeft ? 1 : -1;
      const streaks = Array.from({ length: 26 }, () => [rnd(), rnd() * 2 - 1, 0.3 + rnd() * 0.7, rnd()]);
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, cy = fx.o.at ? fx.pt(fx.o.at).y : H / 2, bh = Math.min(H * 0.3, 19 * u), sk = -0.22 * dir;
        const inn = E.out5(seg(p, 0, 0.22)), out = E.in(seg(p, 0.78, 1)), x = dir * (-(1 - inn) + out) * W * 1.25, life = 1 - seg(p, 0.9, 1);
        K.dim(g, W, H, 0.5 * seg(p, 0, 0.15) * (1 - seg(p, 0.8, 1)));
        g.save(); K.over(g); g.translate(W / 2 + x, cy); g.transform(1, 0, sk, 1, 0, 0);
        // banda secundaria oscura (contramovimiento)
        K.alpha(g, 0.85 * life); g.fillStyle = pal.dark; g.fillRect(-W * 1.2 - x * 1.6, -bh * 0.82, W * 2.4, bh * 1.64);
        g.fillStyle = rgba(GOLD, 0.7); g.fillRect(-W * 1.2 - x * 1.6, -bh * 0.82, W * 2.4, 0.35 * u); g.fillRect(-W * 1.2 - x * 1.6, bh * 0.82 - 0.35 * u, W * 2.4, 0.35 * u);
        // cinta principal
        const gr = g.createLinearGradient(0, -bh / 2, 0, bh / 2); gr.addColorStop(0, mix(pal.a, '#ffffff', 0.28)); gr.addColorStop(0.45, pal.a); gr.addColorStop(1, pal.b);
        K.alpha(g, life); g.fillStyle = gr; g.fillRect(-W * 1.1, -bh / 2, W * 2.2, bh);
        g.save(); g.beginPath(); g.rect(-W * 1.1, -bh / 2, W * 2.2, bh); g.clip();
        // vetas de velocidad dentro de la cinta
        g.fillStyle = '#ffffff';
        streaks.forEach(([sx, sy, len, ph]) => { const xx = (((sx + t * (0.5 + ph) * dir) % 1) + 1) % 1; K.alpha(g, 0.1 + 0.14 * ph); g.fillRect((xx - 0.5) * W * 2.2, sy * bh * 0.5, len * W * 0.3, Math.max(1, 0.18 * u)); });
        // barrido de brillo
        const sh = seg(p, 0.3, 0.62); if (sh > 0 && sh < 1) { const sxp = lerp(-W * 0.7, W * 0.7, E.io(sh)) * dir, lg = g.createLinearGradient(sxp - 12 * u, 0, sxp + 12 * u, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.6)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; K.alpha(g, 1); g.fillRect(sxp - 12 * u, -bh / 2, 24 * u, bh); }
        g.restore();
        // ribetes dorados y grecas
        K.alpha(g, life); g.fillStyle = GOLD; g.fillRect(-W * 1.1, -bh / 2 - 0.7 * u, W * 2.2, 0.7 * u); g.fillRect(-W * 1.1, bh / 2, W * 2.2, 0.7 * u);
        g.strokeStyle = rgba('#fff3c2', 0.75); g.lineWidth = Math.max(1, 0.22 * u); const stepW = 4.2 * u, n = Math.ceil(W * 1.3 / stepW);
        for (let i = -n; i <= n; i++) { K.fret(g, i * stepW, -bh / 2 + 1.5 * u, 0.9 * u, 0); K.fret(g, i * stepW, bh / 2 - 1.5 * u, 0.9 * u, PI); }
        g.restore();
        // texto
        const tq = seg(p, 0.12, 0.32), size = K.fit(g, q.text, bh * 0.52, W * 0.86, { ls: 0.12 }), drift = (seg(p, 0.3, 0.78) - 0.5) * 3 * u * dir;
        const tx = W / 2 + drift + dir * (-(1 - E.out5(tq)) * W * 0.5 + out * W * 1.2);
        g.save(); g.translate(tx, cy); g.transform(1, 0, -0.12, 1, 0, 0);
        K.text(g, q.text, 0.5 * u, 0.6 * u, size, { fill: rgba('#000000', 0.45), ls: 0.12, a: tq * life });
        K.text(g, q.text, 0, 0, size * (1 + 0.5 * (1 - E.out(tq))), { fill: ['#ffffff', '#fff6d8', '#ffd76a'], stroke: pal.dark, sw: 0.12, ls: 0.12, a: tq * life });
        g.restore();
        if (q.subtitle) K.text(g, q.subtitle, W / 2 + x * 0.6, cy + bh * 0.82 + 3.4 * u, K.fit(g, q.subtitle, 3.2 * u, W * 0.9, { weight: 700, ls: 0.2 }), { weight: 700, ls: 0.2, fill: '#fff3c2', stroke: 'rgba(0,0,0,0.7)', sw: 0.2, a: seg(p, 0.26, 0.4) * (1 - seg(p, 0.74, 0.86)) });
        K.add(g);
        if (fx.hit(0.2)) { fx.cue('impact'); fx.shake(0.7, 0.18); for (let i = 0; i < 2; i++) fx.ps.emit({ x: W / 2, y: cy + (i ? 1 : -1) * bh / 2, n: 30, jitter: 0, angle: fromLeft ? 0 : PI, spread: 1.2, speed: [40, 160], life: [0.3, 0.8], size: [0.3, 0.8], colors: [GOLD, '#ffffff', pal.c], type: 'spark', drag: 1.2 }); }
        if (p > 0.2 && p < 0.78 && rnd() < 0.7) fx.ps.emit({ x: rnd() * W, y: cy + (rnd() < 0.5 ? -1 : 1) * bh / 2, n: 1, angle: fromLeft ? 0 : PI, spread: 0.5, speed: [20, 60], life: [0.3, 0.7], size: [0.3, 0.7], colors: [GOLD, '#fff3c2'], type: 'spark', drag: 0.6 });
        K.flash(g, W, H, 0.16 * E.bell(seg(p, 0.17, 0.3)), pal.core);
      };
    };
  }
  const turnInfo = { text: 'Texto principal.', subtitle: 'Texto secundario opcional.' };
  D.define('C02', { name: 'Inicio de turno del jugador', cat: 'C', dur: 1500, noFade: true, layer: 'screen', pal: 'azul', defaults: { text: 'TU TURNO', subtitle: '' }, paramInfo: turnInfo, cues: [[0, 'whoosh'], [0.8, 'whoosh']], extraCues: ['impact'], make: turnFX(true), desc: 'Transición cinematográfica a pantalla completa con cinta azul y texto «TU TURNO».' });
  D.define('C03', { name: 'Inicio de turno del rival', cat: 'C', dur: 1500, noFade: true, layer: 'screen', pal: 'carmesi', defaults: { text: 'TURNO DEL RIVAL', subtitle: '' }, paramInfo: turnInfo, cues: [[0, 'whoosh'], [0.8, 'whoosh']], extraCues: ['impact'], make: turnFX(false), desc: 'Transición equivalente con cinta roja y texto «TURNO DEL RIVAL».' });

  /* ── C04 · Indicadores persistentes de turno (DOM + SVG + CSS, recortados) ── */
  const C04_CSS = `
.drfx-turn{position:absolute;inset:0;pointer-events:none;font-family:var(--drfx-font,"Cinzel","Palatino Linotype",Georgia,serif)}
.drfx-tag{position:absolute;display:flex;align-items:center;gap:.5em;padding:.2em;font-size:clamp(11px,2.4vmin,20px);font-size:clamp(11px,3cqmin,20px);font-weight:900;letter-spacing:.12em;color:#fff;white-space:nowrap;
  background:linear-gradient(180deg,#fff3c2,#ffd76a 45%,#a8720f);opacity:0;transition:opacity .45s ease,transform .55s cubic-bezier(.2,.9,.25,1);will-change:transform,opacity;filter:drop-shadow(0 .2em .5em rgba(0,0,0,.55))}
.drfx-tag[data-edge=left]{clip-path:polygon(0 0,calc(100% - 1.1em) 0,100% 50%,calc(100% - 1.1em) 100%,0 100%);transform:translateX(-106%)}
.drfx-tag[data-edge=right]{clip-path:polygon(1.1em 0,100% 0,100% 100%,1.1em 100%,0 50%);transform:translateX(106%);flex-direction:row-reverse}
.drfx-tag>span{display:flex;align-items:center;gap:.55em;padding:.5em 1.7em .5em .9em;clip-path:inherit;background:linear-gradient(180deg,var(--c1),var(--c2));text-shadow:0 .08em .12em rgba(0,0,0,.6)}
.drfx-tag[data-edge=right]>span{flex-direction:row-reverse;padding:.5em .9em .5em 1.7em}
.drfx-tag.is-on{opacity:1;transform:translateX(0)}
.drfx-tag svg{width:1.35em;height:1.35em;flex:none;overflow:visible}
.drfx-tag.is-on svg{animation:drfx-turn-pulse 2.4s ease-in-out infinite}
.drfx-tag.is-off-fast{transition:none}
@keyframes drfx-turn-pulse{0%,100%{filter:drop-shadow(0 0 0 rgba(255,231,150,0))}50%{filter:drop-shadow(0 0 .35em rgba(255,231,150,.95))}}
@media (prefers-reduced-motion:reduce){.drfx-tag{transition:opacity .2s linear;transform:none!important}.drfx-tag.is-on svg{animation:none}}`;
  const SUN_SVG = '<svg viewBox="-12 -12 24 24" aria-hidden="true"><g fill="#ffe9a0"><circle r="4.6"/>' + Array.from({ length: 8 }, (_, i) => `<path d="M-1.6 -6.4 L0 -11 L1.6 -6.4Z" transform="rotate(${i * 45})"/>`).join('') + '</g></svg>';
  D.define('C04', {
    name: 'Indicadores persistentes de turno', cat: 'C', manual: true, passive: true, layer: 'turn-tags', pal: 'azul',
    defaults: { active: 'player', labelPlayer: 'TU TURNO', labelRival: 'TURNO DEL RIVAL', playerPalette: 'azul', rivalPalette: 'carmesi', player: { edge: 'left', bottom: '24%' }, rival: { edge: 'right', top: '24%' } },
    paramOptions: { active: ['player', 'rival', 'none'] }, paramInfo: { active: "'player' | 'rival' | 'none': indicador visible (lo decide el motor).", player: 'Posición CSS exacta: { edge:"left"|"right", top|bottom|left|right:"…" }.', rival: 'Ídem para el rival.', labelPlayer: 'Texto del jugador.', labelRival: 'Texto del rival.', playerPalette: 'Paleta del jugador.', rivalPalette: 'Paleta del rival.' },
    extraCues: ['tick'], desc: 'Etiquetas laterales recortadas con aparición suave. Persisten hasta stop() o update({active}).',
    make(fx) {
      if (!document.getElementById('drfx-c04-css')) { const st = document.createElement('style'); st.id = 'drfx-c04-css'; st.textContent = C04_CSS; document.head.appendChild(st); }
      const layer = fx.stage.domLayer(), wrap = document.createElement('div'); wrap.className = 'drfx-turn'; wrap.style.setProperty('--drfx-font', D.config.font);
      const tags = {};
      ['player', 'rival'].forEach(who => { const el = tags[who] = document.createElement('div'); el.className = 'drfx-tag'; el.innerHTML = '<span>' + SUN_SVG + '<b></b></span>'; wrap.appendChild(el); });
      layer.appendChild(wrap);
      let current = null;
      function sync() {
        const q = fx.params;
        ['player', 'rival'].forEach(who => {
          const el = tags[who], pos = Object.assign({}, who === 'player' ? { edge: 'left', bottom: '24%' } : { edge: 'right', top: '24%' }, q[who]), pal = P[q[who + 'Palette']] || (who === 'player' ? P.azul : P.carmesi);
          el.dataset.edge = pos.edge === 'right' ? 'right' : 'left';
          ['top', 'bottom', 'left', 'right'].forEach(k => { el.style[k] = pos[k] != null ? pos[k] : ''; });
          if (pos.left == null && pos.right == null) el.style[el.dataset.edge] = '0';
          if (pos.fontSize) el.style.fontSize = pos.fontSize; if (fx.scale !== 1) el.style.zoom = fx.scale;
          el.style.setProperty('--c1', mix(pal.a, '#ffffff', 0.12)); el.style.setProperty('--c2', pal.b);
          el.querySelector('b').textContent = who === 'player' ? q.labelPlayer : q.labelRival;
        });
        if (q.active !== current) { current = q.active; if (current === 'player' || current === 'rival') fx.cue('tick'); }
        // dos fotogramas para que la transición CSS de entrada siempre se dispare
        requestAnimationFrame(() => requestAnimationFrame(() => { if (fx.alive) ['player', 'rival'].forEach(who => tags[who].classList.toggle('is-on', fx.params.active === who)); }));
      }
      fx.on('update', sync); fx.onCleanup(() => wrap.remove());
      sync();
      return () => {};
    },
  });

  /* ── C05 · Entrada a Versus IA (puertas reales) ── */
  D.define('C05', {
    name: 'Entrada a Versus IA', cat: 'C', dur: 2600, noFade: true, layer: 'screen', pal: 'oro',
    defaults: { title: 'VERSUS IA', subtitle: 'LOS REINOS DEL PERÚ' }, paramInfo: { title: 'Título central.', subtitle: 'Línea secundaria.' },
    cues: [[0, 'whoosh'], [0.28, 'door'], [0.3, 'covered'], [0.42, 'reveal'], [0.64, 'door']],
    desc: "Puertas reales que se cierran sobre el menú, sello luminoso y apertura al campo. El cue 'covered' indica cuándo cambiar de pantalla.",
    make(fx) {
      const q = fx.params, rnd = fx.rnd;
      function door(g, x, w, H, u, side) { // side: -1 izquierda, 1 derecha; x = borde interior
        const x0 = side < 0 ? x - w : x, gr = g.createLinearGradient(x0, 0, x0 + w, 0);
        gr.addColorStop(0, side < 0 ? '#120a08' : '#2a1710'); gr.addColorStop(0.5, '#24130d'); gr.addColorStop(1, side < 0 ? '#2a1710' : '#120a08');
        g.fillStyle = gr; g.fillRect(x0, 0, w, H);
        g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = Math.max(1, 0.25 * u); for (let i = 1; i < 7; i++) { g.beginPath(); g.moveTo(x0 + (w * i) / 7, 0); g.lineTo(x0 + (w * i) / 7, H); g.stroke(); }
        const m = 4 * u, pw = w - m * 2, ph = (H - m * 3) / 2; g.strokeStyle = GOLD; g.lineWidth = 0.6 * u;
        for (let r = 0; r < 2; r++) { const py = m + r * (ph + m); g.strokeRect(x0 + m, py, pw, ph); g.lineWidth = 0.25 * u; g.strokeRect(x0 + m + 1.6 * u, py + 1.6 * u, pw - 3.2 * u, ph - 3.2 * u); g.lineWidth = 0.3 * u; const n = Math.max(2, Math.floor(pw / (6 * u))); for (let i = 0; i < n; i++) { K.fret(g, x0 + m + 4 * u + (i * (pw - 8 * u)) / Math.max(1, n - 1), py + 4.2 * u, 1.2 * u, 0); K.fret(g, x0 + m + 4 * u + (i * (pw - 8 * u)) / Math.max(1, n - 1), py + ph - 4.2 * u, 1.2 * u, PI); } g.lineWidth = 0.6 * u; }
        g.fillStyle = '#c9952a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(x - side * 1.6 * u, (H * (i + 0.5)) / 9, 0.7 * u, 0, TAU); g.fill(); }
        const eg = g.createLinearGradient(x - side * 1.2 * u, 0, x, 0); eg.addColorStop(0, '#8a5a10'); eg.addColorStop(1, '#ffe9a0'); g.fillStyle = eg; g.fillRect(side < 0 ? x - 0.8 * u : x, 0, 0.8 * u, H);
      }
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, cl = seg(p, 0, 0.3), op = E.io(seg(p, 0.64, 1));
        const closeK = cl < 1 ? (cl < 0.86 ? E.in(cl / 0.86) : 1 - 0.035 * Math.sin(PI * (cl - 0.86) / 0.14)) : 1, k = closeK * (1 - op), half = W / 2 + 1, gap = half * (1 - k);
        const R = Math.min(15 * u, W * 0.2), seal = seg(p, 0.34, 0.56), sealOut = 1 - seg(p, 0.62, 0.72);
        K.dim(g, W, H, 0.35 * cl * (1 - op));
        // luz que escapa por la rendija al abrir
        if (op > 0) { K.add(g); const lw = gap * 2, lg = g.createLinearGradient(W / 2 - lw - 20 * u, 0, W / 2 + lw + 20 * u, 0); lg.addColorStop(0, 'rgba(255,240,200,0)'); lg.addColorStop(0.5, 'rgba(255,246,220,0.9)'); lg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = lg; K.alpha(g, (1 - op) * 0.9); g.fillRect(W / 2 - lw - 20 * u, 0, (lw + 20 * u) * 2, H); }
        g.save(); K.over(g); K.alpha(g, 1); door(g, W / 2 - gap, half, H, u, -1); door(g, W / 2 + gap, half, H, u, 1);
        // medallón partido
        [-1, 1].forEach(s => { g.save(); g.beginPath(); s < 0 ? g.rect(W / 2 - gap - R * 1.4, 0, R * 1.4, H) : g.rect(W / 2 + gap, 0, R * 1.4, H); g.clip(); g.translate(W / 2 + s * gap, H / 2);
          const mg = g.createRadialGradient(0, 0, R * 0.1, 0, 0, R); mg.addColorStop(0, '#3a2012'); mg.addColorStop(1, '#170c08'); g.fillStyle = mg; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 0.8 * u; g.stroke(); g.lineWidth = 0.3 * u; g.beginPath(); g.arc(0, 0, R * 0.84, 0, TAU); g.stroke();
          K.sun(g, 0, 0, R * 0.66, 16, 0, mix('#8a5a10', '#ffe9a0', seal * sealOut), 1); g.restore(); });
        g.restore(); K.add(g);
        if (fx.hit(0.27)) { fx.shake(2, 0.35); for (let i = 0; i < 10; i++) fx.ps.emit({ x: W / 2, y: (H * (i + 0.5)) / 10, n: 5, angle: rnd() < 0.5 ? 0 : PI, spread: 1.4, speed: [10, 50], life: [0.4, 0.9], size: [0.3, 0.8], colors: [GOLD, '#fff3c2', '#c9a070'], type: 'spark', drag: 2 }); fx.ps.emit({ x: W / 2, y: H, n: 24, jitter: 6, angle: -PI / 2, spread: 2.4, speed: [6, 24], life: [0.6, 1.2], size: [0.6, 1.4], colors: ['#6a5040', '#8a7060'], type: 'ash', drag: 1 }); }
        if (seal > 0 && sealOut > 0) {
          const a = seal * sealOut;
          K.glow(g, W / 2, H / 2, R * (2 + 0.3 * Math.sin(t * 5)), GOLD, 0.6 * a); K.magicCircle(g, W / 2, H / 2, R * 1.32, t * 0.8, { a: '#ff9a3a', c: GOLD }, a, { draw: seal, noSun: true });
          K.burst(g, W / 2, H / 2, R, R * 2.4, 16, t * 0.4, GOLD, 0.22 * a, 0.06);
          const rq = seg(p, 0.42, 0.62); if (rq > 0 && rq < 1) K.ring(g, W / 2, H / 2, R * (1 + 2.4 * E.out(rq)), 0.6 * u * (1 - rq), GOLD, 1 - rq);
          if (rnd() < 0.6) { const an = rnd() * TAU; fx.ps.emit({ x: W / 2 + Math.cos(an) * R * 1.3, y: H / 2 + Math.sin(an) * R * 1.3, n: 1, angle: -PI / 2, spread: 1, speed: [4, 18], life: [0.4, 0.9], size: [0.3, 0.8], colors: [GOLD, '#fff3c2'], type: 'mote' }); }
          fx.ps.draw(g);
          const tq = seg(p, 0.4, 0.52), size = K.fit(g, q.title, 9 * u, W * 0.9, { ls: 0.14 });
          K.text(g, q.title, W / 2, H / 2 + R * 1.75, size * (1.3 - 0.3 * E.out(tq)), { fill: D.GOLD_GRAD, stroke: '#120804', sw: 0.16, ls: 0.14, a: tq * sealOut, glow: '#ff9a3a', blur: 0.3 });
          if (q.subtitle) K.text(g, q.subtitle, W / 2, H / 2 - R * 1.7, K.fit(g, q.subtitle, 3.4 * u, W * 0.9, { weight: 700, ls: 0.3 }), { weight: 700, ls: 0.3, fill: '#fff3c2', stroke: '#120804', sw: 0.22, a: seg(p, 0.44, 0.56) * sealOut });
        }
        K.flash(g, W, H, 0.5 * E.bell(seg(p, 0.6, 0.76)), '#fff3c2');
      };
    },
  });

  /* ── C06 · Victoria ── */
  D.define('C06', {
    name: 'Victoria', cat: 'C', dur: 3600, holdAt: 0.78, layer: 'screen', pal: 'oro', defaults: { title: 'VICTORIA', subtitle: '' }, paramInfo: { title: 'Título.', subtitle: 'Línea secundaria (la entrega el juego).' },
    cues: [[0, 'charge'], [0.16, 'fanfare'], [0.3, 'chime']], desc: 'Revelación dorada, partículas y título cinematográfico. Con hold:true permanece hasta release().',
    make(fx) {
      const q = fx.params, rnd = fx.rnd, pal = fx.pal, letters = Array.from(q.title);
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, c = fx.pt(fx.o.at || 'center'), out = seg(p, 0.88, 1), life = 1 - out, rev = seg(p, 0.1, 0.34);
        K.dim(g, W, H, 0.62 * seg(p, 0, 0.14) * life, '#120a00');
        K.add(g);
        const R = Math.hypot(W, H) * 0.6; K.glow(g, c.x, c.y, R * 0.7 * E.out(seg(p, 0.05, 0.4)), pal.b, 0.6 * life); K.glow(g, c.x, c.y, 34 * u * E.out(rev), GOLD, 0.45 * life);
        K.burst(g, c.x, c.y, 6 * u, R * E.out(seg(p, 0.08, 0.4)), 20, t * 0.18, GOLD, 0.12 * life, 0.085); K.burst(g, c.x, c.y, 6 * u, R * 0.8 * E.out(seg(p, 0.12, 0.44)), 14, -t * 0.12 + 0.2, '#fff3c2', 0.1 * life, 0.05);
        if (fx.hit(0.16)) { fx.shake(1.4, 0.3); fx.ps.emit({ x: c.x, y: c.y, n: 90, speed: [30, 150], life: [0.6, 1.4], size: [0.35, 0.9], colors: [GOLD, '#fff3c2', '#ffffff'], type: 'spark', gravity: 30, drag: 1.4 }); }
        for (let i = 0; i < 3; i++) { const rq = seg(p, 0.16 + i * 0.05, 0.5 + i * 0.05); if (rq > 0 && rq < 1) K.ring(g, c.x, c.y, (10 + (60 + i * 16) * E.out(rq)) * u, 0.8 * u * (1 - rq), i === 1 ? '#ffffff' : GOLD, 1 - rq, 0.4); }
        // lluvia de oro y pétalos blancos y rojos
        if (p > 0.14 && out <= 0 && rnd() < 0.9) fx.ps.emit({ x: rnd() * W, y: -3 * u, n: 2, angle: PI / 2, spread: 0.7, speed: [14, 40], life: [1.6, 3], size: [0.5, 1.1], colors: [GOLD, '#fff3c2', '#ffffff', '#ff4a5a', GOLD], type: 'flake', gravity: 8, drag: 0.3 });
        if (p > 0.2 && rnd() < 0.5) fx.ps.emit({ x: c.x + (rnd() - 0.5) * 80 * u, y: c.y + 10 * u, n: 1, angle: -PI / 2, spread: 0.6, speed: [6, 20], life: [0.8, 1.6], size: [0.4, 1], colors: [GOLD, '#fff3c2'], type: 'mote', drag: 0.3 });
        fx.ps.draw(g);
        // ornamento: líneas doradas con grecas
        const lw = Math.min(W * 0.42, 60 * u) * E.out(seg(p, 0.24, 0.46)), size = K.fit(g, q.title, 17 * u, W * 0.9, { ls: 0.12 }), ty = c.y - 1 * u;
        g.save(); K.over(g); g.strokeStyle = GOLD; g.lineWidth = 0.4 * u; K.alpha(g, life * seg(p, 0.24, 0.3));
        [-1, 1].forEach(s => { const y = ty + s * size * 0.72; g.beginPath(); g.moveTo(c.x - lw, y); g.lineTo(c.x + lw, y); g.stroke(); K.fret(g, c.x - lw, y, 1.3 * u, s > 0 ? PI : 0); K.fret(g, c.x + lw, y, 1.3 * u, s > 0 ? PI : 0); K.sun(g, c.x, y, 1.8 * u, 8, t * 0.6, GOLD, g.globalAlpha); });
        g.restore();
        // título letra a letra
        g.save(); g.font = `900 ${size}px ${D.config.font}`; const ls = size * 0.12, widths = letters.map(ch => g.measureText(ch).width + ls), total = widths.reduce((a, b) => a + b, 0) - ls; g.restore();
        let x = c.x - total / 2;
        letters.forEach((ch, i) => {
          const lq = seg(p, 0.14 + i * 0.022, 0.26 + i * 0.022), cx = x + (widths[i] - ls) / 2; x += widths[i];
          if (lq <= 0) return;
          K.text(g, ch, cx, ty + (1 - E.back(lq)) * -6 * u + Math.sin(t * 1.6 + i * 0.5) * 0.35 * u, size * (1 + 0.8 * (1 - E.out(lq))), { fill: ['#fffbe0', '#ffe07a', '#d8941c', '#fff0a8'], stroke: '#3a1c02', sw: 0.1, a: lq * life, glow: '#ffb020', blur: 0.4 });
        });
        K.add(g); const sh = (seg(p, 0.36, 0.56) || 0); if (sh > 0 && sh < 1) K.glow(g, c.x - total / 2 + total * sh, ty, size * 0.8, '#ffffff', 0.6 * E.bell(sh));
        const tw = (t % 2.6) / 2.6; if (p >= 0.56 && tw < 0.4) K.glow(g, c.x - total / 2 + total * (tw / 0.4), ty - size * 0.2, size * 0.5, '#ffffff', 0.4 * E.bell(tw / 0.4) * life);
        if (q.subtitle) K.text(g, q.subtitle, c.x, ty + size * 1.15, K.fit(g, q.subtitle, 4 * u, W * 0.9, { weight: 700, ls: 0.16 }), { weight: 700, ls: 0.16, fill: '#fff3c2', stroke: '#1a0c02', sw: 0.2, a: seg(p, 0.4, 0.52) * life });
      };
    },
  });

  /* ── C07 · Derrota ── */
  D.define('C07', {
    name: 'Derrota', cat: 'C', dur: 3600, holdAt: 0.78, layer: 'screen', pal: 'ceniza', defaults: { title: 'DERROTA', subtitle: '' }, paramInfo: { title: 'Título.', subtitle: 'Línea secundaria (la entrega el juego).' },
    cues: [[0, 'fall'], [0.34, 'door']], desc: 'Disminución de iluminación, partículas descendentes y presentación del resultado.',
    make(fx) {
      const q = fx.params, rnd = fx.rnd, pal = fx.pal;
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, c = fx.pt(fx.o.at || 'center'), out = seg(p, 0.88, 1), life = 1 - out, dark = E.io(seg(p, 0, 0.45));
        K.dim(g, W, H, 0.8 * dark * life, '#04050a'); K.vignette(g, W, H, '#000000', 0.9 * dark * life);
        // haz frío que se apaga
        K.add(g); const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, rgba(pal.a, 0.28)); lg.addColorStop(1, rgba(pal.a, 0));
        g.fillStyle = lg; K.alpha(g, life * seg(p, 0.1, 0.4) * (0.7 + 0.3 * Math.sin(t * 0.9))); g.beginPath(); g.moveTo(c.x - 10 * u, 0); g.lineTo(c.x + 10 * u, 0); g.lineTo(c.x + 34 * u, H); g.lineTo(c.x - 34 * u, H); g.closePath(); g.fill();
        if (out <= 0 && rnd() < 0.85) fx.ps.emit({ x: rnd() * W, y: -2 * u, n: 2, angle: PI / 2 + 0.15, spread: 0.4, speed: [8, 24], life: [2, 3.6], size: [0.3, 0.9], colors: [pal.a, pal.b, pal.c, '#5a2a30'], type: 'ash', drag: 0.05 });
        if (p > 0.3 && p < 0.7 && rnd() < 0.3) fx.ps.emit({ x: c.x + (rnd() - 0.5) * 60 * u, y: c.y + 8 * u, n: 1, angle: PI / 2, spread: 0.8, speed: [2, 10], life: [0.8, 1.6], size: [0.5, 1.1], colors: ['#ff4a3a', '#a8301a'], type: 'ember', drag: 0.4 });
        fx.ps.draw(g);
        const tq = seg(p, 0.26, 0.5), size = K.fit(g, q.title, 16 * u, W * 0.9, { ls: 0.16 }), ty = c.y - (1 - E.out(tq)) * 7 * u;
        if (fx.hit(0.34)) fx.shake(0.9, 0.3);
        K.text(g, q.title, c.x, ty, size, { fill: ['#e6eaf4', '#9aa3b5', '#4a5266', '#8a2030'], stroke: '#05060a', sw: 0.12, ls: 0.16, a: tq * life, glow: '#7a0010', blur: 0.35 });
        // grieta que cruza el título
        const cq = seg(p, 0.44, 0.6); if (cq > 0) { K.add(g); K.bolt(g, c.x - size * 0.9, ty - size * 0.5, c.x - size * 0.9 + size * 1.8 * cq, ty - size * 0.5 + size * 1.0 * cq, 1.4 * u, D.util.rng(9), '#ff3340', 0.3 * u, 0.75 * life * (0.75 + 0.25 * Math.sin(t * 3)), '#ffd0d0'); }
        g.save(); K.over(g); g.strokeStyle = pal.b; g.lineWidth = 0.35 * u; K.alpha(g, life * seg(p, 0.4, 0.55)); const lw = Math.min(W * 0.4, 52 * u) * E.out(seg(p, 0.4, 0.62)); g.beginPath(); g.moveTo(c.x - lw, ty + size * 0.74); g.lineTo(c.x + lw, ty + size * 0.74); g.stroke(); g.restore();
        if (q.subtitle) K.text(g, q.subtitle, c.x, ty + size * 1.12, K.fit(g, q.subtitle, 3.8 * u, W * 0.9, { weight: 700, ls: 0.16 }), { weight: 700, ls: 0.16, fill: pal.c, stroke: '#05060a', sw: 0.2, a: seg(p, 0.5, 0.62) * life });
      };
    },
  });

  /* ── C08 · Pantalla de carga con progreso REAL ── */
  D.define('C08', {
    name: 'Pantalla de carga', cat: 'C', manual: true, layer: 'screen', pal: 'oro',
    defaults: { assets: null, progress: null, logo: null, title: 'DECRETO REAL', subtitle: 'Los Reinos del Perú', loadingText: 'Cargando recursos', backdrop: 1 },
    paramInfo: { assets: 'Lista de URL que el motor precarga de verdad; el porcentaje es cargados/total.', progress: 'Alternativa: progreso real 0..1 que entrega el anfitrión con handle.update({progress}).', logo: 'URL o HTMLImageElement del logo oficial (opcional).', title: 'Título si no hay logo.', subtitle: 'Subtítulo.', loadingText: 'Texto de estado.', backdrop: 'Opacidad del fondo (0 = transparente).' },
    extraCues: ['tick', 'reveal'], desc: 'Logo y barra de progreso. Sin temporizadores simulados: la salida solo ocurre al completar la precarga.',
    make(fx) {
      const q = fx.params, rnd = fx.rnd; let real = 0, disp = 0, loaded = false, exitT = -1, info = { done: 0, total: 0 }, logo = null, lastPct = -1;
      if (q.logo) { if (q.logo.nodeType === 1) logo = q.logo; else { logo = new Image(); logo.src = q.logo; } }
      if (Array.isArray(q.assets)) {
        D.preload(q.assets, (v, d) => { real = v; info = d; fx._emit('progress', { value: v, detail: d }); }).then(r => { fx.result = r; real = 1; loaded = true; fx._emit('loaded', r); });
      } else fx.on('update', () => { if (q.progress != null) { real = clamp(q.progress); fx._emit('progress', { value: real }); if (real >= 1) { loaded = true; fx.result = { total: 0, failed: [] }; } } });
      if (!Array.isArray(q.assets) && q.progress != null) { real = clamp(q.progress); loaded = real >= 1; }
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, cx = W / 2;
        // solo suavizado visual hacia el valor real (nunca lo supera)
        disp = Math.min(real, disp + (real - disp) * Math.min(1, dt * 9) + dt * 0.02);
        if (loaded && disp >= 0.999 && exitT < 0) { exitT = 0; fx.cue('reveal'); fx.ps.emit({ x: cx, y: H * 0.68, n: 60, speed: [20, 110], life: [0.4, 0.9], size: [0.35, 0.9], colors: [GOLD, '#fff3c2', '#ffffff'], type: 'spark', drag: 1.5 }); }
        if (exitT >= 0) exitT += dt;
        const ex = exitT < 0 ? 0 : clamp(exitT / 0.9), life = 1 - E.in(seg(ex, 0.35, 1)), intro = E.out(clamp(t / 0.5));
        if (q.backdrop > 0) { g.save(); K.over(g); const bg = g.createRadialGradient(cx, H * 0.42, 0, cx, H * 0.42, Math.hypot(W, H) * 0.7); bg.addColorStop(0, '#1a1024'); bg.addColorStop(0.55, '#0c0812'); bg.addColorStop(1, '#050408'); g.fillStyle = bg; K.alpha(g, q.backdrop * life); g.fillRect(0, 0, W, H); g.restore(); }
        K.add(g);
        const ly = H * 0.4, breath = 0.5 + 0.5 * Math.sin(t * 1.4);
        K.glow(g, cx, ly, 46 * u, '#6a3fc4', (0.3 + 0.12 * breath) * life * intro); K.glow(g, cx, ly, 30 * u, GOLD, (0.16 + 0.1 * breath) * life * intro);
        K.magicCircle(g, cx, ly, 33 * u, t * 0.15, { a: '#a26bff', c: GOLD }, 0.2 * life * intro, { noSun: true, glyphs: 16 });
        if (rnd() < 0.3) fx.ps.emit({ x: cx + (rnd() - 0.5) * 70 * u, y: ly + 14 * u, n: 1, angle: -PI / 2, spread: 0.5, speed: [3, 12], life: [1, 2], size: [0.3, 0.8], colors: [GOLD, '#fff3c2', '#a26bff'], type: 'mote', drag: 0.2 });
        fx.ps.draw(g);
        // logo o título
        if (logo && logo.complete && logo.naturalWidth) {
          const lw = Math.min(W * 0.72, 62 * u), lh = (lw * logo.naturalHeight) / logo.naturalWidth, s = (0.94 + 0.06 * intro) * (1 + 0.1 * E.in(ex));
          g.save(); K.over(g); K.alpha(g, life * intro); g.translate(cx, ly); g.scale(s, s); g.drawImage(logo, -lw / 2, -lh / 2, lw, lh); g.restore();
        } else {
          const size = K.fit(g, q.title, 12 * u, W * 0.88, { ls: 0.14 });
          K.text(g, q.title, cx, ly, size * (1 + 0.1 * E.in(ex)), { fill: D.GOLD_GRAD, stroke: '#1a0c02', sw: 0.1, ls: 0.14, a: life * intro, glow: '#a26bff', blur: 0.4 });
        }
        if (q.subtitle) K.text(g, q.subtitle.toUpperCase(), cx, ly + 20 * u, K.fit(g, q.subtitle.toUpperCase(), 3 * u, W * 0.86, { weight: 700, ls: 0.34 }), { weight: 700, ls: 0.34, fill: '#d9c9a0', a: 0.9 * life * intro });
        // barra ornamentada
        const bw = Math.min(W * 0.74, 70 * u), bh = Math.max(6, 2.2 * u), bx = cx - bw / 2, by = H * 0.68, tip = bx + bw * disp;
        g.save(); K.over(g); K.alpha(g, life * intro);
        g.fillStyle = '#0a0710'; K.rrect(g, bx, by - bh / 2, bw, bh, bh / 2); g.fill();
        g.save(); K.rrect(g, bx, by - bh / 2, bw, bh, bh / 2); g.clip();
        const fg = g.createLinearGradient(bx, 0, bx + bw, 0); fg.addColorStop(0, '#a8720f'); fg.addColorStop(0.6, '#ffd76a'); fg.addColorStop(1, '#fff6d0'); g.fillStyle = fg; g.fillRect(bx, by - bh / 2, bw * disp, bh);
        const shx = bx + ((t * 0.5) % 1.4 - 0.2) * bw, sg = g.createLinearGradient(shx - bh * 3, 0, shx + bh * 3, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.7)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(bx, by - bh / 2, bw * disp, bh);
        g.restore();
        g.strokeStyle = GOLD; g.lineWidth = Math.max(1, 0.3 * u); K.rrect(g, bx - 0.6 * u, by - bh / 2 - 0.6 * u, bw + 1.2 * u, bh + 1.2 * u, bh / 2 + 0.6 * u); g.stroke();
        g.fillStyle = GOLD; [bx - 2.6 * u, bx + bw + 2.6 * u].forEach(dx => { g.beginPath(); g.moveTo(dx, by - 1.5 * u); g.lineTo(dx + 1.1 * u, by); g.lineTo(dx, by + 1.5 * u); g.lineTo(dx - 1.1 * u, by); g.closePath(); g.fill(); });
        g.restore();
        K.add(g); if (disp > 0.002) { K.glow(g, tip, by, bh * 2.4, '#fff3c2', life * intro); if (disp < 1 && rnd() < 0.5) fx.ps.emit({ x: tip, y: by, n: 1, angle: PI, spread: 1.6, speed: [6, 26], life: [0.3, 0.6], size: [0.3, 0.6], colors: [GOLD, '#ffffff'], type: 'spark' }); }
        const pct = Math.floor(disp * 100 + 0.0001); if (pct !== lastPct) { lastPct = pct; if (pct % 10 === 0 && pct > 0) fx.cue('tick'); }
        K.text(g, pct + '%', cx, by + 5.6 * u, Math.max(12, 4.2 * u), { fill: '#fff3c2', weight: 700, a: life * intro });
        const st = loaded ? 'Listo' : q.loadingText + (info.total ? ` · ${info.done}/${info.total}` : '…');
        K.text(g, st, cx, by + 10.4 * u, Math.max(10, 2.4 * u), { fill: '#a89878', weight: 600, font: 'system-ui,-apple-system,"Segoe UI",sans-serif', a: 0.9 * life * intro });
        if (ex > 0) { K.add(g); const rq = seg(ex, 0, 0.7); if (rq < 1) K.ring(g, cx, by, bw * 0.5 * (0.2 + 1.4 * E.out(rq)), 0.6 * u * (1 - rq), GOLD, 1 - rq, 0.2); K.flash(g, W, H, 0.5 * E.bell(seg(ex, 0.25, 0.75)), '#fff3c2'); }
        if (ex >= 1) fx.finish();
      };
    },
  });
})(window.DecretoFX);

;
/*! Decreto Real FX Studio G3 — fx-mystic.js · D01–D07 Cartas místicas y habilidades
 * Los valores mostrados (PV, daño) son parámetros de representación entregados por el motor. */
(function (D) {
  'use strict';
  const { K, E, clamp, lerp, seg, mix, rgba, TAU, PI } = D.util, GOLD = D.GOLD, P = D.palettes;
  const num = v => (v == null || v === '' ? null : v);

  /* ── D01 · Marea de Hierro (Baltasar de Fierro) ── */
  D.define('D01', {
    name: 'Marea de Hierro', cat: 'D', dur: 1600, pal: 'hierro', anchors: ['at'], defaults: { heal: 2 }, paramInfo: { heal: 'PV recuperados a mostrar (motor). null = sin número.' },
    cues: [[0, 'whoosh'], [0.3, 'shield'], [0.56, 'impact'], [0.62, 'heal']], desc: 'Baltasar de Fierro · energía metálica y acuática que recupera PV al jugador.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd, plates = Array.from({ length: 7 }, (_, i) => [(i / 7) * TAU, 0.8 + rnd() * 0.4]);
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || fx.side), env = E.bell(seg(p, 0, 0.96)), rise = E.out(seg(p, 0.04, 0.55)), fall = seg(p, 0.55, 0.9), R = 24 * u;
        K.add(g); K.glow(g, c.x, c.y, R * 2.2, pal.b, 0.55 * env);
        // olas metálicas ascendentes (tres capas)
        for (let L = 0; L < 3; L++) {
          const w = R * (2.3 - L * 0.35), base = c.y + R * 0.9, h = R * (1.5 - L * 0.22) * rise * (1 - 0.6 * E.in(fall)), ph = t * (2.6 + L) + L * 2;
          g.beginPath(); g.moveTo(c.x - w, base);
          for (let i = 0; i <= 28; i++) { const k = i / 28, x = c.x - w + k * w * 2, edge = Math.sin(PI * k); g.lineTo(x, base - h * edge * (0.72 + 0.28 * Math.sin(k * 9 + ph)) - Math.sin(k * 22 - ph * 1.6) * 0.8 * u * edge); }
          g.lineTo(c.x + w, base); g.closePath();
          const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, rgba(pal.core, 0.95)); gr.addColorStop(0.18, rgba(pal.c, 0.75)); gr.addColorStop(0.55, rgba(pal.a, 0.45)); gr.addColorStop(1, rgba(pal.b, 0.05));
          g.fillStyle = gr; K.alpha(g, (0.5 + L * 0.2) * env); g.fill();
        }
        // placas de hierro orbitando
        const orb = seg(p, 0.12, 0.8);
        if (orb > 0 && orb < 1) plates.forEach(([a0, sc], i) => {
          const an = a0 + t * 3.4, x = c.x + Math.cos(an) * R * 1.15, y = c.y + Math.sin(an) * R * 0.42 - R * 0.1, front = Math.sin(an) > 0, s = 2.4 * u * sc * E.bell(orb);
          g.save(); K.over(g); g.translate(x, y); g.rotate(an + PI / 2); const pg = g.createLinearGradient(-s, 0, s, 0); pg.addColorStop(0, '#3a4a5c'); pg.addColorStop(0.5, '#e6f0fa'); pg.addColorStop(1, '#5a6f86');
          g.fillStyle = pg; K.alpha(g, (front ? 1 : 0.45) * E.bell(orb)); g.beginPath(); g.moveTo(0, -s * 2); g.lineTo(s * 0.8, 0); g.lineTo(0, s * 2); g.lineTo(-s * 0.8, 0); g.closePath(); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 0.25 * u; g.stroke(); g.restore();
          if (i === 0 && rnd() < 0.5) fx.ps.emit({ x, y, n: 1, speed: [2, 10], life: [0.2, 0.5], size: [0.3, 0.6], colors: ['#ffffff', pal.c], type: 'mote' });
        });
        K.add(g);
        K.spikeRing(g, c.x, c.y, R * (0.9 + 0.2 * Math.sin(t * 3)), 2.4 * u, 20, t * 1.5, pal.c, 0.6 * E.bell(seg(p, 0.1, 0.7)), 0.4 * u);
        if (p < 0.55 && rnd() < 0.9) fx.ps.emit({ x: c.x + (rnd() - 0.5) * R * 3, y: c.y + R * 0.8, n: 2, angle: -PI / 2, spread: 0.7, speed: [20, 60], life: [0.3, 0.7], size: [0.3, 0.8], colors: [pal.c, pal.core, pal.a], type: 'spark', gravity: 60 });
        if (fx.hit(0.56)) { fx.shake(1, 0.25); fx.ps.emit({ x: c.x, y: c.y, n: 50, angle: -PI / 2, spread: 2.8, speed: [30, 110], life: [0.4, 0.9], size: [0.35, 0.9], colors: [pal.c, pal.core, '#ffffff', GOLD], type: 'spark', gravity: 90 }); fx.ps.emit({ x: c.x, y: c.y, n: 24, jitter: 12, angle: -PI / 2, spread: 0.8, speed: [8, 26], life: [0.6, 1.1], size: [0.5, 1.1], colors: [P.vida.a, GOLD, '#ffffff'], type: 'mote', drag: 0.4 }); }
        const hq = seg(p, 0.56, 0.95);
        if (hq > 0 && hq < 1) { K.glow(g, c.x, c.y, R * (0.8 + 1.2 * hq), P.vida.a, 0.55 * (1 - hq)); K.ring(g, c.x, c.y, R * (0.5 + 1.5 * E.out(hq)), 0.7 * u * (1 - hq), P.vida.a, 1 - hq); K.ring(g, c.x, c.y, R * (0.3 + 1.9 * E.out(hq)), 0.4 * u * (1 - hq), GOLD, 1 - hq); K.burst(g, c.x, c.y, R * 0.3, R * (1 + hq), 12, 0.2, '#ffffff', (1 - hq) * 0.5, 0.04); }
        fx.ps.draw(g);
        if (num(fx.params.heal) != null) K.floatText(g, '+' + fx.params.heal, c.x, c.y - R * 0.3, 10 * u, seg(p, 0.58, 1), P.vida.a, '#032612');
      };
    },
  });

  /* ── D02 · Carga Sangrante (Leandro Valcázar) ── */
  D.define('D02', {
    name: 'Carga Sangrante', cat: 'D', dur: 1500, pal: 'sangre', anchors: ['from', 'to'], defaults: { damage: 3, selfDamage: 1 }, paramInfo: { damage: 'Daño al rival a mostrar (motor).', selfDamage: 'PV propios sacrificados a mostrar (motor).' },
    cues: [[0, 'charge'], [0.34, 'whoosh'], [0.56, 'impact']], desc: 'Leandro Valcázar · embestida de energía roja con sacrificio propio.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd;
      return (g, p, dt, t) => {
        const u = fx.u, A = fx.pt(fx.o.from || fx.side), B = fx.pt(fx.o.to || fx.foe), dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, nx = dx / len, ny = dy / len, an = Math.atan2(dy, dx);
        const sac = seg(p, 0, 0.34), ch = E.in(seg(p, 0.34, 0.56)), aft = seg(p, 0.56, 1), F = { x: A.x + nx * 9 * u, y: A.y + ny * 9 * u };
        K.add(g);
        // sacrificio: la energía sale del lanzador y se condensa en la punta
        if (sac < 1) {
          K.glow(g, A.x, A.y, 16 * u, pal.b, 0.7 * E.bell(sac)); K.glow(g, F.x, F.y, (3 + 8 * sac) * u, pal.a, 0.9); K.glow(g, F.x, F.y, (1 + 4 * sac) * u, pal.core, 1);
          K.spikeRing(g, A.x, A.y, (14 - 6 * sac) * u, 2.4 * u, 14, -t * 3, pal.a, 0.8 * E.bell(sac), 0.4 * u, D.util.rng(((t * 20) | 0) + 1));
          if (rnd() < 0.95) fx.ps.emit({ x: A.x, y: A.y, n: 2, jitter: 9, to: F, life: [0.2, 0.4], size: [0.4, 0.9], colors: [pal.a, pal.b, pal.c], type: 'dot' });
          if (fx.hit(0.04) && A.el) fx.shakeEl(A.el, 3, 220);
        }
        // embestida
        if (p >= 0.34 && aft < 0.35) {
          const hx = lerp(F.x, B.x, ch), hy = lerp(F.y, B.y, ch), tk = clamp(ch - 0.5 + aft * 1.6), tx = lerp(F.x, B.x, tk), ty = lerp(F.y, B.y, tk), f = 1 - seg(aft, 0, 0.35);
          g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy);
          g.strokeStyle = pal.b; g.lineWidth = 10 * u; K.alpha(g, 0.45 * f); g.stroke(); g.strokeStyle = pal.a; g.lineWidth = 5 * u; K.alpha(g, 0.9 * f); g.stroke(); g.strokeStyle = pal.core; g.lineWidth = 1.6 * u; K.alpha(g, f); g.stroke();
          // punta de lanza y conos de choque
          g.save(); g.translate(hx, hy); g.rotate(an);
          g.fillStyle = pal.core; K.alpha(g, f); g.beginPath(); g.moveTo(7 * u, 0); g.lineTo(-4 * u, -3 * u); g.lineTo(-1.5 * u, 0); g.lineTo(-4 * u, 3 * u); g.closePath(); g.fill();
          g.strokeStyle = pal.a; g.lineJoin = 'miter';
          for (let i = 0; i < 3; i++) { const o = -(4 + i * 5.5) * u, s = (5 + i * 2.6) * u; g.lineWidth = (1.3 - i * 0.3) * u; K.alpha(g, f * (0.9 - i * 0.25)); g.beginPath(); g.moveTo(o - s * 0.8, -s); g.lineTo(o, 0); g.lineTo(o - s * 0.8, s); g.stroke(); }
          g.restore();
          K.glow(g, hx, hy, 12 * u, pal.a, f);
          if (ch < 1) fx.ps.emit({ x: hx, y: hy, n: 3, angle: an + PI, spread: 0.9, speed: [30, 100], life: [0.25, 0.55], size: [0.35, 0.8], colors: [pal.a, pal.c, pal.core], type: 'spark' });
        }
        if (fx.hit(0.56)) {
          fx.shake(2.4, 0.4); if (B.el) fx.shakeEl(B.el, 9, 340);
          fx.ps.emit({ x: B.x, y: B.y, n: 70, angle: an, spread: 2.8, speed: [30, 150], life: [0.35, 0.9], size: [0.35, 0.95], colors: [pal.a, pal.c, pal.core, '#ffffff'], type: 'spark', gravity: 50, drag: 2 });
          fx.ps.emit({ x: B.x, y: B.y, n: 18, angle: an, spread: 2.2, speed: [20, 80], life: [0.5, 1], size: [0.8, 1.6], colors: [pal.a, pal.b], type: 'shard', gravity: 90 });
        }
        if (aft > 0 && aft < 1) {
          const f = 1 - aft, e = E.out5(aft);
          K.glow(g, B.x, B.y, (18 + 34 * e) * u, pal.a, 0.75 * f); K.glow(g, B.x, B.y, (9 + 14 * e) * u, pal.core, f * f);
          K.burst(g, B.x, B.y, 3 * u, (16 + 34 * e) * u, 16, an, pal.core, f * f, 0.045, D.util.rng(4));
          K.spikeRing(g, B.x, B.y, (8 + 30 * e) * u, 4.5 * u * f, 18, aft * 2, pal.a, f, 0.7 * u, D.util.rng(((p * 30) | 0) + 2)); K.ring(g, B.x, B.y, (5 + 44 * e) * u, 0.6 * u * f, pal.c, f * 0.8);
        }
        K.flash(g, fx.W, fx.H, 0.14 * E.bell(seg(p, 0.55, 0.68)), pal.core);
        fx.ps.draw(g);
        if (num(fx.params.selfDamage) != null) K.floatText(g, '−' + fx.params.selfDamage, A.x, A.y - 6 * u, 7 * u, seg(p, 0.06, 0.6), '#ff6a6a');
        if (num(fx.params.damage) != null) K.floatText(g, '−' + fx.params.damage, B.x, B.y - 6 * u, 11 * u, seg(p, 0.58, 1), '#ff4a5a');
      };
    },
  });

  /* ── D03 · Pacto de Azogue (Octavio Argento) ── */
  D.define('D03', {
    name: 'Pacto de Azogue', cat: 'D', dur: 1900, pal: 'azogue', anchors: ['from', 'to', 'at'], defaults: { heal: 4, healEnemy: 1 }, paramInfo: { heal: 'PV propios recuperados a mostrar (motor).', healEnemy: 'PV del rival recuperados a mostrar (motor).' },
    cues: [[0, 'hum'], [0.4, 'chime'], [0.5, 'whoosh'], [0.74, 'heal']], desc: 'Octavio Argento · energía mercurial plateada y dorada: cura al jugador y concede vida al rival.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd, blobs = Array.from({ length: 6 }, (_, i) => [(i / 6) * TAU, 0.7 + rnd() * 0.6, rnd() * TAU]);
      function blob(g, x, y, r, a) {
        if (r < 0.5 || a <= 0) return; g.save(); K.over(g); K.alpha(g, a);
        const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#e2e8f0'); gr.addColorStop(0.7, '#8d99a8'); gr.addColorStop(1, '#3a424e');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = rgba(GOLD, 0.8); g.lineWidth = Math.max(0.6, r * 0.07); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.42, r * 0.22, r * 0.12, -0.6, 0, TAU); g.fill(); g.restore();
      }
      function stream(g, M, T, q, w, u, t) { // corriente mercurial de M a T
        if (q <= 0 || q >= 1) return;
        const cx = (M.x + T.x) / 2 - (T.y - M.y) * 0.22, cy = (M.y + T.y) / 2 + (T.x - M.x) * 0.22, head = E.io(seg(q, 0, 0.7)), tail = E.io(seg(q, 0.3, 1));
        g.save(); K.add(g); g.lineCap = 'round'; g.beginPath();
        for (let i = 0; i <= 20; i++) { const k = lerp(tail, head, i / 20), m = 1 - k, x = m * m * M.x + 2 * m * k * cx + k * k * T.x + Math.sin(k * 14 + t * 8) * 0.7 * u, y = m * m * M.y + 2 * m * k * cy + k * k * T.y; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = '#7d8a99'; g.lineWidth = w * 2.2; K.alpha(g, 0.45); g.stroke(); g.strokeStyle = GOLD; g.lineWidth = w * 1.2; K.alpha(g, 0.7); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = w * 0.5; K.alpha(g, 1); g.stroke(); g.restore();
        const m = 1 - head; blob(g, m * m * M.x + 2 * m * head * cx + head * head * T.x, m * m * M.y + 2 * m * head * cy + head * head * T.y, w * 1.25, 1);
      }
      return (g, p, dt, t) => {
        const u = fx.u, A = fx.pt(fx.o.from || fx.side), B = fx.pt(fx.o.to || fx.foe), M = fx.o.at ? fx.pt(fx.o.at) : { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
        const gather = E.io(seg(p, 0, 0.4)), split = seg(p, 0.46, 0.8), env = E.bell(seg(p, 0, 0.98)), R = 7 * u;
        K.add(g); K.glow(g, M.x, M.y, 26 * u, pal.b, 0.5 * env * (1 - seg(p, 0.6, 0.85)));
        K.magicCircle(g, M.x, M.y, 17 * u, t * 0.9, { a: pal.a, c: GOLD }, 0.55 * E.bell(seg(p, 0.02, 0.7)), { draw: seg(p, 0, 0.3), noSun: true, points: 6, step: 2 });
        const core = R * (0.4 + 0.8 * gather) * (1 - 0.75 * E.in(seg(p, 0.5, 0.8))) * (1 + 0.05 * Math.sin(t * 12));
        blobs.forEach(([a0, sc, ph]) => { const an = a0 + t * 2.4, rr = 17 * u * (1 - gather) + core * 0.2; blob(g, M.x + Math.cos(an) * rr, M.y + Math.sin(an) * rr * 0.8, R * 0.42 * sc * (1 - 0.6 * gather) * (1 + 0.15 * Math.sin(t * 9 + ph)), 1 - seg(gather, 0.85, 1)); });
        if (p < 0.82) blob(g, M.x, M.y, core, 1);
        K.add(g); if (p < 0.8) K.glow(g, M.x, M.y, core * 2.2, '#ffffff', 0.3 + 0.3 * gather);
        if (fx.hit(0.4)) fx.ps.emit({ x: M.x, y: M.y, n: 30, speed: [16, 60], life: [0.35, 0.8], size: [0.35, 0.8], colors: ['#ffffff', pal.a, GOLD], type: 'spark' });
        const rq = seg(p, 0.4, 0.7); if (rq > 0 && rq < 1) K.ring(g, M.x, M.y, (6 + 24 * E.out(rq)) * u, 0.5 * u * (1 - rq), GOLD, 1 - rq);
        stream(g, M, A, split, 2.2 * u, u, t); stream(g, M, B, seg(p, 0.52, 0.8), 0.9 * u, u, t);
        K.add(g);
        [[A, 0.72, 1, fx.params.heal, 10], [B, 0.76, 0.5, fx.params.healEnemy, 7]].forEach(([T, at, sc, val, ts]) => {
          if (fx.hit(at)) fx.ps.emit({ x: T.x, y: T.y, n: 30 * sc, jitter: 8, angle: -PI / 2, spread: 1, speed: [8, 30], life: [0.5, 1], size: [0.4, 1], colors: [P.vida.a, GOLD, '#ffffff', pal.a], type: 'mote', drag: 0.4 });
          const hq = seg(p, at, 1); if (hq > 0 && hq < 1) { K.glow(g, T.x, T.y, (10 + 22 * hq) * u * sc, P.vida.a, 0.6 * (1 - hq)); K.ring(g, T.x, T.y, (5 + 26 * E.out(hq)) * u * sc, 0.6 * u * (1 - hq), GOLD, 1 - hq); K.ring(g, T.x, T.y, (3 + 18 * E.out(hq)) * u * sc, 0.5 * u * (1 - hq), '#ffffff', 1 - hq); }
        });
        fx.ps.draw(g);
        if (num(fx.params.heal) != null) K.floatText(g, '+' + fx.params.heal, A.x, A.y - 6 * u, 10 * u, seg(p, 0.72, 1), P.vida.a, '#032612');
        if (num(fx.params.healEnemy) != null) K.floatText(g, '+' + fx.params.healEnemy, B.x, B.y - 6 * u, 7 * u, seg(p, 0.76, 1), P.vida.a, '#032612');
      };
    },
  });

  /* ── Sello de Mando (anillo de sello con grecas y sol) ── */
  function commandSeal(g, x, y, R, lit, t, a) {
    if (a <= 0) return; g.save(); K.over(g); K.alpha(g, a); g.translate(x, y);
    const gr = g.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R); gr.addColorStop(0, mix('#6a4a1a', '#fff6c8', lit)); gr.addColorStop(0.6, mix('#3a2608', '#ffc93a', lit)); gr.addColorStop(1, mix('#1a1004', '#a86c0c', lit));
    g.fillStyle = gr; g.beginPath(); for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU + PI / 8; i ? g.lineTo(Math.cos(an) * R, Math.sin(an) * R) : g.moveTo(Math.cos(an) * R, Math.sin(an) * R); } g.closePath(); g.fill();
    g.strokeStyle = mix('#8a6a2a', '#fff3c2', lit); g.lineWidth = R * 0.07; g.lineJoin = 'round'; g.stroke();
    g.lineWidth = R * 0.035; g.beginPath(); g.arc(0, 0, R * 0.72, 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; K.fret(g, Math.cos(an) * R * 0.84, Math.sin(an) * R * 0.84, R * 0.07, an + PI / 2); }
    K.sun(g, 0, 0, R * 0.56, 12, t * 0.4 * lit, mix('#8a6a2a', '#fffbe8', lit), a); g.restore();
  }

  /* ── D04 · Decreto del Legado (Zhinchi → Sello de Mando de Xervias) ── */
  D.define('D04', {
    name: 'Decreto del Legado', cat: 'D', dur: 3000, holdAt: 0.84, pal: 'legado', anchors: ['from', 'to'], defaults: { label: '' }, paramInfo: { label: 'Texto opcional bajo el sello (lo entrega el juego).' },
    cues: [[0, 'hum'], [0.2, 'chime'], [0.52, 'charge'], [0.68, 'boom'], [0.72, 'fanfare']], desc: 'Zhinchi · transferencia de poder al Sello de Mando de Xervias; energía dorada y manifestación solemne.',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd;
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, S = fx.pt(fx.o.to || 'seal'), top = fx.o.from ? fx.pt(fx.o.from) : { x: S.x, y: Math.max(13 * u, S.y - 46 * u) };
        const out = seg(p, 0.9, 1), life = 1 - out, man = E.io(seg(p, 0.04, 0.4)), flow = seg(p, 0.3, 0.7), lit = E.io(seg(p, 0.56, 0.72)), R = 9 * u;
        K.dim(g, W, H, 0.55 * seg(p, 0, 0.2) * life, '#0a0600');
        K.add(g);
        // manifestación: gran disco solar que desciende con solemnidad
        const my = top.y - (1 - man) * 8 * u, MR = 15 * u * (0.7 + 0.3 * man);
        K.glow(g, top.x, my, MR * 3, pal.b, 0.5 * man * life); K.glow(g, top.x, my, MR * 1.6, pal.a, 0.4 * man * life);
        K.burst(g, top.x, my, MR * 0.9, MR * 3.4, 24, t * 0.12, pal.c, 0.14 * man * life, 0.05);
        K.magicCircle(g, top.x, my, MR, t * 0.3, pal, man * life, { draw: seg(p, 0.04, 0.36), glyphs: 16 });
        K.magicCircle(g, top.x, my, MR * 1.42, -t * 0.2, pal, 0.5 * man * life, { draw: seg(p, 0.12, 0.44), noSun: true, points: 12, step: 5, glyphs: 24 });
        // columna de luz descendente
        const col = E.io(seg(p, 0.26, 0.5)), cy1 = lerp(my, S.y, col), cw = (2 + 5 * E.bell(seg(p, 0.26, 0.86))) * u;
        if (col > 0) { const lg = g.createLinearGradient(top.x - cw, 0, top.x + cw, 0); lg.addColorStop(0, rgba(pal.a, 0)); lg.addColorStop(0.5, rgba(pal.core, 0.85)); lg.addColorStop(1, rgba(pal.a, 0)); g.fillStyle = lg; K.alpha(g, life * (0.6 + 0.2 * Math.sin(t * 5))); g.beginPath(); g.moveTo(top.x - cw * 0.6, my); g.lineTo(top.x + cw * 0.6, my); g.lineTo(S.x + cw, cy1); g.lineTo(S.x - cw, cy1); g.closePath(); g.fill(); }
        if (flow > 0 && flow < 1 && rnd() < 0.95) { const an = rnd() * TAU; fx.ps.emit({ x: top.x + Math.cos(an) * MR, y: my + Math.sin(an) * MR, n: 2, to: { x: S.x, y: S.y }, life: [0.5, 0.9], size: [0.4, 1], colors: [pal.a, pal.c, pal.core], type: 'dot' }); }
        // el Sello de Mando recibe el poder
        const sa = seg(p, 0.14, 0.3) * life, pulse = 1 + 0.08 * E.bell(seg(p, 0.66, 0.8)) + 0.02 * Math.sin(t * 4) * lit;
        K.glow(g, S.x, S.y, R * (2 + 2.4 * lit), pal.a, (0.25 + 0.5 * lit) * sa);
        if (lit > 0) { K.burst(g, S.x, S.y, R * 1.1, R * (2.4 + 1.6 * lit), 16, t * 0.25, pal.c, 0.3 * lit * life, 0.06); K.magicCircle(g, S.x, S.y, R * 2.1, -t * 0.5, pal, 0.7 * lit * life, { noSun: true, draw: lit }); }
        fx.ps.draw(g);
        commandSeal(g, S.x, S.y, R * pulse, lit, t, sa); K.add(g);
        if (fx.hit(0.68)) { fx.shake(1.6, 0.4); fx.ps.emit({ x: S.x, y: S.y, n: 80, speed: [20, 120], life: [0.6, 1.4], size: [0.35, 0.95], colors: [pal.a, pal.c, '#ffffff'], type: 'spark', drag: 1.3 }); fx.ps.emit({ x: S.x, y: S.y, n: 30, jitter: 10, angle: -PI / 2, spread: 0.8, speed: [6, 24], life: [1, 1.8], size: [0.5, 1.2], colors: [pal.a, pal.c], type: 'mote', drag: 0.3 }); }
        for (let i = 0; i < 3; i++) { const rq = seg(p, 0.68 + i * 0.04, 0.9 + i * 0.04); if (rq > 0 && rq < 1) K.ring(g, S.x, S.y, R * (1 + (4 + i) * E.out(rq)), 0.7 * u * (1 - rq), i === 1 ? '#ffffff' : pal.a, 1 - rq); }
        K.glow(g, S.x, S.y, R * 1.4, '#ffffff', 0.8 * E.bell(seg(p, 0.64, 0.8)));
        K.flash(g, W, H, 0.16 * E.bell(seg(p, 0.66, 0.78)), pal.c);
        if (fx.params.label) K.text(g, fx.params.label, S.x, S.y + R * 2.9, K.fit(g, fx.params.label, 5 * u, W * 0.9, { ls: 0.14 }), { fill: D.GOLD_GRAD, stroke: '#1a0c02', sw: 0.16, ls: 0.14, a: seg(p, 0.72, 0.82) * life });
      };
    },
  });

  /* ── D05 · Invocación del León del Edicto ── */
  D.define('D05', {
    name: 'Invocación del León del Edicto', cat: 'D', dur: 2200, holdAt: 0.82, pal: 'oro', anchors: ['at'], defaults: { hp: 4, attack: 2, label: 'LEÓN DEL EDICTO' }, paramInfo: { hp: 'PV de la invocación a mostrar (motor).', attack: 'Ataque de la invocación a mostrar (motor).', label: 'Nombre a mostrar.' },
    cues: [[0, 'hum'], [0.34, 'charge'], [0.5, 'roar'], [0.52, 'impact']], desc: 'Círculo mágico, sello y aparición luminosa de la invocación (4 PV · 2 ATQ).',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd;
      return (g, p, dt, t) => {
        const u = fx.u, c = fx.pt(fx.o.at || 'summon'), R = 24 * u, gy = c.y + 15 * u, draw = E.io(seg(p, 0, 0.34)), out = seg(p, 0.9, 1), life = 1 - out, em = E.out(seg(p, 0.4, 0.62)), q = fx.params;
        K.add(g); K.glow(g, c.x, gy, R * 2, pal.b, 0.5 * draw * life);
        K.magicCircle(g, c.x, gy, R, t * 0.9, pal, life, { draw, sy: 0.34 }); K.magicCircle(g, c.x, gy, R * 1.3, -t * 0.6, pal, 0.5 * life * draw, { draw: seg(p, 0.1, 0.4), sy: 0.34, noSun: true, glyphs: 20 });
        // columna de luz
        const pq = seg(p, 0.3, 0.75); if (pq > 0 && pq < 1) { const w = R * (0.2 + 0.7 * E.bell(pq)), lg = g.createLinearGradient(c.x - w, 0, c.x + w, 0); lg.addColorStop(0, rgba(pal.a, 0)); lg.addColorStop(0.5, rgba(pal.core, 0.9)); lg.addColorStop(1, rgba(pal.a, 0)); g.fillStyle = lg; K.alpha(g, E.bell(pq)); g.fillRect(c.x - w, gy - R * 3.2 * E.out(seg(pq, 0, 0.4)), w * 2, R * 3.2 * E.out(seg(pq, 0, 0.4))); }
        if (p > 0.1 && p < 0.7 && rnd() < 0.9) { const an = rnd() * TAU; fx.ps.emit({ x: c.x + Math.cos(an) * R, y: gy + Math.sin(an) * R * 0.34, n: 1, angle: -PI / 2, spread: 0.3, speed: [14, 44], life: [0.4, 0.9], size: [0.4, 0.9], colors: [pal.a, pal.c, '#ffffff'], type: 'mote', drag: 0.3 }); }
        if (fx.hit(0.5)) { fx.shake(2, 0.4); fx.ps.emit({ x: c.x, y: c.y, n: 70, speed: [30, 130], life: [0.4, 1], size: [0.35, 0.9], colors: [pal.a, pal.c, '#ffffff'], type: 'spark', drag: 1.6 }); }
        // rugido: ondas dentadas
        for (let i = 0; i < 3; i++) { const rq = seg(p, 0.5 + i * 0.06, 0.8 + i * 0.06); if (rq > 0 && rq < 1) K.spikeRing(g, c.x, c.y - 2 * u, R * (0.7 + 1.6 * E.out(rq)), 3 * u * (1 - rq), 20, i, pal.c, 1 - rq, 0.5 * u, D.util.rng(i + 3)); }
        fx.ps.draw(g);
        if (em > 0) {
          const s = 14 * u * (0.5 + 0.5 * E.back(seg(p, 0.4, 0.62))), ly = c.y - 2 * u + Math.sin(t * 1.6) * 0.5 * u;
          K.add(g); K.glow(g, c.x, ly, s * 2.6, pal.a, 0.5 * em * life); K.burst(g, c.x, ly, s, s * 2.4, 18, t * 0.2, pal.c, 0.16 * em * life, 0.06);
          K.lion(g, c.x, ly, s, em * life, pal, t);
          K.add(g); K.glow(g, c.x, ly, s * 1.7, '#ffffff', (1 - seg(p, 0.46, 0.7)) * em);  // silueta blanca que revela
        }
        const tq = seg(p, 0.62, 0.74) * life;
        if (q.label) K.text(g, q.label, c.x, gy + R * 0.62, K.fit(g, q.label, 4.6 * u, fx.W * 0.9, { ls: 0.12 }), { fill: D.GOLD_GRAD, stroke: '#1a0c02', sw: 0.18, ls: 0.12, a: tq });
        if (num(q.hp) != null && num(q.attack) != null) {
          const y = gy + R * 0.62 + 6.4 * u, sz = 4.4 * u;
          [[-1, 'PV ' + q.hp, P.vida], [1, 'ATQ ' + q.attack, P.carmesi]].forEach(([s, txt, pl]) => { K.ribbon(g, c.x + s * 9.5 * u, y, 17 * u, sz * 1.5, pl, tq, 0); K.text(g, txt, c.x + s * 9.5 * u, y, sz * 0.82, { fill: '#ffffff', stroke: pl.dark, sw: 0.2, a: tq }); });
        }
      };
    },
  });

  /* ── D06 · León del Edicto, combate (ataque · daño recibido · disipación) ── */
  D.define('D06', {
    name: 'León del Edicto, combate', cat: 'D', dur: 1300, pal: 'oro', anchors: ['from', 'to'], defaults: { mode: 'attack', amount: 2 },
    paramInfo: { mode: "'attack' (ataque de la invocación) | 'hit' (daño recibido) | 'destroy' (disipación al ser destruida).", amount: 'Daño a mostrar (motor). null = sin número.' },
    paramOptions: { mode: ['attack', 'hit', 'destroy'] }, cues: [[0, 'roar']], extraCues: ['slash', 'impact', 'shatter'],
    desc: 'Ataque de la invocación, daño recibido y disipación cuando es destruida (param mode).',
    make(fx) {
      const pal = fx.pal, rnd = fx.rnd, mode = fx.params.mode, amount = num(fx.params.amount);
      const claws = [-1, 0, 1];
      return (g, p, dt, t) => {
        const u = fx.u, L = fx.pt(fx.o.from || fx.o.at || 'summon'), s = 13 * u;
        K.add(g);
        if (mode === 'attack') {
          const B = fx.pt(fx.o.to || fx.foe), dx = B.x - L.x, dy = B.y - L.y, len = Math.hypot(dx, dy) || 1, nx = dx / len, ny = dy / len, reach = Math.max(0, len - 16 * u);
          const lunge = E.in(seg(p, 0.12, 0.4)) * (1 - E.io(seg(p, 0.5, 0.86))), wind = E.bell(seg(p, 0, 0.16)) * 3 * u, x = L.x + nx * (reach * lunge - wind), y = L.y + ny * (reach * lunge - wind), a = seg(p, 0, 0.08);
          for (let i = 1; i <= 3; i++) if (lunge > 0.05) K.glow(g, x - nx * i * 5 * u * lunge, y - ny * i * 5 * u * lunge, s * 1.4, pal.a, 0.22 * lunge);
          K.glow(g, x, y, s * 2.2, pal.a, 0.45 * a); K.lion(g, x, y, s * (1 + 0.18 * lunge), a, pal, t); K.add(g);
          // zarpazo triple (tres hojas paralelas)
          const an = Math.atan2(ny, nx) + 1.0, cx = Math.cos(an), cy = Math.sin(an), LL = 15 * u, head = E.out(seg(p, 0.38, 0.52)), tail = E.io(seg(p, 0.44, 0.68));
          if (head > tail) claws.forEach(k => { const ox = -cy * k * 5 * u, oy = cx * k * 5 * u, P0 = { x: B.x - cx * LL + ox, y: B.y - cy * LL + oy }, P1 = { x: B.x + cx * LL + ox, y: B.y + cy * LL + oy }, C = { x: B.x + ox - cy * 3 * u, y: B.y + oy + cx * 3 * u }; K.blade(g, P0, C, P1, tail, head, 3.2 * u, [[pal.b, 1, 0.6], [pal.a, 0.7, 0.95], ['#ffffff', 0.32, 1]], 1); });
          if (fx.hit(0.38)) fx.cue('slash');
          if (fx.hit(0.46)) { fx.cue('impact'); fx.shake(1.8, 0.3); if (B.el) fx.shakeEl(B.el, 8, 320); fx.ps.emit({ x: B.x, y: B.y, n: 54, speed: [30, 130], life: [0.35, 0.85], size: [0.35, 0.9], colors: [pal.a, pal.c, '#ffffff'], type: 'spark', gravity: 50, drag: 2 }); fx.ps.emit({ x: B.x, y: B.y, n: 12, speed: [20, 70], life: [0.5, 0.9], size: [0.8, 1.5], colors: [pal.a, pal.b], type: 'shard', gravity: 80 }); }
          const im = seg(p, 0.46, 0.85); if (im > 0 && im < 1) { const f = 1 - im, e = E.out5(im); K.glow(g, B.x, B.y, (14 + 28 * e) * u, pal.a, 0.7 * f); K.glow(g, B.x, B.y, (7 + 10 * e) * u, '#ffffff', f * f); K.burst(g, B.x, B.y, 3 * u, (14 + 26 * e) * u, 14, 0.5, '#ffffff', f * f, 0.045, D.util.rng(8)); K.ring(g, B.x, B.y, (5 + 34 * e) * u, 0.6 * u * f, pal.c, f); }
          K.flash(g, fx.W, fx.H, 0.1 * E.bell(seg(p, 0.45, 0.57)), pal.core);
          fx.ps.draw(g); if (amount != null) K.floatText(g, '−' + amount, B.x, B.y - 6 * u, 10 * u, seg(p, 0.48, 1), '#ff4a5a');
        } else if (mode === 'hit') {
          const hurt = E.bell(seg(p, 0, 0.6)), jx = fx.reduced ? 0 : (rnd() - 0.5) * 2.4 * u * (1 - seg(p, 0, 0.5)), a = seg(p, 0, 0.06);
          if (fx.hit(0.04)) { fx.cue('impact'); fx.shake(1.2, 0.3); fx.ps.emit({ x: L.x, y: L.y, n: 40, speed: [30, 110], life: [0.3, 0.75], size: [0.35, 0.85], colors: ['#ff4a5a', pal.a, '#ffffff'], type: 'spark', gravity: 70, drag: 2 }); }
          K.glow(g, L.x, L.y, s * 2.4, '#ff2038', 0.6 * hurt); K.lion(g, L.x + jx, L.y, s * (1 - 0.06 * hurt), a, pal, t, hurt); K.add(g);
          K.glow(g, L.x, L.y, s * 1.5, '#ffffff', 0.7 * (1 - seg(p, 0, 0.2)));
          for (let i = 0; i < 4; i++) { const r = D.util.rng(i * 7 + 2), an = r() * TAU; K.bolt(g, L.x, L.y, L.x + Math.cos(an) * s * 1.1 * seg(p, 0.02, 0.2), L.y + Math.sin(an) * s * 1.1 * seg(p, 0.02, 0.2), 1.4 * u, r, '#ff4a5a', 0.3 * u, 1 - seg(p, 0.4, 0.85)); }
          K.spikeRing(g, L.x, L.y, s * (0.8 + 1.2 * E.out(seg(p, 0, 0.5))), 3 * u * (1 - p), 16, p * 2, '#ff4a5a', 1 - seg(p, 0, 0.6), 0.5 * u, D.util.rng(((p * 30) | 0) + 1));
          fx.ps.draw(g); if (amount != null) K.floatText(g, '−' + amount, L.x, L.y - s, 9 * u, seg(p, 0.06, 1), '#ff4a5a');
        } else { // destroy
          const crack = seg(p, 0, 0.32), dis = seg(p, 0.3, 0.92), a = 1 - E.io(dis), gy = L.y + 15 * u, R = 22 * u;
          K.magicCircle(g, L.x, gy, R * (1 + 0.2 * dis), t * 0.4, pal, 0.7 * (1 - seg(p, 0.2, 0.7)), { sy: 0.34, draw: 1 - seg(p, 0.25, 0.7), noSun: true });
          K.glow(g, L.x, L.y, s * 2.4, pal.a, 0.5 * a + 0.4 * E.bell(seg(p, 0.24, 0.44)));
          g.save(); g.translate(0, -dis * 5 * u); K.lion(g, L.x + (fx.reduced ? 0 : (rnd() - 0.5) * crack * (1 - dis) * 1.6 * u), L.y, s * (1 + 0.1 * dis), a, pal, t, 0); g.restore(); K.add(g);
          for (let i = 0; i < 5; i++) { const r = D.util.rng(i * 11 + 4), an = r() * TAU; K.bolt(g, L.x, L.y, L.x + Math.cos(an) * s * crack, L.y + Math.sin(an) * s * crack, 1.5 * u, r, '#ffffff', 0.3 * u, (1 - seg(p, 0.3, 0.5))); }
          if (fx.hit(0.3)) { fx.cue('shatter'); fx.shake(1.4, 0.3); fx.ps.emit({ x: L.x, y: L.y, n: 40, speed: [20, 90], life: [0.4, 0.9], size: [0.6, 1.4], colors: [pal.a, pal.c, '#ffffff'], type: 'shard', gravity: 30, drag: 1.6 }); }
          K.glow(g, L.x, L.y, s * 1.8, '#ffffff', 0.9 * E.bell(seg(p, 0.24, 0.44)));
          if (dis > 0 && dis < 0.8) fx.ps.emit({ x: L.x, y: L.y, n: 4, jitter: 11, angle: -PI / 2, spread: 0.9, speed: [8, 34], life: [0.6, 1.3], size: [0.4, 1], colors: [pal.a, pal.c, '#ffffff', pal.b], type: 'mote', drag: 0.3 });
          const rq = seg(p, 0.32, 0.8); if (rq > 0 && rq < 1) { K.ring(g, L.x, L.y, s * (0.8 + 2.4 * E.out(rq)), 0.6 * u * (1 - rq), pal.c, 1 - rq); K.ring(g, L.x, gy, R * (1 + 0.8 * E.out(rq)), 0.5 * u * (1 - rq), pal.a, 1 - rq, 0.34); }
        }
      };
    },
  });

  /* ── D07 · Plantilla configurable para habilidades místicas de generales ── */
  const SYMBOLS = {
    sol: (g, s) => { K.sun(g, 0, 0, s, 16, 0, g.fillStyle, g.globalAlpha); },
    luna: (g, s) => { g.beginPath(); g.arc(0, 0, s * 0.8, 0.6, TAU - 0.6); g.arc(s * 0.36, 0, s * 0.62, TAU - 0.95, 0.95, true); g.closePath(); g.fill(); },
    rayo: (g, s) => { g.beginPath(); g.moveTo(s * 0.2, -s); g.lineTo(-s * 0.5, s * 0.1); g.lineTo(-s * 0.05, s * 0.1); g.lineTo(-s * 0.25, s); g.lineTo(s * 0.5, -s * 0.15); g.lineTo(s * 0.05, -s * 0.15); g.closePath(); g.fill(); },
    hoja: (g, s) => { g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.85, -s * 0.2, 0, s); g.quadraticCurveTo(-s * 0.85, -s * 0.2, 0, -s); g.fill(); },
    ala: (g, s) => { for (let i = 0; i < 4; i++) { g.save(); g.rotate(-0.9 + i * 0.42); g.beginPath(); g.moveTo(0, s * 0.3); g.quadraticCurveTo(s * 0.3, -s * 0.3, s * (1 - i * 0.12), -s * 0.5); g.quadraticCurveTo(s * 0.4, 0, 0, s * 0.3); g.fill(); g.restore(); } },
    espada: (g, s) => { g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.16, -s * 0.7); g.lineTo(s * 0.14, s * 0.35); g.lineTo(s * 0.42, s * 0.35); g.lineTo(s * 0.42, s * 0.5); g.lineTo(s * 0.1, s * 0.5); g.lineTo(s * 0.1, s); g.lineTo(-s * 0.1, s); g.lineTo(-s * 0.1, s * 0.5); g.lineTo(-s * 0.42, s * 0.5); g.lineTo(-s * 0.42, s * 0.35); g.lineTo(-s * 0.14, s * 0.35); g.lineTo(-s * 0.16, -s * 0.7); g.closePath(); g.fill(); },
    ojo: (g, s) => { g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.9, s, 0); g.quadraticCurveTo(0, s * 0.9, -s, 0); g.fill(); g.save(); g.shadowBlur = 0; g.fillStyle = '#12061f'; g.beginPath(); g.arc(0, 0, s * 0.3, 0, TAU); g.fill(); g.restore(); },
    gota: (g, s) => { g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.9, s * 0.2, 0, s); g.quadraticCurveTo(-s * 0.9, s * 0.2, 0, -s); g.fill(); },
    estrella: (g, s) => { g.beginPath(); for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU - PI / 2, r = i % 2 ? s * 0.32 : s; i ? g.lineTo(Math.cos(an) * r, Math.sin(an) * r) : g.moveTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill(); },
    corona: (g, s) => { g.beginPath(); g.moveTo(-s * 0.8, s * 0.5); g.lineTo(-s * 0.9, -s * 0.4); g.lineTo(-s * 0.4, 0); g.lineTo(0, -s * 0.7); g.lineTo(s * 0.4, 0); g.lineTo(s * 0.9, -s * 0.4); g.lineTo(s * 0.8, s * 0.5); g.closePath(); g.fill(); },
    torre: (g, s) => { g.beginPath(); g.rect(-s * 0.45, -s * 0.5, s * 0.9, s * 1.4); g.rect(-s * 0.65, -s * 0.9, s * 0.3, s * 0.4); g.rect(-s * 0.15, -s * 0.9, s * 0.3, s * 0.4); g.rect(s * 0.35, -s * 0.9, s * 0.3, s * 0.4); g.fill(); },
  };
  const PTYPE = { chispas: 'spark', brasas: 'ember', motas: 'mote', fragmentos: 'shard', plumas: 'flake', ceniza: 'ash' };
  D.define('D07', {
    name: 'Plantilla de habilidad mística', cat: 'D', dur: 1500, pal: 'orden', anchors: ['from', 'to', 'at'],
    defaults: { palette: null, symbol: 'sol', particles: 'chispas', activation: 'sello', direction: 'self', special: ['rings'], label: '', valueSelf: null, valueTarget: null },
    paramInfo: {
      palette: 'Nombre de paleta, color hex u objeto {a,b,c,core,dark}.', symbol: Object.keys(SYMBOLS).join(' | '), particles: Object.keys(PTYPE).join(' | '),
      activation: "'sello' | 'columna' | 'onda' | 'proyectil' | 'lluvia'", direction: "'self' (sobre el lanzador) | 'target' (hacia el contrario)",
      special: "Lista: 'rings', 'lightning', 'shake', 'flash', 'dim', 'runes'", label: 'Nombre de la habilidad (lo entrega el juego).', valueSelf: 'Texto flotante sobre el lanzador (p. ej. «+2»).', valueTarget: 'Texto flotante sobre el objetivo (p. ej. «−3»).',
    },
    paramOptions: { symbol: Object.keys(SYMBOLS), particles: Object.keys(PTYPE), activation: ['sello', 'columna', 'onda', 'proyectil', 'lluvia'], direction: ['self', 'target'] },
    presets: {
      'Solar · sello': { palette: 'legado', symbol: 'sol', particles: 'motas', activation: 'sello', direction: 'self', special: ['rings', 'runes'] },
      'Tormenta · proyectil': { palette: 'tormenta', symbol: 'rayo', particles: 'chispas', activation: 'proyectil', direction: 'target', special: ['lightning', 'shake', 'flash'] },
      'Selva · lluvia': { palette: 'selva', symbol: 'hoja', particles: 'plumas', activation: 'lluvia', direction: 'target', special: ['rings'] },
      'Sombra · onda': { palette: 'sombra', symbol: 'ojo', particles: 'ceniza', activation: 'onda', direction: 'target', special: ['dim', 'rings', 'runes'] },
      'Celeste · columna': { palette: 'celeste', symbol: 'ala', particles: 'plumas', activation: 'columna', direction: 'self', special: ['rings', 'flash'] },
      'Acero · proyectil': { palette: 'hierro', symbol: 'espada', particles: 'fragmentos', activation: 'proyectil', direction: 'target', special: ['shake', 'rings'] },
    },
    cues: [[0, 'hum'], [0.36, 'whoosh'], [0.62, 'impact']], desc: 'Sistema configurable (paleta, símbolo, partículas, activación, dirección y especiales) para las habilidades de los generales restantes.',
    make(fx) {
      const q = fx.params, rnd = fx.rnd, sp = new Set(q.special || []), ptype = PTYPE[q.particles] || 'spark', sym = SYMBOLS[q.symbol] || SYMBOLS.sol;
      const pal = q.palette ? (typeof q.palette === 'object' ? Object.assign({}, P.orden, q.palette) : q.palette[0] === '#' ? D.util.paletteFrom(q.palette) : P[q.palette] || fx.pal) : fx.pal;
      const cols = [pal.a, pal.c, pal.core], rain = Array.from({ length: 14 }, () => [rnd() * 2 - 1, rnd(), 0.6 + rnd() * 0.6]);
      const symbol = (g, x, y, s, a, rot) => { if (a <= 0 || s < 1) return; g.save(); K.over(g); g.translate(x, y); g.rotate(rot || 0); g.shadowColor = pal.a; g.shadowBlur = s * 0.6; K.alpha(g, a); g.fillStyle = pal.core; sym(g, s); g.restore(); };
      const emit = (x, y, n, o) => fx.ps.emit(Object.assign({ x, y, n, speed: [20, 80], life: [0.4, 0.9], size: ptype === 'shard' || ptype === 'flake' ? [0.6, 1.3] : [0.35, 0.9], colors: cols, type: ptype, drag: 1.5 }, o));
      return (g, p, dt, t) => {
        const u = fx.u, W = fx.W, H = fx.H, A = fx.pt(fx.o.from || fx.side), toTarget = q.direction === 'target', T = fx.o.at ? fx.pt(fx.o.at) : toTarget ? fx.pt(fx.o.to || fx.foe) : A;
        const inv = E.io(seg(p, 0, 0.36)), act = seg(p, 0.36, 0.7), aft = seg(p, 0.62, 1), out = seg(p, 0.86, 1), life = 1 - out, R = 18 * u;
        if (sp.has('dim')) K.dim(g, W, H, 0.5 * E.bell(seg(p, 0, 1)));
        K.add(g);
        // 1 · invocación en el lanzador
        const ia = (toTarget ? 1 - seg(p, 0.5, 0.75) : life);
        K.glow(g, A.x, A.y, R * 1.8, pal.b, 0.5 * inv * ia); K.magicCircle(g, A.x, A.y, R * (0.8 + 0.2 * inv), t, pal, ia, { draw: inv, noSun: true, glyphs: sp.has('runes') ? 20 : 10 });
        if (p < 0.4 && rnd() < 0.8) { const an = rnd() * TAU; emit(A.x + Math.cos(an) * R, A.y + Math.sin(an) * R, 1, { to: toTarget ? null : { x: A.x, y: A.y }, angle: an + PI / 2, spread: 0.4, speed: [8, 24], life: [0.3, 0.6] }); }
        if (sp.has('lightning') && p > 0.1 && p < 0.7) { const br = D.util.rng(((t * 22) | 0) + 3); for (let i = 0; i < 3; i++) { const an = br() * TAU; K.bolt(g, A.x, A.y, A.x + Math.cos(an) * R * 1.3, A.y + Math.sin(an) * R * 1.3, 1.6 * u, br, pal.a, 0.3 * u, 0.9 * ia); } }
        const symScale = E.back(seg(p, 0.14, 0.36));
        // 2 · activación
        let sx = A.x, sy2 = A.y, sa = ia;
        if (q.activation === 'proyectil' && toTarget) {
          const k = E.in(act); sx = lerp(A.x, T.x, k); sy2 = lerp(A.y, T.y, k); sa = 1 - seg(p, 0.62, 0.7);
          if (act > 0 && act < 1) { const k2 = clamp(k - 0.25); g.lineCap = 'round'; g.beginPath(); g.moveTo(lerp(A.x, T.x, k2), lerp(A.y, T.y, k2)); g.lineTo(sx, sy2); g.strokeStyle = pal.a; g.lineWidth = 4 * u; K.alpha(g, 0.6); g.stroke(); g.strokeStyle = pal.core; g.lineWidth = 1.2 * u; K.alpha(g, 1); g.stroke(); K.glow(g, sx, sy2, 10 * u, pal.a, 0.9); emit(sx, sy2, 2, { speed: [6, 30], life: [0.25, 0.5] }); }
        } else if (q.activation === 'columna') {
          const w = R * (0.25 + 0.6 * E.bell(act)), h = H * E.out(seg(act, 0, 0.5)), lg = g.createLinearGradient(T.x - w, 0, T.x + w, 0); lg.addColorStop(0, rgba(pal.a, 0)); lg.addColorStop(0.5, rgba(pal.core, 0.9)); lg.addColorStop(1, rgba(pal.a, 0));
          if (act > 0) { g.fillStyle = lg; K.alpha(g, E.bell(seg(p, 0.36, 0.95))); g.fillRect(T.x - w, T.y + R * 0.3 - h, w * 2, h); if (rnd() < 0.9) emit(T.x + (rnd() - 0.5) * w * 2, T.y, 2, { angle: -PI / 2, spread: 0.3, speed: [30, 90], drag: 0.4 }); }
        } else if (q.activation === 'onda') {
          for (let i = 0; i < 4; i++) { const wq = seg(p, 0.36 + i * 0.08, 0.74 + i * 0.08); if (wq > 0 && wq < 1) { const cxw = toTarget ? lerp(A.x, T.x, E.out(wq)) : A.x, cyw = toTarget ? lerp(A.y, T.y, E.out(wq)) : A.y; K.ring(g, cxw, cyw, R * (0.5 + (toTarget ? 0.9 : 2.2) * E.out(wq)), 0.9 * u * (1 - wq), i % 2 ? pal.c : pal.a, 1 - wq); } }
        } else if (q.activation === 'lluvia') {
          rain.forEach(([ox, ph, len]) => { const rq = seg(p, 0.36 + ph * 0.2, 0.62 + ph * 0.2); if (rq <= 0 || rq >= 1) return; const x = T.x + ox * R * 1.4, y1 = lerp(T.y - H * 0.6, T.y + (ph - 0.5) * R, E.in(rq)); g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 2 * u, y1 - len * 10 * u); g.lineTo(x, y1); g.strokeStyle = pal.a; g.lineWidth = 1.6 * u; K.alpha(g, 0.6); g.stroke(); g.strokeStyle = pal.core; g.lineWidth = 0.5 * u; K.alpha(g, 1); g.stroke(); if (rq > 0.9 && rnd() < 0.5) emit(x, y1, 2, { angle: -PI / 2, spread: 2, speed: [10, 40], life: [0.25, 0.5] }); });
        }
        // 3 · resolución en el objetivo
        if (fx.hit(0.62)) { if (sp.has('shake')) { fx.shake(1.8, 0.35); if (T.el) fx.shakeEl(T.el, 7, 300); } emit(T.x, T.y, 50, { speed: [24, 120], life: [0.4, 0.95] }); }
        if (aft > 0 && aft < 1) {
          const f = 1 - aft, e = E.out5(aft);
          K.glow(g, T.x, T.y, R * (1 + 1.6 * e), pal.a, 0.65 * f); K.glow(g, T.x, T.y, R * (0.5 + 0.6 * e), pal.core, f * f);
          K.burst(g, T.x, T.y, 3 * u, R * (0.9 + 1.4 * e), 14, 0.3, pal.core, f * f * 0.9, 0.045, D.util.rng(6));
          if (sp.has('rings')) for (let i = 0; i < 3; i++) { const rq = seg(aft, i * 0.12, 0.6 + i * 0.12); if (rq > 0 && rq < 1) K.ring(g, T.x, T.y, R * (0.4 + (1.6 + i * 0.4) * E.out(rq)), 0.7 * u * (1 - rq), i % 2 ? pal.c : pal.a, 1 - rq); }
          if (sp.has('lightning')) { const br = D.util.rng(((t * 22) | 0) + 8); for (let i = 0; i < 4; i++) { const an = br() * TAU; K.bolt(g, T.x, T.y, T.x + Math.cos(an) * R * 1.6 * e, T.y + Math.sin(an) * R * 1.6 * e, 1.8 * u, br, pal.a, 0.35 * u, f); } }
          if (toTarget && q.activation !== 'proyectil') symbol(g, T.x, T.y, 7 * u * E.back(seg(aft, 0, 0.3)), f, 0);
        }
        if (sp.has('flash')) K.flash(g, W, H, 0.3 * E.bell(seg(p, 0.6, 0.72)), pal.core);
        fx.ps.draw(g);
        symbol(g, sx, sy2, 7.5 * u * symScale * (1 + 0.06 * Math.sin(t * 6)), sa * seg(p, 0.14, 0.24), q.activation === 'proyectil' && toTarget ? Math.atan2(T.y - A.y, T.x - A.x) + PI / 2 : 0);
        if (q.label) { const tq = seg(p, 0.2, 0.34) * life; K.text(g, q.label, W / 2, Math.min(H - 6 * u, Math.max(A.y, T.y) + R * 1.5), K.fit(g, q.label, 5.6 * u, W * 0.9, { ls: 0.1 }), { fill: D.GOLD_GRAD, stroke: pal.dark, sw: 0.16, ls: 0.1, a: tq, glow: pal.a }); }
        if (num(q.valueSelf) != null) K.floatText(g, q.valueSelf, A.x, A.y - 6 * u, 9 * u, seg(p, 0.5, 1), pal.c);
        if (num(q.valueTarget) != null) K.floatText(g, q.valueTarget, T.x, T.y - 6 * u, 10 * u, seg(p, 0.62, 1), pal.a);
      };
    },
  });
  D.symbols = SYMBOLS;
})(window.DecretoFX);
