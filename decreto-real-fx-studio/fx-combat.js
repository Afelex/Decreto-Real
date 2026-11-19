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
