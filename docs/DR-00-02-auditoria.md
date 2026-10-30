# Decreto Real — Auditoría DR-00 a DR-02

**Actualización:** 30 de octubre de 2026. Rama: `codex/decreto-real-combate-v1`.
Traspaso: `CLAUDE_HANDOFF.md` (estado, reglas, evidencias, riesgos y próximo encargo). Paquete de Claude de esta fecha: motor `dr-combat-2` (`DR-01-motor.md`) y guardado/tutorial (`DR-02-guardado-tutorial.md`).

Revisión de interfaz: `DR-02-qa-interfaz.md` separa pruebas ejecutadas de QA visual pendiente.

Base de `main`: `48cc6386ab151e53ee3086216bec21ba94a6761d`. No se modificó ni fusionó `main` ni se abrió un PR.

## Estado por fase

| Fase | Estado | Evidencia y pendientes |
|---|---|---|
| DR-00 Base | Parcial | Catálogo y reglas inventariados. Contrato del motor y **política de compatibilidad de registros** documentados en `DR-01-motor.md`. Agotamiento, empate, abandono y contratos de integración siguen pendientes. |
| DR-01 Combate | Núcleo consolidado; puerta completa pendiente | `dr-combat-2`: eventos de solo datos, textos derivados, lectura de `dr-combat-1` por proyección, acciones canónicas, registro lineal, validación de registros externos y motivos de bloqueo. Restauración local implementada mediante replay. Falta la decisión de agotamiento; la desconexión entre dispositivos no existe (solo local). |
| DR-02 Muestra jugable | Parcial | Guardado y recuperación local, tutorial guiado opcional, Impactos visibles, motivos de bloqueo y textos ≥ 10 px. 26 integración + 45 E2E Chromium aprobados. Pendientes tres barajas, piloto con usuarios nuevos y dispositivos físicos. |

## Problemas resueltos

Paquete de Claude (30 de octubre de 2026), cada uno con reproducción y regresión:

- Textos de defensa que anunciaban el escudo pedido y no el obtenido (jugador en tope 12; rival en tope 10). Corregido sin invalidar registros gracias a la nueva política.
- Coste cuadrático del registro: 5.000 acciones tardaban 24 s en construirse y otros 24 s en reproducirse; ahora 0,2 s. Medido antes de optimizar.
- Acciones con campos ajenos se guardaban tal cual y un campo no clonable lanzaba excepción tras resolver la acción.
- La pantalla se rompía con `localStorage` bloqueado.
- Impactos propios ausentes del tablero; Impactos rivales ocultos a ≤ 370 px.
- Motivos de bloqueo de cartas imprecisos o silenciosos; texto a 9,6 px; solapes del encabezado y de la última jugada a 320–360 px; aviso de recuperación que ocultaba el turno rival.

Antecedentes:

- QA real detectó y corrigió botones menores de 44 px, panel de ayuda recortado en poca altura y etiquetas Mando/Racha pegadas. Segunda ejecución: 20/20 E2E aprobados.

- “Inspiración” calcula el robo después de retirar la carta de la mano e informa cuando no puede robar.
- La IA antigua de `/game` consulta estado vigente entre cartas. Su controlador pausa/reanuda conservando la espera y cancela cartas y habilidades pendientes al terminar/salir del turno.
- El prototipo ya no distribuye las reglas en setters de React: el motor resuelve cartas, costes, combos, escudos, Impactos, respuestas rivales y resultados atómicamente.
- La semilla reproduce tanto el barajado como las decisiones de IA. Los IDs de instancia son estables dentro de la partida. El RNG forma parte del estado.
- Acciones ilegales no cambian estado ni RNG ni registro: carta ausente/repetida, mando insuficiente, Impacto fuera de orden/segundo del turno, turno incorrecto, pausa, partida terminada, tipos/dificultades/versiones inválidos.
- Se registra cada acción aceptada junto con sus eventos, incluida la dificultad y pausa. El replay verifica los eventos y produce el mismo estado serializado.
- La UI deriva mensajes e historial de los eventos. Su temporizador rival de 700 ms se limpia al desmontar/salir o pausar; los estilos y las mecánicas existentes se conservan.

- Corregidos dos defectos de UI reproducidos por tests: «TU TURNO» durante respuesta rival y foco fuera de los diálogos. Ahora el estado indica el turno real y los diálogos gestionan foco, Tab/Shift+Tab y Escape, incluida reanudación de pausa.

## Verificaciones ejecutadas

Paquete actual (código `e4822cc`, CI [41095702756](https://github.com/Afelex/Decreto-Real/actions/runs/41095702756)):

| Verificación | Resultado |
|---|---|
| `npm test` | 42 aprobadas: 9 reglas, 4 IA anterior, 20 motor/textos, 6 guardado, 3 tutorial. Local Node 22.22.0 y 24.22.2; CI Node 22 y 24 |
| `npm run test:ui` | 26 aprobadas en jsdom/StrictMode. Local Node 22.22.0 y 24.22.2; CI Node 22 y 24 |
| `npx tsc --noEmit`, `npm run build` | Aprobados en los mismos cuatro entornos |
| E2E Chromium | 45/45 en CI (Chrome Headless Shell 156.0.8078.4) y 45/45 locales (Chrome for Testing 153.0.8010.12) |
| Equivalencia de reglas | 600 registros generados con el motor anterior reproducen el mismo estado final con `dr-combat-2` (comprobación puntual, no versionada como prueba; el fixture versionado cubre un registro) |
| Reproducción del fallo de almacenamiento | El componente de `454a3a4` lanza `SecurityError` con `localStorage` bloqueado (prueba temporal, no versionada) |
| Dispositivo Android / iOS físico | **No ejecutado** |

Antecedentes (código `5f48cfb`):

| Verificación | Resultado |
|---|---|
| `npm test` en Node 24.22.1 | 23 pruebas aprobadas |
| `npm run test:ui` en Node 24.22.1 y 22.23.4 | 12 aprobadas |
| E2E en Chromium 156 / GitHub Actions | 20/20, run 41085102590 |
| Primer E2E real | 12 aprobadas / 8 fallidas; corregido |

## Riesgos y decisiones pendientes

1. **Agotamiento sin implementar:** mazo vacío no causa fatiga, reciclaje ni empate. Requiere decisión de diseño explícita.
2. **Guardado solo local:** un navegador y perfil, sin sincronización, copia ni protección competitiva; dos pestañas se sobrescriben. Reconexión entre dispositivos no existe.
3. QA en Android/iOS físicos, Safari/WebKit, Firefox, lector de pantalla y contraste medido sigue pendiente. El tutorial no se ha probado con jugadores nuevos.
4. El motor nuevo solo gobierna `/duelo-v1` y su tutorial. `/game` conserva su lógica anterior; no se unificaron.
5. El replay comprueba consistencia, no autenticidad. No es un servidor autoritativo.
6. Balance y rendimiento en teléfonos sin medir. La semilla del tutorial depende del catálogo/RNG actuales (protegida por prueba).
7. Rankings, multijugador e integración en Peruanistas continúan fuera de alcance.

## Preparación para pull request

El trabajo se conserva en commits de desarrollo y se publica exclusivamente en esa rama, cotejando los árboles de GitHub con los locales. No se incluyen dependencias instaladas, build, secretos ni temporales; `package-lock.json` conserva versiones. Puede revisarse como avance de DR-01 con límites explícitos; no como cierre de DR-00 a DR-02 ni como QA móvil aprobado. No se abrió ni fusionó ningún PR ni se desplegó. CI de desarrollo con Node 22/24 y navegador se ejecuta solo sobre esta rama; no despliega.
