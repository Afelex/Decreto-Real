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
