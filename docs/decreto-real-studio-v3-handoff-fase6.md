# Traspaso: Decreto Real Studio v3 → fase 6 (publicación)

Documento para el agente que continúa (Codex / ChatGPT). Léelo junto con `docs/decreto-real-studio-v3-plan.md` (plan y estado por fase) y `docs/decreto-real-studio-v3.md` (guía de uso).

## 1. Punto de partida
- **Rama:** `claude/stoic-einstein-e8bbn6`.
- **PR en borrador:** https://github.com/Afelex/Decreto-Real/pull/78. Base `main` = `2885c06` (Studio v2).
- **Fases 1–5 completadas.** Último commit: fase 5.
- **Verificación al cierre:** `npm test` 240/240, `npm run test:ui` 123/123, `npx tsc --noEmit` correcto, `npm run build` correcto y e2e completo 273 pasan, 0 fallos.
- El aviso de CSS `Expected identifier but found "4\\"` ya existía antes y no es de Studio.

## 2. Comandos
```bash
npm ci
npm test                      # node --experimental-strip-types (Node ≥ 22)
npm run test:ui               # vitest (tests/integration)
npx tsc --noEmit
npm run build
npx playwright test --trace off --workers=4
# Si el Chromium fijado no está instalado: PW_CHROMIUM_PATH=/ruta/a/chromium npx playwright test ...
```
- Proyectos de Playwright: `mobile-320`, `mobile-360`, `mobile-390`, `short-360` y `landscape` (táctiles), más `desktop-1280` (ratón; solo los specs `studio*.spec.ts`).
- URL de Studio: `/Decreto-Real/?drDev=1#/studio`, que redirige a `#/campania/prologo?studio=1&studioStep=1`.
- QA solo está activo con `import.meta.env.DEV` o con `?drDev=1` (`campaign/campaignQA.ts → isCampaignQaAvailable`).

## 3. Arquitectura actual
**Lógica pura** (`campaign/`, se ejecuta con Node; los imports llevan extensión `.ts`):

| Archivo | Rol |
|---|---|
| `prologueScript.ts` | Guion del prólogo con **beatId estable** (`arresto-01`…), `PROLOGUE_BEAT_IDS`, `prologueSceneKey()` → `prologo/<beatId>` y `prologueBeatGroup()`. |
| `studio/schema.ts` | Documento v3: tipos, límites, normalización y validación. |
| `studio/migrate.ts` | Migración v1/v2 → v3 (tablas congeladas), `readStudioDocumentV3` y `saveStudioDocumentV3` (clave `decreto-real.studio.borradores.v3`). |
| `studio/ops.ts` | Operaciones puras e inmutables: capas, fondo, diálogo, `copyScene`, `mergeStudioDocuments`, `referencedAssetIds`, `withoutUnusedAssets`, `assetUsage`… |
| `studio/history.ts` | Reducer de deshacer/rehacer con transacciones (`begin`/`preview`/`commit`). |
| `studio/composition.ts` | Reparto base declarativo por beatId (`prologueComposition`). |
| `studio/grid.ts` | Grilla, imantado, guías, alineación y preferencias del editor. |
| `studio/richText.ts` | Negrita `**…**` convertida en segmentos (nunca HTML). |
| `studio/mediaSignature.ts`, `studio/zip.ts`, `studio/package.ts` | Firma real de los archivos, ZIP propio y respaldo `proyecto.json` + `media/`. |
| `studioMedia.ts` | IndexedDB (`decreto-real-studio-media-v1`): subir con SHA-256 y reutilización, listar, renombrar y borrar. |
| `studioLayout.ts` | Formato v1/v2. Solo se usa para migrar y leer el borrador v2: **no se borra**. |

**Interfaz** (`screens/`):

| Archivo | Rol |
|---|---|
| `CampaignOpening.tsx` | Flujo del prólogo. Envuelve todo en `StudioProvider`. |
| `studio/StudioContext.tsx` | Estado compartido: documento, historial, multimedia, audiencia (`player`/`developer`), comparar, autoguardado e importación. **Fuera de QA devuelve `INACTIVE`, con audiencia `player` y documento vacío.** |
| `studio/StageComposer.tsx` | Pinta actores, capas, globo y fondo (`StudioBackdrop`), y aplica `visibleTo(devOnly)`. |
| `studio/StudioInspector.tsx`, `StudioCanvasOverlay.tsx`, `StudioTimeline.tsx`, `StudioLibrary.tsx`, `useStudioDrag.ts`, `stageGeometry.ts`, `studioActions.ts` | Editor: inspector, lienzo, línea de tiempo, biblioteca y arrastre. |
| `StoryDialogue.tsx` | Bloque de diálogo con `textScale`, `boxScale`, `devOnlyNotice` y texto enriquecido. |
| `App.tsx` | Mantiene montada la pantalla durante la sesión de Studio (`key='decreto-real-studio'`). |

**Pruebas:** `campaign/studio/*.test.ts`, `campaign/prologueScript.test.ts`, `tests/integration/story-dialogue.test.tsx` y `tests/e2e/studio*.spec.ts` (`studio`, `studio-canvas`, `studio-phase4`, `studio-media`).

## 4. Fase 6: lo que hay que construir
**Objetivo:** que los ajustes de Studio lleguen a **todos los jugadores** mediante un PR revisado. El navegador nunca escribe en GitHub ni guarda tokens.

### 4.1. Publicado en el juego: `campaign/studio/published.ts`
- Archivo `public/studio/composiciones.json`: documento v3 normalizado, con los `assetId` reescritos a rutas públicas, por ejemplo `assets:{id:{name,mime,src:"./studio/media/<id>.<ext>"}}`.
  - Opción A: añadir un campo `src` opcional y validado a `StudioAssetMeta` (solo rutas relativas `./studio/media/[a-z0-9-]+\.(png|jpg|gif|webp|mp4|webm)`).
  - Opción B: derivar la ruta del id y del mime. **Recomendado B**, porque no cambia el esquema.
- Cargarlo con `fetch` y `cache:'no-store'`, como los manifiestos de `prologueV2.ts`/`prologueV3.ts`, y validarlo con `normalizeStudioDocumentV3`.
- **Capas de override (plan):** composición base < publicado < borrador local (solo QA).
  - En `StudioContext`, fuera de QA: `active=false`, pero el documento publicado debe aplicarse con audiencia `player`. Cambiar `INACTIVE` por un valor de solo lectura con `doc=publicado`, `mediaUrls` = rutas públicas y `visibleTo(devOnly)=!devOnly`.
  - En QA: decidir si el borrador parte del publicado. Recomendado: `doc` = borrador local si existe; si no, el publicado. Botón «Partir de lo publicado».
- `useStudioPlane` y `StageComposer` leen hoy `studio.active`. Hay que revisar que el plano único y las variables `--dr-stage-w/h` (`useStageSizeVars`) también se activen con contenido publicado.
- **Intervenciones solo dev:** `CampaignOpening.advance()` ya las salta cuando `visibleTo` es falso. Con el publicado cargado, en el juego público funcionará sin más.

### 4.2. Exportar para publicar (en Studio)
- Botón «⇪ Exportar para publicar». Reutilizar `buildStudioPackage` (`campaign/studio/package.ts`): el mismo ZIP sirve; también puede ser un ZIP con un nombre distinto.
- Comprobar antes: no hay referencias rotas y los tamaños están dentro de los límites (por ejemplo, 25 MB por archivo y 200 MB en total).

### 4.3. Herramienta y workflow
- **`tools/studio-publish.mjs`** (Node 22, sin dependencias):
  - Lee el ZIP (puede importar `campaign/studio/zip.ts` y `package.ts` con `--experimental-strip-types`).
  - Valida la firma de cada archivo.
  - Escribe `public/studio/composiciones.json` y `public/studio/media/<id>.<ext>`.
  - Borra los medios publicados que ya no se usan.
  - Añadir pruebas en `tools/studio-publish.test.mjs` e incluirlas en el script `test` de `package.json`.
- **`.github/workflows/studio-publicar.yml`:**
  - `workflow_dispatch` con una entrada: URL o artefacto del ZIP. Alternativa: el ZIP subido a una rama `studio/publicacion-*`.
  - Pasos: ejecutar la herramienta, después `npm test` y `npm run build`, y abrir un PR (`peter-evans/create-pull-request` o `gh pr create`).
  - Seguir el patrón de `.github/workflows/generate-prologue-v3.yml` y `tools/art-github.mjs`.
  - **Nunca** publicar directamente en `main`.

### 4.4. Pruebas recomendadas
- **Unitarias:** ZIP → archivos publicados (ida y vuelta); rechazo de archivos disfrazados o rutas peligrosas; poda de los medios publicados que ya no se usan.
- **E2E:**
  - Con un `public/studio/composiciones.json` de prueba (servido por Vite) sin `drDev`: se aplican las capas y la negrita, y se ocultan los elementos `devOnly`, el rótulo `titleDevOnly` y las intervenciones `devOnly`.
  - Con `drDev`: el borrador local tiene prioridad.
  - El juego sin archivo publicado no cambia.

## 5. Convenciones y trampas conocidas
- Textos de la interfaz, comentarios de dominio y documentación **en español**. Commits del tipo `feat(studio v3): …`.
- Los módulos de `campaign/` deben poder ejecutarse en Node:
  - Imports con `.ts`.
  - Tipos con `import type` o `type X`.
  - Sin DOM.
- Varios `Object.entries(...)` dan `unknown` con este tsconfig: usar `Object.keys` o helpers tipados.
- `React.StrictMode` está activo: nada de efectos secundarios dentro de los updaters de `setState`.
- `x`/`y` son **% del escenario** (`.dcop-stage`), no del viewport. `z` usa un plano único (actores 11–40, globo 47, capas añadidas 48–49).
- El documento es inmutable. Las operaciones de `ops.ts` normalizan; usar `studio.apply` (un paso de deshacer) o `begin`/`preview`/`commit` para los gestos continuos.
- `beforeunload` está activo mientras hay cambios sin guardar. En las e2e que recargan con cambios, aceptar el diálogo con `page.on('dialog', d => d.accept())`.
- `copyScene` copia solo la composición, nunca los textos.
- El historial no puede perder archivos: la limpieza respeta `protectedAssetIds`.

## 6. Pendiente después de la fase 6 (fase 7)
Llevar `StageComposer` y Studio a `CampaignAfterVictory`, `CampaignRegionMoment`, `CampaignStory`/`StoryDialogue`, `CampaignEpilogue` y los créditos, con claves de escena `pantalla/beatId` estables (por ejemplo `region-3/entrada-01`).
