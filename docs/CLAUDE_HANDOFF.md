# Decreto Real — Informe de estado y traspaso

Actualizado el 30 de octubre de 2026 tras el paquete «combate sólido, recuperable y comprensible» (Claude). No declara el juego terminado ni autoriza ampliar mecánicas.

## 1. Punto de partida verificable

| Dato | Valor |
|---|---|
| Repositorio | https://github.com/Afelex/Decreto-Real |
| Rama de trabajo | `codex/decreto-real-combate-v1` |
| Base del paquete | `454a3a4be134401675585b81f3c73ed1ef31ece9` (código validado `5f48cfb`) |
| Último código verificado | `e4822ccca7f695a7aaa8c73b437e77ffc895d65a` |
| CI aprobado sobre ese código | [run 41095702756](https://github.com/Afelex/Decreto-Real/actions/runs/41095702756): Node 22, Node 24 y navegador `success` |
| CI del commit del motor | [run 41092850163](https://github.com/Afelex/Decreto-Real/actions/runs/41092850163) `success` |
| `main` | `48cc6386ab151e53ee3086216bec21ba94a6761d`, sin cambios |

El commit de documentación que actualiza este informe es posterior al código verificado. No se abrió ni fusionó un PR, no se tocó `main` y no se desplegó: GitHub Pages sigue sirviendo `main`, que **no** contiene el prototipo. Para evaluarlo, ejecutar la rama localmente (sección 9).

## 2. Qué cambió en este paquete

| Entrega | Resultado | Documento |
|---|---|---|
| A. Motor | `dr-combat-2`: eventos solo con datos y textos derivados; política de compatibilidad; lectura de `dr-combat-1`; acciones canónicas; registro con coste lineal; validación de registros externos; motivos de bloqueo estructurados | `DR-01-motor.md` |
| B. Guardado | Guardado local tras cada acción aceptada; «Continuar partida» / «Nueva partida»; restauración solo por replay; corrupción, versión, almacenamiento bloqueado y cuota con mensajes; respuesta rival pendiente resuelta una vez | `DR-02-guardado-tutorial.md` |
| C. Tutorial | `/duelo-v1/tutorial`, 7 pasos sobre el motor normal con semilla preparada; omitir, salir, repetir y reabrir desde la ayuda; no escribe la partida guardada | `DR-02-guardado-tutorial.md` |
| D. Interfaz | Impactos propios y rivales siempre visibles; motivo de bloqueo al tocar; textos ≥ 10 px; mano con contador y aviso de deslizamiento; sin solapes a 320–360 px; foco en el resultado; «Jugar otra vez» sin recargar; hover solo en punteros | `DR-02-guardado-tutorial.md`, `DR-02-qa-interfaz.md` |

Defectos reales corregidos, todos con reproducción y regresión: textos de escudo que no coincidían con lo aplicado; registro cuadrático (5.000 acciones: 24 s → 0,2 s); acciones con campos ajenos en el registro; pantalla rota con `localStorage` bloqueado; Impactos invisibles; motivos de bloqueo imprecisos; texto a 9,6 px; solapes en móvil estrecho; aviso de recuperación que tapaba el turno rival.

## 3. Rutas y arquitectura

| Ruta (HashRouter) | Componente | Estado |
|---|---|---|
| `/#/game` | `screens/GameBoard.tsx` | Juego antiguo, sin cambios |
| `/#/duelo-v1` | `screens/CombatPrototype.tsx` → `DuelBoard` | Entrada: recuperación, bienvenida o duelo |
| `/#/duelo-v1/tutorial` | `screens/TutorialScreen.tsx` → `DuelBoard` | Tutorial guiado, solo en memoria |

| Archivo | Responsabilidad |
|---|---|
| `game/combatEngine.ts` | Estado, acciones, validación, RNG Mulberry32, eventos de datos, registro compartido y congelado, `invalidRecord`, replay y compatibilidad |
| `game/combatText.ts` | Mensajes, historial y motivos de bloqueo derivados de eventos; editables sin versión nueva |
| `game/combatSave.ts` | Lectura/escritura tolerante a fallos con almacenamiento inyectado; restauración por replay |
| `game/tutorial.ts` | Semilla 2308, pasos, acciones permitidas y objetivo; progreso derivado del registro |
| `screens/DuelBoard.tsx` | Tablero reutilizable: reducer del motor, temporizador rival de 700 ms, guardado tras cada acción, diálogos con foco y capa opcional de guía |
| `screens/CombatPrototype.tsx` | Sesión: «¿Continuar el duelo?», «No se pudo recuperar», bienvenida, duelo |
| `game/fixtures/dr-combat-1-record.json` | Registro real del motor anterior para la prueba de compatibilidad |

La IA del prototipo sigue sin mano ni baraja propias: una respuesta por turno con probabilidades. No es una IA simétrica ni de competición.

## 4. Reglas efectivamente implementadas en el prototipo

| Elemento | Comportamiento actual |
|---|---|
| Baraja | 24 instancias, una baraja fija barajada por semilla |
| Catálogo | 9 diseños: dos ataques, dos defensas, un apoyo y cuatro Impactos |
| Copias | 7 ataques, 7 defensas, 6 apoyos, 4 Impactos únicos. No está implementada la propuesta futura de máximo dos copias normales |
| Mano | Cuatro cartas al iniciar; máximo seis; robo de una después de la respuesta rival |
| Vida y mando | 20 de vida; tres de mando por turno sin acumular |
| Ataques | Golpe preciso: coste 1/daño 3; Asedio: coste 2/daño 5 |
| Defensas | Bastión: coste 1/escudo 4; Guardia real: coste 2/escudo 7 |
| Apoyo | Inspiración: coste 1, roba una tras retirar la carta jugada de la mano |
| Escudo | Persiste y absorbe ataques; límite 12 para el jugador y 10 para el rival. Esa asimetría está conservada |
| Impactos | Coste 2; I, II, III y Final en orden; máximo uno por turno del jugador. Los no finales hacen 1 de daño directo y curan 1 con tope de vida; el cuarto gana |
| Combo | Racha de tres cartas propias del mismo tipo; Ataque/Defensa reciben bono de 2 al dispararla y el contador vuelve a cero. No se reinicia automáticamente al cambiar de turno |
| Resultado | Victoria por vida rival agotada o cuarto Impacto; derrota por vida propia agotada o cuarto Impacto rival |
| Turno rival | Una respuesta según perfil actual y RNG guardado. Conserva el contador de turno y robo posteriores incluso en una respuesta letal |
| Pausa | Motor bloquea acciones mientras está pausado. UI permite pausa durante turno del jugador; botón deshabilitado durante respuesta rival |
| Mazo vacío | Robo sin efecto. No fatiga, reciclaje, empate ni límite de turnos nuevos |

El paquete de Claude no cambió ninguna de estas reglas: se comprobó reproduciendo 600 registros del motor anterior con estado final idéntico.

Los detalles anteriores son la referencia de regresión actual, no una aprobación de balance definitivo. Cambiarlos requiere distinguir una decisión de diseño de un defecto.


## 5. Pruebas y evidencias

| Nivel | Casos | Ejecución |
|---|---:|---|
| Reglas | 9 | CI Node 22/24; local Node 22.22.0 y 24.22.2 |
| Controlador IA antigua | 4 | Igual |
| Motor y textos | 20 | Igual |
| Guardado | 6 | Igual |
| Guion del tutorial | 3 | Igual |
| Integración React–motor (jsdom) | 26 | Igual |
| E2E Chromium | 45 = 9 casos × 5 viewports | CI: Chrome Headless Shell 156.0.8078.4, 45/45. Local: Chrome for Testing 153.0.8010.12, 45/45 |

Son 68 casos funcionales y 9 casos E2E distintos; no sumar las ejecuciones repetidas por Node o viewport como casos nuevos. TypeScript y build aprobados en los cuatro entornos.

Matriz E2E en CI (run 41095702756): 320×568, 360×800, 390×844, 360×480 y 844×390, 9/9 cada uno. Artefacto `browser-results` ID `12996581520` ([descarga](https://github.com/Afelex/Decreto-Real/actions/runs/41095702756/artifacts/12996581520)), retención de siete días. Las capturas se inspeccionaron en local (320×568, 360×480, 390×844, 844×390); no se versionan.

Comprobaciones puntuales no versionadas como pruebas: 600 registros del motor anterior reproducidos con estado idéntico; mediciones de coste del registro; reproducción del fallo de almacenamiento sobre `454a3a4`.

**No ejecutado:** Android/iPhone físicos, Safari/WebKit, Firefox, lector de pantalla real, contraste medido, jugadores nuevos probando el tutorial, rendimiento en teléfonos y red móvil, ensayo de balance. Viewport y tacto simulados en Chromium no sustituyen esas verificaciones.

## 6. Estado de las fases

| Fase | Evaluación |
|---|---|
| DR-00 | Parcial: contratos, política de versiones y diagnóstico documentados; casos límite e integración pendientes |
| DR-01 | Núcleo consolidado y restauración local. No se cierra mientras el agotamiento no tenga decisión |
| DR-02 | Muestra jugable, recuperable y con tutorial, probada en navegador simulado. Faltan tres barajas, piloto y dispositivos físicos |
| Siguientes | Catálogo/editor, IA avanzada, integración, ranking, colección y PvP no implementados |

## 7. Decisiones de producto pendientes

1. **Agotamiento del mazo.** Hoy el robo con mazo vacío no hace nada; una partida puede prolongarse. Alternativas: (a) fatiga creciente al no poder robar; (b) barajar el descarte en un mazo nuevo; (c) límite de turnos con desempate por vida/Impactos; (d) dejarlo como está porque los Impactos del rival terminan la partida. Cada una cambia reglas y exige versión de registro nueva. No implementado.
2. **Varias pestañas.** Ahora gana la última jugada. ¿Avisar o bloquear la segunda pestaña?
3. **Tutorial.** ¿Ofrecerlo siempre en la primera visita (actual) o solo desde la ayuda? ¿Ampliar a combos y victoria completa? Conviene decidirlo tras observar a jugadores nuevos.
4. **Descarga/importación de partidas** y cualquier guardado en servidor o entre dispositivos.
5. **Unificación con `/game`** y asimetrías conservadas (escudo 12/10, rival sin baraja).

## 8. Riesgos técnicos

- El guardado es local y manipulable; nunca usarlo como resultado competitivo.
- Recuperar un registro cerca del límite (2 M caracteres) puede tardar ~0,5–1 s en escritorio; en teléfonos no se midió.
- La semilla del tutorial depende del catálogo, barajado y RNG; `tutorial.test.ts` avisa si deja de servir.
- `LEGACY_VERSIONS` solo es correcto mientras las reglas no cambien (ver política en `DR-01-motor.md`).
- Fuentes de Google y recursos del juego antiguo siguen siendo remotos; no se verificó el funcionamiento sin red.

## 9. Puesta en marcha y verificaciones

```sh
git fetch origin
git switch codex/decreto-real-combate-v1
git pull --ff-only origin codex/decreto-real-combate-v1
npm ci
npm test
npm run test:ui
npx tsc --noEmit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e -- --workers=2
```

Si Playwright no puede descargar su navegador pero hay un Chromium local compatible: `PW_CHROMIUM_PATH=/ruta/a/chrome npm run test:e2e`. CI no usa esa variable.

Para probar a mano:

```sh
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Abrir `http://127.0.0.1:4173/Decreto-Real/#/duelo-v1`. Primera visita: elegir «Aprender a jugar» o «Ir directamente al duelo». Para la recuperación: jugar una carta, pulsar «Terminar turno» y recargar enseguida; debe aparecer «¿Continuar el duelo?». Para volver a ver la bienvenida, borrar los datos del sitio o la clave `decreto-real.duelo-v1.tutorial`.

No confirmar `node_modules`, `dist`, `test-results` ni secretos.

## 10. Historial de entregas

| Commit | Entrega |
|---|---|
| `4329f27` | Prototipo aislado de combate |
| `ed64db9` | Arreglo de robo/pausa, pruebas iniciales y auditoría |
| `8dce3c0` | IA con estado vigente y controlador de esperas |
| `3e752ab` | Motor determinista y replay |
| `8889d27` | Contrato DR-01 y validación Node 22 |
| `217bbbe` | Integración de UI; indicador de turno y foco |
| `041474e` | Informe de integración y matriz móvil preparada |
| `c619963` | CI de desarrollo con Node 22/24 y Chromium |
| `38b1602` | Arreglo de paneles y controles táctiles |
| `5f48cfb` | Capturas por viewport y documentación de QA real |
| `454a3a4` | Informe de traspaso |
| `b9eaea2` | Motor `dr-combat-2`, política de compatibilidad, registro lineal |
| `afbede3` | Guardado local por replay |
| `877aabd` | Guion del tutorial |
| `e4822cc` | Interfaz: recuperación, tutorial, claridad, pruebas |

## 11. Próximo paquete recomendado (no implementado)

1. **QA humana y física** con el usuario: Android e iPhone reales, Safari, lector de pantalla; tres o cuatro personas nuevas completando el tutorial sin ayuda. Registrar dispositivo, navegador y observaciones.
2. **Decisión de agotamiento** (sección 7.1) y, tras aprobarla, implementación con versión de registro nueva y regresiones.
3. Después, según prioridades de producto: barajas iniciales o propuesta de unificación con `/game`.
