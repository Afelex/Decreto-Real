# DR-01 — Contrato del motor del prototipo

Versión de reglas/registro: `dr-combat-1`. Implementación: `game/combatEngine.ts`.
Se aplica a `/duelo-v1`; `/game` conserva el combate anterior y su controlador de IA.

## Entrada, salida y reproducción

- `createCombat(seed, difficulty)` crea un estado serializable. La semilla es un entero de 32 bits sin signo, incluido cero. La dificultad inicial se conserva por separado de los cambios durante la partida.
- `invalidAction(state, action)` devuelve un motivo o `null`. Valida turno, pausa, resultado, carta en mano, coste e Impactos en orden/uno por turno. Rechaza tipos desconocidos y dificultades inválidas.
- `applyCombatAction(state, action)` devuelve `{ state, events, error }`. No modifica la entrada. Si rechaza la acción, devuelve el mismo estado, ningún evento y un motivo; no consume aleatoriedad ni añade una entrada al registro.
- `exportCombat(state)` produce `{ version, seed, difficulty, journal }`, apto para JSON. Cada entrada contiene la acción aceptada y sus eventos en orden.
- `replayCombat(record)` inicializa desde la semilla y reaplica las acciones; comprueba los eventos generados y rechaza versiones incompatibles, acciones ilegales o eventos divergentes.

Ejemplo reproducible sin navegador:

```ts
import { createCombat, applyCombatAction, exportCombat, replayCombat } from './game/combatEngine.ts';
let state = createCombat(42, 'Estratega');
state = applyCombatAction(state, { type: 'end_turn' }).state;
state = applyCombatAction(state, { type: 'resolve_rival' }).state;
const record = JSON.parse(JSON.stringify(exportCombat(state)));
const restored = replayCombat(record); // mismo estado completo, RNG y registro
```

La reproducción verifica consistencia, no autenticidad: no es una firma, protección competitiva ni validación de servidor. El registro y estado permanecen en memoria; no hay botón de descarga, persistencia automática ni reconexión. La semilla se genera con `crypto.getRandomValues` solo al crear la partida en la interfaz. El motor no consulta reloj, DOM, almacenamiento ni aleatoriedad global.

## Acciones y eventos

| Acción | Condición | Resultado |
|---|---|---|
| `play`, `cardId` | Turno del jugador, carta en mano y jugable | Carta al descarte, mando consumido, efecto y combo resueltos atómicamente |
| `end_turn` | Turno del jugador | Pasa al rival |
| `resolve_rival` | Turno rival | Respuesta de IA con RNG guardado, robo y siguiente turno; comprueba resultado |
| `pause` / `resume` | Pausa coherente, partida sin terminar | Bloquea/restaura acciones sin consumir RNG |
| `difficulty`, `value` | Valor admitido, sin pausa y partida activa | Cambia el perfil y registra el cambio para reproducción |

Los eventos incluyen tipo, turno y datos estructurados para carta, ataque, escudo, Impacto, robo, cambio de turno, resultado, pausa y dificultad. Los mensajes del historial se derivan de estos eventos; no controlan las reglas. No se registra tiempo real.

## Mecánicas conservadas

24 cartas existentes, mano inicial de cuatro, tope de seis, 20 de vida, tres de mando por turno; mismos costes y efectos. Se mantienen el combo de tres cartas, escudos persistentes (tope del jugador 12, rival 10), cuatro Impactos ordenados y uno por turno del jugador. La IA conserva sus probabilidades, prioridades y una respuesta por turno. El contador y robo tras la respuesta rival conservan el comportamiento anterior incluso si esa respuesta es letal. El daño de Impacto no pasa por escudo. No se añadieron cartas ni reglas.

La UI conserva estilos y diálogos. Su efecto de 700 ms únicamente envía `resolve_rival` y se limpia al salir/desmontar o pausar; el motor resuelve la acción completa. El botón de pausa sigue deshabilitado durante la respuesta rival como antes. La pantalla antigua tiene un controlador distinto que conserva el tiempo restante de cada espera.

## Decisión pendiente: agotamiento

El robo de mazo vacío permanece sin efecto. No hay fatiga, reciclaje, límite de turnos ni empate nuevo. Una partida sin salida sigue siendo un riesgo pendiente de diseño; este trabajo no declara cerrada la puerta completa de DR-01.

## Verificaciones y límites

23 pruebas automáticas: nueve de reglas, cuatro del controlador anterior de IA y diez del motor. Cubren ilegalidades, turnos, pausa, victoria/derrota por vida e Impactos, límites, conservación de 24 instancias y reproducción de partidas completas para semillas 0–39 con cambios de dificultad. Es una regresión determinista, no una simulación estadística de balance ni 10.000 partidas.

Probadas en Node 24.22.1 y Node 22.23.4 con `--experimental-strip-types`; se comprobaron también TypeScript y Vite en ambos. No se garantiza compatibilidad con todos los parches antiguos de Node 22. MockTimers emite una advertencia experimental en Node 22.

La revisión inicial no ejecutó navegador. La revisión posterior sí ejecutó 20 E2E con Chromium real en Actions; Android/iOS físicos siguen pendientes. Las pruebas del motor no montan React. La revisión posterior añade 12 pruebas de integración en jsdom que sí montan la UI; no verifican estilos, geometría ni interacción táctil real. Ver `DR-02-qa-interfaz.md` para los resultados y los límites del QA automatizado. El registro completo se clona al resolver cada acción; su coste crece con partidas muy largas. Quedan pendientes persistencia/reconexión y la decisión de agotamiento.
