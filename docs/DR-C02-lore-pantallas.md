# DR-C02 — Pantallas narrativas de Decreto Real I: El Sello y la Falsa Luz

**Rama:** `feat/campania-ia-estrellas-v1`
**Estado:** implementación revisable; no fusionada ni desplegada. **No afirmar QA aprobado hasta consultar CI.**
**Alcance:** historia y presentación del modo campaña; el motor y las cartas del duelo no se modifican.

## Canon editorial protegido

- Ambientación: Perú virreinal ficticio, año `162X`.
- Protagonista: joven soldado compasivo. `X` es identificador provisional; en una futura integración el jugador utilizará su nombre de cuenta.
- `Zero`: capitán y mentor, antiguo compañero de `Sigma`, guardián de un secreto de San Jerónimo.
- `Vile`: exmiembro brutal, mercenario armado, aliado de Sigma por poder y no por fe.
- `Sigma`: excomandante honorable, falso redentor de la Falsa Luz; descubre parte del fraude, pero continúa conscientemente imponiendo autoridad.
- La Falsa Luz utiliza injusticias reales y falsificaciones del Escribano del Alba.
- Final de Decreto Real I: Zero desaparece gravemente herido después de enfrentarse a Vile; Vile es capturado; Sigma muere en el derrumbe de la Casa del Sello; quedan abiertos San Jerónimo y el destino de Zero para Decreto Real II.
- PvP futuro: elegir exactamente **3 cartas especiales de las 8**; no se implementan aquí ni se mezclan con cartas comunes de efectos.

**Nota de canon:** los ocho generales, regiones y cartas especiales son canónicos dentro de esta versión. Los títulos de pequeñas misiones, adversarios menores y diálogos de enlace son una **adaptación provisional para pantallas**, no una transcripción literal aprobada de las 38 misiones anteriores. Deben revisarse editorialmente antes de cerrar la historia.

## Pantallas incorporadas

| Ruta | Pantalla | Función |
|---|---|---|
| `/#/campania/historia` | Prólogo narrativo | Presentación del conflicto, protagonistas y ocho generales |
| `/#/campania` | Mapa por capítulos | Progreso de 38 misiones, 114 estrellas máximas, diez tramos, regionalización y jefes |
| `/#/campania/mision/:missionId` | Presentación de encuentro | Ubicación, rival, diálogo, objetivos de estrella, botón de comenzar |
| misma ruta, tras comenzar | Combate real | Reutiliza `DuelBoard` y motor actuales; muestra el nombre narrativo del rival |
| misma ruta, al terminar | Crónica del resultado | Desenlace por misión, estrellas, marca mejorada, repetir o avanzar |
| `/#/campania/epilogo` | Epílogo | Final canónico, solo accesible tras superar la misión 38 |

El menú principal mantiene tres accesos: campaña, duelo libre y juego original.

## Estructura de 38 misiones

- Prólogo: 2 misiones (01–02).
- Ocho regiones: 4 misiones cada una (03–34), de las cuales la cuarta es el enfrentamiento con el general; en cada región existe un subjefe nombrado (segundo reto).
- Final: 4 misiones (35–38): Escribano del Alba, Vile, legado de Zero y Sigma. **Zero no es enemigo:** su escena consiste en superar la guardia de Sigma y seguir sus últimas pistas.

| General | Región | Carta especial de lore | Jefe |
|---|---|---|---|
| Almirante de Hierro | Puerto del Callao | Bombardeo naval | 06 |
| Jinete Escarlata | Caminos del Reino | Carga de caballería | 10 |
| Señor de la Plata | Minas de la Sierra | Pólvora enterrada | 14 |
| Artillero del Trueno | Fortaleza de Artillería | Fuego concentrado | 18 |
| Fantasma de la Selva | Frontera Oriental | Sendero secreto | 22 |
| Dama del Estandarte | Ciudad de los Estandartes | Estandarte de resistencia | 26 |
| Cóndor de los Andes | Fortaleza de las Cumbres | Ataque de las cumbres | 30 |
| Caballero del Juramento | Casa del Juramento | Último juramento | 34 |

Los subjefes de la historia original son, en orden: **Contramaestre rebelde, Capitán de salteadores, Capataz, Maestro bombardero, Explorador renegado, Predicador impostor, Guardián de los pasos y Teniente de la Guardia**.

## Mecánica y progresión, sin cambios de motor

- Se emplean las mismas cartas, efectos, vidas y reglas del prototipo. Los jefes **son por ahora identidades narrativas**, no disponen todavía de IA propia ni de cartas especiales activas.
- Cada misión utiliza una semilla fija y una de las tres dificultades del rival existente. Los objetivos de estrellas por vida y turno son **provisionales**, no equilibrados estadísticamente.
- Una victoria otorga al menos una estrella y desbloquea la siguiente misión; se puede repetir para mejorar la marca.
- La mejor marca por misión se guarda en `localStorage`, sin afectar al guardado del duelo libre.
- El capítulo inicial de ocho misiones de `DR-C01` ha sido **ampliado y sustituido por la estructura de 38**; no crear dos mapas paralelos.
- Siguen sin implementarse agotamiento simétrico, mazos de la IA, PvP, recompensas jugables, compras, clasificaciones o integración de cuenta.
- En la campaña la partida en curso no se restaura automáticamente tras cerrar el navegador, aunque el progreso de estrellas completadas sí se conserva.

## Pruebas y verificación

- `campaign/campaign.test.ts`: progresión, puntaje, almacenamiento, estructura de 38 misiones, ocho generales y cierre.
- `tests/integration/campaign.test.tsx`: mapa, desbloqueo, navegación, selector de regiones.
- `tests/integration/story.test.tsx`: prólogo, presentación del encuentro, bloqueo de jefe y acceso al epílogo.
- `tests/e2e/campaign.spec.ts`: mapa, prólogo, epílogo bloqueado, entrada al duelo y presentación del Almirante de Hierro en cinco viewports; las capturas quedan como artefactos de Actions cuando el workflow se ejecute.
- Pruebas anteriores de motor, juego, tutorial y guardado deben permanecer vigentes.

**No comprobado:** resultados CI de esta rama, navegador físico, duración real de las 38 misiones, balance de estrellas, adaptación literaria final, sistemas de jefes particulares y resultado efectivo de las verificaciones CI de esta rama.

## Próxima entrega

1. Validar compilación, pruebas React y E2E en esta rama. Corregir defectos antes de merge.
2. Fusionar o integrar cuidadosamente con el futuro rediseño `feat/duelo-mesa-interactiva-v2`: podría afectar `DuelBoard`, `App.tsx` o `MainMenu.tsx`.
3. Revisar editorialmente subtítulos, diálogos y subjefes contra la historia completa antes de declararla canon final.
4. Sustituir los bloques artísticos provisionales por fondos y personajes originales; no copiar el arte de otras franquicias.
5. Evaluar que los jefes tengan patrones propios cuando esté aprobado un sistema simétrico de IA y barajas.
