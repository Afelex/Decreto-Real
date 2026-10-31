# DR-C07 · El juego original vuelve a ser el combate principal

Decisión editorial: **se sustituye el prototipo de duelo creado posteriormente por el juego original de Decreto Real como base de desarrollo.**

## Qué se conserva exactamente del original

La campaña utiliza el mismo componente `screens/GameBoard.tsx` que la ruta `/#/game`, sin duplicar mazos, IA, interfaz ni reglas. Ambos modos comparten:

- Ritual inicial de moneda, elección del primer jugador, rótulos de turnos y final de batalla.
- Mazo real propio para jugador y rival, cada uno con **10 Decretos de Ataque, 10 Decretos de Defensa y 4 Impactos**.
- 10 puntos de vida iniciales, mano inicial de 3, robos de 1 al comenzar los turnos, ataque de 2, defensa que cura 1, Impactos secuenciales y combos/elección de habilidad especial.
- Cartas que se juegan con **un solo toque**, sin Mando ni confirmación adicional.
- Tablero circular, retratos, mazos, reversos visibles de cartas de IA, abanico, imágenes, efectos visuales, música/efectos originales, menú, rendición y botón de fin de turno.
- IA de cartas original implementada en `game/aiTurn.ts`. No se emplean los perfiles `bossTactics` de la versión descartada mientras se usa el original.

## Puente con campaña (única extensión del componente)

Para no eliminar la campaña ya construida, `GameBoard` acepta **dos propiedades opcionales**: `onOutcome` (informa victoria o derrota, turno y vida al terminar la animación original) y `onReturn` (vuelve al mapa desde «Rendirse»). En `/#/game` se siguen omitiendo y el original se comporta **idéntico**: mismo juego, misma pantalla de victoria, menú y reinicio.

En campaña, el jugador sigue viendo el briefing y el mapa, los 38 niveles y sus bloqueos. Tras terminar el ritual y la partida, la pantalla de resultados de campaña conserva los textos de la historia, las estrellas y el botón para repetir o avanzar. Así **se restaura el combate tal cual**, pero los textos narrativos y el guardado que lo rodean son propios de la campaña. El guardado `decreto-real.campania.v1` no cambia ni se borra.

## Estrellas compatibles con el combate original

Los objetivos anteriores fueron escritos para **20 HP** y contaban rondas. La campaña traduce esos umbrales a 10 HP (redondeando hacia arriba el porcentaje) y considera una ronda por cada pareja de turnos alternados. La conversión solo ocurre en `campaign/classicScoring.ts`; no altera `GameBoard` ni sus reglas.

En el menú principal, «Duelo original contra IA» abre `/#/game`. `/#/campania` mantiene la aventura y usa el mismo duelo original en todas las misiones.

## Conservación y próximos pasos

La versión experimental de motor/mesa no se borra: permanece en el repositorio y se puede abrir por URL directa `/#/duelo-v1` para comparación y eventual reutilización de tecnología, pero sale del menú principal para evitar confundir al jugador. La versión anterior de `main` se guarda también en una rama de respaldo.

Esta etapa **no** adapta los generales a las cartas originales ni conserva perfiles de IA diferentes por jefe: los combates de campaña se rigen todos por el motor original. Aceptamos temporalmente esa simplificación para volver a una base jugable divertida y fácil de aprender.

## QA antes de publicar

- Node 22 y 24: TypeScript, construcción, reglas e integración de React.
- Navegador Chromium: ritual de moneda, cartas de un toque, ambos mazos de 24, interfaz y modo música, cinco pantallas y desbloqueos de mapa.
- Asegurar que no se restaure el Mando ni el escudo de la versión nueva en la campaña.
- Comprobar que las victorias originales otorgan estrellas alcanzables, las derrotas no desbloquean y la versión `/#/game` sigue usando su pantalla original de resultado.
- No fusionar ni desplegar con pruebas fallidas.
