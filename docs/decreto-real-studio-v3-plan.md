# Decreto Real Studio — Auditoría v2 y plan para DRStudio v3

## Context
Studio v2 (commit `2885c06`) permite editar en QA las 49 intervenciones del prólogo sobre el renderer real (`CampaignOpening`): mover/escalar actores, reemplazar sprites, añadir capas/efectos, cambiar fondos, editar globos y exportar un paquete con multimedia. Se pidió auditar v2 (arquitectura y usabilidad) y proponer un plan para v3 **sin tocar código todavía**. Este documento no modifica código: es la base para aprobar el desarrollo de v3.

Archivos auditados: `campaign/studioLayout.ts` (178 l.), `campaign/studioMedia.ts` (108), `screens/DecretoRealStudioPanel.tsx` (170), `screens/CampaignOpening.tsx` (741, ~400 son de Studio), `screens/decreto-real-studio.css` (190), `App.tsx`, `campaign/campaignQA.ts`, `tests/e2e/studio.spec.ts`, `campaign/studioLayout.test.ts`, `docs/decreto-real-studio-v1/v2.md`.

---

## Parte A — Auditoría de Studio v2

### A1. Arquitectura (por gravedad)

**Críticos**
1. **Claves de escena por posición** (`studioSceneKey('opening'|'after', índice)`, `studioLayout.ts:53`). Insertar, borrar o reordenar un diálogo en `OPENING_BEATS`/`AFTER_DUEL_BEATS` traslada en silencio todas las ediciones a la intervención equivocada. No hay ID estable por diálogo.
2. **Unidades dependientes del viewport.** Las transformaciones se guardan en `vw`/`vh` (`CampaignOpening.tsx:347`, arrastre en `:389`), pero el escenario mide `width:min(100%,540px)` (`campaign-opening.css:6`). Un ajuste hecho en móvil se desplaza en escritorio o en horizontal (x=10 → 39 px en un móvil de 390 px y 144 px en un monitor de 1440 px). La composición no es portable.
3. **El control «Capa» engaña.** `.dcop-scene-figures` crea su propio contexto de apilamiento (`z-index:3`, `campaign-opening.css:41`). Las capas de los actores (1–30) solo los ordenan entre sí, y las capas añadidas compiten contra el grupo entero. Por eso un efecto no se puede colocar entre Xervias y Domingo.
4. **El editor está incrustado en el renderer del juego.** El estado, los handlers, el arrastre, la exportación y la importación viven dentro de `CampaignOpening.tsx`, junto con los datos de la historia, la elección de arte (v1/v2/v3) y una lógica de reparto con números mágicos (`beat===15`, `after===9`, `after===13`…). El panel recibe 35 props. Así no se puede reutilizar en `CampaignAfterVictory`, `CampaignRegionMoment`, `CampaignStory` ni en los créditos, y cada cambio de Studio pone en riesgo el prólogo jugable.
5. **Navegar entre intervenciones remonta toda la pantalla.** `App.tsx:50` usa `key={location.key}` y Studio navega con `navigate('?studio=1&studioStep=n')`. Cada cambio de intervención borra el historial de deshacer, vuelve a pedir los 3 manifiestos y recarga desde IndexedDB todas las URL multimedia, lo que hace parpadear las imágenes y reinicia los vídeos.
6. **Sin camino de publicación.** Los borradores viven en `localStorage` e IndexedDB. Para llevar un ajuste al juego público hay que pasarlo a mano al código. Es el mayor hueco de producto.

**Importantes**
7. **Versionado incoherente.** El esquema v2 sigue declarando `version:1`, con la clave `...borradores.v1`, la base `...media-v1` y el paquete `studioPackage:2`. Un documento v2 importado en un cliente v1 pierde datos sin aviso, y no existe un marco de migraciones.
8. **Multimedia sin integridad referencial.** Cada reemplazo crea otro blob y nada se recoge nunca: deshacer, quitar una capa o restaurar dejan huérfanos en IndexedDB. `assets` crece sin límite y la exportación incluye recursos que nadie usa, por lo que se agota antes el tope de 70 MB. `parseStudioDocument` tampoco verifica que los `assetId` referenciados existan.
9. **Deshacer frágil.** `pushStudioHistory` toma `studioDoc` del closure del render. En los flujos asíncronos (`studioReplace`, `studioAdd`) el snapshot llega desfasado respecto a `withStudioAsset`. Además, un simple toque para seleccionar crea una entrada de deshacer (`startStudioDrag`), y cada pulsación de tecla en X/Y/texto crea otra. El tope de 25 entradas se agota enseguida.
10. **Rendimiento en el arrastre.** Cada `pointermove` hace `setStudioDoc`, que vuelve a renderizar toda la pantalla y ejecuta `JSON.stringify(doc)` para calcular si hay cambios sin guardar (`:328`). `readStudioDocument()` se ejecuta dos veces al montar (`:183-184`).
11. **Normalización con un actor ficticio.** Las capas añadidas y el globo se normalizan como `'Madre'` (`studioLayout.ts:86,116,158`). Las capas por defecto no coinciden: globo 7 en la UI frente a 4 al normalizar, y restaurar un efecto lo deja en capa 8 aunque se creó en 9.
12. **Guerra de especificidad CSS.** Studio necesita `!important` para ganar a `transform:none!important` de `prologue-v2.css`. Un actor ajustado pierde la animación nativa de «hablando/atenuado», y las capas añadidas mezclan unidades: caja del 42 % del escenario con desplazamiento en `vw`.
13. **Respaldo pesado.** El JSON lleva base64 (+33 %), con hasta 70 MB de media y 100 MB de import en memoria como string, formateado con `null,2`. Hay riesgo real de cuelgue en móvil. La importación **reemplaza** el documento entero sin confirmar ni fusionar.

**Menores**
14. Se confía en `file.type` (no se comprueba la firma del archivo). Es aceptable porque todo es local, pero hay que endurecerlo si se publica.
15. Se puede activar QA en producción con `?drDev=1`. Es inocuo porque solo afecta al navegador local, pero no es control de acceso si v3 publica.
16. Node 20 en `deploy.yml` frente a Node 22+ exigido por `--experimental-strip-types` en `npm test`.

### A2. Usabilidad
1. **No se pueden teclear números negativos ni dejar un campo vacío.** `onChange={e=>update({x:number(+e.target.value)})}`: al escribir «-», `+"-"` da `NaN`, se normaliza a 0 y el campo controlado vuelve a 0. Escribir «-11» tecla a tecla es imposible; la e2e pasa porque usa `fill('-11')`.
2. **El panel tapa la escena.** Está anclado arriba con hasta 60 dvh en móvil y cubre a los actores que se están editando. La única vía para ver la composición es contraer el panel.
3. **No se pueden aplicar ajustes en lote.** Cada una de las 49 intervenciones se edita por separado, aunque `arresto` tenga 3 diálogos con el mismo encuadre. No hay «aplicar a toda la escena», «copiar de la anterior» ni plantillas.
4. **La escala solo se cambia con el slider.** No hay asas en el lienzo, ni rotación, opacidad, guías, ajuste a cuadrícula, zoom de lienzo ni rejilla de seguridad para 320–390 px.
5. **Modelo de guardado confuso.** Hay un botón «Guardar», pero también autoguardado al navegar y al previsualizar. No hay aviso `beforeunload`. **«Salir del editor» en realidad abre la previsualización** (`studioExit=studioPreview`, `:558`).
6. **Acciones duplicadas.** «Quitar de escena» y «Visible/Oculto» hacen lo mismo con los actores nativos; «Restaurar» significa cosas distintas según el tipo de elemento.
7. **Globos muy limitados.** Solo existen en 4 diálogos con `quickBubble` fijo en código, y no se pueden crear en otros. El texto, el hablante y el tono del diálogo principal no se pueden editar.
8. **El editor no muestra qué cambió.** No se marcan las intervenciones editadas en el selector, no hay vista antes/después ni miniaturas, y el mensaje de estado es único y efímero.
9. **Accesibilidad y teclado.** Los iconos son emoji dentro de etiquetas, los inputs de archivo se llaman «Archivo replace», no hay atajos (Ctrl+Z, flechas para mover) y la selección en el lienzo depende del puntero.
10. **Cobertura funcional.** Solo funciona en el prólogo. Faltan las conversaciones tras victoria, los momentos de región, la historia, el epílogo y los créditos.

### A3. Calidad y pruebas
- Las e2e de Studio solo corren en `mobile-390`. No se prueban el horizontal (donde se nota el fallo de `vw`), los 320 px ni el escritorio.
- `studioMedia.ts` (IndexedDB) no tiene pruebas unitarias. Tampoco se prueban la recogida de huérfanos, el corrimiento de índices ni que una compilación pública ignore los borradores.
- Lo que está bien hecho y conviene conservar: funciones puras e inmutables de documento, saneado defensivo del JSON (lista blanca de MIME, regex de ID, límites), aislamiento del progreso real en la previsualización (`:227`, `:235`) y el principio «editar sobre el renderer real».

---

## Parte B — Plan DRStudio v3

### Principios
- Seguir editando sobre el renderer real, pero mediante una **capa de composición declarativa** en vez de código de editor dentro de cada pantalla.
- Datos portables: IDs estables, unidades relativas al escenario y esquema versionado con migraciones.
- Hacerlo por fases, cada una entregable, con CI en verde y sin cambiar las reglas del duelo ni `GameBoard`.

### Arquitectura objetivo
```
campaign/studio/
  schema.ts        StudioDocumentV3 + parse/normalize (reutiliza el saneado de studioLayout.ts)
  migrate.ts       v1/v2 (version:1) → v3, con mapa índice→beatId congelado
  ops.ts           operaciones puras (set/remove/duplicate/applyToScene/reorder)
  history.ts       reducer con deshacer/rehacer por transacciones (pointerdown…pointerup = 1 entrada)
  grid.ts          matemáticas puras de grilla, snap, guías inteligentes y alineación (fase 3)
  media.ts         IndexedDB (evolución de studioMedia.ts): refcount, GC de huérfanos, firma de archivos
  package.ts       export/import: .zip propio sin dependencias (STORE), o JSON+base64 en streaming como fallback
  published.ts     carga de public/studio/composiciones.json para todos los jugadores
screens/studio/
  StudioProvider.tsx      contexto con el reducer; la pantalla del juego solo lee
  StageComposer.tsx       pinta actores/capas/globo desde un "SceneComposition" (unidades % del escenario)
  StudioCanvasOverlay.tsx asas de selección, escala, rotación, guías y snapping, por encima del escenario
  StudioGridOverlay.tsx   grilla, ejes, márgenes de seguridad y guías inteligentes (pointer-events:none)
  StudioInspector.tsx     panel acoplable (hoja inferior en móvil, lateral en escritorio)
  StudioTimeline.tsx      lista de intervenciones con miniaturas y marcas de "editado"
```
- **IDs estables de diálogo.** Añadir `id` a cada entrada de `OPENING_BEATS`/`AFTER_DUEL_BEATS` (p. ej. `arresto-01`) y sacar los datos del prólogo de `CampaignOpening.tsx` a `campaign/prologueScript.ts`. La clave de escena pasa a ser `prologo/arresto-01`.
- **Reparto declarativo.** Convertir la cadena `if/else` de actores, arte y globos (`CampaignOpening.tsx:249-310`) en una función pura `prologueComposition(beatId, artFlags) → SceneComposition`, que es lo que Studio sobrescribe. Así desaparecen los números mágicos y se puede añadir o quitar cualquier actor y crear globos en cualquier diálogo.
- **Un solo plano de capas.** Actores, extras y globo comparten un mismo contenedor de capas, para que «Capa» funcione de verdad. Unidades en % del escenario (`.dcop-stage`), con `container-type:size` y unidades `cqw`/`cqh`.
- **Navegación dentro de Studio sin remontar.** Cambiar de intervención actualiza el estado y hace `replaceState` del query, sin `navigate` con nueva `key`. Así se conservan el historial, las URL multimedia y los manifiestos.
- **Overrides por capas:** composición base del código < `published.json` (todos los jugadores) < borrador local (solo QA).

### Modelo de datos v3 (definido en la fase 1)
```ts
StudioDocumentV3 = { version: 3; scenes: Record<SceneKey, StudioSceneV3>; assets?: Record<MediaId, {name, mime}> }
SceneKey         = 'prologo/arresto-01'            // pantalla/beatId estable, nunca un índice
StudioSceneV3    = { layers?: StudioLayer[]; background?: {assetId}; titleVisible?: boolean }
StudioLayer      = { id, x, y, scale, rotation, opacity, mirror, z, visible } & (
                     {kind:'actor', actor, assetId?}          // id 'actor-madre', 'actor-nino'…
                   | {kind:'image'|'effect', name, assetId}   // id 'extra-<uuid>' (se conservan los de v2)
                   | {kind:'bubble', text?} )                 // id 'bubble', uno por escena
```
- `x`, `y`: desplazamiento en **% del escenario** (`.dcop-stage`) desde el ancla base de la capa: la posición nativa del actor o del globo, o el punto 50 %/48 % del escenario para imágenes y efectos (el mismo que usaba v2). Rangos: x/y −100…100, escala 0,35…2,75, rotación −180…180°, opacidad 0…1, `z` 1…100 en **un único plano**.
- Las capas que apuntan a un recurso inexistente en `assets` se descartan al leer (integridad referencial).
- Almacenamiento: clave nueva `decreto-real.studio.borradores.v3`. Si no existe, se migra la clave v1 al vuelo **sin borrarla** (queda como respaldo).
- Migración v1/v2 (`version:1`) → v3:
  - Claves `opening:N`/`after:N` → beatId mediante una **tabla congelada** del orden publicado en v2. Las claves fuera de rango se descartan y se informan.
  - `vw`/`vh` → % del escenario. Es una equivalencia exacta en el viewport de referencia de 390×844, donde el escenario mide 100 vw × 100 dvh.
  - Capas: los actores pasan a `z = 10 + capa` (11–40). Las imágenes, efectos y globo pasan a `z = capa` si capa ≤ 2 (detrás del grupo de actores, que tenía z-index 3) o a `z = 40 + capa`. Así se conserva exactamente el orden visual de v2.
  - `bubbleVisible`/`bubbleText`/`bubbleTransform` → capa `bubble`; `backgroundAsset` → `background`.

### Fases
| Fase | Entrega | Archivos principales |
|---|---|---|
| **0. Documento** | Esta auditoría y este plan (sin cambios de código) | `docs/decreto-real-studio-v3-plan.md` |
| **1. Fundamentos de datos** ✅ | IDs estables, `prologueScript.ts`, schema v3, migración v1/v2→v3, pruebas de migración y de corrimiento de índices | `campaign/studio/{schema,migrate,ops}.ts`, `CampaignOpening.tsx` (solo extraer datos) |
| **2. Desacoplar** ✅ | `StudioProvider` + reducer con transacciones de deshacer/rehacer; `StageComposer` consume `SceneComposition`; quitar ~400 líneas de Studio de `CampaignOpening.tsx`; navegación sin remontar | `screens/studio/*`, `CampaignOpening.tsx`, `App.tsx` |
| **3. Lienzo, coordenadas, capas y grilla** ✅ | Unidades % del escenario (arrastre medido con el rectángulo del escenario, no con `window.innerWidth`), plano de capas único, asas de escala/rotación, **grilla, ajuste magnético, ejes, márgenes de seguridad, guías inteligentes y alineación** (ver especificación abajo), selección múltiple para alinear, bloqueo de capa, fondo como capa con encuadre editable, nudges con teclado, inputs numéricos con borrador local (arregla el «-») | `campaign/studio/grid.ts`, `StageComposer`, `StudioCanvasOverlay`, `StudioGridOverlay`, CSS nuevo sin `!important` heredado |
| **4. UX del editor** ✅ | Inspector acoplable (hoja inferior plegable, lateral en escritorio); timeline con miniaturas y marcas de editado; «aplicar a toda la escena» y «copiar de la anterior»; guardado explícito con indicador, autoguardado en borrador y `beforeunload`; Salir/Previsualizar separados; globos y texto de diálogo editables; comparar antes/después | `StudioInspector`, `StudioTimeline` |
| **5. Multimedia robusta** ✅ | Refcount y GC de huérfanos, panel de biblioteca (reutilizar y renombrar recursos, ver tamaño), comprobación de firma, paquete `.zip` sin dependencias, importación con «fusionar/reemplazar» confirmada | `campaign/studio/{media,package}.ts` |
| **6. Publicación** | `public/studio/composiciones.json` cargado por el juego público; «Exportar para publicar» genera ese JSON y los assets normalizados; workflow manual de GitHub Actions que valida el paquete y abre un PR (siguiendo el patrón de `generate-prologue-v3.yml` y `tools/art-github.mjs`) | `published.ts`, `.github/workflows/studio-publicar.yml`, `tools/studio-publish.mjs` |
| **7. Más pantallas** | El mismo `StageComposer` y el mismo Studio en `CampaignAfterVictory`, `CampaignRegionMoment`, `CampaignStory`/`StoryDialogue`, `CampaignEpilogue` y créditos | esas pantallas |

### Especificación: grilla, ajuste magnético y guías (fase 3)
Studio v3 debe funcionar como un editor gráfico: personajes, sprites, globos, fondos y efectos se ubican con precisión sobre una grilla del escenario.

| # | Requisito | Diseño |
|---|---|---|
| 1 | Activar/desactivar la grilla con un botón visible | Botón **▦ Grilla** en la barra fija del lienzo (no dentro del inspector plegable), con `aria-pressed`. Atajo `G` en escritorio. |
| 2 | Grilla superpuesta sin modificar los recursos | `StudioGridOverlay`: un único elemento absoluto que cubre exactamente `.dcop-stage`, dibujado con `linear-gradient` repetidos (o SVG inline). No toca imágenes, fondos ni el DOM del juego. Las líneas son dobles (clara y oscura) para verse sobre cualquier fondo. |
| 3 | Densidad y transparencia configurables | Densidad: 6, 8, 12 (por defecto), 16 o 24 columnas. Las celdas son **cuadradas**: el paso horizontal es 100/N % del ancho y el vertical se deriva de la proporción del escenario. Cada 4 celdas, una línea principal más marcada. Transparencia de 10 a 80 % (35 % por defecto). |
| 4 | Snap to Grid independiente | Interruptor **🧲 Ajuste** separado de la grilla: se puede ajustar sin verla. Se aplica al arrastrar, a los nudges con flechas (1 celda con ajuste, 0,5 % sin él), a las asas de escala (pasos de 5 %) y a la rotación (pasos de 15°). Al arrastrar, el borde, el centro o el borde opuesto de la caja del elemento termina **siempre** sobre la línea de grilla más cercana; las guías inteligentes, si están activas, tienen prioridad dentro de un umbral de 8 px CSS. En escritorio, `Alt` mantenido lo suspende; en táctil se usa el interruptor. |
| 5 | Guías: ejes, márgenes de seguridad, alineación | Interruptores independientes: **Ejes** (centro vertical y horizontal), **Márgenes seguros** (acción al 5 % y títulos al 10 % por lado; franja del panel de diálogo, `--dcop-story-panel-height`, sombreada) y **Guías inteligentes**: líneas de color al coincidir borde o centro con los ejes, los márgenes o los bordes y centros de otras capas, con el mismo umbral de imantado. |
| 6 | Alinear personajes por arriba, abajo o centro | En el inspector: alineación vertical (arriba, centro, abajo) y horizontal (izquierda, centro, derecha). La referencia puede ser el escenario, la zona segura o la selección. Selección múltiple con `Shift`+clic, o en táctil con el modo «Seleccionar varios». Acción **«Igualar suelo»** para poner los pies de varios personajes en la misma línea base. Se deshace como una sola acción. |
| 7 | Controles numéricos precisos | X, Y (% del escenario, 2 decimales) y Escala (%). Mientras se teclea, el valor vive en un borrador local, así que «-», «-1» y el campo vacío son válidos, y se confirma con `Enter` o al salir del campo. Botones ± por paso. Los valores escritos **no se imantan**: se respetan exactamente. |
| 8 | Coordenadas relativas al escenario | Modelo de la fase 1. El arrastre convierte con `stage.getBoundingClientRect()`, nunca con `window.innerWidth/innerHeight`. |
| 9 | La grilla no impide seleccionar ni arrastrar | La grilla y las guías llevan `pointer-events:none` y `aria-hidden`. Solo las asas del elemento seleccionado reciben eventos. Los fondos y capas bloqueados (🔒) no se arrastran por accidente. |
| 10 | Solo dentro del editor | El overlay se monta solo con `studioEnabled` (QA + `?studio=1`). Las preferencias (visible, densidad, opacidad, ajuste, guías) se guardan aparte en `decreto-real.studio.preferencias-editor.v1`, **nunca** en el documento, el respaldo ni el JSON publicado. No aparecen en la previsualización, en la reproducción QA ni en el juego público. |

Implementación: la matemática pura (paso de grilla, `snapValue`, `snapRect`, alinear y distribuir cajas, detección de guías inteligentes) va en `campaign/studio/grid.ts` con pruebas unitarias. Los componentes solo la invocan.

**Pruebas de posicionamiento y ajuste magnético (fase 3)**
- Unitarias (`npm test`):
  - Paso de grilla para 6/8/12/16/24 columnas en 390×844, 320×568, 844×390 y 1280×800.
  - `snapValue` dentro y fuera del umbral.
  - `snapRect` por borde, centro y ancla.
  - Alineación arriba/centro/abajo e «Igualar suelo» con varias cajas.
  - Guías inteligentes contra ejes, márgenes y otras capas.
  - Que los valores numéricos escritos no se imanten.
- E2E móvil (`mobile-320`, `mobile-390`, `landscape`, táctil):
  - Activar y desactivar grilla y ajuste por separado.
  - Arrastre táctil con ajuste: la posición final cae en una línea de la grilla (±0,01 %). Sin ajuste, la posición es libre.
  - `elementFromPoint` en el centro de un actor devuelve el actor con la grilla activa, y el arrastre funciona a través de ella.
  - Teclear «-11» en X.
  - La misma composición guardada en 390 ocupa la misma caja relativa al escenario en `landscape`.
- E2E escritorio (nuevo proyecto `desktop-1280`, 1280×800, ratón, limitado a los specs de Studio con `testMatch`):
  - Arrastre con ratón y ajuste.
  - `Alt` suspende el ajuste.
  - Nudges con flechas de una celda.
  - Atajo `G`.
  - Alinear abajo dos personajes: sus pies quedan a la misma altura (±1 px).
- Aislamiento: ni la grilla ni las guías existen en `?previewStep=`, en la reproducción QA ni sin `drDev`. Las preferencias del editor no aparecen en el JSON exportado.

### Estado de la fase 1 (implementada)
- `campaign/prologueScript.ts`: guion del prólogo (49 intervenciones, textos idénticos) con IDs estables, `PROLOGUE_BEAT_IDS` y `prologueSceneKey()`. `CampaignOpening.tsx` lo importa y lo reexporta; su comportamiento no cambia.
- `campaign/studio/schema.ts`: tipos v3, límites, normalización y validación con integridad referencial.
- `campaign/studio/migrate.ts`: tablas congeladas de v2, `migrateLegacyStudioDocument`, `parseAnyStudioDocument` y lectura/escritura del borrador v3 (con migración al vuelo que conserva la clave v1).
- `campaign/studio/ops.ts`: operaciones puras (capas, escena, fondo, título, `copyScene`, recursos usados y poda de recursos).
- Pruebas en `campaign/prologueScript.test.ts` y `campaign/studio/*.test.ts`, incluidas en `npm test`.
- Studio v2 sigue usando su almacenamiento actual. La fase 2 conectará el editor al documento v3.

### Estado de la fase 2 (implementada)
- **Reparto declarativo** (`campaign/studio/composition.ts`): fondo, actores, arte y globo de cada intervención se declaran por beatId; se acabaron los números mágicos (`beat===15`, `after===9`…). Una prueba con la lógica anterior transcrita como oráculo confirma resultados idénticos en las 49 intervenciones y 5 estados de arte.
- **Historial transaccional** (`campaign/studio/history.ts`):
  - Un arrastre o la edición de un campo cuenta como una sola entrada de deshacer; tocar para seleccionar no crea ninguna.
  - Rehacer, `Ctrl+Z`, `Ctrl+Shift+Z` y `Ctrl+S`.
  - El estado «sin guardar» se calcula por identidad del documento, sin `JSON.stringify` en cada render.
- **Estado compartido** (`screens/studio/StudioContext.tsx`): documento v3, guardado en `decreto-real.studio.borradores.v3` con migración automática del borrador v2, biblioteca multimedia con carga incremental, y exportación e importación (paquete `studioPackage:3`, que también acepta los respaldos v2).
- **`screens/studio/StageComposer.tsx`**: pinta actores, niño, capas añadidas y globo. Las coordenadas se miden en **% del escenario**: el tamaño real se publica como `--dr-stage-w/h` y el arrastre usa el rectángulo del escenario.
- **`screens/studio/StudioInspector.tsx`**: sustituye a `DecretoRealStudioPanel` (35 props) leyendo y escribiendo a través del contexto.
- **`CampaignOpening.tsx`**: pasa de 741 a 291 líneas, sin código del editor.
- **Navegación sin remontar:** Studio cambia de intervención reemplazando solo el query y `App.tsx` mantiene la pantalla montada, así que se conservan el historial, los recursos multimedia y los manifiestos.
- **Correcciones de la auditoría ya incluidas:**
  - «Salir del editor» sale de verdad.
  - La exportación omite los recursos que ninguna escena usa.
  - «Restaurar» devuelve cada capa al `z` de su tipo.
  - Deshacer un cambio de otra intervención lo indica en el estado.
- **Provisional hasta la fase 3:** los actores siguen dentro del grupo teatral de figuras, así que el `z` del plano único se traduce al orden de v2 (`interimCssLayer`). Todavía no se puede colocar un efecto entre dos actores en pantalla, aunque el documento ya lo representa.
- **Pruebas nuevas:**
  - Unitarias de composición e historial.
  - E2E: un arrastre equivale a un paso de deshacer; el historial se conserva entre intervenciones; las unidades son del escenario en 390 y en horizontal; migración del borrador v2; salir del editor.

### Estado de la fase 3 (implementada)
- **Plano único de capas.** En QA, `.dcop-art` se aísla y el grupo de figuras deja de crear su propio contexto de apilamiento. Los elementos nativos ocupan las bandas `z` del documento: atenuado 12, hablante 14, destello 44, VS 46, globo 47; las capas añadidas, 48–49 por defecto. Un efecto puede ir **entre** dos personajes (`z` 13: delante de Domingo atenuado, detrás de Xervias hablando); está verificado con `elementFromPoint`. El juego público no cambia: el plano solo se activa con el editor abierto o con capas en la escena. Desaparece el adaptador provisional `interimCssLayer`.
- **Grilla y guías** (`campaign/studio/grid.ts`, `screens/studio/StudioCanvasOverlay.tsx`):
  - Barra fija con Grilla (atajo `G`), Ajuste, Ejes, Márgenes, Guías y Opciones (densidad 6–24 columnas y transparencia 10–80 %).
  - Celdas cuadradas.
  - El ajuste deja el borde, el centro o el borde opuesto **siempre** sobre una línea; las guías inteligentes (ejes, márgenes y otras capas) tienen prioridad dentro de 8 px.
  - `Alt` suspende el ajuste.
  - Márgenes del 5 % y el 10 %, más la franja del diálogo.
  - Las preferencias se guardan en `decreto-real.studio.preferencias-editor.v1`, nunca en el documento ni en el respaldo.
  - Ninguna capa del lienzo recibe eventos.
- **Asas** de escala (pasos de 5 % con ajuste) y de rotación (15°) en las esquinas inferiores, donde el panel no las tapa.
- **Alineación:**
  - Arriba, centro y abajo; izquierda, centro y derecha.
  - Referencia: automática, escenario, zona segura o selección.
  - «Igualar suelo» lleva los pies de todos a la línea más baja.
  - Selección múltiple con `Shift`+clic o con «Seleccionar varios».
  - Cada alineación se deshace con un solo paso.
- **Bloqueo por capa.** El **fondo** es una capa con encuadre (X, Y y escala), bloqueada por defecto.
- **Controles numéricos exactos** (X, Y, escala, capa, rotación y opacidad) con borrador local: el «-» se puede teclear y los valores escritos no se imantan. Hay botones ± y flechas: una celda con ajuste, 0,5 % sin él.
- **Escritorio:** el inspector se acopla al margen derecho, fuera del escenario.
- **Limitaciones conocidas:**
  - El niño se ordena dentro del grupo de la madre: su contenedor tiene filtro y, por tanto, contexto de apilamiento propio.
  - La caja de selección y la alineación usan la caja del sprite, incluida su transparencia.
- **Pruebas:**
  - Unitarias de grilla, ajuste, guías, alineación, nudges y preferencias.
  - `tests/e2e/studio-canvas.spec.ts` en `mobile-320`, `mobile-390`, `landscape` y el nuevo proyecto `desktop-1280` (ratón).

### Estado de la fase 4 (implementada)
- **Textos del bloque inferior:**
  - Se pueden reescribir y marcar en **negrita** con `**así**` o con el botón **B** sobre la selección.
  - `campaign/studio/richText.ts` convierte el marcado en segmentos y nunca interpreta HTML; la negrita se conserva aunque cruce un salto de página.
  - Se puede editar el rótulo de la escena.
  - «↺ Texto original» restaura el guion.
- **Tamaño de los bloques:**
  - Tamaño del texto (80–160 %) y alto del bloque (80–180 %), para una intervención o para todas (`defaults.dialogue`); el ajuste propio de una intervención tiene prioridad.
  - El alto mueve `--dcop-story-panel-height`, así que los personajes se apoyan sobre el bloque.
  - La paginación se adapta: con letra más grande cada página lleva menos texto.
- **Solo desarrollador:**
  - Se puede ocultar a los jugadores cualquier capa (personaje, sprite, efecto o globo), el rótulo o una intervención completa con su texto.
  - En el editor esos elementos llevan un contorno morado.
  - En la vista previa, «🛠 Viendo como desarrollador» / «👁 Viendo como jugador» simula la versión publicada: lo marcado desaparece y las intervenciones ocultas se saltan al avanzar.
  - La regla se aplica en el renderer con la audiencia `player` (la de la versión pública), lista para la publicación de la fase 6.
- **Globos en cualquier intervención:** «💬 ＋ Globo», con negrita y lado izquierdo o derecho.
- **Línea de tiempo** (`screens/studio/StudioTimeline.tsx`):
  - 49 miniaturas con el fondo y los personajes de cada composición.
  - Marcas: ● editada, ✎ texto modificado, DEV oculta a los jugadores.
  - Filtro «Solo editadas».
  - Tira horizontal en el móvil; columna en el margen izquierdo en escritorio.
- **Composición entre intervenciones:**
  - «⧉ Aplicar a toda la escena» y «⤺ Copiar de la anterior» copian solo capas y fondo; los textos de cada intervención se conservan.
  - Se deshacen con un solo paso.
- **Comparar:** «◐ Original» muestra la escena y los textos sin ediciones.
- **Guardado seguro:**
  - Autoguardado continuo en `decreto-real.studio.autoguardado.v3`.
  - Aviso del navegador al salir con cambios.
  - Al volver, se ofrece «↺ Recuperar» o «Descartar».
- **Móvil:** el panel se puede acoplar arriba o abajo (⇅). Esta preferencia es del editor y no del documento.
- **Pruebas:**
  - Unitarias de texto enriquecido, diálogo, rótulo, visibilidad y copia de composición.
  - Integración de `StoryDialogue` (negrita sin HTML y paginación).
  - `tests/e2e/studio-phase4.spec.ts` en móvil, horizontal y escritorio.

### Estado de la fase 5 (implementada)
- **Firma real de cada archivo** (`campaign/studio/mediaSignature.ts`): PNG, JPEG, GIF, WebP, MP4 y WebM se reconocen por sus primeros bytes. Un texto o un SVG disfrazado de `.png` se rechaza, y un archivo válido con la extensión equivocada se acepta con su tipo real. Se aplica al subir, al importar y al exportar.
- **Sin duplicados:** al subir se calcula el SHA-256. Si el archivo ya está en la biblioteca, se reutiliza su id y se avisa «no se duplicó».
- **Biblioteca** (`screens/studio/StudioLibrary.tsx`, botón 🖼):
  - Miniatura, tipo, tamaño y escenas que usan cada archivo.
  - Renombrar.
  - Reutilizar en la intervención actual como sprite, efecto o fondo, o para reemplazar al elemento seleccionado.
  - Eliminar archivos sueltos.
- **Limpieza segura:** «🧹 Limpiar sin uso» borra solo lo que nada puede volver a necesitar. Protege lo que usa el documento actual, cualquier paso del historial de deshacer/rehacer, el borrador guardado, el autoguardado y el borrador v2 conservado como respaldo. La confirmación es en dos pasos.
- **Respaldo ZIP sin dependencias** (`campaign/studio/zip.ts`, `campaign/studio/package.ts`):
  - Contiene `proyecto.json` y `media/<id>.<ext>` con los archivos originales: sin base64 ni su inflado del 33 %.
  - Usa CRC-32 y solo admite rutas seguras (sin `..` ni rutas absolutas).
  - Es determinista y admite hasta 200 MB.
  - Solo incluye los archivos en uso.
  - El lector rechaza ZIP dañados, comprimidos o ajenos.
- **Importación en dos pasos:**
  1. Un resumen previo indica escenas, archivos, tamaño y coincidencias con el borrador.
  2. Se elige **⊕ Fusionar** (las escenas importadas reemplazan solo a las coincidentes), **⟲ Reemplazar todo** o **Cancelar** (no cambia nada).
  - Los archivos se restauran en la biblioteca.
  - La importación se deshace con un paso.
  - Los respaldos JSON de v2 y v3 siguen siendo compatibles.
- **Pruebas:**
  - Unitarias de firmas, ZIP (CRC, rutas, corrupción), paquete (ida y vuelta, archivos disfrazados, JSON antiguo), fusión y uso de recursos.
  - `tests/e2e/studio-media.spec.ts` en móvil y escritorio.

Reutilizar sin reescribir: `normalizeStudioTransform`/`parseStudioDocument` (base del saneado v3), `validateStudioMedia`/`withStore` (IndexedDB), `isCampaignQaAvailable`/`getCampaignStorage` (gating y aislamiento del progreso), el patrón de manifiestos de `prologueV2.ts`/`prologueV3.ts` y la descarga `studioDownload`.

### Decisiones abiertas (con recomendación)
- **Publicación:** se recomienda un PR revisado vía workflow, sin escribir en GitHub desde el navegador con tokens.
- **Alcance de v3.0:** se recomiendan las fases 1–5 (prólogo completo y robusto), dejando las fases 6–7 como v3.1/v3.2.
- **Formato de respaldo:** se recomienda un ZIP propio (store, sin compresión) para evitar dependencias nuevas.

### Verificación (para cada fase de implementación)
- `npm test` (pruebas puras: schema, migración, ops, history, GC), `npm run test:ui`, `npx tsc --noEmit` y `npm run build`.
- `npm run test:e2e -- --trace off`, ampliando Studio a los proyectos `mobile-320`, `mobile-390`, `landscape` y `desktop-1280` (ver las pruebas de grilla de la fase 3): un ajuste guardado en 390 debe quedar en la misma posición relativa del escenario en `landscape`. Añadir regresiones para teclear «-11», deshacer y rehacer tras arrastrar, capa de un efecto entre dos actores, conservar el historial al cambiar de intervención y que no queden huérfanos tras reemplazar y deshacer.
- Un borrador v2 real (exportado de la versión actual) importado en v3 debe verse idéntico.
- La previsualización sigue sin escribir `PROLOGUE_CHECKPOINT_KEY` ni progreso de campaña (prueba existente, que se mantiene).
- CI: workflow `development-qa.yml` en el PR.
