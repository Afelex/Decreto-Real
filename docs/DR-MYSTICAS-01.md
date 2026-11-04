# DR-MYSTICAS-01 · Desbloqueos y edición de baraja

Implementación incremental con primera propuesta JUGABLE de nombres y efectos de 12 habilidades místicas. Los nombres y números podrán afinarse con el usuario después de QA; el arte todavía es provisional.

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

## Nombres y efectos jugables · primera propuesta de balance

Los efectos de los combos se **añaden** al efecto de la carta base. La racha se mide por el tipo MÍSTICA: se puede hacer combo entre místicas distintas, y la **última carta jugada** determina el efecto del combo. Las rachas sobreviven al cambio de turno y se reinician tras ×3.

| Portador | Nombre | Activación | Combo ×2 (adicional) | Combo ×3 (adicional) |
|---|---|---|---|---|
| Almirante de Hierro | Marea de Hierro | Cura 2 | Daño 2 y cura 1 | Daño 3 y cura 2 |
| Jinete Escarlata | Carga Sangrante | Daño 3, retroceso 1 | Daño 2 | Daño 4, retroceso 1 |
| Señor de la Plata | Pacto de Azogue | Cura 4 y cura 1 al rival | Cura 2 y roba 1 | Daño 3, cura 2 y cura 1 al rival |
| Artillero del Trueno | Descarga del Trueno | Daño 3 | Daño 4 | Daño 5, retroceso 2 |
| Nayisa de Sombras | Velo de la Selva | Daño 1 y roba 1 | Arrebata 1 carta de la mano rival | Daño 3 y arrebata 1 |
| Dama del Estandarte | Estandarte Sagrado | Cura 3 y cura 1 al rival | Cura 2 y roba 1 | Cura 3 y daño 2 |
| Cóndor de los Andes | Picado Celestial | Daño 4, retroceso 1 | Daño 3, retroceso 1 | Daño 5, retroceso 2 |
| Caballero del Juramento | Juramento Eterno | Daño 2 y cura 2 | Cura 2 y roba 1 | Daño 3 y cura 3 |
| Zhinchi | Último Juramento | Daño 5, cura 2 y retroceso 2 | Daño 3 y roba 1 | Daño 5 y cura 3 |
| Sigumán (I) | Renacimiento Solar | Recupera toda su vida hasta 20 | Cura 3 y arrebata 1 | Daño 3 y roba 1 |
| Sigumán (II) | Juicio del Eclipse | Reduce a la mitad la vida **actual** rival (redondeo hacia abajo) | Arrebata 2 cartas | Daño 3, cura 3 y roba 1 |
| Sigumán (III) | Decreto del Sol Negro | Sella un Impacto y causa daño 5 | Daño 3 y roba 1 | Daño 5, retroceso 2 |

**Límites de seguridad jugable:** vida máxima 20; el retroceso no mata a quien lo usa (mínimo 1 HP), evita una derrota simultánea; Sol Negro cuenta como uno de los 4 Impactos normales y no puede usarse si ya selló otro ese turno; arrebatar roba cartas **reales de la mano rival**, sin duplicarlas, y si no tiene suficientes solo toma las disponibles.

Las cartas místicas de Sigumán solo aparecen en su baraja como jefe final. Xervias no puede equiparlas por defecto, pero sí puede aprovechar una carta robada durante el duelo.

## Arte y revisión pendientes

- Las habilidades están implementadas funcionalmente, pero son la **primera propuesta para QA**: antes de fijarlas como balance final, revisarlas con el usuario y probarlas contra los 20 HP iniciales.
- Pendiente: ilustraciones originales 2:3 y animaciones propias (canal alfa) de las doce cartas místicas. De momento se reutiliza arte temporal y un banner de combo místico.
- La carta sigue limitada a una copia de cada general para Xervias, con posibilidad de combinar místicas diferentes para ×2/×3; no se generan copias de recompensa por repetir jefes.
- La herramienta de victoria automática de QA debe seguir siendo temporal y eliminarse antes de publicar la versión final del juego.

## Datos y pruebas

- `game/mysticCards.ts`: catálogo estable, generación de cartas y sustituciones.
- `campaign/mysticDeck.ts`: premios derivados del progreso existente, desbloqueo de Zhinchi y guardado separado `decreto-real.campania.mazo-mistico.v1`. El progreso anterior se mantiene en `decreto-real.campania.v1` sin migración.
- `screens/CampaignDeck.tsx`: colección y editor en una sola pantalla.
- `screens/CampaignMission.tsx`: místicas en baraja de jefes y carga de la baraja editada tras el desbloqueo.
- Pruebas: `game/mysticCards.test.ts`, `campaign/mysticDeck.test.ts`, `tests/integration/mystic-deck.test.tsx`.
