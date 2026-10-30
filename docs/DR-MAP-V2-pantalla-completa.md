# DR-MAP-V2 — Mapa virreinal a pantalla completa

**Rama de desarrollo:** `feat/mapa-virreinal-pantalla-completa-v2`  
**Estado:** revisión y QA; no reemplazar la versión pública hasta aprobar las pruebas.  
**Referencia artística:** mapa del Virreinato del Perú compartido por el usuario, reinterpretado como ilustración SVG propia, escalable y local (`public/virreinato-map.svg`). No es reproducción cartográfica exacta ni una reconstrucción histórica de fronteras.

## Experiencia

- `/#/campania` utiliza una única pantalla `100dvh` con bloqueos de desbordamiento y márgenes de zona segura del móvil. No hay desplazamiento vertical ni horizontal en el mapa.
- Cabecera **Campaña · Virreinato del Perú**, acceso a Historia y regreso al menú.
- Una región de la historia por vez; la región actual se presenta con entre dos y cuatro retos sobre un mapa ilustrado de pergamino.
- El recorrido está marcado por una senda punteada. Los retos futuros son grises, muestran candado y no aceptan interacción.
- Un reto disponible es seleccionable; el reto seleccionado se ilumina y se muestra abajo con título, descripción, dificultad y estrellas.
- Botón principal **Seleccionar reto** abre el briefing narrativo existente; este, a su vez, abre el duelo táctil existente.
- Una derrota **no desbloquea nada**. Una victoria guarda entre 1 y 3 estrellas, abre solo el siguiente reto y conserva la mejor marca.
- Las flechas de capítulos se desactivan cuando el siguiente capítulo no está desbloqueado. Los capítulos ya superados pueden volver a visitarse.
- La URL de una misión futura está protegida por `isMissionUnlocked` (no solo por el estado de la interfaz).
- El epílogo requiere que se hayan superado las 38 misiones, no solo una entrada artificial de puntuación para la misión 38.
- El guardado de estrellas sigue usando `decreto-real.campania.v1`; no se borra progreso anterior ni se toca el espacio de duelo libre.
- Se mantienen las 38 misiones, las ocho identidades de generales, el lore y las reglas de combate existentes.

## Diseño visual

La nueva pantalla recoge la atmósfera del mapa suministrado: pergamino cálido, relieve de los Andes, costa del Mar del Sur, rosa de los vientos, bordes metálicos y botones rojos/dorados. La ilustración incluida es vectorial y puede sustituirse más adelante por arte definitivo, sin alterar la lógica del mapa.

## Comprobaciones requeridas

- `npm test` — lógica de progresión, secuencia de derrotas y persistencia.
- `npm run test:ui` — selección de reto, bloqueo de fases, navegación entre regiones y rutas.
- `npx tsc --noEmit` y `npm run build`.
- `npm run test:e2e` — sin scroll vertical ni horizontal, botón de reto, nodos bloqueados, región nueva y combate.
- Playwright para 320×568, 360×800, 390×844, 360×480 y 844×390.
- QA manual en teléfono Android (observar barra inferior del navegador, barra de gestos y visualización de todos los controles).

**Regla de publicación:** ninguna prueba preparada se considerará aprobada hasta comprobar su ejecución real; conservar respaldo de `main` antes de fusionar.
