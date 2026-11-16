#!/usr/bin/env node
/* Regenera fx-manifest.json a partir de las definiciones registradas en el motor: node build-manifest.cjs */
const fs = require('fs'), path = require('path'), vm = require('vm');
const noop = () => {}, ctx2d = new Proxy({}, { get: () => noop });
const win = { document: { createElement: () => ({ getContext: () => ctx2d, style: {} }), getElementById: () => null, head: { appendChild: noop } }, matchMedia: () => ({ matches: false }), addEventListener: noop, performance: { now: () => 0 } };
win.window = win; vm.createContext(win);
['fx-core.js', 'fx-combat.js', 'fx-health-combos.js', 'fx-ui.js', 'fx-mystic.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), win, { filename: f }));
const D = win.DecretoFX, effects = D.manifest();
const out = {
  name: 'Decreto Real FX Studio G3', version: D.version, api: "DecretoFX.playFX(effectId, options)",
  files: ['index.html', 'styles.css', 'studio.js', 'fx-core.js', 'fx-combat.js', 'fx-health-combos.js', 'fx-ui.js', 'fx-mystic.js', 'fx-manifest.json', 'README.md'],
  options: { container: 'Elemento anfitrión (por defecto document.body, a pantalla completa).', faction: "'carmesi' | 'azul' (efectos con usesFaction).", palette: 'Nombre de paleta u objeto {a,b,c,core,dark}.', color: 'Color hex del que se deriva una paleta.', side: "'player' | 'rival': quién actúa.", 'at / from / to': "Ancla: nombre, {x,y} normalizado (0..1) o Element.", anchors: 'Mapa de anclas solo para esta llamada.', target: 'Elemento a sacudir (B01/B02).', scale: 'Escala (1).', duration: 'Duración en ms.', speed: 'Multiplicador de velocidad (1).', intensity: 'Densidad de partículas 0..2 (1).', params: 'Parámetros propios del efecto.', hold: 'Mantener en pantalla hasta release() (efectos holdable).', layer: 'Capa exclusiva: un efecto nuevo reemplaza al anterior de la misma capa.', silent: 'No dispara audio enlazado.', shake: 'false desactiva sacudidas.', seed: 'Semilla determinista.', signal: 'AbortSignal para cancelar.', onComplete: 'Callback ({id, completed}).' },
  palettes: Object.keys(D.palettes), categories: D.categories,
  summary: { total: effects.length, completo: effects.filter(e => e.status === 'completo').length },
  effects,
};
fs.writeFileSync(path.join(__dirname, 'fx-manifest.json'), JSON.stringify(out, null, 2) + '\n');
console.log('fx-manifest.json:', out.summary);
