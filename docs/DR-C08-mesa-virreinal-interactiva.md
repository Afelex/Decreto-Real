# DR-C08 · Mesa virreinal interactiva (primera implementación funcional)

## Objetivo

Adoptar la composición de los bocetos aprobados: plaza virreinal, personajes enfrentados, cartas grandes en abanico, mano oculta del rival, barajas con contadores, cuatro casillas centrales y botón circular para terminar el turno.

**No es una imagen de interfaz pegada encima del juego.** Se emplea el GameBoard original restaurado y cada pieza está conectada a su estado real. La ilustración de plaza inicial es un SVG autónomo, temporal y editable; se reemplazará por arte definitivo de alta resolución sin cambiar ni tarjetas ni lógica. Las imágenes, nombres y escudos de personajes son igualmente intercambiables a través de `GameBoard.presentation`.

## Nuevo contrato de interacción

1. **Tocar una carta**: selección visible y guía contextual; **no** consume la carta.
2. **Arrastrar Ataque o Defensa al campo**: al soltar sobre la zona, se ejecuta `playCard` original. Soltar fuera no tiene efecto.
3. **Arrastrar Impacto a la casilla correcta**: I, II, III, Final de izquierda a derecha. El motor original sigue limitando a un Impacto por turno y hace cumplir los rangos.
4. **Accesibilidad**: después de seleccionar, se puede tocar la zona central (Ataque/Defensa) o la casilla correspondiente (Impacto). Esto evita obligar al arrastre fino en todos los dispositivos. La tecla Enter/Espacio también puede seleccionar la carta y activar el objetivo.
5. **Seguridad**: selecciones y gestos no pueden gastar dos veces una carta ni jugar cartas durante pausas, turno rival, selección de habilidad o resultado.
6. **Combos**: ×2 refleja dos cartas encadenadas y ×3 indica la tercera (habilidad original). No existe un aviso «combo ×1» ni bonificaciones nuevas.
7. **Manos**: se ve el número de cartas reales de ambos jugadores, y las cartas rivales permanecen **siempre boca abajo**.
8. **Impactos**: cuatro espacios físicos centrales muestran las cartas al jugarse, sin crear espacios falsos ni repetir un contador de Impactos del jugador.
9. **Reglas intactas**: dos mazos de 24 (10 Ataque, 10 Defensa, cuatro Impactos); 10 HP; curación, daño, IA, ritual de moneda, sonidos, condición de victoria y guardado de campaña sin cambios.

## Estética y piezas intercambiables

- `public/escenarios/plaza-virreinal.svg`: fondo ilustrado local (referencia de estilo, no reconstrucción histórica exacta). Sin cartas ni UI incrustadas; puede cambiarse por el escenario de cualquier jefe.
- `screens/royal-table.css`: organización responsive por franjas del viewport, sin scroll vertical.
- `screens/GameBoard.tsx`: estado, interacción, animaciones y retratos desacoplados mediante la propiedad opcional `presentation: { background?, playerPortrait?, opponentPortrait? }`.
- Las manos, los contadores, los cuatro Impactos, la vida, las cartas y el botón están renderizados con elementos HTML reales.
- El arte digital del mockup no equivale por sí mismo a activos listos para producción; para igualar su detalle pictórico será necesario aportar/crear las ilustraciones separadas del fondo, cartas y retratos.

## Criterios de aceptación

- Una pulsación selecciona, pero no reduce la mano ni altera vidas.
- Una suelta válida activa exactamente la carta seleccionada, en la posición correcta; una suelta fuera no afecta el juego.
- Impacto I jamás puede entrar en la posición II, e Impacto III no debe poder jugarse antes del II.
- Los cuatro huecos muestran su progresión real y conservan el orden I → II → III → Final.
- Se ven contador de mano rival/jugador, mazos, vida, combo ×2 y ×3, cartas enfrentadas y botón Fin Turno.
- El juego abre y conserva el ritual de moneda, IA y audio.
- La campaña sigue desbloqueando misiones solo por victoria.
- Móvil 320×568, 360×800, 390×844, 360×480 y paisaje 844×390 sin desplazamiento vertical.
- Node 22 + Node 24 (reglas, integración, TypeScript y build), Chromium (navegación y arrastre) aprobados antes de integración a `main`.

## Próximas iteraciones

1. Integrar un fondo pictórico de mayor calidad **como archivo separado**, no como screenshot con cartas dibujadas.
2. Animación visual carta→casilla y efectos de impacto contextualizados, con movimiento reducido.
3. Ajustar el abanico en pruebas táctiles físicas y definir diseño de la mano cuando hay 8–12 cartas.
4. Definir retratos de los ocho generales con la misma plantilla visual y escenarios intercambiables.
5. Medir ritmo y balance; no cambiar reglas sin nueva decisión del propietario.
