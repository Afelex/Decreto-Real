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
