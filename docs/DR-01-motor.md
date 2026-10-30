# DR-01 — Contrato del motor del prototipo

Versión de reglas/registro: `dr-combat-2` (lee también `dr-combat-1`). Implementación: `game/combatEngine.ts`; textos en `game/combatText.ts`; guardado en `game/combatSave.ts`.
Se aplica a `/duelo-v1` y `/duelo-v1/tutorial`; `/game` conserva el combate anterior y su controlador de IA.

## Política de compatibilidad de registros

Definida antes de cambiar el formato de eventos (octubre de 2026):

1. **La versión identifica** reglas, catálogo, consumo de RNG, semántica de acciones y el esquema de los *datos* de eventos. Cambiar cualquiera de ellos exige una versión nueva.
2. **Los textos no forman parte del registro.** Desde `dr-combat-2` los eventos solo contienen `type`, `turn` y `data`; los mensajes se derivan en `combatText.ts`. Corregir o traducir un texto no invalida registros ni exige versión.
3. **Comparación estricta para la versión actual:** el replay exige eventos idénticos en JSON, incluidos campos inesperados.
4. **Versiones anteriores admitidas** (`LEGACY_VERSIONS`): se reproducen con las reglas actuales y se comparan por proyección —mismo número de eventos, tipo, turno y cada campo de `data` que el registro antiguo guardó—. Se ignoran sus mensajes. Al exportar de nuevo, el registro sale en la versión actual. Esto solo es válido mientras reglas y RNG sean iguales; si cambian, la versión antigua se retira de `LEGACY_VERSIONS` y sus registros se rechazan con un mensaje de versión incompatible.
5. **Campos nuevos solo se añaden.** `dr-combat-2` conserva todos los campos de `dr-combat-1` y añade: `amount` y `shield` en la defensa del jugador; `gained` en la del rival; `incoming` en el ataque rival; `damage` y `healing` en el Impacto rival.
6. **Rechazo explícito:** versión desconocida, forma inválida (`invalidRecord`), acción ilegal o eventos divergentes lanzan error; nunca se acepta parcialmente un registro.

Motivo del cambio: con `dr-combat-1` un texto erróneo era parte del registro. La defensa con el escudo cerca del tope mostraba «obtienes 7 de escudo» con `gained: 4`, y el rival «obtiene 3» con el escudo ya en 10. Corregirlo sin esta política habría invalidado todos los registros. El fixture `game/fixtures/dr-combat-1-record.json`, generado con el motor anterior, demuestra la lectura de registros antiguos; además se reprodujeron 600 registros v1 (200 semillas × 3 dificultades, tres estrategias de juego) con estado final idéntico al del motor anterior.

## Entrada, salida y reproducción

- `createCombat(seed, difficulty)` crea un estado serializable. La semilla es un entero de 32 bits sin signo, incluido cero. La dificultad inicial se conserva por separado de los cambios durante la partida.
- `canonicalAction(input)` copia solo los campos que define cada acción (`type`, `cardId` o `value`). El registro guarda siempre la forma canónica; campos ajenos o no clonables se descartan.
- `invalidAction(state, action)` devuelve un motivo o `null`. Valida versión, resultado, pausa, turno, carta en mano, Impactos en orden y uno por turno, y mando.
- `playBlockReason(state, cardId)` devuelve el motivo estructurado (`finished`, `paused`, `not_your_turn`, `not_in_hand`, `impact_order`, `impact_used`, `mana`). La interfaz lo usa para explicar bloqueos; `invalidAction` lo usa para jugar cartas, así no hay dos criterios.
- `applyCombatAction(state, action)` devuelve `{ state, events, error }`. No modifica la entrada. Si rechaza la acción, devuelve la misma referencia, ningún evento y un motivo; no consume aleatoriedad ni añade una entrada al registro.
- `exportCombat(state)` produce `{ version, seed, difficulty, journal }`, apto para JSON e independiente del estado.
- `invalidRecord(input)` comprueba la forma de un registro externo: versión admitida, semilla, dificultad, acciones canónicas y eventos con `type`, `turn` y `data`.
- `replayCombat(record)` aplica `invalidRecord`, inicializa desde la semilla, reaplica las acciones y compara eventos según la política anterior.

Ejemplo reproducible sin navegador:

```ts
import { createCombat, applyCombatAction, exportCombat, replayCombat } from './game/combatEngine.ts';
let state = createCombat(42, 'Estratega');
state = applyCombatAction(state, { type: 'end_turn' }).state;
state = applyCombatAction(state, { type: 'resolve_rival' }).state;
const record = JSON.parse(JSON.stringify(exportCombat(state)));
const restored = replayCombat(record); // mismo estado completo, RNG y registro
```

La reproducción verifica consistencia, no autenticidad: no es una firma, protección competitiva ni validación de servidor. La semilla se genera con `crypto.getRandomValues` solo al crear la partida en la interfaz. El motor no consulta reloj, DOM, almacenamiento ni aleatoriedad global.

## Acciones y eventos

| Acción | Condición | Resultado |
|---|---|---|
| `play`, `cardId` | Turno del jugador, carta en mano y jugable | Carta al descarte, mando consumido, efecto y combo resueltos atómicamente |
| `end_turn` | Turno del jugador | Pasa al rival |
| `resolve_rival` | Turno rival | Respuesta de IA con RNG guardado, robo y siguiente turno; comprueba resultado |
| `pause` / `resume` | Pausa coherente, partida sin terminar | Bloquea/restaura acciones sin consumir RNG |
| `difficulty`, `value` | Valor admitido, sin pausa y partida activa | Cambia el perfil y registra el cambio para reproducción |

Los eventos contienen tipo, turno y datos estructurados de lo realmente aplicado: carta, ataque (daño, bloqueo, escudo restante, bono o ataque entrante), escudo (ganancia real, cantidad pedida y resultado), Impacto (sellos, daño, curación), robo, turno, resultado, pausa y dificultad. `combatText.ts` deriva de ellos el mensaje del tablero y el historial; por ejemplo, una defensa con el escudo en 10 indica «obtienes 2 de escudo (tope 12; 2 sin efecto)». No se registra tiempo real.

## Coste del registro (medido antes de optimizar)

| Escenario | `dr-combat-1` | `dr-combat-2` |
|---|---:|---:|
| 3.000 partidas con estrategia voraz (semillas 0–999 × 3 dificultades) | mediana 34 entradas, máx. 60; JSON máx. 14,3 KB | mismas entradas; JSON máx. 11,5 KB (sin mensajes) |
| Jugador pasivo, Aprendiz, 1.000 semillas | máx. 68 entradas, 14,8 KB | máx. 68 entradas, 11,5 KB |
| 1.000 acciones (pausa/reanudar) | construir 972 ms, replay 933 ms | 36 ms / 39 ms |
| 5.000 acciones | 24,3 s / 24,2 s | 207 ms / 221 ms |
| 10.000 acciones | 101,7 s / 103,5 s; siguiente acción 21 ms | 448 ms / 441 ms; siguiente acción 0,05 ms |

Medido en el contenedor de desarrollo con Node 22.22.0; las cifras son orientativas, no un banco de pruebas formal. Las partidas naturales son cortas; el coste cuadrático solo aparecía al inflar el registro, pero bloqueaba la recuperación de una partida guardada. Causa: `structuredClone(state)` copiaba todo el registro en cada acción. Ahora se clona el estado sin registro y las entradas, congeladas con `Object.freeze`, se comparten entre estados sucesivos. Se conserva la información completa para reproducir. La regresión `journal cost grows linearly` construye y reproduce 5.000 acciones con un límite holgado de 6 s.

## Mecánicas conservadas

24 cartas existentes, mano inicial de cuatro, tope de seis, 20 de vida, tres de mando por turno; mismos costes y efectos. Se mantienen el combo de tres cartas, escudos persistentes (tope del jugador 12, rival 10), cuatro Impactos ordenados y uno por turno del jugador. La IA conserva sus probabilidades, prioridades, consumo de RNG y una respuesta por turno. El contador y robo tras la respuesta rival conservan el comportamiento anterior incluso si esa respuesta es letal. El daño de Impacto no pasa por escudo. No se añadieron cartas ni reglas. La equivalencia se comprobó reproduciendo 600 registros generados con el motor anterior: mismo estado final campo a campo.

La UI conserva estilos y diálogos. Su efecto de 700 ms únicamente envía `resolve_rival` y se limpia al salir/desmontar o pausar; el motor resuelve la acción completa.

## Decisión pendiente: agotamiento

El robo de mazo vacío permanece sin efecto. No hay fatiga, reciclaje, límite de turnos ni empate nuevo. Una partida sin salida sigue siendo un riesgo pendiente de diseño; este trabajo no declara cerrada la puerta completa de DR-01.

## Verificaciones

`npm test`: 42 pruebas (9 reglas, 4 controlador anterior de IA, 20 motor y textos, 6 guardado y 3 del guion del tutorial). Cubren ilegalidades, atomicidad, turnos, pausa, victoria/derrota, 40 semillas reproducidas, compatibilidad `dr-combat-1`, textos de escudo y respuesta rival, acciones canónicas, registro compartido y congelado, coste lineal, validación de registros externos y motivos de bloqueo. Aprobadas en Node 22.22.0 y 24.22.2 locales y en los trabajos Node 22/24 de CI.
