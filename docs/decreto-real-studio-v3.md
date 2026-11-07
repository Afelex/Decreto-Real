# Decreto Real Studio v3 — Guía de uso

**Acceso:** https://afelex.github.io/Decreto-Real/?drDev=1#/studio (o **QA · Historia → Abrir Decreto Real Studio**).

Todo lo que hagas es un **borrador local de QA**: no cambia el juego publicado ni tu partida. Los borradores de Studio v2 se convierten solos la primera vez que abres v3; el borrador anterior se conserva como respaldo.

## Lienzo
La barra inferior siempre está visible:

| Botón | Qué hace |
|---|---|
| ▦ **Grilla** (`G`) | Muestra u oculta la cuadrícula. No modifica ninguna imagen. |
| 🧲 **Ajuste** | Al arrastrar, el borde, el centro o el borde opuesto del elemento cae siempre sobre una línea. `Alt` lo suspende mientras arrastras. |
| ✛ **Ejes** | Líneas centrales vertical y horizontal. |
| ▭ **Márgenes** | Zonas seguras del 5 % (verde) y el 10 % (amarillo), y la franja que ocupa el diálogo. |
| ⌖ **Guías** | Líneas de color cuando el elemento se alinea con los ejes, los márgenes u otro elemento, con imantado a 8 px. |
| ⚙ **Opciones** | Densidad (6–24 columnas) y transparencia (10–80 %). |

La grilla y las guías **no impiden** tocar ni arrastrar los personajes, y no aparecen en la vista de Historia ni en el juego.

## Mover, escalar y rotar
- Arrastra cualquier personaje, sprite, efecto o globo. Las posiciones se miden en **% del escenario**, así que un ajuste hecho en el móvil se ve igual en horizontal y en el ordenador.
- **Asa naranja ⤡** (abajo a la derecha): escala, en pasos de 5 % con Ajuste.
- **Asa azul ⟳** (abajo a la izquierda): rota, en pasos de 15° con Ajuste.
- **Campos exactos:** X, Y, Escala, Capa (1–100), Rotación y Opacidad. Puedes escribir números negativos y los valores escritos se respetan tal cual. Los botones − y + ajustan por pasos.
- **Flechas** (en pantalla o en el teclado): una celda con Ajuste, 0,5 % sin él.
- 🔒 **Bloquear:** el elemento ya no se arrastra en el lienzo, pero sigue editable desde el panel.
- **Fondo:** selecciona «Fondo» para encuadrarlo (X, Y, escala). Viene bloqueado para no moverlo sin querer.

## Capas
Personajes, sprites, efectos y globo comparten **una sola numeración de capas**. Por defecto, los personajes van de 11 a 40, el globo en 47 y los elementos añadidos en 48–49. Por ejemplo, con capa 13 una niebla queda delante del personaje atenuado y detrás del que habla.

## Alinear
- Elige un elemento, o varios con **Shift + clic** (ordenador) o **☐ Seleccionar varios** (táctil).
- **Arriba, Centro, Abajo, Izq., Centro, Der.** respecto al escenario, a la zona segura o a la selección. En automático, se alinea a la selección si hay varios elementos y al escenario si hay uno.
- **⎯ Igualar suelo:** pone los pies de todos los seleccionados en la misma línea, la más baja.
- Cada alineación se deshace con un solo **↶ Deshacer**.

## Textos: escribir, negrita y tamaño
En **Diálogo y textos**:
- **Texto del bloque inferior:** reescribe la línea de la intervención. Para la **negrita**, selecciona palabras y pulsa **B**, o escribe `**así**`. **↺ Texto original** recupera el guion.
- **Tamaño del texto** (80–160 %) y **Alto del bloque** (80–180 %). En «Aplicar tamaños a» elige *Solo esta intervención* o *Todas las intervenciones*. Al subir el bloque, los personajes se apoyan sobre él.
- **Rótulo de la escena:** el título pequeño que aparece sobre el diálogo.
- Los globos también admiten **negrita**. Con **💬 ＋ Globo** añades uno en cualquier intervención, y con ⇤/⇥ eliges su lado.

## Solo para desarrolladores
Puedes ocultar elementos y textos **a los jugadores** y seguir viéndolos como desarrollador:
- **🛠 Solo dev** en un personaje, sprite, efecto o globo.
- **🛠 Rótulo solo dev** para el título de la escena.
- **🛠 Intervención solo dev:** la intervención completa, con su texto, se salta en la versión publicada.

En el editor, lo marcado lleva un contorno morado punteado. En **▶ Historia** usa **🛠 Viendo como desarrollador / 👁 Viendo como jugador** para comprobar exactamente qué verá el público.

## Organizar el trabajo
- **☰ Línea de tiempo:** las 49 intervenciones con miniatura. ● indica que está editada, ✎ que su texto cambió y DEV que está oculta a los jugadores. Toca una para ir a ella.
- **⧉ Aplicar a toda la escena:** copia personajes, capas y fondo a las demás intervenciones de la misma escena, sin tocar sus textos.
- **⤺ Copiar de la anterior:** trae la composición de la intervención previa.
- **◐ Original** (barra inferior): compara con la escena sin ediciones.
- **⇅** (en el móvil): pasa el panel arriba o abajo.
- **Autoguardado:** si cierras o recargas sin guardar, el navegador te avisa. Al volver, Studio ofrece **↺ Recuperar** tus cambios.

## Atajos de teclado
`Ctrl+Z` deshacer · `Ctrl+Shift+Z` rehacer · `Ctrl+S` guardar · `G` grilla · flechas para mover · `Alt` para arrastrar sin ajuste · `Esc` para vaciar la selección múltiple.

## Límites actuales
- El niño se ordena dentro del grupo de su madre.
- La caja de selección incluye la parte transparente del sprite.
- La publicación para todos los jugadores llegará en una fase posterior. Mientras tanto, usa **⇩ Exportar proyecto** para respaldar tu trabajo.
