# Decreto Real Studio v3 — Guía de uso

**Acceso:** https://afelex.github.io/Decreto-Real/?drDev=1#/studio (o **QA · Historia → Abrir Decreto Real Studio**).

Todo lo que hagas es un **borrador local de QA**: no cambia el juego publicado ni tu partida. **Guardar** conserva los ajustes en el navegador, pero para que los jugadores vean los títulos ocultos, como «Crónica», debes pulsar **⇪ Exportar publicación**, subir el ZIP al flujo de GitHub Actions y fusionar el PR que genera. El modo historia publicado ya respeta las opciones de ocultar nombre, progreso y rótulos. Los borradores de Studio v2 se convierten solos la primera vez que abres v3; el borrador anterior se conserva como respaldo.

## Lienzo
En móviles, la barra inferior comienza **plegada**: pulsa **⚙ Herramientas** para abrirla y **✕ Cerrar** para retirarla del texto. En pantallas de escritorio continúa visible. Además, el inspector tiene **Deshacer** y **Guardar** siempre accesibles arriba; sus barras de deslizamiento y botones +/- empiezan bloqueados en pantallas táctiles para evitar movimientos accidentales. Los valores X, Y y demás se pueden seguir escribiendo directamente. Para usar deslizadores, pulsa **🔒 Desbloquear ajustes**. El selector **Ir directamente a…** permite saltar a **Posición y escala**, **Diálogo y títulos** o **Guardar y publicar** sin recorrer todo el panel.

Las herramientas del lienzo son:

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
- **📋 Copiar posición / 📥 Pegar posición:** copia X, Y, escala, rotación, capa, opacidad y espejado del elemento seleccionado y los aplica a otro, también en otra intervención (se deshace con un paso). También quedan en el portapapeles como texto legible.
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
- **Texto del bloque inferior:** reescribe la línea de la intervención. **Enter** crea una línea nueva (también en los globos y en las otras pantallas). Puedes vaciar el campo y escribir desde cero. Para la **negrita**, selecciona palabras y pulsa **B**, o escribe `**así**`. **↺ Texto original** recupera el guion.
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

## Biblioteca de imágenes y videos
Pulsa **🖼** para abrir la biblioteca:
- Muestra cada archivo con su miniatura, su tamaño y las escenas que lo usan.
- Cámbiale el nombre escribiendo sobre él.
- Reutilízalo en la intervención actual como **＋ Sprite**, **✦ Efecto** o **▧ Fondo**, o con **⇄ Reemplazar** sobre el personaje seleccionado, sin volver a subirlo.
- Si subes un archivo que ya estaba, Studio lo reutiliza y no ocupa espacio dos veces.
- Studio comprueba el **contenido real** de cada archivo: un archivo que no es una imagen o un video de verdad se rechaza, aunque se llame `.png`.
- **🧹 Limpiar sin uso** borra lo que ya no necesitas. Nunca borra lo que usan tus escenas, el historial de deshacer, el borrador guardado ni el autoguardado.

## Respaldos (.zip)
- **⇩ Exportar proyecto (.zip)** guarda tus escenas y solo los archivos que usan, en un ZIP normal.
- **⇧ Importar proyecto** acepta ese ZIP y también los respaldos `.json` de versiones anteriores. Antes de cambiar nada, muestra un resumen:
  - **⊕ Fusionar:** conserva tu borrador; las escenas del respaldo reemplazan solo a las que coinciden.
  - **⟲ Reemplazar todo:** tu borrador pasa a ser el del respaldo.
  - **Cancelar:** no cambia nada.
- Las imágenes y videos del respaldo vuelven a la biblioteca. Si te equivocas, **↶ Deshacer** revierte la importación.

## Textos de interfaz y elementos de la escena 1
- En **Diálogo y textos → Visible solo para desarrolladores** puedes ocultar a los jugadores el **nombre** de quien habla («Crónica»), el **progreso** («ESCENA 1/21») y el **rótulo** («Decreto Real · Prólogo»). Siguen viéndose en Studio y en «Viendo como desarrollador». Respeta «Aplicar tamaños a»: esta intervención o todas.
- **Ancho del bloque** (50–100 %): estrecha el bloque de texto inferior, centrado.
- En la escena 1, la **ilustración del pergamino** y la **tarjeta «Por orden de la Corona»** aparecen en «Elemento a editar»: se pueden mover, escalar, ocultar (🗑) o marcar «solo dev».

## Pantalla VS (intervención 21)
La pantalla VS ocupa ahora todo el lienzo vertical; la narración se superpone sin recortar el fondo de VS. La pantalla de enfrentamiento tiene ahora un diseño propio: rival arriba (franja azul), Xervias abajo (franja roja), nombres con la inicial grande y una marca «VS» metálica en el centro. En «Elemento a editar» aparecen sus piezas (**Marco completo**, **Franja** y **Nombre** de cada personaje, **Marca «VS»**): puedes moverlas, escalarlas, rotarlas, cambiar su capa, ocultarlas o marcarlas «solo dev».

## Tablero de juego
Abre **☷ → ♜ Tablero de juego** (o `?drDev=1#/game?studio=1`). Puedes mover, escalar, rotar, cambiar la capa y la opacidad, espejar, ocultar o marcar «solo dev» los retratos, los mazos, los marcadores de impactos, la mano oculta del rival, **tu mano de cartas**, las etiquetas **«Tu Turno» y «Turno del Oponente»** y los botones «Fin de turno» y menú. Las etiquetas aparecen simultáneamente solo mientras editas. Cuando seleccionas una, puedes arrastrar **el estandarte ilustrado real** (inmóvil en la vista previa); el mismo ajuste se aplica al indicador persistente y al anuncio animado durante la partida. La mano permanece visible y jugable en las partidas. Mientras editas, la partida queda congelada.
- Los ajustes se guardan **por formato de pantalla** (móvil vertical, horizontal y escritorio): el panel indica cuál estás editando. Para editar otro, gira el móvil o cambia el tamaño de la ventana.
- Tu mano puede moverse y escalarse como conjunto, sin cambiar los gestos de las cartas ni las casillas donde se juegan. Para evitar bloquear el juego no puede ocultarse ni marcarse «solo dev». Las zonas de juego siguen fijas.
- 📋 Copiar / 📥 Pegar posición también funciona aquí, incluso entre formatos.

## Tutorial de combate (32 intervenciones)
En **Studio · Tablero** aparecen seis elementos nuevos: **ventana de diálogo**, **ilustración de Domingo**, **ilustración de Xervias**, **indicador COMBO ×2/×3**, **moneda** y **menú de combo**. Al seleccionar un elemento aparece una vista previa fija para moverlo, escalarlo o ajustar sus propiedades, aunque todavía no hayas llegado a ese punto de la partida.

El selector **Vista previa del tutorial** permite inspeccionar cualquiera de las **32 intervenciones** sin repetir la partida. **Texto de esta intervención** edita el guion real, que se conserva en la exportación ZIP de publicación. Este selector no avanza, reinicia ni modifica las reglas del duelo. Por defecto, la ventana del tutorial se posiciona más arriba para no tapar la mano ni los botones jugables. Los retratos narrativos y retratos HUD ahora tienen tamaños mayores y se pueden ajustar individualmente.

### Contrato de autoría compartida — Fase 1
El editor y las versiones que prepare desde GitHub comparten **exactamente el mismo formato de composición**, el documento versión 3 que se publica como `public/studio/composiciones.json`.

- **Texto de un paso:** `scenes["tutorial/g11"].dialogue.text` (g11 es la intervención 12; el identificador no cambia cuando editamos el texto).
- **Ubicación común del tablero móvil:** `scenes["tablero/movil"].layers`.
- **Ubicación del diálogo exclusivamente en la intervención 12 móvil:** `scenes["tutorial/g11-movil"].layers`. Equivalentes: `tutorial/g11-horizontal` y `tutorial/g11-escritorio`.
- **Herencia:** si no existe una posición particular, el elemento adopta la del tablero para ese formato. «Restaurar este elemento» borra solo la excepción de la intervención.
- **Seguridad:** editar composiciones no modifica el orden obligatorio de cartas, combos, puntos de vida ni resultados del tutorial.

**Colaboración:** puedo preparar un borrador desde GitHub en el mismo manifiesto, y tú puedes afinarlo desde DRStudio. Por ahora, tus retoques del móvil permanecen como borrador local hasta que los exportes y publiques explícitamente; las fases 3 y 4 resolverán la sincronización y publicación sin ZIP. Importar una composición debe respetar los borradores y usar la opción de fusionar si ya hiciste cambios.

Acceso directo en móvil: `https://afelex.github.io/Decreto-Real/?drDev=1#/game?studio=1`. Después de guardar, exporta para publicar y fusiona el PR preparado para aplicar los cambios al juego de todos.

### Fichas narrativas (Fase 1 · primer borrador)
Todas las **32 intervenciones** del primer duelo guiado tienen ahora una propuesta editorial de **personaje, intención emocional, objetivo dramático y dirección visual** en `public/studio/composiciones.json`. No se cambió ningún diálogo previo ni el orden de las acciones.

En **Studio · Tablero**, selecciona una intervención y abre **Ficha narrativa**. Puedes editar:
- **Personaje que habla**: se aplica inmediatamente al encabezado del diálogo del tutorial y permite cambiar entre Xervias, Domingo Quispe y Sistema; no modifica la baraja ni las reglas.
- **Intención emocional**: dato editorial para escoger las expresiones ilustradas en la fase 2; aún no cambia automáticamente la imagen.
- **Objetivo** y **Dirección visual**: indicaciones de autoría, que no ve el jugador.
- **Acción obligatoria**: lectura informativa, no editable, para que los cambios visuales no alteren el curso del duelo.

Estas fichas se almacenan en `scenes["tutorial/g11"].narrative`; el diálogo de ese mismo paso permanece en `.dialogue.text`. Al abrir un borrador antiguo, las nuevas anotaciones publicadas se incorporan **solo donde falten campos**: los textos, medios y posiciones que ya editaste prevalecen. No borres tus borradores para obtener las fichas.

Por ahora, la ficha y los retoques siguen el flujo de publicación segura por ZIP y PR. La selección de retratos por emoción, animaciones, audio, sincronización entre dispositivos y publicación directa todavía son trabajos de las siguientes fases.

## Otras pantallas de la historia
Abre **☷ Otras pantallas** (o `#/studio/escenas`) y elige una conversación tras victoria, la entrada o liberación de una región, la crónica, el epílogo o los créditos. En cada una puedes cambiar los textos (con **negrita**), el rótulo, el fondo y añadir sprites o efectos, y marcar textos o capas como «solo desarrollador». Se abren con una partida de prueba: tu partida real no cambia.

## Atajos de teclado
`Ctrl+Z` deshacer · `Ctrl+Shift+Z` rehacer · `Ctrl+S` guardar · `G` grilla · flechas para mover · `Alt` para arrastrar sin ajuste · `Esc` para vaciar la selección múltiple.

## Límites actuales
- El niño se ordena dentro del grupo de su madre.
- La caja de selección incluye la parte transparente del sprite.
- La publicación sigue limitada al prólogo; las demás pantallas corresponden a la fase 7.

## Publicar para todos los jugadores
1. Pulsa **⇪ Exportar para publicar**. El ZIP contiene el documento v3 y solo los medios usados; se comprueban firmas, referencias y límites (25 MB por archivo, 200 MB en total).
2. Aloja el ZIP en una URL HTTPS accesible sin credenciales. Ejecuta **Studio · Preparar publicación mediante PR** desde GitHub Actions e introduce esa URL.
3. El workflow valida el paquete, prepara `public/studio/composiciones.json` y `public/studio/media/`, elimina los medios publicados sin uso, ejecuta pruebas y compilación, y abre una rama `studio/publicacion-*` con un PR hacia `main`.
4. Revisa el PR antes de fusionarlo. El navegador nunca escribe en GitHub ni guarda tokens. La publicación llega al desplegar la versión fusionada.

Para preparar los mismos archivos localmente con Node 22 o superior:
```bash
node --experimental-strip-types tools/studio-publish.mjs ruta/al/paquete.zip
```

El juego aplica **composición base → publicación revisada → borrador local (solo QA)**. Fuera de QA no lee borradores ni IndexedDB y siempre oculta lo marcado solo dev. Si no existe publicación válida, conserva la composición base.

Al abrir Studio sin borrador se parte de la publicación. **Partir de lo publicado** sustituye el documento actual por la publicación y se puede deshacer; pulsa Guardar para conservarlo. Los archivos publicados se pueden exportar de nuevo sin tenerlos en la biblioteca local.
