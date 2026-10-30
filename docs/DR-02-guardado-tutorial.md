# DR-02 — Guardado local, recuperación y tutorial guiado

30 de octubre de 2026. Rama `codex/decreto-real-combate-v1`. Afecta a `/duelo-v1` y a la nueva ruta `/duelo-v1/tutorial`. `/game` no cambia.

## Guardado y recuperación

Implementación: `game/combatSave.ts` (lógica pura con almacenamiento inyectado) y `screens/CombatPrototype.tsx` (entrada a la pantalla).

| Aspecto | Comportamiento |
|---|---|
| Qué se guarda | Solo el registro del motor: `{ format: 1, record: { version, seed, difficulty, journal } }` en la clave `decreto-real.duelo-v1.partida` de `localStorage` |
| Cuándo | Después de cada acción aceptada por el motor (crecimiento del registro). Una partida sin jugadas no se guarda; al terminar una partida se borra |
| Recuperación | Al entrar en `/duelo-v1`, si hay una partida recuperable, aparece «¿Continuar el duelo?» con el resumen (turno, vidas, Impactos, IA) y los botones «Continuar partida» y «Nueva partida» |
| Validación | Tamaño máximo 2 M caracteres, JSON, formato, versión admitida, forma (`invalidRecord`) y **replay completo** con comparación de eventos. Nunca se usa un objeto de estado leído del almacenamiento |
| Mismo estado | El replay reconstruye estado, RNG, dificultad inicial y actual, pausa y registro; continuar produce el mismo futuro que la partida original (probado) |
| Respuesta rival pendiente | Si se cerró tras «Terminar turno», se restaura en fase rival; el temporizador de 700 ms envía `resolve_rival` una vez. El motor rechaza una segunda respuesta. Si se cerró justo después de resolverla y antes de guardar, se restaura el estado previo y la respuesta, determinista, se repite idéntica: no se duplica ni se pierde |
| Nueva partida | No borra la guardada al pulsar: la reemplaza con la primera jugada aceptada. Salir sin jugar conserva la anterior |
| Datos dañados | Mensaje «La partida guardada está dañada o incompleta…» y «Descartar y empezar una nueva». Se conservan hasta esa decisión |
| Versión incompatible | Mensaje específico de versión. Registros `dr-combat-1` sí se recuperan (política de DR-01) |
| Almacenamiento no disponible | El duelo se juega; aviso «Este navegador no permite guardar…» y estado «⚠ Sin guardar». Antes la pantalla se rompía (ver defectos) |
| Cuota agotada | Aviso «No hay espacio de almacenamiento…», el juego continúa |
| Datos ajenos | Solo se elimina la clave propia; nunca `localStorage.clear()`. Preferencias: `decreto-difficulty` (existente) y `decreto-real.duelo-v1.tutorial` |
| Estado visible | Encabezado «✓ Guardado» o «⚠ Sin guardar»; detalle en la pausa; aviso «Partida recuperada en el turno N» que desaparece con la siguiente jugada |

Limitaciones: el guardado vive en un navegador y perfil; **no es sincronización entre dispositivos, copia de seguridad ni protección competitiva**. Cualquiera con acceso al navegador puede leerlo o borrarlo, y un registro válido puede construirse a mano. Dos pestañas abiertas a la vez escriben la misma clave: gana la última jugada, sin aviso. Borrar datos del sitio elimina la partida. La recuperación de un registro enorme (límite 2 M caracteres, ~20.000 acciones) puede tardar alrededor de un segundo en un equipo de escritorio; en teléfonos no se midió.

## Tutorial guiado

Implementación: `game/tutorial.ts` (guion puro) y `screens/TutorialScreen.tsx` sobre el mismo `DuelBoard` del duelo.

- **Mismo motor, situación preparada aislada:** semilla fija 2308 en Aprendiz, cuya mano inicial contiene Golpe preciso, Guardia real, Bastión e Impacto I. No hay estados inyectados ni otra implementación de combate: cada jugada es una acción normal del motor. `tutorial.test.ts` falla si catálogo, barajado o RNG cambian y la semilla deja de servir.
- **Sin efectos persistentes:** el tutorial no recibe almacenamiento, no escribe la partida guardada ni cambia la dificultad preferida. Solo marca `decreto-real.duelo-v1.tutorial` para no volver a ofrecerlo.
- **Pasos (una acción principal cada uno):** bienvenida → seleccionar Golpe preciso → confirmar → jugar Bastión → leer por qué Impacto I está bloqueado (mando) y terminar turno → leer la respuesta rival real (ataque de 3 bloqueado por el escudo) → nuevo turno y sellar Impacto I → completado.
- **Guía:** el panel ocupa el campo de batalla; en teléfonos verticales queda fijo arriba al desplazarse. El objetivo lleva contorno pulsante (estático con movimiento reducido) y se desplaza a la vista. Las demás cartas y «Terminar turno» quedan atenuadas; tocarlas explica «Sigue el paso indicado en la guía» sin llegar al motor.
- **Omitir, abandonar, repetir, volver a consultar:** primera visita a `/duelo-v1` ofrece «Aprender a jugar» o «Ir directamente al duelo»; «Omitir» y «Salir» están siempre en el encabezado; «Repetir tutorial» al final crea la misma situación desde cero; la ayuda (?) del duelo incluye «Ver tutorial guiado».

Decisión técnica: el progreso se deriva del registro del motor, la carta seleccionada y los pasos leídos. Cancelar una selección vuelve al paso anterior y no hay estado de guion que pueda desincronizarse del motor.

## Defectos corregidos en la interfaz

| Defecto | Reproducción | Regresión |
|---|---|---|
| La pantalla se rompía con `localStorage` bloqueado (`SecurityError` al leer la dificultad en el inicializador) | Montar la versión `454a3a4` con el getter de `localStorage` lanzando `SecurityError`: el render lanza la excepción | Integración «plays normally when storage is unavailable» |
| Los Impactos propios no aparecían en el tablero; los del rival se ocultaban a 370 px o menos | Inspección de `CombatPrototype.tsx` y CSS (`.dr-seals { display:none }`); captura a 320 px | Integración «shows both players’ Impacts»; E2E de legibilidad en cinco tamaños |
| Mensajes de escudo que no coincidían con lo aplicado | Registro v1 semilla 1/Maestro, entradas 9 y 42 (DR-01) | Pruebas de textos en `combatEngine.test.ts` |
| Tocar una carta bloqueada no explicaba nada; «Juega en orden» también se mostraba cuando el motivo era «uno por turno» | Revisión de código: dos criterios distintos en UI y motor | Integración «explains why a blocked card cannot be played» |
| «· Historial» a 9,6 px y textos de 7–9 px en cartas, sellos y listas | E2E de legibilidad en Chromium real, primera ejecución fallida en los cinco tamaños | E2E «decision information is visible and readable» |
| A 320–360 px «Menú»/«Omitir» se solapaban con el título y la ficha «Jugada del rival» quedaba tapada por el mensaje | Capturas de Chromium a 320×568 | Revisión visual de capturas; sin aserción automática de solapamiento |
| El aviso «Partida recuperada» tapaba «TURNO DEL RIVAL» al recuperar una respuesta pendiente | Integración de recuperación fallida | Integración «resolves a rival response interrupted by a reload exactly once» |

Otros cambios: el título del resultado recibe el foco; «Jugar otra vez» crea una partida nueva sin recargar el documento; la elevación de cartas al pasar el puntero solo se aplica en dispositivos con `hover`; foco visible común (`:focus-visible`); contador «Mano N/6» y aviso «Desliza para ver todas →» cuando la mano no cabe.
