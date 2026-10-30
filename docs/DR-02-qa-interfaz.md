# DR-02 — Integración de interfaz y motor

30 de octubre de 2026. Rama `codex/decreto-real-combate-v1`, base `8889d275e69c992c47f82b795b4a77a4862036aa`.

## Resultados realmente ejecutados

| Verificación | Resultado |
|---|---|
| `npm test` | 23 pruebas de reglas, motor y controlador de IA aprobadas |
| `npm run test:ui` | 12 pruebas React + motor real aprobadas en jsdom; componentes montados bajo StrictMode |
| TypeScript y build de Vite | Aprobados |
| Las mismas pruebas, TypeScript y build con Node 22.23.4 | Aprobados; también se verificó Node 24.22.1 |
| `npm run test:e2e -- --list` | Configuración y descubrimiento de 20 casos válidos; esto no ejecuta navegador |
| `npm run test:e2e -- --project=mobile-320 --workers=1 --max-failures=1` | Fallo de infraestructura antes de abrir página: falta Chromium. Un caso no pudo arrancar y los otros tres de ese proyecto no se ejecutaron |
| Instalación `npx playwright install chromium` | Falló: descargas truncadas/no ZIP válido. No se consiguió un navegador ejecutable |
| `git diff --check` | Aprobado |

**Cero casos de navegador completados. QA móvil pendiente.** jsdom simula DOM/eventos, no calcula layout, tipografía, recortes ni dimensiones de pantalla. No se asignaron anchos ficticios a jsdom para presentarlos como QA móvil.

## Cobertura de las 12 pruebas de integración

Se monta la pantalla real en un router con `/duelo-v1` y un destino de menú. Solo se controla la semilla y el reloj; no se reemplaza el motor por mocks ni se inyectan estados de victoria artificiales.

- Selección, cancelación y confirmación de carta; mano, descarte, mando, vida y escudo coinciden con el motor. Las cartas bloqueadas no se pueden usar.
- Cambio de turno: controles bloqueados, indicador rival, respuesta a los 700 ms y una sola resolución bajo StrictMode; no resuelve antes ni se duplica después.
- Pausa durante turno del jugador, reanudación, cierre por fondo y salida al menú; el estado no avanza mientras está pausado.
- Ayuda, pestañas mazo/descarte, historial y dificultad; cambio de dificultad guardado.
- Foco inicial, Tab/Shift+Tab dentro del diálogo, Escape y restitución del foco. Se cubren ayuda, pausa, historial, mazo y dificultad.
- Salida de ruta mientras el rival tiene una respuesta pendiente: se limpia el temporizador y no queda trabajo de esa pantalla.
- Partida completa desde la UI hasta victoria (semilla 0, 31 acciones, turno 9) y derrota (semilla 5, 25 acciones, turno 8). En cada paso se comparan contadores/mano con el motor. El estado final coincide también con el replay. Se comprueba salida al menú.

Son 12 casos: las variantes de diálogos y resultados cuentan individualmente. Las 40 semillas anteriores siguen cubiertas por pruebas del motor, no por 40 partidas de interfaz.

## Defectos reproducidos y corregidos

1. Durante la respuesta rival la pantalla seguía mostrando «TU TURNO» aunque el motor ya estaba en fase rival. El test falló con ese texto. Ahora muestra «TURNO DEL RIVAL» y un estado de preparación; se anuncia con una región de estado accesible.
2. Al abrir un diálogo, el foco permanecía fuera de él. El test de foco falló tras corregir inicialmente un problema del reloj simulado en el propio test. Ahora se enfoca el primer control, se contiene Tab/Shift+Tab, Escape cierra/reanuda según corresponda y el foco vuelve al control de origen. Las cinco variantes pasan.

No se modificaron reglas, catálogo, estilos del tablero, barajado, dificultad ni agotamiento. No se abrió un PR.

## Matriz de navegador preparada, pendiente

`playwright.config.ts` y `tests/e2e/duel.spec.ts` incluyen cuatro casos por viewport: interacción táctil/diálogos/turnos, tamaño mínimo de controles principales (44×44 CSS px), partida hasta victoria y partida hasta derrota con reinicio por «Jugar otra vez».

| Proyecto | Viewport | Estado |
|---|---|---|
| mobile-320 | 320 × 568 | No ejecutado: navegador no arranca |
| mobile-360 | 360 × 800 | Pendiente |
| mobile-390 | 390 × 844 | Pendiente |
| short-360 | 360 × 480 | Pendiente |
| landscape | 844 × 390 | Pendiente |

Los casos comprueban desbordamiento horizontal de página, encuadre de los diálogos, selección y confirmación por toque, navegación de la mano, controles principales y resultados/reinicio. La altura total de página puede requerir scroll; debe comprobarse que todas las acciones sean alcanzables. Estos archivos están comprobados por TypeScript y descubrimiento de Playwright, **no validados por ejecución**. Es posible que detecten otros defectos al disponer de navegador.

Para ejecutarlos donde Chromium esté disponible:

```sh
npm ci
npx playwright install chromium
npm run test:e2e
```

Playwright inicia Vite local automáticamente y entra en `/Decreto-Real/#/duelo-v1`. No publica ni despliega. Artefactos locales de test quedan excluidos de Git.

## Inspección manual requerida

En cada tamaño de la matriz y un Android/iPhone real cuando estén disponibles:

- Revisar legibilidad de costes, títulos, efectos, mano llena, vida, mando e Impactos. Hay tamaños de texto pequeños en los estilos existentes; falta su revisión visual.
- Recorrer la mano horizontalmente; verificar que selección y confirmación no quedan recortadas ni causan scroll horizontal de la página.
- Abrir los cinco diálogos con poca altura y teclado/dispositivo horizontal; llegar a sus controles de cierre aunque el contenido necesite scroll. Comprobar contraste y foco visible.
- Tocar controles con el dedo y revisar separación y área útil; la comprobación automática de 44 px aún no se ha ejecutado.
- Confirmar victoria/derrota, reinicio real del documento por «Jugar otra vez», salida al menú y vuelta a la partida. El reinicio por recarga solo está preparado en E2E; jsdom no lo ejecutó.
- Verificar fuentes y recursos remotos disponibles; su carga o sustitución puede afectar tamaños. Comparar apariencia con la referencia aprobada.

La pausa sigue disponible solo durante el turno del jugador; su botón permanece deshabilitado durante la espera rival, como antes. El agotamiento conserva el robo sin efecto y continúa pendiente de decisión de diseño.
