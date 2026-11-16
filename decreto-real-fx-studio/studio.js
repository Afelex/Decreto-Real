/*! Decreto Real FX Studio G3 — studio.js · lógica de la galería (no forma parte del motor). */
(function () {
  'use strict';
  const D = window.DecretoFX, $ = id => document.getElementById(id);
  const stage = $('stage'), frame = $('stageFrame');
  const MAN = D.manifest(), byId = Object.fromEntries(MAN.map(m => [m.id, m]));
  const ASSETS = ['assets/logo.png', 'assets/escenario.webp', 'assets/jugador.webp', 'assets/rival.webp', 'assets/mazo.webp', 'assets/carta-ataque.webp', 'assets/carta-defensa.webp', 'assets/carta-impacto.webp', 'assets/carta-orden.webp'];
  /* Valores de muestra solo para la vista previa (en el juego los entrega el motor de combate). */
  const SAMPLE = { A04: { amount: 3 }, B01: { amount: 3 }, B02: { amount: 3 }, A11: { label: 'HABILIDAD MÍSTICA' }, D04: { label: 'SELLO DE MANDO' }, C06: { subtitle: 'EL DECRETO SE HA CUMPLIDO' }, C07: { subtitle: 'EL DECRETO HA SIDO REVOCADO' }, B07: { subtitle: 'AMBOS MAZOS SE HAN AGOTADO' } };
  const HIDDEN = { C08: ['assets', 'logo', 'progress'] };
  const PALS = ['carmesi', 'azul', 'defensa', 'orden', 'vida', 'oro', 'impacto', 'hierro', 'sangre', 'azogue', 'legado', 'ceniza', 'tormenta', 'selva', 'sombra', 'celeste'];
  const ui = { id: 'A01', loop: false, bg: 'oscuro', handle: null, duel: null, tags: null, loopTimer: 0, ran: {}, per: {} };
  const hp = { player: 20, rival: 20 };

  /* ── Catálogo ── */
  function buildCatalog() {
    const root = $('catalog'); root.textContent = '';
    Object.entries(D.categories).forEach(([k, title]) => {
      const items = MAN.filter(m => m.category === k), sec = document.createElement('section'); sec.className = 'cat';
      sec.innerHTML = `<div class="cat__title"><b><i>${k}</i></b>${title}<em>${items.filter(m => m.status === 'completo').length}/${items.length}</em></div>`;
      const list = document.createElement('div'); list.className = 'cat__list';
      items.forEach(m => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'item'; b.dataset.id = m.id; b.title = m.description;
        b.innerHTML = `<span class="item__id">${m.id}</span><span class="item__name"></span><span class="dot" data-s="${m.status}" title="Estado: ${m.status}"></span>`;
        b.querySelector('.item__name').textContent = m.name;
        b.addEventListener('click', () => { select(m.id); play(); });
        list.appendChild(b);
      });
      sec.appendChild(list); root.appendChild(sec);
    });
    const done = MAN.filter(m => m.status === 'completo').length;
    $('mDone').textContent = `${done}/${MAN.length}`; $('catHint').textContent = `${MAN.length} efectos`;
  }
  function markRan(id, state) { ui.ran[id] = state; const d = document.querySelector(`.item[data-id="${id}"] .dot`); if (d) { d.dataset.ran = state; d.title = state === 'err' ? 'Error en ejecución' : 'Completo · reproducido sin errores en esta sesión'; } }

  /* ── Estado por efecto ── */
  function per(id) {
    if (!ui.per[id]) { const m = byId[id]; ui.per[id] = { params: Object.assign({}, JSON.parse(JSON.stringify(m.defaults)), SAMPLE[id]), dur: m.durationMs }; }
    return ui.per[id];
  }
  function select(id) {
    if (!byId[id]) return; ui.id = id; const m = byId[id], st = per(id);
    document.querySelectorAll('.item').forEach(b => b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false'));
    $('fxId').textContent = id; $('fxName').textContent = m.name; $('fxDesc').textContent = m.description;
    const chip = $('fxStatus'); chip.textContent = m.status; chip.dataset.s = m.status;
    const dur = $('cDur'); dur.disabled = m.persistent; dur.value = st.dur || 1000; $('cHold').disabled = !m.holdable; if (!m.holdable) $('cHold').checked = false;
    buildParams(); syncOutputs();
    try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch (e) { /* sin historial */ }
  }
  function coerce(v, def) {
    if (typeof def === 'number') { const n = parseFloat(v); return isNaN(n) ? def : n; }
    if (def !== null && typeof def === 'object') { try { return JSON.parse(v); } catch (e) { return def; } }
    if (def === null) { if (v === '') return null; return /^-?\d+(\.\d+)?$/.test(v) ? parseFloat(v) : v; }
    return v;
  }
  function buildParams() {
    const m = byId[ui.id], st = per(ui.id), root = $('params'), hidden = HIDDEN[ui.id] || []; root.textContent = '';
    if (m.presets) {
      const f = document.createElement('div'); f.className = 'field'; f.innerHTML = '<label for="p_preset">Preajuste visual</label>';
      const s = document.createElement('select'); s.id = 'p_preset'; s.innerHTML = '<option value="">—</option>' + Object.keys(m.presets).map(k => `<option>${k}</option>`).join('');
      s.addEventListener('change', () => { if (m.presets[s.value]) { Object.assign(st.params, JSON.parse(JSON.stringify(m.presets[s.value]))); buildParams(); syncOutputs(); play(); } });
      f.appendChild(s); root.appendChild(f);
    }
    const keys = Object.keys(m.defaults).filter(k => !hidden.includes(k));
    if (!keys.length && !m.presets) { root.innerHTML = '<p class="none">Este efecto no necesita parámetros.</p>'; }
    keys.forEach(k => {
      const def = m.defaults[k], f = document.createElement('div'); f.className = 'field';
      const lab = document.createElement('label'); lab.htmlFor = 'p_' + k; lab.textContent = k; f.appendChild(lab);
      let inp; const opts = m.options[k];
      if (opts) { inp = document.createElement('select'); opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o === '' ? '(ninguno)' : o; inp.appendChild(op); }); inp.value = st.params[k] == null ? '' : st.params[k]; }
      else { inp = document.createElement('input'); inp.type = typeof def === 'number' ? 'number' : 'text'; const v = st.params[k]; inp.value = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v; if (def === null) inp.placeholder = 'sin valor'; }
      inp.id = 'p_' + k;
      inp.addEventListener('change', () => { let v = coerce(inp.value, def); if (opts && def === null && v === '') v = null; st.params[k] = v; syncOutputs(); if (ui.handle && ui.handle.alive && ui.handle.def.manual && ui.handle.id === ui.id) ui.handle.update({ [k]: v }); else play(); });
      f.appendChild(inp);
      if (m.params[k]) { const i = document.createElement('span'); i.className = 'pinfo'; i.textContent = m.params[k]; f.appendChild(i); }
      root.appendChild(f);
    });
    if (ui.id === 'C08') { const i = document.createElement('p'); i.className = 'pinfo'; i.textContent = `La galería precarga de verdad ${ASSETS.length} recursos de assets/ (sin caché) y la barra avanza con cada archivo recibido.`; root.appendChild(i); }
  }

  /* ── Opciones y reproducción ── */
  function options() {
    const m = byId[ui.id], st = per(ui.id), o = { container: stage, side: $('cSide').value };
    const speed = parseFloat($('cSpeed').value), inten = parseFloat($('cInt').value), scale = parseFloat($('cScale').value);
    if (speed !== 1) o.speed = speed; if (inten !== 1) o.intensity = inten; if (scale !== 1) o.scale = scale;
    if (!m.persistent && st.dur !== m.durationMs) o.duration = st.dur;
    if ($('cUseColor').checked) o.color = $('cColor').value; else if ($('cPal').value) o.palette = $('cPal').value;
    if ($('cHold').checked && m.holdable) o.hold = true;
    const params = {}; Object.keys(st.params).forEach(k => { if (JSON.stringify(st.params[k]) !== JSON.stringify(m.defaults[k])) params[k] = st.params[k]; });
    if (ui.id === 'C08') { params.assets = ASSETS.map(a => a + '?t=' + Date.now()); params.logo = 'assets/logo.png'; }
    if (Object.keys(params).length) o.params = params;
    return o;
  }
  function syncOutputs() {
    const m = byId[ui.id], st = per(ui.id);
    $('oDur').textContent = m.persistent ? 'persistente' : st.dur + ' ms'; $('oSpeed').textContent = '×' + parseFloat($('cSpeed').value).toFixed(2);
    $('oInt').textContent = Math.round($('cInt').value * 100) + ' %'; $('oScale').textContent = '×' + parseFloat($('cScale').value).toFixed(2);
    const o = options(); delete o.container; if (o.params && o.params.assets) o.params.assets = `[…${ASSETS.length} URL]`;
    const body = JSON.stringify(o, null, 2).replace(/"([a-zA-Z_]\w*)":/g, '$1:').replace(/^\{/, '{\n  container: campo,').replace(/,\n\}$/, '\n}');
    $('code').textContent = `const fx = DecretoFX.playFX('${ui.id}', ${body});\nfx.on('cue', e => sonidos[e.cue]?.play());\nawait fx; // { id, completed }`;
  }
  function log(html, cls) {
    const el = $('log'), e = el.querySelector('.log__empty'); if (e) e.remove();
    const row = document.createElement('div'); if (cls) row.className = cls; row.innerHTML = html; el.appendChild(row);
    while (el.childElementCount > 80) el.firstElementChild.remove(); el.scrollTop = el.scrollHeight;
  }
  function stopAll() {
    clearTimeout(ui.loopTimer); if (ui.duel) { ui.duel.stop(); ui.duel = null; }
    D.stopAll(stage); ui.handle = null; ui.tags = null;
  }
  function play() {
    stopAll(); D.audio.unlock();
    let h; try { h = D.playFX(ui.id, options()); } catch (e) { log(`<span class="err">${ui.id} · ${e.message}</span>`); markRan(ui.id, 'err'); return; }
    ui.handle = h; const t0 = performance.now(), id = ui.id;
    h.on('cue', e => log(`<b>${id}</b> · cue <b>${e.cue}</b> @ ${Math.round(performance.now() - t0)} ms`));
    if (id === 'C08') h.on('progress', e => { if (e.detail && e.detail.url) log(`<b>C08</b> · recurso ${e.detail.done}/${e.detail.total} ${e.detail.ok ? 'recibido' : '<span class="err">falló</span>'}`); });
    h.then(r => {
      if (r.error) { markRan(id, 'err'); log(`<span class="err">${id} · error: ${r.error.message}</span>`); return; }
      if (r.completed) { markRan(id, '1'); log(`<span class="ok">${id} · completado en ${Math.round(performance.now() - t0)} ms</span>`); if (ui.loop && ui.handle === h) ui.loopTimer = setTimeout(play, 380); }
    });
  }

  /* ── Fondo, formato y anclas ── */
  function setBg(bg) {
    ui.bg = bg; stage.dataset.bg = bg;
    document.querySelectorAll('#segBg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bg === bg)));
    D.setAnchors(stage, bg === 'combate' ? { player: $('pPlayer'), rival: $('pRival'), deck: $('deckPlayer'), rivalDeck: $('deckRival'), hand: $('handPlayer'), rivalHand: $('handRival'), playerBar: $('barPlayer'), rivalBar: $('barRival'), seal: $('sealAnchor'), summon: $('sealAnchor') } : {});
  }
  function setHp(who, v) {
    hp[who] = Math.max(0, Math.min(20, v)); const k = hp[who] / 20, bar = $(who === 'player' ? 'barPlayer' : 'barRival').firstElementChild;
    bar.style.width = k * 100 + '%'; const c = D.util.hpColor(k); bar.style.background = `linear-gradient(180deg, ${D.util.mix(c, '#ffffff', 0.45)}, ${c} 50%, ${D.util.mix(c, '#000000', 0.35)})`;
    $(who === 'player' ? 'hpPlayer' : 'hpRival').textContent = `${hp[who]} / 20`;
  }

  /* ── Simulación de duelo: secuencia controlada con DecretoFX.sequence ── */
  function duel() {
    stopAll(); D.audio.unlock(); setBg('combate'); setHp('player', 20); setHp('rival', 20);
    const S = (id, options, extra) => Object.assign({ id, options }, extra), dmg = (who, amount, to) => [S(who === 'rival' ? 'B02' : 'B01', { params: { amount } }), () => setHp(who, to)];
    log('<b>Duelo de prueba</b> · secuencia iniciada');
    const off = D.on('cue', e => { if (ui.duel) log(`<b>${e.id}</b> · cue <b>${e.cue}</b>`); });
    ui.duel = D.sequence([
      S('C05'),
      S('C01', { params: { result: 'player' } }),
      S('C02'),
      () => { ui.tags = D.playFX('C04', { container: stage, params: { active: 'player', player: { edge: 'left', bottom: '47%' }, rival: { edge: 'right', top: '42%' } } }); },
      S('A10'),
      S('A01', { side: 'player' }, { until: 'impact' }), dmg('rival', 3, 17),
      S('A09', { at: 'center' }),
      S('D02', { side: 'player' }, { until: 'impact' }), [S('B02', { params: { amount: 3 } }), () => { setHp('rival', 14); setHp('player', 19); }],
      S('B05', { params: { kind: 'damage' } }),
      S('C03'), () => ui.tags && ui.tags.update({ active: 'rival' }),
      S('A10', { side: 'rival' }),
      [S('A03', { side: 'player' }), S('A02', { side: 'rival' }, { delay: 420, until: 'impact' })],
      S('A12', { side: 'rival', params: { attack: 'azul', defense: 'defensa', winner: 'defense' } }), dmg('player', 1, 18),
      S('A07', { side: 'rival' }, { until: 'impact' }), [S('B01', { params: { amount: 14 } }), S('B04', { side: 'player', params: { from: 18, to: 4 } }), () => setHp('player', 4)],
      S('C02'), () => ui.tags && ui.tags.update({ active: 'player' }),
      [S('A04', { side: 'player', params: { amount: 3 } }), S('B03', { side: 'player', params: { from: 4, to: 7 } }, { delay: 250 }), () => setHp('player', 7)],
      S('D05', { at: 'summon' }),
      S('D06', { from: 'summon', side: 'player', params: { mode: 'attack', amount: 2 } }, { until: 'impact' }), dmg('rival', 2, 12),
      S('B06', { params: { kind: 'damage' } }),
      S('A08', { side: 'player' }, { until: 'boom' }), dmg('rival', 12, 0),
      () => { if (ui.tags) ui.tags.stop(); },
      S('C06', { params: { subtitle: 'EL DECRETO SE HA CUMPLIDO' } }),
    ], { container: stage, speed: parseFloat($('cSpeed').value), intensity: parseFloat($('cInt').value) });
    const d = ui.duel; d.then(r => { off(); if (ui.duel === d) { ui.duel = null; if (ui.tags) { ui.tags.stop(); ui.tags = null; } log(r.completed ? '<span class="ok">Duelo de prueba · secuencia completada</span>' : 'Duelo de prueba · detenido'); } });
  }

  /* ── Medidor de FPS (propio, siempre activo) ── */
  let fLast = performance.now(), fAcc = 0, fN = 0;
  function meter(now) {
    fAcc += now - fLast; fLast = now; fN++;
    if (fAcc >= 500) { $('mFps').textContent = Math.round((fN * 1000) / fAcc); fAcc = 0; fN = 0; $('mAct').textContent = D.stats.active; $('mPar').textContent = D.stats.particles; $('mTier').textContent = ['alta', 'media', 'baja'][D.stats.tier] || 'alta'; }
    requestAnimationFrame(meter);
  }

  /* ── Enlaces de interfaz ── */
  function bind() {
    $('btnPlay').addEventListener('click', play);
    $('btnStop').addEventListener('click', () => { stopAll(); log('Detenido · escenario limpio'); });
    $('btnLoop').addEventListener('click', e => { ui.loop = !ui.loop; e.currentTarget.setAttribute('aria-pressed', String(ui.loop)); if (ui.loop && !(ui.handle && ui.handle.alive)) play(); });
    $('btnDuel').addEventListener('click', duel);
    $('segBg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setBg(b.dataset.bg); });
    $('segAspect').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; frame.dataset.aspect = b.dataset.aspect; document.querySelectorAll('#segAspect button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $('cDur').addEventListener('input', e => { per(ui.id).dur = parseInt(e.target.value, 10); syncOutputs(); });
    ['cSpeed', 'cInt', 'cScale'].forEach(id => $(id).addEventListener('input', syncOutputs));
    ['cDur', 'cSpeed', 'cInt', 'cScale', 'cPal', 'cSide', 'cUseColor', 'cColor', 'cHold'].forEach(id => $(id).addEventListener('change', () => { syncOutputs(); play(); }));
    $('cSound').addEventListener('change', e => { D.audio.enabled = e.target.checked; if (e.target.checked) D.audio.unlock(); });
    $('cMotion').addEventListener('change', e => { D.config.reducedMotion = e.target.value === 'auto' ? 'auto' : e.target.value === 'true'; play(); });
    $('cQuality').addEventListener('change', e => { D.setQuality(e.target.value); });
    $('btnReset').addEventListener('click', () => { delete ui.per[ui.id]; $('cSpeed').value = 1; $('cInt').value = 1; $('cScale').value = 1; $('cPal').value = ''; $('cUseColor').checked = false; $('cHold').checked = false; select(ui.id); play(); });
    $('btnCopy').addEventListener('click', e => { const t = $('code').textContent, b = e.currentTarget, ok = () => { b.textContent = 'Copiado'; setTimeout(() => { b.textContent = 'Copiar'; }, 1200); }; const fb = () => { const r = document.createRange(); r.selectNodeContents($('code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb(); });
    document.addEventListener('keydown', e => {
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      const i = MAN.findIndex(m => m.id === ui.id);
      if (e.key === 'Escape') stopAll();
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); play(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select(MAN[(i + 1) % MAN.length].id); play(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select(MAN[(i - 1 + MAN.length) % MAN.length].id); play(); }
    });
    window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (byId[id] && id !== ui.id) { select(id); play(); } });
    D.on('error', e => { markRan(e.id, 'err'); log(`<span class="err">${e.id} · ${e.error && e.error.message}</span>`); });
    D.on('end', e => { if (!e.error && e.completed) markRan(e.id, '1'); });
    D.on('quality', e => log(`Calidad adaptativa → nivel ${['alta', 'media', 'baja'][e.tier]}`));
  }

  function boot() {
    const sel = $('cPal'); sel.innerHTML = '<option value="">Por defecto del efecto</option>' + PALS.map(p => `<option value="${p}">${p[0].toUpperCase() + p.slice(1)}</option>`).join('');
    buildCatalog(); bind(); setBg('oscuro');
    const start = byId[location.hash.slice(1)] ? location.hash.slice(1) : 'A01';
    select(start); requestAnimationFrame(meter);
    // La propia galería arranca con C08 y una precarga real de sus recursos; después reproduce el efecto elegido.
    const boot = D.playFX('C08', { container: stage, params: { assets: ASSETS, logo: 'assets/logo.png', loadingText: 'Cargando recursos del estudio' } });
    ui.handle = boot; boot.then(r => { if (r.completed) { markRan('C08', '1'); if (ui.handle === boot) play(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
