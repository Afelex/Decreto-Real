# Canon narrativo: Corona Solar y Revolución Solar

**Estado:** nombres aprobados, marco místico para la historia. No cambia las reglas del motor de combate.

## Dos fuerzas diferentes

**Orden de la Corona Solar:** institución de guardianes encargada de mantener la paz del reino. Sus soldados, capitanes, generales y algunos servidores públicos se entrenan y son consagrados. Al superar ese proceso reciben un anillo que concentra la mística para canalizar el poder de las cartas.

**Revolución Solar:** movimiento encabezado por **Sigumán**, antiguo comandante de la Orden. Sus partidarios son **los solarianos**. Sigumán aprovecha agravios reales y falsifica decretos escritos para manipular a la población y a miembros de la Orden. La Revolución Solar usa el símbolo solar para disputar la legitimidad del reino; **no es la misma institución que la Orden de la Corona Solar**.

**Decreto Real:** no es únicamente la orden administrativa firmada con un sello. También es el nombre del combate místico que un portador del anillo libra mediante cartas. Esta doble acepción es deliberada: la falsificación de los documentos puede llevar a portadores del poder a enfrentarse entre sí.

## Quién puede luchar con cartas

- Una persona corriente, sin entrenamiento ni consagración, **no puede** utilizar un anillo ni canalizar cartas.
- Un **miembro en servicio** tiene anillo por su consagración y trabaja en la Orden.
- Un **antiguo miembro** mantiene su capacidad adquirida incluso si se retiró o se corrompió. El anillo depende de la aptitud, **no certifica su moralidad**.
- Un **consagrado en función civil** recibió la formación correspondiente y ejerce como mensajero, escribano, guía u otro oficio. No se debe confundir con cualquier civil sin formación.
- Un **custodio consagrado** protege a vecinos, funcionarios civiles, caminos o instituciones. Cuando la persona protegida carece de anillo, **el custodio combate por ella**. Una autoridad no consagrada no realiza mágicamente el duelo por delegación.

Las 38 identidades de combate conservan nombre y cargo propios. `campaign/characters.ts` registra la relación de cada portador con la consagración mediante `sealPath` (`orden`, `retirado`, `civil_consagrado`, `custodio`). En esta clasificación, `custodio` es un miembro consagrado destinado a tareas de protección.

Ejemplos: Xervias es soldado de la Orden; Zhinchi es capitán; Sigumán fue comandante. Bartolomé, el contramaestre, fue miembro; Esteban, el capataz, también. Mateo es mensajero civil consagrado; Rafael es escribano civil consagrado; los guardias del puerto y la plaza son custodios.

## Límites dramáticos

La mística explica **cómo** sucede un combate, no sustituye las razones humanas para combatir. Cada portador tiene una historia: proteger a su gente, seguir órdenes, obedecer por miedo, beneficiarse de la corrupción o buscar justicia. El conflicto central opone el juramento de paz a quienes usan ese mismo poder para someter al reino.

El anillo y el entrenamiento no conceden automáticamente superioridad moral. El agotamiento de la vida durante el combate significa derrota en el juego; una muerte solo ocurre si la historia la narra expresamente.

Los nombres oficiales que deben aparecer en las pantallas son **Orden de la Corona Solar**, **Revolución Solar** y **solarianos**. El epílogo es una conclusión de esta historia: no debe anunciar otra entrega ni presentar una frase del tipo «continuará».
