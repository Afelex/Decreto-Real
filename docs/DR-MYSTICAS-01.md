# DR-MYSTICAS-01 · Desbloqueos y edición de baraja

Implementación incremental del acuerdo de campaña. No define todavía los nombres, las imágenes ni los efectos finales de cada habilidad.

## Desbloqueo

- Las misiones 06, 10, 14, 18, 22, 26, 30 y 34 son los **ocho generales**. Una victoria otorga **una carta mística permanente** del general; repetirlo mejora estrellas, pero no duplica la recompensa.
- Las cartas obtenidas se muestran en `/#/campania/baraja` como **selladas**. Su colección es visible desde el mapa, pero no se pueden equipar todavía.
- En la victoria de la misión 36, Zhinchi protege a Xervias, le confía su bastón y desaparece herido. El bastón despierta el poder místico, añade la carta del legado de Zhinchi y habilita **Editar baraja**.
- Las misiones 37 y 38 ya permiten usar la baraja equipada. También funciona al repetir misiones anteriores.
- La partida libre `/#/game` conserva sus 28 cartas estándar sin edición; el sistema es exclusivo de campaña.

## Reglas comprobables del editor

- La baraja siempre tiene 28 cartas. Se pueden incorporar **0, 1, 2 o 3** cartas místicas diferentes obtenidas.
- Cada mística sustituye **exactamente una** carta de Ataque, Defensa u Orden según el selector. **Nunca** sustituye Impactos I, II, III o Final.
- Xervias obtiene **una única copia de cada general**, no tres. No se puede equipar dos veces la misma recompensa.
- Cada jefe general lleva **tres copias idénticas de su mística** durante el duelo. Sigumán lleva tres místicas diferentes, identificadas internamente como `siguman-1`, `siguman-2` y `siguman-3`.
- Los combos consecutivos del tipo MÍSTICA cuentan para ×2 y ×3, también entre turnos.

## Fase provisional y tareas pendientes

**Importante:** hasta aprobar con el usuario los efectos individuales, todas las cartas MÍSTICAS usan **daño de prueba de 2 puntos**, y el combo actual del tipo místico aplica la elección normal entre daño y curación. No son los efectos finales de los generales ni de Sigumán, y no deben presentarse como tal en el arte oficial.

- Pendiente: definir con el usuario nueve nombres/efectos propios (ocho generales + legado de Zhinchi) y tres habilidades distintas de Sigumán; entonces cambiar la tabla de efectos y el balance.
- Pendiente: imágenes 2:3, sonido y efectos transparentes para MÍSTICA.
- La tarjeta de prueba utiliza temporalmente el arte ya alojado de Orden, teñido en violeta por CSS.
- La herramienta de victoria automática de QA debe seguir siendo temporal y eliminarse antes de publicar la versión final del juego.

## Datos y pruebas

- `game/mysticCards.ts`: catálogo estable, generación de cartas y sustituciones.
- `campaign/mysticDeck.ts`: premios derivados del progreso existente, desbloqueo de Zhinchi y guardado separado `decreto-real.campania.mazo-mistico.v1`. El progreso anterior se mantiene en `decreto-real.campania.v1` sin migración.
- `screens/CampaignDeck.tsx`: colección y editor en una sola pantalla.
- `screens/CampaignMission.tsx`: místicas en baraja de jefes y carga de la baraja editada tras el desbloqueo.
- Pruebas: `game/mysticCards.test.ts`, `campaign/mysticDeck.test.ts`, `tests/integration/mystic-deck.test.tsx`.
