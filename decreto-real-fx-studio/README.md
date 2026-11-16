# Decreto Real FX Studio G3

Biblioteca de 34 efectos visuales programados (Canvas 2D + SVG/CSS/JS), con fondo transparente real, sin dependencias ni servidores. Los efectos son solo representación: no leen ni cambian el estado del juego.

## Probar

Abre `index.html` (doble clic o cualquier servidor estático). La galería arranca con C08 precargando sus propios recursos.
Atajos: Espacio reproduce, Esc detiene, flechas cambian de efecto.

## Integrar

```html
<script src="fx-core.js"></script>
<script src="fx-combat.js"></script>
<script src="fx-health-combos.js"></script>
<script src="fx-ui.js"></script>
<script src="fx-mystic.js"></script>
```

```js
const campo = document.querySelector('#campo');
// Anclas: nombres → elementos reales del tablero (o {x, y} de 0 a 1)
DecretoFX.setAnchors(campo, { player: retratoJugador, rival: retratoRival, deck: mazo, hand: mano,
                              playerBar: barraJugador, rivalBar: barraRival, summon: zonaInvocacion, seal: sello });

const fx = DecretoFX.playFX('A01', { container: campo, side: 'player' });
fx.on('cue', e => sonidos[e.cue]?.play());   // sincronía de audio
await fx;                                     // { id, completed }
fx.stop();                                    // cancelar
DecretoFX.stopAll(campo);                     // detener todo
DecretoFX.clear(campo);                       // quitar lienzo y capas del DOM
```

Opciones de `playFX`: `container, faction, palette, color, side, at, from, to, anchors, target, scale, duration, speed, intensity, params, hold, layer, silent, shake, seed, signal, onComplete`. El detalle de cada efecto (parámetros, cues, anclas) está en `fx-manifest.json`.

- **Secuencias:** `DecretoFX.sequence([{ id, options, delay, wait, until:'impact' }, [paralelos], 300, () => actualizarUI()])` devuelve `{ finished, stop() }`.
- **Capas exclusivas:** las transiciones usan `layer:'screen'`; una nueva reemplaza a la anterior.
- **Persistentes:** `C04` vive hasta `stop()`; cambia con `fx.update({ active:'rival' })`. Con `hold:true`, C01, C06, C07, B04, B07, D04 y D05 quedan en pantalla hasta `fx.release()`.
- **Audio existente:** `DecretoFX.audio.enabled = true; DecretoFX.audio.bind('impact', 'audio/impacto.mp3')` o `bind('A01:impact', fn)`. Sin enlace se usa un sintetizador mínimo (`audio.synth = false` lo apaga).
- **Carga real (C08):** `playFX('C08', { params: { assets: [...urls], logo } })` precarga esos archivos y solo termina al completarse. Alternativa: `fx.update({ progress })` con tu propio progreso real.
- **C05:** cambia de pantalla al recibir el cue `covered` (puertas cerradas).
- **Rendimiento:** calidad adaptativa (`DecretoFX.setQuality('auto'|'high'|'medium'|'low')`), DPR limitado y `prefers-reduced-motion` respetado (`config.reducedMotion`). El lienzo usa `pointer-events:none`.
- **Valores de juego:** daño, PV y textos llegan por `params`; los valores por defecto de D01–D06 son los indicados en el encargo.

## Archivos

`fx-core.js` motor · `fx-combat.js` A01–A12 · `fx-health-combos.js` B01–B07 · `fx-ui.js` C01–C08 · `fx-mystic.js` D01–D07 · `studio.js`, `index.html`, `styles.css` galería · `fx-manifest.json` (se regenera con `node build-manifest.cjs`) · `assets/` copias de recursos oficiales usadas solo por la galería.

## Estado

34/34 implementados. D07 es una plantilla: sus preajustes son visuales y no llevan nombres ni mecánicas de habilidades.
