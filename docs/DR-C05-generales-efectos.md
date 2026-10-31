# DR-C05 · Retratos de generales y efectos de combate

Rama: `feat/generales-efectos-cartas-v1`.

## Entrega

- **Ocho retratos vectoriales diferenciados** para los generales de la campaña. Usan siluetas y atuendos originales de arte provisional (no retratos históricos ni artes definitivos aprobados): almirante naval, jinete, minero, artillero, guardián de la selva, dama del estandarte, cóndor de las cumbres y caballero del juramento.
- El retrato aparece en el briefing del jefe, sobre el paisaje de su región, y como avatar durante el duelo. Las misiones ordinarias conservan el retrato genérico, y el duelo libre sigue igual.
- La mesa de campaña muestra señales breves de **daño real después de escudos**, defensa efectiva, progreso de Impactos y cartas efectivamente robadas. El texto visible procede **solo** de eventos del motor ya aceptados y registrados. Un ataque completamente bloqueado dice «Bloqueado»; un robo sin nuevas cartas dice «Mazo sin cartas».
- Los efectos visuales se reconstruyen a partir de la **última entrada del diario**, por lo que no se introduce un segundo estado de combate ni se alteran RNG, turnos, habilidades o guardado.
- El cambio de turno, la pausa, el cambio de dificultad y las acciones inválidas no crean efectos engañosos.
- En dispositivos con `prefers-reduced-motion: reduce`, desaparecen las animaciones, pero permanecen los textos del efecto.
- No se incorporan las ocho cartas especiales de generales a los mazos actuales: siguen reservadas para una futura revisión de reglas y equilibrio.

## Regresión y aceptación

- Node 22/24: `npm test`, `npm run test:ui`, `npx tsc --noEmit`, `npm run build`.
- Chromium: cinco dimensiones en Playwright (320×568, 360×800, 390×844, 360×480, 844×390).
- Casos automatizados: ocho retratos, rival normal sin retrato de general, efectos de daño y escudo según el evento real, robo agotado, Impactos, ausencia de animación en pausa, guardado/replay intactos, legibilidad y posición dentro del viewport.
- Prueba manual pendiente: arrastre físico en Android, confirmación de toque y modo de reducción de movimiento.
- `main` solo debe actualizarse después del éxito completo de CI. Conservar respaldo anterior para revertir.

## Lo que queda fuera

Retratos ilustrados de alta resolución y aprobados editorialmente, sonidos, música, animaciones cinematográficas, nuevas cartas y habilidades, y mazos simétricos de la IA. Esta entrega prepara la capa visual sin alterar el motor estable.
