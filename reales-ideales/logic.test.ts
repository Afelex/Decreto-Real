import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CARTAS,
  TAMANO_MANO,
  TAMANO_MAZO,
  TOTAL_RONDAS,
  barajar,
  crearDuelo,
  jugarCarta,
  resolverRonda,
  siguienteRonda,
} from './logic.ts';

const siempreCero = () => 0;

test('cada jugador recibe un mazo de 9 cartas distintas y una mano de 3', () => {
  const duelo = crearDuelo(siempreCero);
  for (const jugador of [duelo.jugador, duelo.cpu]) {
    const todas = [...jugador.mano, ...jugador.mazo];
    assert.equal(todas.length, TAMANO_MAZO);
    assert.equal(jugador.mano.length, TAMANO_MANO);
    assert.equal(new Set(todas.map((c) => c.id)).size, TAMANO_MAZO);
  }
});

test('barajar devuelve los mismos elementos sin modificar la lista original', () => {
  const original = [...CARTAS];
  const mezcla = barajar(CARTAS, siempreCero);
  assert.deepEqual(CARTAS, original);
  const ids = (lista: readonly { id: string }[]) => lista.map((c) => c.id).sort();
  assert.deepEqual(ids(mezcla), ids(original));
});

test('resolverRonda gana la carta de mayor poder y empata con poder igual', () => {
  const alta = CARTAS.find((c) => c.id === 'mariscal-audaz')!;
  const baja = CARTAS.find((c) => c.id === 'escudero-fiel')!;
  assert.equal(resolverRonda(alta, baja), 'jugador');
  assert.equal(resolverRonda(baja, alta), 'cpu');
  assert.equal(resolverRonda(alta, alta), 'empate');
});

test('jugarCarta quita la carta de la mano y suma la ronda al ganador', () => {
  const duelo = crearDuelo(siempreCero);
  const cartaJugador = duelo.jugador.mano[0];
  const tras = jugarCarta(duelo, cartaJugador.id, siempreCero);

  assert.equal(tras.jugador.mano.length, TAMANO_MANO - 1);
  assert.ok(!tras.jugador.mano.some((c) => c.id === cartaJugador.id));
  assert.equal(tras.jugadas.jugador?.id, cartaJugador.id);
  assert.ok(tras.resultadoRonda !== null);

  const sumadas = tras.jugador.rondasGanadas + tras.cpu.rondasGanadas;
  assert.equal(sumadas, tras.resultadoRonda === 'empate' ? 0 : 1);
});

test('jugarCarta ignora ids que no están en la mano y segundas jugadas en la misma ronda', () => {
  const duelo = crearDuelo(siempreCero);
  assert.equal(jugarCarta(duelo, 'no-existe', siempreCero), duelo);

  const jugado = jugarCarta(duelo, duelo.jugador.mano[0].id, siempreCero);
  assert.equal(jugarCarta(jugado, jugado.jugador.mano[0].id, siempreCero), jugado);
});

test('siguienteRonda roba una carta, limpia las jugadas y avanza la ronda', () => {
  const duelo = crearDuelo(siempreCero);
  const jugado = jugarCarta(duelo, duelo.jugador.mano[0].id, siempreCero);
  const siguiente = siguienteRonda(jugado);

  assert.equal(siguiente.ronda, 2);
  assert.equal(siguiente.resultadoRonda, null);
  assert.deepEqual(siguiente.jugadas, { jugador: null, cpu: null });
  assert.equal(siguiente.jugador.mano.length, TAMANO_MANO);
  assert.equal(siguiente.cpu.mano.length, TAMANO_MANO);
  assert.equal(siguiente.jugador.mazo.length, duelo.jugador.mazo.length - 1);
});

test('siguienteRonda no avanza si la ronda aún no se ha jugado', () => {
  const duelo = crearDuelo(siempreCero);
  assert.equal(siguienteRonda(duelo), duelo);
});

test('un duelo completo termina tras 3 rondas con el ganador correcto', () => {
  let duelo = crearDuelo(siempreCero);
  for (let ronda = 1; ronda <= TOTAL_RONDAS; ronda++) {
    duelo = jugarCarta(duelo, duelo.jugador.mano[0].id, siempreCero);
    if (ronda < TOTAL_RONDAS) {
      assert.equal(duelo.ganadorDuelo, null);
      duelo = siguienteRonda(duelo);
    }
  }

  assert.ok(duelo.ganadorDuelo !== null);
  const esperado =
    duelo.jugador.rondasGanadas === duelo.cpu.rondasGanadas
      ? 'empate'
      : duelo.jugador.rondasGanadas > duelo.cpu.rondasGanadas
        ? 'jugador'
        : 'cpu';
  assert.equal(duelo.ganadorDuelo, esperado);
  assert.equal(jugarCarta(duelo, 'cualquiera', siempreCero), duelo);
});

test('en la última ronda gana quien acumula más rondas', () => {
  const alta = CARTAS.find((c) => c.id === 'mariscal-audaz')!;
  const baja = CARTAS.find((c) => c.id === 'escudero-fiel')!;
  const enLaUltimaRonda = (rondasJugador: number, rondasCpu: number, cartaJugador = alta, cartaCpu = baja) => ({
    jugador: { nombre: 'Tú', mazo: [], mano: [cartaJugador], rondasGanadas: rondasJugador },
    cpu: { nombre: 'Rival', mazo: [], mano: [cartaCpu], rondasGanadas: rondasCpu },
    ronda: TOTAL_RONDAS,
    jugadas: { jugador: null, cpu: null },
    resultadoRonda: null,
    ganadorDuelo: null,
  });

  // Con 1-1 la última ronda decide el duelo.
  assert.equal(jugarCarta(enLaUltimaRonda(1, 1), alta.id, siempreCero).ganadorDuelo, 'jugador');
  // Si la última ronda empata y el marcador sigue igualado, el duelo queda en empate.
  assert.equal(jugarCarta(enLaUltimaRonda(1, 1, alta, alta), alta.id, siempreCero).ganadorDuelo, 'empate');
  // Si el rival va por delante y el jugador pierde la última, gana el rival.
  assert.equal(jugarCarta(enLaUltimaRonda(0, 2), alta.id, siempreCero).ganadorDuelo, 'cpu');
});
