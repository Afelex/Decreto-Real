# DR-02 — Integración de interfaz y motor

30 de octubre de 2026. Rama `codex/decreto-real-combate-v1`, base `8889d275e69c992c47f82b795b4a77a4862036aa`.

## Actualización 2: guardado, tutorial y claridad (Claude, 30 de octubre de 2026)

Comportamiento y defectos: `DR-02-guardado-tutorial.md`. Esta sección resume la verificación.

| Nivel | Casos | Estado |
|---|---:|---|
| Integración React + motor real (jsdom, StrictMode) | 26 (12 anteriores + 14) | Aprobados en Node 22.22.0 y 24.22.2 locales y en CI |
| E2E Chromium | 45 (9 casos × 5 viewports; antes 4 × 5) | 45/45 en CI con Chrome Headless Shell 156.0.8078.4 ([run 41095702756](https://github.com/Afelex/Decreto-Real/actions/runs/41095702756)) y 45/45 locales con Chrome for Testing 153.0.8010.12 (`PW_CHROMIUM_PATH`) |

Nuevos casos de integración: guardado y recuperación tras «recarga» (desmontar y montar) con el mismo estado, RNG y dificultad; respuesta rival interrumpida que se resuelve una vez; «Nueva partida» que conserva la guardada hasta la primera jugada; datos dañados que solo borran su clave; versión incompatible; almacenamiento bloqueado; cuota agotada; motivo de carta bloqueada; Impactos visibles; bienvenida; tutorial completado; jugadas fuera de la guía; omitir, abandonar con respuesta pendiente y reabrir desde la ayuda; repetir.

Nuevos E2E por viewport: recarga real del documento durante la respuesta rival y recuperación; tutorial completo por toque con guía y objetivo dentro de pantalla; mano de seis cartas con desplazamiento interno y todas las cartas alcanzables; ningún texto visible no decorativo por debajo de 10 px y Impactos/contadores visibles; movimiento reducido sin pulso de guía.

La primera ejecución local de los E2E nuevos falló en los cinco tamaños por «· Historial» a 9,6 px; se corrigió. Las capturas locales a 320×568 y 390×844 mostraron el solape del encabezado y de la última jugada, también corregidos (sin aserción automática de solapamiento).

**Sigue sin hacerse:** Android/iPhone físicos, Safari/WebKit y Firefox, lector de pantalla real, contraste medido, usuarios nuevos haciendo el tutorial y rendimiento en teléfonos. La matriz es Chromium con viewport y tacto simulados.

## Actualización: navegador real en GitHub Actions

La ejecución [41084549868](https://github.com/Afelex/Decreto-Real/actions/runs/41084549868), sobre el commit `38b16026d491b82fed3aefb916ef0e2e54c47969`, instaló Chrome Headless Shell 156.0.8078.4 y aprobó **20 de 20 pruebas E2E** en Ubuntu, además de reglas, integración, TypeScript y build en Node 22 y 24. Se ejecutaron los cinco viewports con `hasTouch`/`isMobile`. Es navegador real automatizado con viewport y tacto simulados, no un teléfono físico.

La primera ejecución [41083955390](https://github.com/Afelex/Decreto-Real/actions/runs/41083955390) aprobó 12 y falló 8: cinco por el botón de ayuda de 38 px y tres por el diálogo de ayuda fuera del viewport (629 px en altura 568; 528 en 480; 487 en 390). Se inspeccionaron sus capturas. Se corrigieron únicamente estilos:

- Controles de al menos 44×44 CSS px; el selector de dificultad también respeta ese mínimo.
- Paneles limitados a la altura disponible, con desplazamiento interno para alcanzar sus acciones. El E2E también desplaza hasta la última acción y comprueba que queda dentro de la pantalla.
- «Mando» y «Racha» en líneas separadas: en la captura aparecían pegados.

Se incorporó `.github/workflows/development-qa.yml`, limitado a pushes de esta rama y permisos `contents: read`. No despliega, no toca `main` y no abre PR. Los resultados de navegador, trazas de fallo y capturas se retienen siete días como artefactos de Actions. Las capturas de tablero y ayuda por tamaño y la comprobación horizontal de controles complementan la matriz.

El Chromium obtenido por npm se descargó en este entorno, pero no arrancó (SIGSEGV incluso con `--version`); quedó fuera del repositorio. Se conserva el runner estándar de Playwright, que sí funciona en Actions. El Chrome conectado al equipo del usuario no se usó para probar la aplicación: no hay una URL publicada de esta rama ni acceso directo a este servidor local.

## Verificaciones de integración y antecedentes locales

| Verificación | Resultado |
|---|---|
| `npm test` | 23 pruebas de reglas, motor y controlador de IA aprobadas |
| `npm run test:ui` | 12 pruebas React + motor real aprobadas en jsdom; componentes montados bajo StrictMode |
| TypeScript y build de Vite | Aprobados |
| Las mismas pruebas, TypeScript y build con Node 22.23.4 | Aprobados; también se verificó Node 24.22.1 |
| E2E real en Actions | 20 aprobados en cinco viewports; ejecución enlazada arriba |
| `npm run test:e2e -- --list` | Configuración y descubrimiento válidos, comprobación previa a ejecución |
| `npm run test:e2e -- --project=mobile-320 --workers=1 --max-failures=1` | Fallo de infraestructura antes de abrir página: falta Chromium. Un caso no pudo arrancar y los otros tres de ese proyecto no se ejecutaron |
| Instalación `npx playwright install chromium` | Falló: descargas truncadas/no ZIP válido. No se consiguió un navegador ejecutable |
| `git diff --check` | Aprobado |

**QA automatizado de navegador: 20 casos aprobados. QA físico Android/iOS y evaluación humana de legibilidad pendientes.** jsdom sigue sin calcular layout; esas comprobaciones se ejecutaron por separado en Chromium. Los intentos locales fallidos de la tabla son antecedentes, no el resultado de Actions.

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

No se modificaron reglas, catálogo, barajado, dificultad ni agotamiento. La revisión posterior modifica solo tamaños de controles y encuadre de diálogos descritos arriba. No se abrió un PR.

## Matriz de navegador ejecutada

`playwright.config.ts` y `tests/e2e/duel.spec.ts` incluyen cuatro casos por viewport: interacción táctil/diálogos/turnos, tamaño mínimo de controles principales (44×44 CSS px), partida hasta victoria y partida hasta derrota con reinicio por «Jugar otra vez».

| Proyecto | Viewport | Estado |
|---|---|---|
| mobile-320 | 320 × 568 | 4/4 aprobadas en Chromium CI |
| mobile-360 | 360 × 800 | 4/4 aprobadas en Chromium CI |
| mobile-390 | 390 × 844 | 4/4 aprobadas en Chromium CI |
| short-360 | 360 × 480 | 4/4 aprobadas en Chromium CI |
| landscape | 844 × 390 | 4/4 aprobadas en Chromium CI |

Los casos comprueban desbordamiento horizontal de página, encuadre de los diálogos, selección y confirmación por toque, navegación de la mano, controles principales y resultados/reinicio. La altura total de página puede requerir scroll; debe comprobarse que todas las acciones sean alcanzables. La ejecución real comprobó geometría de paneles y última acción accesible, límites de controles, falta de desbordamiento horizontal de página y partidas completas con reinicio. No sustituye la evaluación visual humana o un dispositivo real.

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
- Tocar controles con el dedo y revisar separación y área útil; la comprobación automática de 44 px ya pasó en CI, pero la comodidad del dedo requiere dispositivo físico.
- Confirmar victoria/derrota, reinicio real del documento por «Jugar otra vez», salida al menú y vuelta a la partida. El reinicio por recarga ya pasó en E2E; jsdom no lo ejecuta.
- Verificar fuentes y recursos remotos disponibles; su carga o sustitución puede afectar tamaños. Comparar apariencia con la referencia aprobada.

La pausa sigue disponible solo durante el turno del jugador; su botón permanece deshabilitado durante la espera rival, como antes. El agotamiento conserva el robo sin efecto y continúa pendiente de decisión de diseño.
