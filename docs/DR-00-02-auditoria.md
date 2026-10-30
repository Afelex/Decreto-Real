# Decreto Real — Auditoría DR-00 a DR-02

**Fecha:** 30 de octubre de 2026  
**Rama revisada:** `codex/decreto-real-combate-v1`  
**Base:** `48cc638` (mismo commit que `main` al inicio de la revisión)  
**Alcance:** revisión local de código y verificaciones disponibles. No se modificó ni fusionó `main`; no se creó ni publicó un pull request.

## Resumen

La rama contiene una pantalla de combate nueva en `/duelo-v1` y conserva el juego anterior en `/game`. La muestra es jugable en términos de UI y tiene reglas puras para parte de sus efectos, pero todavía no alcanza la puerta de salida de DR-01 ni la de DR-02. La integración con Colección, tres barajas iniciales, tutorial guiado, motor determinista, resultados verificables y validación móvil siguen pendientes.

Se corrigieron dos defectos confirmados: el robo de “Inspiración” al llegar al límite de mano, y la continuación de las acciones temporizadas de la IA antigua mientras el menú de pausa está abierto. Se añadieron nueve pruebas automatizadas de reglas y robo.

## Estado por fase

| Fase | Estado | Evidencia y brecha principal |
|---|---|---|
| DR-00 — Base | Parcial | Hay ruta y prototipo aislados, catálogo estructurado y descripción visible de reglas. Falta cerrar/documentar contratos de integración, casos límite (agotamiento, empate, abandono, orden completo de efectos) y diagnóstico de la IA antigua. El alcance de Colección no está integrado. |
| DR-01 — Combate | Parcial; no cumple puerta de salida | `game/rules.ts` contiene funciones puras para ataque, escudo, Impactos, combo y robo. Ahora hay pruebas de ellas. Todavía no existe un motor de estado/acción atómica, aleatoriedad reproducible por semilla ni registro reproducible de eventos. No se pueden rechazar ilegalidades mediante un único motor independiente de la UI. |
| DR-02 — Muestra jugable | Parcial; no cumple puerta de salida | `/duelo-v1` permite iniciar un duelo contra una IA sencilla, jugar cartas, pausar durante el turno del jugador y ver un resultado. El acceso se agregó como “Probar nuevo combate” desde el menú. La ayuda es una guía estática, hay un solo mazo aleatorio de 24 cartas, no hay tres barajas predefinidas ni personalización y no se ha probado con investigadores. |

## Funciones revisadas

| Área | Completo en la muestra | Pendiente o defectuoso |
|---|---|---|
| Reglas | Daño absorbe escudo antes de vida; tope de mano; combo de tres; Impactos en orden, uno por turno; victoria por vida o cuarto Impacto. | Fatiga/fin de partida por agotamiento no está definida; no hay límite de turnos ni empate. La ayuda no cubre ese caso. No se conserva una semilla para repetir partidas. |
| IA nueva | Resuelve una respuesta por turno, contempla tres perfiles de dificultad y puede cerrar con el Impacto Final. | No evalúa secuencias ni daño letal de manera general; sus decisiones usan probabilidades simples y no son reproducibles. La pausa no se puede abrir durante la espera breve de la IA porque el botón se deshabilita mientras `busy`. |
| IA antigua (`/game`) | La rutina automatiza el turno rival. | Leía métricas capturadas al inicio del turno para decisiones sucesivas (incluido el combo/medidor), como advertía la hoja de ruta. No se rediseñó en esta revisión. La pausa sí era defectuosa: continuaba la rutina durante el menú; ahora la rutina espera hasta reanudar y cancela al desmontar el componente. |
| Pausa nueva | En el turno del jugador, el panel cubre los controles y permite continuar o volver al menú. | No se abrió durante el turno de la IA; el botón queda inhabilitado en ese lapso. Falta validación interactiva en navegador. |
| Victoria/derrota | El prototipo deriva fin de partida de vida o Impactos y presenta un resumen. | No hay prueba de integración/render para ambos resultados. La pantalla antigua de resultado incluye puntuaciones fijas; no equivalen a un resultado calculado ni a un ranking y deben tratarse como contenido de muestra. |
| Agotamiento | El robo no inventa cartas ni excede la mano máxima; el contador de mazo llega a cero. | El mazo vacío no produce fatiga ni finaliza la partida, por decisión aún pendiente de reglas. No se añadieron mecánicas para resolverlo. El mensaje de Apoyo ya informa cuando no se pudo robar. |
| Móvil | Hay estilos responsivos, mano desplazable horizontalmente, `100svh`/`100dvh` y respeto por movimiento reducido. | No había Chromium disponible en el entorno para medir desbordamiento/recortes con viewports reales. No se verificó en Android ni iOS. La estabilidad móvil queda pendiente de QA visual en tamaños pequeños y en orientación horizontal. |
| Integración | Ruta separada accesible desde el menú de prueba. | No reemplaza “Reales Ideales” por Decreto Real en Colección; no comparte identidad, sesión, inventario o cartas con Peruanistas. Esto corresponde a fases posteriores y se mantuvo fuera del alcance. |

## Cambios hechos en esta revisión

- Se extrajo `drawFromPile` como regla pura y se corrigió “Inspiración”: el cálculo usa la mano después de retirar la carta jugada. Antes, con seis cartas, la función veía la mano llena y denegaba el robo aunque la carta de Apoyo dejaba espacio.
- Cuando no hay robo posible, el mensaje de Apoyo ya no afirma que se robó una carta.
- La IA antigua espera mientras el menú de pausa permanece abierto y evita continuar si la partida termina o el componente se desmonta.
- Se agregaron nueve casos automatizados para daño/escudo, límites, Impactos, combos, robo, mazo vacío y el espacio liberado por una carta de Apoyo.

## Verificaciones ejecutadas

| Comando | Resultado |
|---|---|
| `npm run test:rules` | Aprobado: 9 pruebas, 0 fallidas. |
| `npx tsc --noEmit` | Aprobado: sin errores de tipos. |
| `npm run build` | Aprobado: Vite generó el build de producción. |
| `git diff --check` | Aprobado: sin errores de espacios/parches. |

El entorno mostró una advertencia de configuración npm `Unknown env config "http-proxy"`; no impidió ninguna de las verificaciones.

## Riesgos y trabajo pendiente antes de aceptar DR-02

1. Resolver y escribir la regla de agotamiento y el caso de partida que no termina; cubrirla con pruebas sin cambiarla hasta que esté aprobada.
2. Completar el motor determinista de DR-01, RNG con semilla, acciones legales y log de eventos; migrar el flujo de la IA antigua para eliminar el uso de estado capturado.
3. Añadir pruebas de integración de pausa/reanudación, victoria, derrota y transición de turnos. Las nueve pruebas actuales verifican funciones puras, no el montaje React ni los temporizadores.
4. Probar la partida en navegador real a 360 px, 320 px, altura reducida y orientación horizontal, incluyendo mano llena y diálogos abiertos.
5. Hacer prueba observada con investigadores: comprensión, duración, decisiones, finalización sin ayuda y deseo de revancha.
6. Acordar qué cambios de esta rama son parte del PR. La rama local aún contiene trabajo previo no confirmado, además de los cambios de esta auditoría.

## Preparación para pull request

**No está listo para solicitar revisión de DR-00 a DR-02 como entregas completas.** Está en condición de PR incremental etiquetado como “prototipo / QA parcial” si se desea revisar estos cambios y las brechas quedan claramente visibles. Antes de abrirlo, revisar el diff completo, separar el trabajo previo del arreglo de auditoría y completar QA de navegador/móvil. La rama sigue local y sin commit nuevo en esta revisión; `main` permanece intacta y no se realizó fusión.
