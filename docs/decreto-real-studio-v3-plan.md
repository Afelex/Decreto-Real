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
  media.ts         IndexedDB (evolución de studioMedia.ts): refcount, GC de huérfanos, firma de archivos
  package.ts       export/import: .zip propio sin dependencias (STORE), o JSON+base64 en streaming como fallback
  published.ts     carga de public/studio/composiciones.json para todos los jugadores
screens/studio/
  StudioProvider.tsx      contexto con el reducer; la pantalla del juego solo lee
  StageComposer.tsx       pinta actores/capas/globo desde un "SceneComposition" (unidades % del escenario)
  StudioCanvasOverlay.tsx asas de selección, escala, rotación, guías y snapping, por encima del escenario
  StudioInspector.tsx     panel acoplable (hoja inferior en móvil, lateral en escritorio)
  StudioTimeline.tsx      lista de intervenciones con miniaturas y marcas de "editado"
```
- **IDs estables de diálogo.** Añadir `id` a cada entrada de `OPENING_BEATS`/`AFTER_DUEL_BEATS` (p. ej. `arresto-01`) y sacar los datos del prólogo de `CampaignOpening.tsx` a `campaign/prologueScript.ts`. La clave de escena pasa a ser `prologo/arresto-01`.
- **Reparto declarativo.** Convertir la cadena `if/else` de actores, arte y globos (`CampaignOpening.tsx:249-310`) en una función pura `prologueComposition(beatId, artFlags) → SceneComposition`, que es lo que Studio sobrescribe. Así desaparecen los números mágicos y se puede añadir o quitar cualquier actor y crear globos en cualquier diálogo.
- **Un solo plano de capas.** Actores, extras y globo comparten un mismo contenedor de capas, para que «Capa» funcione de verdad. Unidades en % del escenario (`.dcop-stage`), con `container-type:size` y unidades `cqw`/`cqh`.
- **Navegación dentro de Studio sin remontar.** Cambiar de intervención actualiza el estado y hace `replaceState` del query, sin `navigate` con nueva `key`. Así se conservan el historial, las URL multimedia y los manifiestos.
- **Overrides por capas:** composición base del código < `published.json` (todos los jugadores) < borrador local (solo QA).

### Modelo de datos v3 (resumen)
`{version:3, documentId, updatedAt, scenes: {[sceneKey]: {layers: Layer[], background?, title?, dialogue?: {text?, speaker?, tone?}}}, assets}`.
`Layer = {id, kind:'actor'|'image'|'effect'|'bubble', ref, x,y (% escenario), scale, rotation, opacity, mirror, z, visible, text?}`.
Las migraciones conservan los borradores v1/v2 existentes: claves por índice → beatId usando una tabla congelada del orden actual, y `vw`/`vh` → % del escenario con el factor de 390×844 documentado.

### Fases
| Fase | Entrega | Archivos principales |
|---|---|---|
| **0. Documento** | Esta auditoría y este plan (sin cambios de código) | `docs/decreto-real-studio-v3-plan.md` |
| **1. Fundamentos de datos** | IDs estables, `prologueScript.ts`, schema v3, migración v1/v2→v3, pruebas de migración y de corrimiento de índices | `campaign/studio/{schema,migrate,ops}.ts`, `CampaignOpening.tsx` (solo extraer datos) |
| **2. Desacoplar** | `StudioProvider` + reducer con transacciones de deshacer/rehacer; `StageComposer` consume `SceneComposition`; quitar ~400 líneas de Studio de `CampaignOpening.tsx`; navegación sin remontar | `screens/studio/*`, `CampaignOpening.tsx`, `App.tsx` |
| **3. Lienzo y unidades** | Unidades % del escenario, plano de capas único, asas de escala/rotación, guías/snapping, nudges con teclado, inputs numéricos con borrador local (arregla el «-») | `StageComposer`, `StudioCanvasOverlay`, CSS nuevo sin `!important` heredado |
| **4. UX del editor** | Inspector acoplable (hoja inferior plegable, lateral en escritorio); timeline con miniaturas y marcas de editado; «aplicar a toda la escena» y «copiar de la anterior»; guardado explícito con indicador, autoguardado en borrador y `beforeunload`; Salir/Previsualizar separados; globos y texto de diálogo editables; comparar antes/después | `StudioInspector`, `StudioTimeline` |
| **5. Multimedia robusta** | Refcount y GC de huérfanos, panel de biblioteca (reutilizar y renombrar recursos, ver tamaño), comprobación de firma, paquete `.zip` sin dependencias, importación con «fusionar/reemplazar» confirmada | `campaign/studio/{media,package}.ts` |
| **6. Publicación** | `public/studio/composiciones.json` cargado por el juego público; «Exportar para publicar» genera ese JSON y los assets normalizados; workflow manual de GitHub Actions que valida el paquete y abre un PR (siguiendo el patrón de `generate-prologue-v3.yml` y `tools/art-github.mjs`) | `published.ts`, `.github/workflows/studio-publicar.yml`, `tools/studio-publish.mjs` |
| **7. Más pantallas** | El mismo `StageComposer` y el mismo Studio en `CampaignAfterVictory`, `CampaignRegionMoment`, `CampaignStory`/`StoryDialogue`, `CampaignEpilogue` y créditos | esas pantallas |

Reutilizar sin reescribir: `normalizeStudioTransform`/`parseStudioDocument` (base del saneado v3), `validateStudioMedia`/`withStore` (IndexedDB), `isCampaignQaAvailable`/`getCampaignStorage` (gating y aislamiento del progreso), el patrón de manifiestos de `prologueV2.ts`/`prologueV3.ts` y la descarga `studioDownload`.

### Decisiones abiertas (con recomendación)
- **Publicación:** se recomienda un PR revisado vía workflow, sin escribir en GitHub desde el navegador con tokens.
- **Alcance de v3.0:** se recomiendan las fases 1–5 (prólogo completo y robusto), dejando las fases 6–7 como v3.1/v3.2.
- **Formato de respaldo:** se recomienda un ZIP propio (store, sin compresión) para evitar dependencias nuevas.

### Verificación (para cada fase de implementación)
- `npm test` (pruebas puras: schema, migración, ops, history, GC), `npm run test:ui`, `npx tsc --noEmit` y `npm run build`.
- `npm run test:e2e -- --trace off`, ampliando Studio a los proyectos `mobile-320`, `mobile-390` y `landscape`: un ajuste guardado en 390 debe quedar en la misma posición relativa del escenario en `landscape`. Añadir regresiones para teclear «-11», deshacer y rehacer tras arrastrar, capa de un efecto entre dos actores, conservar el historial al cambiar de intervención y que no queden huérfanos tras reemplazar y deshacer.
- Un borrador v2 real (exportado de la versión actual) importado en v3 debe verse idéntico.
- La previsualización sigue sin escribir `PROLOGUE_CHECKPOINT_KEY` ni progreso de campaña (prueba existente, que se mantiene).
- CI: workflow `development-qa.yml` en el PR.
