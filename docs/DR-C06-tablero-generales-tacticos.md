# DR-C06 — Generales tácticos y tablero inspirado en la versión original

## Alcance aceptado para esta iteración

El objetivo es recuperar la sensación de mesa analógica del juego original `/game` y dar personalidad a los ocho generales de la campaña, **sin crear nuevas cartas, nuevos poderes, daño extra, costes nuevos, inventarios rivales o reglas de agotamiento**.

### Tablero de campaña
- Recupera la composición de dos fuerzas enfrentadas, tapete oscuro, adornos metálicos, ranuras ornamentales centrales, mano de cartas ligeramente abierta en abanico, marco artístico en las cartas y botón de turno destacado en rojo y oro.
- Los cuatro sellos visibles **reflejan los Impactos reales** de cada participante; las dos ranuras del centro son decorativas y no representan cartas que el rival tenga en mano.
- Conserva arrastrar y soltar una carta sobre la mesa; tocar y confirmar sigue siendo la alternativa accesible.
- Toda la pantalla cabe en `100dvh` sin desplazamiento vertical. La mano mantiene únicamente desplazamiento horizontal. Las decoraciones se reducen en pantallas cortas para no sacrificar botones.
- `/game` y `/duelo-v1` continúan usando sus propias interfaces: esta apariencia nueva solo se aplica a `/campania/mision/:id`.

### Tácticas individuales
Los ocho generales usan **las mismas tres acciones preexistentes de la IA**: ataque, defensa de escudo e Impacto. Lo que cambia es el criterio determinista para elegirlas, con una sola muestra del RNG del motor y factores situacionales; conservan los topes, el daño, las curaciones, la vida y la prioridad del cuarto Impacto ya existentes.

| General | Táctica | Tendencia |
|---|---|---|
| Almirante de Hierro | Baluarte naval | Preparar escudo y contraatacar |
| Jinete Escarlata | Carga veloz | Atacar de forma insistente |
| Señor de la Plata | Pacto de plata | Buscar Impactos |
| Artillero del Trueno | Fuego de artillería | Priorizar daño con poca defensa rival |
| Fantasma de la Selva | Emboscada velada | Alternar ataques e Impactos |
| Dama del Estandarte | Estandarte firme | Resistir con escudo |
| Cóndor de los Andes | Picado de las cumbres | Atacar más cuando el jugador está herido |
| Caballero del Juramento | Juramento final | Adaptarse cuando él mismo está en peligro |

Una ficha en la cabecera del rival y el briefing revelan la orientación táctica, de modo que es una **decisión estratégica reconocible y no una ventaja oculta**.

### Contrato del motor y compatibilidad
- La nueva acción aceptada es `{type:'resolve_rival', bossId:'1'..'8'}`. Sigue siendo **una respuesta por turno**. El ID está validado, es canónico y queda guardado en el diario para reproducción fiel.
- `ENGINE_VERSION` pasa a `dr-combat-3` debido a la nueva semántica opcional del rival. Los diarios de `dr-combat-1` y `dr-combat-2` son versiones legibles: sus acciones de IA sin `bossId` se reproducen con su comportamiento original, sin variación.
- Las partidas del duelo libre y el tutorial **no tienen** `bossId` y conservan la misma IA y secuencia de RNG. La campaña usa `bossId` solo si la misión es efectivamente un jefe; no en subjefes, soldados ni batallas finales.
- El cambio del perfil no altera la puntuación de estrellas ni el desbloqueo, pero podría modificar la dificultad real de un general y requiere pruebas de balance con partidas reproducidas.
- No se implementa una mano, mazo ni agotamiento simétrico de la IA. Es una iteración táctica **sobre el prototipo actual**, no el motor competitivo definitivo.

## Verificación
- Node 22 y 24: pruebas de reglas/motor/compatibilidad, integración UI, TypeScript y build.
- Chromium: cinco tamaños 320×568, 360×800, 390×844, 360×480 y 844×390; la nueva mesa, mano y «Terminar turno» deben quedar visibles.
- Comprobar que los ocho perfiles difieran, el registro tenga `bossId` en respuestas a generales, el replay sea exacto y los registros viejos sigan válidos.
- Probar arrastre, toque-confirmación, pausa, historia y retorno al mapa; movimiento reducido sigue vigente.
- No modificar `main` sin aprobar CI y conservar un respaldo anterior.

## Pendientes
Balance empírico por boss con 1.000 partidas o más, IA con mano/mazo simétricos, agotamiento pactado, imágenes definitivas de cartas y generales, efectos sonoros originales opcionales y PvP de tres cartas especiales elegidas entre ocho.
