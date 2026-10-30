# Decreto Real — Auditoría DR-00 a DR-02

**Fecha:** 30 de octubre de 2026  
**Rama revisada:** `codex/decreto-real-combate-v1`  
**Base:** `48cc638` (mismo commit que `main` al inicio de la revisión)  
**Alcance:** revisión local de código y verificaciones disponibles. No se modificó ni fusionó `main`; no se abrió un pull request. El trabajo previo se publicó en la rama de desarrollo (commit `ed64db94d56a830b02e44dfea4a3422495c90ba4`).

## Resumen

La rama contiene una pantalla de combate nueva en `/duelo-v1` y conserva el juego anterior en `/game`. La muestra es jugable en términos de UI y tiene reglas puras para parte de sus efectos, pero todavía no alcanza la puerta de salida de DR-01 ni la de DR-02. La integración con Colección, tres barajas iniciales, tutorial guiado, motor determinista, resultados verificables y validación móvil siguen pendientes.

Se corrigieron dos defectos confirmados: el robo de “Inspiración” al llegar al límite de mano, y la continuación de las acciones temporizadas de la IA antigua mientras el menú de pausa está abierto. Se añadieron nueve pruebas automatizadas de reglas y robo. La consolidación posterior corrige la lectura de estado de la IA antigua y añade cuatro pruebas de turnos y temporizadores.

## Estado por fase

| Fase | Estado | Evidencia y brecha principal |
|---|---|---|
| DR-00 — Base | Parcial | Hay ruta y prototipo aislados, catálogo estructurado y descripción visible de reglas. Falta cerrar/documentar contratos de integración, casos límite (agotamiento, empate, abandono, orden completo de efectos) y validación de interfaz de la IA antigua. El alcance de Colección no está integrado. |
| DR-01 — Combate | Parcial; no cumple puerta de salida | `game/rules.ts` contiene funciones puras para ataque, escudo, Impactos, combo y robo. Ahora hay pruebas de ellas. Todavía no existe un motor de estado/acción atómica, aleatoriedad reproducible por semilla ni registro reproducible de eventos. No se pueden rechazar ilegalidades mediante un único motor independiente de la UI. |
| DR-02 — Muestra jugable | Parcial; no cumple puerta de salida | `/duelo-v1` permite iniciar un duelo contra una IA sencilla, jugar cartas, pausar durante el turno del jugador y ver un resultado. El acceso se agregó como “Probar nuevo combate” desde el menú. La ayuda es una guía estática, hay un solo mazo aleatorio de 24 cartas, no hay tres barajas predefinidas ni personalización y no se ha probado con investigadores. |

## Funciones revisadas

| Área | Completo en la muestra | Pendiente o defectuoso |
|---|---|---|
| Reglas | Daño absorbe escudo antes de vida; tope de mano; combo de tres; Impactos en orden, uno por turno; victoria por vida o cuarto Impacto. | Fatiga/fin de partida por agotamiento no está definida; no hay límite de turnos ni empate. La ayuda no cubre ese caso. No se conserva una semilla para repetir partidas. |
| IA nueva | Resuelve una respuesta por turno, contempla tres perfiles de dificultad y puede cerrar con el Impacto Final. | No evalúa secuencias ni daño letal de manera general; sus decisiones usan probabilidades simples y no son reproducibles. La pausa no se puede abrir durante la espera breve de la IA porque el botón se deshabilita mientras `busy`. |
| IA antigua (`/game`) | La rutina automatiza el turno rival. | Resuelto: la rutina lee mano, vida y nivel de Impacto actualizados entre acciones; usa la función de jugada del render actual y el medidor actual. La habilidad diferida decide con la vida vigente. Un controlador por turno conserva el tiempo restante al pausar y cancela cartas, habilidades y finalización al salir del turno/desmontar. La prioridad sigue siendo Impacto legal, defensas con vida menor de cinco y ataques. Falta validación interactiva de React. |
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
| `npm run test:ai` | Aprobado: 4 pruebas, 0 fallidas: turnos consecutivos con estado actualizado, pausa/reanudación sin duplicar jugadas, cancelación de habilidades pendientes y cancelación tras una carta. |
| `npx tsc --noEmit` | Aprobado: sin errores de tipos. |
| `npm run build` | Aprobado: Vite generó el build de producción. |
| `git diff --check` | Aprobado: sin errores de espacios/parches. |

El entorno mostró una advertencia de configuración npm `Unknown env config "http-proxy"`; no impidió ninguna de las verificaciones.

## Riesgos y trabajo pendiente antes de aceptar DR-02

1. Resolver y escribir la regla de agotamiento y el caso de partida que no termina; cubrirla con pruebas sin cambiarla hasta que esté aprobada.
2. Completar el motor determinista de DR-01, RNG con semilla, acciones legales y log de eventos; completar la validación de la conexión React de la IA antigua; el defecto de estado capturado se corrigió en esta consolidación.
3. Añadir pruebas de integración de pausa/reanudación, victoria, derrota y transición de turnos. Las trece pruebas actuales verifican reglas y el ejecutor real de IA con temporizadores simulados, pero no montan React. Se ejecutaron en Node 24.22.1; no se comprobó aún el runner en Node 22. Los temporizadores de banners, moneda y efectos visuales antiguos siguen fuera de este controlador de IA.
4. Probar la partida en navegador real a 360 px, 320 px, altura reducida y orientación horizontal, incluyendo mano llena y diálogos abiertos.
5. Hacer prueba observada con investigadores: comprensión, duración, decisiones, finalización sin ayuda y deseo de revancha.
6. Revisar los tres commits de desarrollo antes de abrir el PR; el trabajo previo ya está consolidado y publicado. No se abrió ningún PR.

## Preparación para pull request

**No está listo para solicitar revisión de DR-00 a DR-02 como entregas completas.** Está en condición de PR incremental etiquetado como “prototipo / QA parcial” si se desea revisar estos cambios y las brechas quedan claramente visibles. Antes de abrirlo, revisar el diff completo, separar el trabajo previo del arreglo de auditoría y completar QA de navegador/móvil. El trabajo se organiza en tres commits coherentes: prototipo, correcciones/pruebas iniciales y corrección de estado/temporizadores de IA. La publicación utiliza el conector de GitHub porque el envío directo de Git carece de credenciales; los árboles se cotejan con los locales. `main` permanece en `48cc6386ab151e53ee3086216bec21ba94a6761d` y no se realizó fusión. No se incluyeron `node_modules`, `dist`, secretos detectados ni archivos temporales; `package-lock.json` conserva las versiones reproducibles.
