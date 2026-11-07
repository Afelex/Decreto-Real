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

## Atajos de teclado
`Ctrl+Z` deshacer · `Ctrl+Shift+Z` rehacer · `Ctrl+S` guardar · `G` grilla · flechas para mover · `Alt` para arrastrar sin ajuste · `Esc` para vaciar la selección múltiple.

## Límites actuales
- El niño se ordena dentro del grupo de su madre.
- La caja de selección incluye la parte transparente del sprite.
- La publicación para todos los jugadores llegará en una fase posterior. Mientras tanto, usa **⇩ Exportar proyecto** para respaldar tu trabajo.
