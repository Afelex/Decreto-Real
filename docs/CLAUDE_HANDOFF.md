# Decreto Real — Informe de estado y traspaso a Claude

Fecha: 30 de octubre de 2026. Este documento describe el estado comprobado del proyecto, sus límites y un encargo inicial de revisión. No declara el juego terminado ni autoriza ampliar mecánicas.

## 1. Punto de partida verificable

| Dato | Valor |
|---|---|
| Repositorio | https://github.com/Afelex/Decreto-Real |
| Rama de trabajo | `codex/decreto-real-combate-v1` |
| Último código y QA revisados | `5f48cfbf22f0faa257e2f65ff599b0249fbb4fd0` |
| `main`, sin cambios de este trabajo | `48cc6386ab151e53ee3086216bec21ba94a6761d` |
| CI aprobado sobre el código revisado | https://github.com/Afelex/Decreto-Real/actions/runs/41085102590 |
| Rama y ejecución | Verificadas de nuevo mediante la API de GitHub al preparar este informe |
| Esta entrega | Documentación de traspaso; no cambia código, reglas ni apariencia |

El commit que añade este informe será posterior al SHA de código de la tabla. Para trabajar, actualizar la rama remota y comprobar `git status`; no volver a una copia antigua de `main`. El árbol local estaba limpio antes de escribir este documento.

No se abrió ni fusionó un PR en estas entregas. No se desplegó esta rama: GitHub Pages continúa asociado al despliegue existente de `main`. **La web publicada no sirve para evaluar el prototipo nuevo.** Para verlo, ejecutar la rama localmente.

## 2. Visión y límites vigentes

Visión del usuario: duelo de cartas histórico peruano con presentación cuidada, decisiones interesantes, IA, futura personalización de jugador y baraja y, más adelante, acceso desde Colección de Peruanistas, clasificación y partidas entre jugadores. La imagen conceptual aprobada es una dirección artística, no una captura de la implementación actual.

El alcance trabajado hasta ahora es consolidar el prototipo, extraer su motor y verificar su interfaz. Se preservaron las reglas existentes durante la extracción; las cifras de la hoja de ruta eran propuestas de balance y no se aplicaron automáticamente.

Restricciones expresas:

- Trabajar solo en la rama de desarrollo; no modificar, fusionar ni desplegar `main`.
- No abrir PR sin una nueva instrucción del usuario.
- No implementar agotamiento del mazo: necesita decisión de diseño.
- No añadir cartas, rankings, multijugador ni integración en Peruanistas en este tramo.
- No contratar servicios ni añadir IA por API de pago. La IA actual es lógica local.
- Corregir defectos reproducidos con regresión; separar propuestas de diseño de errores de implementación.

## 3. Hay dos juegos en el mismo repositorio

| Ruta real del HashRouter | Componente | Estado |
|---|---|---|
| `/#/game` | `screens/GameBoard.tsx` | Juego antiguo, 10 de vida y reglas originales; sigue accesible por el botón principal |
| `/#/duelo-v1` | `screens/CombatPrototype.tsx` | Prototipo nuevo, 20 de vida y mando; usa el motor extraído. Acceso «Probar nuevo combate» |
| `/#/victory` | `screens/VictoryScreen.tsx` | Resultado del juego antiguo; incluye cifras de muestra, no puntuación competitiva validada |

Con el `base` de Vite actual, la URL local completa es `http://127.0.0.1:4173/Decreto-Real/#/duelo-v1`. Las dos rutas no comparten un motor unificado. Las 12 pruebas de integración y los 20 E2E se refieren al prototipo, no a toda la UI antigua.

La extracción DR-01 no convirtió al rival del prototipo en un jugador simétrico: el rival realiza una respuesta de ataque, defensa o Impacto por turno mediante probabilidades y estado público. No tiene una mano, baraja o presupuesto de mando propios. «Aprendiz», «Estratega» y «Maestro» son perfiles simples; no representan búsqueda avanzada de secuencias.

## 4. Arquitectura actual

| Archivo | Responsabilidad y observaciones |
|---|---|
| `game/cards.ts` | Catálogo, tipos y barajado con RNG inyectable. IDs estables por instancia; efectos copiados para evitar compartir mutaciones con el catálogo |
| `game/rules.ts` | Ataque/absorción de escudo, robo con límite de mano, Impactos y racha |
| `game/combatEngine.ts` | Estado serializable, acciones, validación, RNG Mulberry32, efectos atómicos, eventos, registro y reproducción |
| `screens/CombatPrototype.tsx` | Render y diálogos; `useReducer` delega al motor. Genera la semilla inicial en la frontera de UI; temporizador de 700 ms envía la respuesta rival y se limpia al desmontar |
| `screens/combat-prototype.css` | Apariencia propia con SVG, tamaños adaptables, movimiento reducido y paneles desplazables |
| `game/aiTurn.ts` | Controlador distinto para la IA antigua: lectura de estado vigente, esperas pausables y cancelables |
| `screens/GameBoard.tsx` | Conexión de la IA antigua con referencias a estado/funciones actuales. Conserva temporizadores antiguos fuera de ese controlador |
| `tests/scenarios.ts` | Genera secuencias legales reproducibles para probar resultados reales desde UI |
| `tests/integration/duel.test.tsx` | React montado con router, motor real y StrictMode; solo controla semilla y reloj |
| `tests/e2e/duel.spec.ts` | Chromium real: interacción, resultados, reinicio, geometría y capturas por viewport |
| `.github/workflows/development-qa.yml` | CI exclusivamente en pushes de esta rama; Node 22/24 y Chromium, permisos de lectura, sin despliegue |

Contrato del motor, versión `dr-combat-1`:

- `createCombat(seed, difficulty)`: inicialización reproducible; semilla entera sin signo de 32 bits, incluido cero.
- `invalidAction(state, action)`: devuelve el motivo de rechazo o `null`.
- `applyCombatAction(state, action)`: devuelve `{ state, events, error }` sin mutar la entrada. Rechazo conserva el mismo estado, no consume RNG y no añade registro.
- Acciones: `play`, `end_turn`, `resolve_rival`, `pause`, `resume`, `difficulty`.
- `exportCombat(state)`: registro serializable con versión, semilla, dificultad inicial, acciones aceptadas y eventos.
- `replayCombat(record)`: reinicializa desde la semilla, reaplica acciones y verifica los eventos generados.

No es un servidor autoritativo ni un sistema antifraude. El estado, RNG y registro viven en memoria del cliente. No hay restauración automática tras recargar ni botones de importación/exportación.

## 5. Reglas efectivamente implementadas en el prototipo

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

Los detalles anteriores son la referencia de regresión actual, no una aprobación de balance definitivo. Cambiarlos requiere distinguir una decisión de diseño de un defecto.

## 6. Correcciones realizadas

1. Separación del catálogo y efectos estructurados; eliminación del rango de Impacto duplicado.
2. Inspiración con mano llena ahora usa el espacio liberado al jugarla; no anuncia una carta robada cuando no se pudo robar.
3. IA antigua: sustituida lectura de estado capturado por datos vigentes entre acciones y al resolver habilidades diferidas.
4. Pausa de la IA antigua: conserva esperas y cancela acciones/habilidades al salir o terminar el turno.
5. Motor puro del prototipo con semilla, validación central y replay.
6. UI indica «TURNO DEL RIVAL» durante su respuesta, en vez de mostrar «TU TURNO».
7. Diálogos: foco inicial, Tab/Shift+Tab contenido, Escape y retorno del foco; pausa se reanuda al cerrar.
8. QA real detectó ayuda fuera de pantalla y botones menores de 44 px; paneles ahora tienen altura limitada y scroll interno, y controles mínimos de 44×44 px.
9. Etiquetas «Mando» y «Racha» separadas tras revisar capturas.
10. CI de la rama y capturas/trazas automáticas para reproducir regresiones.

## 7. Pruebas y evidencias

| Nivel | Cantidad | Qué se comprobó |
|---|---:|---|
| Funciones de reglas | 9 | Daño/escudo, límites, Impactos, combo y robo |
| Controlador de IA antigua | 4 | Turnos consecutivos, estado vigente, pausa/reanudación y cancelación de acciones/habilidades |
| Motor nuevo | 10 | Ilegalidades, atomicidad, turnos, pausa, victoria/derrota, semilla y replay |
| Integración React–motor | 12 | Selección/uso/descarte, contadores, turno y tiempo, diálogos, teclado, salida de ruta y partidas completas |
| E2E Chromium | 20 | Cuatro casos en cinco viewports; geometría de paneles y controles, toque simulado, resultados y reinicio real |

Son **35 casos funcionales y 20 E2E** distintos; no sumar otra vez las ejecuciones repetidas en Node 22/24 como si fueran casos nuevos.

- Se reprodujeron 40 partidas del motor (semillas 0–39) con estados/eventos idénticos, conservación de 24 cartas y límites de vida/mano/mando. No son 10.000 simulaciones ni un estudio estadístico de equilibrio.
- Los flujos completos de UI usan semilla 0 para victoria (31 acciones, turno 9) y 5 para derrota (25 acciones, turno 8), comparando UI con el motor tras cada acción.
- Node 24.22.1 y Node 22.23.4 se comprobaron localmente en entregas anteriores; el workflow también aprobó sus trabajos Node 22/24 en runners limpios. No se verificó cada parche antiguo de Node 22.
- TypeScript y build de producción aprobados. El workflow instala con `npm ci`.

Matriz E2E aprobada en Chromium 156.0.8078.4 sobre Ubuntu:

| Viewport | Resultado |
|---|---|
| 320 × 568 | 4/4 |
| 360 × 800 | 4/4 |
| 390 × 844 | 4/4 |
| 360 × 480 | 4/4 |
| 844 × 390 | 4/4 |

Evidencia exacta más reciente: [run 41085102590](https://github.com/Afelex/Decreto-Real/actions/runs/41085102590), commit de código `5f48cfbf22f0faa257e2f65ff599b0249fbb4fd0`, conclusión `success` confirmada de nuevo para este informe.

Antecedentes: primer Chromium real [41083955390](https://github.com/Afelex/Decreto-Real/actions/runs/41083955390), 12 aprobadas/8 fallidas; tras corregir estilos [41084549868](https://github.com/Afelex/Decreto-Real/actions/runs/41084549868), 20/20. El último run añadió límites horizontales de controles y capturas de tablero/ayuda.

Artefacto `browser-results` del último run: ID `12992315092`, [descarga en Actions](https://github.com/Afelex/Decreto-Real/actions/runs/41085102590/artifacts/12992315092), retención de siete días (vence el 6 de noviembre de 2026 según metadatos). Contiene capturas de los cinco tamaños; se inspeccionaron muestras de 320 px, 390 px y horizontal. Las imágenes no están versionadas dentro del código.

**No ejecutado:** pruebas en Android/iPhone físicos, validación de Safari/WebKit o Firefox, piloto con investigadores, auditoría completa de accesibilidad, medición de fluidez/carga en red móvil y ensayo de balance. El viewport y tacto simulados en Chromium no sustituyen esas verificaciones.

## 8. Estado de las fases

| Fase | Evaluación actual |
|---|---|
| DR-00 | Parcial: contratos del motor y diagnóstico documentados; decisiones de casos límite e integración futura pendientes |
| DR-01 | Núcleo consolidado: motor determinista, acciones atómicas, eventos y pruebas. No cerrar toda la fase mientras agotamiento y desconexión/restauración sigan sin definición |
| DR-02 | Muestra jugable con pruebas de interfaz y navegador. Faltan tres barajas, tutorial guiado, piloto y validación física |
| Fases siguientes | Catálogo ampliado/editor, IA avanzada, integración, ranking, colección y PvP no implementados |

Aún no se ha alcanzado la presentación artística de la imagen conceptual ni estándares finales de publicación. Hay una base técnica probada para seguir iterando, no un producto final terminado.

## 9. Pendientes y revisión recomendada para Claude

| Prioridad | Trabajo | Criterio de salida |
|---|---|---|
| Alta | Revisar invariantes y fronteras del motor/replay sin cambiar reglas | Hallazgos con archivo, reproducción, gravedad y prueba de regresión; conservar semillas reproducibles |
| Alta | Proponer decisión de agotamiento y de desconexión al usuario | Alternativas y consecuencias explícitas. No implementar antes de autorización |
| Alta | Organizar QA en el teléfono del usuario y revisión visual humana | Comprobar legibilidad, tacto, diálogos y toda la información de estado; registrar dispositivo/navegador y observaciones |
| Media | Evaluar coste del registro para partidas largas | Medición de memoria/tiempo antes de optimizar; no perder reproducibilidad |
| Media | Acordar política de versiones de registros | Documentar cómo tratar registros antiguos al cambiar catálogo, RNG, eventos o mensajes |
| Posterior | Plan de una única implementación de combate | Propuesta de migración con regresiones, antes de eliminar `/game` o duplicar más código |

Puntos concretos para revisión estática; no todos son defectos reproducidos:

- `structuredClone(state)` copia también todo el journal en cada acción; el coste crece con la longitud de la partida.
- El replay compara eventos completos por JSON, incluidos mensajes. Cambiar un texto puede invalidar registros de la misma versión; revisar la estrategia antes de editar mensajes del motor.
- Se valida la acción contra un estado de confianza, no todo estado externo ni un esquema JSON hostil. No usar esta API como endpoint autoritativo sin un trabajo específico de validación.
- Hay valores conservados explícitos (20 de vida, 3 de mando, 12/10 de escudo) además de `GAME_RULES`. Cualquier refactor debe preservar las asimetrías actuales hasta acordar cambios.
- La UI consume `result.state` y descarta `error` del reducer; botones bloqueados previenen usos normales, pero revisar si los motivos de bloqueo son siempre comprensibles.
- En el CSS actual `.dr-seals` se oculta a anchuras de 370 px o menos; algunos textos llegan a 7–9 px. Los E2E no verifican que todos los datos importantes estén visibles ni miden comprensión. Revisar antes de afirmar que todo el móvil es legible.
- El rival del prototipo no administra cartas propias. No asumir que las probabilidades actuales equivalen a una IA de baraja simétrica, equilibrada o lista para competición.
- El escudo puede limitar la ganancia real por debajo de la cantidad indicada en el mensaje de una defensa. Revisar consistencia entre evento `gained`, texto y estado antes de cambiar mensajes/versiones.
- Fuentes y algunos recursos del juego antiguo siguen siendo remotos. No se comprobó funcionamiento completo offline ni presupuesto de carga.

## 10. Puesta en marcha y verificaciones

```sh
git fetch origin
git switch codex/decreto-real-combate-v1
git pull --ff-only origin codex/decreto-real-combate-v1
git status --short --branch
npm ci
npm test
npm run test:ui
npx tsc --noEmit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e -- --workers=2
```

Para abrir la muestra:

```sh
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
# Abrir http://127.0.0.1:4173/Decreto-Real/#/duelo-v1
```

Si el entorno no permite instalar/arrancar Chromium, usar el workflow ya existente de la rama y consultar sus resultados reales. No presentar un `--list`, jsdom o un intento de arranque fallido como navegador aprobado. En el entorno de ChatGPT falló la descarga directa de Playwright y un binario alternativo no arrancó; por eso la matriz se ejecutó en Actions. No se deben copiar rutas temporales de ese entorno al código.

Conservar `package-lock.json`, no confirmar `node_modules`, `dist`, trazas locales ni secretos. Los artefactos locales de tests están ignorados. La CI puede emitir avisos sobre los runtimes internos de actions v4; los trabajos revisados terminaron correctamente.

## 11. Historial de entregas principales

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

## 12. Encargo sugerido para la primera intervención de Claude

Lee este informe, `DR-01-motor.md`, `DR-00-02-auditoria.md` y `DR-02-qa-interfaz.md` desde la rama de desarrollo actualizada. Confirma el SHA y la limpieza del árbol antes de trabajar. Haz una revisión del motor, sus invariantes, el replay y la conexión React. Prioriza defectos comprobables que las pruebas actuales no detecten y añade regresión para los que corrijas. Conserva las reglas y el contrato reproducible; justifica cualquier cambio que afecte eventos/versiones. No implementes agotamiento, cartas, ranking, PvP ni integración, no modifiques `main` y no abras/fusiones PR. Entrega hallazgos con evidencia, archivos modificados, pruebas realmente ejecutadas, limitaciones y SHA publicado en desarrollo.

Coordinar el siguiente paquete con el usuario para evitar ediciones simultáneas de Claude y ChatGPT sobre los mismos archivos. Este informe habilita el traspaso de contexto; no implica que Claude ya haya revisado o ejecutado nada.
