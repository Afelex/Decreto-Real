# Decreto Real — Auditoría DR-00 a DR-02

**Actualización:** 30 de octubre de 2026. Rama: `codex/decreto-real-combate-v1`.
Revisión de interfaz: `DR-02-qa-interfaz.md` separa pruebas ejecutadas de QA visual pendiente.

Base de `main`: `48cc6386ab151e53ee3086216bec21ba94a6761d`. No se modificó ni fusionó `main` ni se abrió un PR.

## Estado por fase

| Fase | Estado | Evidencia y pendientes |
|---|---|---|
| DR-00 Base | Parcial | Catálogo y reglas existentes inventariados. Contrato del motor documentado en `DR-01-motor.md`. Agotamiento, empate, abandono y contratos futuros de integración siguen pendientes. |
| DR-01 Combate | Núcleo del prototipo consolidado; puerta completa aún pendiente | `combatEngine.ts`: estado/acción/eventos puros, validación central, RNG por semilla, journal versionado, exportación JSON y replay con comprobación de eventos. `/duelo-v1` ya consume este motor. Pendientes decisión de agotamiento y definición de desconexión/restauración; no se declara completada toda la fase. |
| DR-02 Muestra jugable | Parcial | Mismo tablero y cartas, una baraja, tres perfiles sencillos de IA, ayuda estática y resultado. Integración React-motor probada en DOM simulado con 12 casos. Pendientes tres barajas, tutorial guiado y pruebas con investigadores/navegador móvil. |

## Problemas resueltos

- “Inspiración” calcula el robo después de retirar la carta de la mano e informa cuando no puede robar.
- La IA antigua de `/game` consulta estado vigente entre cartas. Su controlador pausa/reanuda conservando la espera y cancela cartas y habilidades pendientes al terminar/salir del turno.
- El prototipo ya no distribuye las reglas en setters de React: el motor resuelve cartas, costes, combos, escudos, Impactos, respuestas rivales y resultados atómicamente.
- La semilla reproduce tanto el barajado como las decisiones de IA. Los IDs de instancia son estables dentro de la partida. El RNG forma parte del estado.
- Acciones ilegales no cambian estado ni RNG ni registro: carta ausente/repetida, mando insuficiente, Impacto fuera de orden/segundo del turno, turno incorrecto, pausa, partida terminada, tipos/dificultades/versiones inválidos.
- Se registra cada acción aceptada junto con sus eventos, incluida la dificultad y pausa. El replay verifica los eventos y produce el mismo estado serializado.
- La UI deriva mensajes e historial de los eventos. Su temporizador rival de 700 ms se limpia al desmontar/salir o pausar; los estilos y las mecánicas existentes se conservan.

- Corregidos dos defectos de UI reproducidos por tests: «TU TURNO» durante respuesta rival y foco fuera de los diálogos. Ahora el estado indica el turno real y los diálogos gestionan foco, Tab/Shift+Tab y Escape, incluida reanudación de pausa.

## Verificaciones ejecutadas

| Verificación | Resultado |
|---|---|
| `npm test` en Node 24.22.1 | 23 pruebas aprobadas: 9 reglas, 4 IA anterior, 10 motor |
| `npm run test:ui` en Node 24.22.1 y 22.23.4 | 12 aprobadas: selección/uso, turnos, pausa/reanudación, diálogos, cancelación al salir, victoria y derrota completas |
| `npm run test:e2e -- --list` | 20 casos preparados en cinco viewports; no equivale a ejecución |
| Arranque E2E de mobile-320 | Bloqueado antes de abrir página por Chromium ausente; instalación falló por descarga truncada |
| Mismas pruebas con Node 22.23.4 y `--experimental-strip-types` | 23 aprobadas |
| TypeScript `tsc --noEmit` en Node 24 y Node 22 | Aprobado |
| Compilación Vite en Node 24 y Node 22 | Aprobada |
| `git diff --check` | Sin errores |
| Reproducción serializada con semillas 0–39 | 40 partidas completas: estados/eventos idénticos, conservación de cartas, límites de vida/mano/mando, cambios de dificultad y pausa |
| Navegador real / Android / iOS | **No ejecutado; QA móvil no completado** |

Las pruebas del motor cubren victoria y derrota por vida o cuarto Impacto, cambio de turno, acciones inválidas sin mutación y detección de registros divergentes. Las del controlador anterior usan reloj simulado para pausa, reanudación y cancelación de acciones pendientes. Las 23 pruebas anteriores no montan React; las 12 nuevas sí montan la pantalla con el motor real en jsdom/StrictMode. DOM simulado no verifica layout.

Se observaron avisos de npm `http-proxy`, del agente proxy del entorno y de MockTimers experimental en Node 22; no impidieron las verificaciones. La compatibilidad comprobada es con Node 22.23.4, no con cada parche de Node 22.

## Riesgos y decisiones pendientes

1. **Agotamiento sin implementar:** mazo vacío no causa fatiga, reciclaje ni empate. Se conserva el comportamiento previo y el riesgo de partidas sin salida. Requiere decisión de diseño explícita.
2. No hay persistencia automática ni reconexión. El registro exportable/reproducible está disponible por API del motor, en memoria; la interfaz no descarga archivos ni restaura al recargar.
3. Integración funcional de React cubierta por 12 tests; falta QA en navegador real, geometría, legibilidad y tacto. Matriz E2E preparada: 320×568, 360×800, 390×844, 360×480 y 844×390. No hay Chromium ejecutable; su descarga falló. Cero casos de navegador completados. Ver checklist manual en `DR-02-qa-interfaz.md`.
4. El motor nuevo solo gobierna `/duelo-v1`. `/game` conserva su lógica anterior, sus puntuaciones de muestra y temporizadores de banners/moneda/efectos fuera del controlador de IA. No se unificaron los dos juegos en esta entrega.
5. El registro se clona por acción: coste creciente en partidas largas. El replay comprueba consistencia, no autenticidad competitiva. No es un servidor autoritativo.
6. Sigue pendiente el piloto con investigadores y la medición de balance/rendimiento. Las 40 semillas son pruebas de regresión, no un estudio de equilibrio.
7. Rankings, multijugador e integración en Peruanistas continúan fuera de esta entrega.

## Preparación para pull request

El trabajo se conserva en commits de desarrollo y se publica exclusivamente en esa rama, cotejando los árboles de GitHub con los locales. No se incluyen dependencias instaladas, build, secretos ni temporales; `package-lock.json` conserva versiones. Puede revisarse como avance de DR-01 con límites explícitos; no como cierre de DR-00 a DR-02 ni como QA móvil aprobado. No se abrió ni fusionó ningún PR.
