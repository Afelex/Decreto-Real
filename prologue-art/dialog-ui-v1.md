# Decreto Real · Sistema de diálogo y puesta en escena v1

## Referencia funcional
Las capturas de *Yu-Gi-Oh! Duel Links* se utilizan solamente como referencia de **composición vertical**: fondos separados, personajes en capas y panel de lectura inferior. La interfaz, los símbolos y los sprites de este proyecto son originales de *Decreto Real*.

## Inventario aprobado de los 13 recursos UI
Se renderizan con **CSS / SVG / texto HTML**, sin generar nuevas imágenes por API.

| ID | Recurso | Implementación | Uso |
|---|---|---|---|
| UI01 | Caja principal | `StoryDialogue`, `.dcop-dialog-character` | Conversación |
| UI02 | Caja narrador | `.dcop-dialog-narrator` | Crónica y descripción |
| UI03 | Caja de pensamiento | `.dcop-dialog-thought` | Reflexión de Xervias |
| UI04 | Caja tutorial | `.dr-royal-story-coach` | Guía del GameBoard real |
| UI05 | Nameplate rojo | `.dcop-nameplate-player` | Xervias |
| UI06 | Nameplate azul | `.dcop-nameplate-authority` | Zhinchi |
| UI07 | Nameplate neutro | `.dcop-nameplate-neutral` | Domingo, civiles |
| UI08 | Nameplate sistema | `.dcop-nameplate-system` | Crónica y tutorial |
| UI09 | Indicador de avance | SVG de `StoryDialogue` | Avance con 44 px de toque |
| UI10 | Botón menú | `CampaignPauseMenu` | Menú, sonido, salir |
| UI11 | Llamada tutorial | Guía `.dr-royal-story-coach-hint` | Instrucción compacta |
| UI12 | Burbuja izquierda | `.dcop-quick-bubble.left` | Exclamación breve |
| UI13 | Burbuja derecha | `.dcop-quick-bubble.right` | Exclamación breve |

## Reglas de teatro visual
1. Los **fondos no contienen actores**; los personajes se montan en DOM, con WebP transparente.
2. Máximo **dos conjuntos de personajes simultáneos** (madre + niño cuentan como uno); la cámara y el foco alternan al cambiar el hablante.
3. El hablante crece levemente y se ilumina; el oyente permanece visible, atenuado. No se deforman los dibujos ni se aplica desenfoque fuerte.
4. Las intervenciones largas se paginan automáticamente en frases breves sin alterar su texto original.
5. El panel ocupa aproximadamente el 28 % inferior de un móvil vertical; siempre permanece dentro del viewport, sin scroll externo.
6. Los primeros planos de **pergamino, anillo y cetro** son *inserts*, no fondos permanentes con personajes dibujados. Conservar `plano_02_anillo.webp`.
7. La escena 8 utiliza **exclusivamente GameBoard**, sus cartas y sus efectos auténticos. La guía modifica decisiones permitidas, no reglas.
8. La conclusión pública conserva **solo** el título «Fin del Prólogo» y el botón «Volver al menú».

## Puesta en escena integrada en esta primera iteración
- **Escena 2:** pergamino y mesa, crónica en una caja sobria.
- **Escenas 3–4:** madre con niño y guardia; entra Xervias. Exclamaciones como globos cortos.
- **Escenas 5–6:** Xervias frente a Domingo; alternancia de luz y jerarquía de nombres.
- **Escena 7:** plano del anillo aprobado + carta auténtica como capa independiente.
- **Escena 8:** guía cian compacta en tablero real.
- **Escenas 9–12:** cambia la pareja en pantalla según el diálogo; Zhinchi entra inicialmente como voz fuera de campo, luego se revela.
- **Escena 13:** Xervias solo con caja de pensamiento, plaza atenuada.
- **Escena 14:** pantalla final sin nuevos controles.

## Validación antes de publicación
Node 22 y Node 24: unitarias, integración, tipos y build. En Chromium móvil: escena del arresto, diálogo de Zhinchi, primer plano del anillo, tutorial completo hasta el cuarto Impacto y final de un solo botón. Revisar manualmente a 360×800 y 390×844 que no existan textos cortados, rostros tapados ni scroll.
