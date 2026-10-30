# DR-C03 — Recorrido visible y objetivos de estrellas

Rama de desarrollo: `feat/progreso-campania-estrellas-v1`.

## Cambios funcionales

- El botón principal **Campaña** del menú inicial muestra el siguiente reto disponible (o indica que la campaña terminó), además de una barra compacta de progreso.
- La información se calcula a partir de la secuencia real de victorias consecutivas. Los datos dañados o estrellas aisladas de misiones futuras no hacen que el menú anuncie una fase bloqueada como superada.
- El mapa conserva una sola pantalla sin desplazamiento vertical. La cabecera incluye un indicador de cuántos de los 38 retos están superados.
- En la ficha del reto elegido, pulsar **Objetivos** muestra tres metas: victoria, vida restante y límite de turnos. El diálogo puede cerrarse con el botón, tocando fuera o con Escape; no sustituye al botón existente **Seleccionar reto**.
- El briefing usa exactamente los mismos textos de los objetivos. La victoria sigue desbloqueando el siguiente reto desde una sola estrella, sin cambios en el cálculo de puntuación.
- Se mantienen el motor, la IA, los mazos, el registro de resultados, las 38 misiones, los ocho generales y el guardado de progreso `decreto-real.campania.v1`.

## Validación requerida

- Node 22 y Node 24: reglas y motor, pruebas React, TypeScript y build.
- Chromium en 320×568, 360×800, 390×844, 360×480 y 844×390.
- Comprobar que el pop-up, el botón de cerrar, los tres criterios y **Seleccionar reto** estén visibles sin scroll.
- Prueba del menú con progresión inicial, una victoria, guardado fuera de orden y campaña concluida.
- Navegación por teclado y prevención de saltos a capítulos cerrados.

No fusionar en `main` si cualquier prueba falla; guardar un respaldo de `main` antes del merge.
