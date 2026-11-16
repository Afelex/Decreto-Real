# Decreto Real — cierre técnico del modo «Jugar con la IA»

**Alcance de esta revisión:** duelo libre contra la IA, menú de entrada, sorteo, turnos, cintas, HP, decretos, sonido, pausa, reinicio, rendición y resultado. El objetivo es una demostración estable **sin cambiar las reglas ni el arte aprobado**.

## Cambios ya integrados con anterioridad

| PR | Resultado |
| --- | --- |
| #145 | Evita tiempos muertos duplicados durante la IA; conserva las animaciones |
| #146 | Reloj de presentación secuencial y fallback de WebM |
| #147 | Carga bajo demanda y precarga de imágenes por ruta |
| #148 | Reproductores de efectos de audio reutilizables y catálogo audiovisual G3 |
| #149 | Suspensión de vídeo ambiental no visible; métricas y pruebas de ciclo de partida |

Los rótulos rojo/azul aprobados siguen deliberadamente recortados; cada fase de decreto mantiene su duración de 1500 ms.

## Control de publicación

- `Release Readiness · Decreto Real IA`: pruebas de lógica, React, TypeScript, build, inspección de archivos reales y recorridos móviles de apertura, sorteo, cintas, pausa, reinicio y rendición.
- `Deploy Decreto Real to GitHub Pages`: Node 22 + `npm ci`, conversión del escenario a H264, generación de póster extraído del mismo vídeo, inspección de firmas reales de 20 imágenes/vídeos y carga del artefacto.
- `release.json`: etiqueta de revisión construida a partir de `GITHUB_SHA`. Tras la subida, el paso de verificación comprueba que Pages sirve **esa revisión exacta** y permite acceder al JavaScript de producción, las cintas, los WebM y el fondo del duelo.
- Si un recurso está vacío, falta, contiene un puntero LFS en lugar del medio real o la URL publicada falla, el control de lanzamiento marca error.

**No considerar la publicación confirmada hasta que el workflow de Pages aparezca verde, incluida la verificación HTTPS final.** La compilación y la fusión a `main` por sí solas no demuestran que la URL pública se haya actualizado.

## Revisión mínima en un Android físico (último GO/NO-GO)

1. Abrir https://afelex.github.io/Decreto-Real/ en Chrome, en modo normal y con conexión móvil o wifi representativa.
2. Confirmar que aparecen únicamente los accesos de la demo (IA y multijugador); abrir IA, observar transición de entrada y lanzar la moneda.
3. Dejar actuar al rival; confirmar las etiquetas roja y azul, texto legible sin desbordes y los 1,5 s de anuncio seguidos por los 1,5 s del efecto, cuando proceda.
4. Ejecutar al menos un Ataque, Defensa, Orden e Impacto que estén disponibles; comprobar barras verdes/ámbar/rojas y efectos.
5. Pausar durante un turno, alternar música/efectos, reanudar, confirmar reinicio y también cancelar una confirmación.
6. Volver a empezar, usar «Rendirse», comprobar derrota, continuar y regresar al menú; repetir la entrada al duelo para descartar pantallas negras o recursos retenidos.
7. Revisar consola de Chrome Android o depuración remota si aparece un error, registrar captura, acción realizada y versión `/release.json`.

**GO de demostración IA:** control de Pages satisfactorio y recorrido manual sin fallos bloqueantes. **NO GO de estabilidad total:** no se certifica WebSocket/Railway, toda la campaña, DRStudio, ni un dispositivo físico con pruebas sólo de CI.

## Riesgos deliberadamente delimitados

- El recorrido E2E general de campaña y DRStudio ha sufrido ejecuciones prolongadas/fallidas en anteriores PR. Su estado debe revisarse por separado; no debe confundirse con las comprobaciones específicas de IA.
- El rendimiento CI mide Chromium en pantallas simuladas, no FPS, memoria ni temperatura de un Redmi físico.
- Los MP3 definitivos de Suno y WebM nuevos no se integran hasta su aprobación; se conservan los provisionales.
- Las pruebas automáticas del menú de la demo no certifican que el multijugador en Railway esté funcional en tiempo real.

**Criterio de cierre:** evitar refactorizaciones visuales de última hora después de publicar una revisión exitosa. Sólo corregir errores críticos reproducidos en demo.
