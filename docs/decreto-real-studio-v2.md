# Decreto Real Studio v2 — Guía de edición del prólogo

**Acceso en navegador móvil o PC:** https://afelex.github.io/Decreto-Real/?drDev=1#/studio

También se abre desde el menú **QA · Historia → Abrir Decreto Real Studio**.

## 1. Escoger cualquier intervención
Selecciona directamente una de las **49 intervenciones** en "Ir a cualquier intervención" o utiliza ‹ / ›.
El editor muestra **los mismos personajes, diálogos y fondos que el juego real**, no una maqueta distinta. En cada intervención se guardan posiciones independientes.

Si no ves al personaje, revisa el selector **Elemento a editar**, o añade un sprite con su imagen mediante el botón **+ Sprite PNG / WebP**. Una intervención puede tener distintos actores de otra intervención.

## 2. Editar un personaje
Selecciona el personaje tocándolo o desde **Elemento a editar**. Puedes:
- Arrastrarlo con el dedo o el ratón.
- Ajustar X/Y (% de pantalla), escala 35–275 %, dirección mediante **Espejar** y capa 1–30.
- **Reemplazar imagen**: abre el selector local de PNG, WebP, JPEG o GIF para ese personaje solo en la intervención actual.
- **Quitar de escena**: los personajes de la historia se ocultan (no se borran del juego); los sprites añadidos se eliminan de esa intervención.
- **Restaurar este elemento**: retira cambios y reemplazo, o restituye las transformaciones iniciales si se trata de un sprite añadido.
- **Deshacer**: revierte el último cambio.

**Aviso:** los PNG transparentes funcionan mejor que una imagen con fondo opaco para representar actores completos.

## 3. Añadir nuevas imágenes y efectos
- **+ Sprite PNG / WebP**: importa una imagen nueva como capa independiente que puedes mover, ampliar, espejar, reordenar y eliminar.
- **✦ GIF / video / efecto**: importa una imagen, GIF animado, MP4 o WebM como efecto visual independiente. Los videos se reproducen **en silencio, en bucle**.
- **▧ Cambiar fondo**: reemplaza el escenario por una imagen o video solo en esa intervención.
- **↺ Fondo original**: restituye el escenario por defecto.
- Cada archivo tiene un límite de **25 MB**. El editor conserva archivos con **IndexedDB** del navegador.

## 4. Globos y rótulos
Cuando una intervención contiene un globo breve (por ejemplo «¡Por favor!»), puedes seleccionarlo como **Globo de texto** para editar sus palabras, moverlo, cambiar su escala y su capa. Utiliza **Ocultar globo** para quitarlo de esa intervención; el diálogo principal no desaparece. También puedes **Ocultar título**, que quita el pequeño rótulo narrativo colocado encima del cuadro principal.

## 5. Comprobar en el juego
1. Haz las modificaciones.
2. Pulsa **Guardar borrador**, o cambia de intervención (Studio guarda automáticamente al cambiar).
3. Pulsa **▶ Ver esta escena en Historia**, o **▶ Historia** en la parte superior.
4. Verás la escena **sin el editor** y con sus cambios locales aplicados.
5. Pulsa **✎ Volver a Studio** para regresar exactamente a la intervención que estabas revisando.

Este modo de previsualización **no modifica el progreso real** de tu partida.

## 6. Guardar y respaldar
- **Guardar borrador** conserva tamaños, posiciones, imagen reemplazada y opciones en el mismo navegador/dispositivo.
- **⇩ Exportar proyecto** descarga un archivo JSON que incluye configuraciones y las imágenes y videos utilizados (hasta **70 MB** de recursos). Guárdalo en tu computador u otra ubicación segura.
- **⇧ Importar proyecto** recupera el respaldo con sus recursos multimedia.
- Los documentos anteriores de **Studio v1** siguen siendo compatibles.

**Limitación:** los cambios son locales, privados y de QA. No se fusionan ni se publican para todos los usuarios al pulsar Guardar. La publicación centralizada/por aprobación vendrá en una versión posterior. Cambiar de móvil, limpiar datos del navegador o usar modo incógnito puede hacer que se pierdan los borradores no exportados.

## 7. Alcance
Esta versión se concentra en las **escenas cinematográficas del prólogo y desenlace**. No modifica el tablero de cartas ni las reglas del duelo. Las funciones de publicación central, biblioteca colaborativa y edición de otras misiones están previstas para versiones posteriores.
