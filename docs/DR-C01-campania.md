# DR-C01 — Campaña contra IA: mapa y estrellas (prototipo)

**Estado:** Primera implementación revisable en `feat/campania-ia-estrellas-v1`. No desplegada. No es una entrega final de DR-03.
**Base:** `main` en `4e1f007adc4c3346755897dfa0660533fe6fa691`.

## Objetivo de producto

Decreto Real debe ofrecer dos experiencias complementarias:

1. **Campaña individual:** un mapa de capítulos y misiones de duelo contra la IA, con desbloqueo secuencial y hasta tres estrellas por nivel.
2. **Duelo libre:** la experiencia de combate existente, conservada. PvP, clasificación y sincronización futura quedan fuera de esta entrega.

La referencia de progresión son los mapas de niveles con estrellas de juegos como Angry Birds, no sus recursos artísticos ni mecánicas específicas. La temática gráfica es propia: recorrido hacia una audiencia real, con papel, oro envejecido y motivos coloniales.

## Alcance funcional de esta primera versión

- `/#/campania`: primer capítulo **Camino a la Corona**, ocho misiones en un recorrido vertical.
- `/#/campania/mision/:missionId`: abre el **mismo** componente `DuelBoard` del duelo libre; el combate no se reescribe.
- Cada misión ofrece un nombre, introducción, semilla fija reproducible y dificultad inicial.
- La primera misión empieza desbloqueada. Cualquier victoria (una estrella o más) desbloquea la siguiente.
- En cada misión se obtienen estrellas de manera independiente:
  - ★ Ganar el duelo.
  - ★ Ganar conservando al menos la vida objetivo indicada.
  - ★ Ganar en el turno objetivo o antes.
- La puntuación es acumulativa hasta tres estrellas; la mejor marca nunca disminuye al repetir.
- Cambiar la dificultad durante la partida limita la recompensa a una estrella. La regla se informa antes de entrar.
- Progreso persistido solo en `localStorage` con clave `decreto-real.campania.v1`; sin conexión de cuenta, compras o energía.
- Ruta `/game` y `/duelo-v1` siguen disponibles en el menú.
- El duelo de campaña no utiliza el espacio de partida guardada del duelo libre.

## Límites conocidos

- Las ocho misiones usan el mismo catálogo y mecánica de duelo, variando semilla y perfil inicial. **No son todavía ocho escenarios con reglas particulares, diálogos narrativos ni barajas propias.**
- Objetivos de turno y vida son valores iniciales para experimentar; no se han equilibrado con un estudio de partidas reales.
- La IA sigue siendo el rival actual y no gestiona mano/mazo propios; el diseño simétrico de agotamiento es una propuesta futura separada.
- La campaña conserva las reglas actuales: no introduce fatiga, reciclaje ni pérdida automática por mazo vacío.
- El progreso de estrellas se guarda localmente, pero **la partida de misión en curso no se recupera tras cerrar la página** en esta primera iteración. Hay que reiniciar ese duelo.
- Si el navegador bloquea el almacenamiento, se permite jugar y se advierte cuando una victoria no se puede guardar.
- No hay estrellas globales, perfiles remotos, pagos, energía, PvP, premios o desbloqueos cosméticos.
- Las rutas y progresión están implementadas en una rama aparte; no se declara publicada ni validada en un móvil físico.

## Flujo de validación sugerido

1. Entrar a `/#/campania` y comprobar que solo la misión 1 está habilitada.
2. Abrir la misión 1, revisar requisitos de ★, ★★, ★★★ y comenzar.
3. Jugar hasta ganar: verificar pantalla de resultado, estrellas y desbloqueo de misión 2.
4. Repetir la misión y comprobar que la mejor marca no retrocede.
5. Cambiar dificultad durante un duelo: comprobar que la recompensa no supera una estrella.
6. Perder: no registrar estrellas ni avanzar el mapa.
7. Volver a abrir la campaña tras recargar: las estrellas deben persistir.
8. Iniciar un duelo libre en `/duelo-v1` y comprobar que su partida guardada no se sobrescribió.
9. Probar el mapa en 320 × 568, 360 × 800, 390 × 844, 360 × 480 y 844 × 390.
10. Comprobar que `/game` sigue siendo accesible.

Pruebas automatizadas agregadas:
- `campaign/campaign.test.ts`: ocho casos de reglas de progresión y almacenamiento.
- `tests/integration/campaign.test.tsx`: cuatro casos de mapa y navegación en React.
- `tests/e2e/campaign.spec.ts`: tres casos en cada uno de los cinco viewports de Playwright (15 ejecuciones previstas) para desbloqueo, detalles, salida y entrada al duelo.
- `npm test` ejecuta reglas de juego y reglas de campaña.
- El workflow de desarrollo de esta rama ejecuta Node 22/24, integración, compilación y E2E existentes.

**Pendientes:** ejecutar y verificar las pruebas CI de esta rama; E2E de victoria completa, registro de estrellas y desbloqueo posterior; verificación visual humana y pruebas reales en móviles. Los 15 casos E2E de mapa son pruebas preparadas, no aprobadas hasta que el workflow termine satisfactoriamente. No confundir E2E del duelo con QA del mapa.

## Evolución recomendada

- **C02:** evaluar duración y dificultad de cada escenario con partidas simuladas y jugadores reales; ajustar únicamente los objetivos de estrellas.
- **C03:** introducir briefings de historia, eventos y variantes de escenarios de manera incremental y explícita, sin alterar el motor global accidentalmente.
- **C04:** permitir guardado recuperable de una misión individual sin mezclarlo con duelo libre.
- **C05:** capítulos adicionales, recompensas cosméticas y futuro acceso desde Peruanistas.
- **PvP:** proyecto posterior e independiente, sin bloquear el modo historia.

## Coordinación con otros desarrollos

La primera campaña se construye desde el `main` publicado en una **rama separada**. No se modifica la rama del rediseño de mesa/arrastre de cartas. Antes de fusionar, rebasar o integrar con ese rediseño y revisar conflictos especialmente en `App.tsx` y `screens/MainMenu.tsx`. No modificar `DuelBoard` para solucionar conflictos de estilos; el modo campaña debe seguir consumiendo el componente compartido.
