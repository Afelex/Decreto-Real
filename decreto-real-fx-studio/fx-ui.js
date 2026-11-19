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
