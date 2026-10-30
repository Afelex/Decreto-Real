// Lógica de Reales Ideales: sin React, para poder probarla por separado.
// Reglas v1 (punto de partida, pensadas para cambiarse después):
// - Cada jugador tiene un mazo de 9 cartas y una mano de 3.
// - El duelo tiene 3 rondas. En cada ronda se juega una carta y gana la de mayor poder.
// - Tras cada ronda se roba una carta del mazo para volver a tener 3 en la mano.
// - Gana quien más rondas consigue. Si empatan, el duelo queda en empate.
// La virtud de cada carta se guarda para usarla en reglas futuras; de momento no afecta al resultado.

export type Virtud = 'Justicia' | 'Sabiduría' | 'Valor';

export interface Carta {
  id: string;
  nombre: string;
  poder: number;
  virtud: Virtud;
}

export const CARTAS: readonly Carta[] = [
  { id: 'rey-justo', nombre: 'Rey Justo', poder: 9, virtud: 'Justicia' },
  { id: 'reina-sabia', nombre: 'Reina Sabia', poder: 7, virtud: 'Sabiduría' },
  { id: 'principe-valiente', nombre: 'Príncipe Valiente', poder: 6, virtud: 'Valor' },
  { id: 'consejero-astuto', nombre: 'Consejero Astuto', poder: 5, virtud: 'Sabiduría' },
  { id: 'capitan-leal', nombre: 'Capitán Leal', poder: 8, virtud: 'Valor' },
  { id: 'juez-imparcial', nombre: 'Juez Imparcial', poder: 4, virtud: 'Justicia' },
  { id: 'bardo-sincero', nombre: 'Bardo Sincero', poder: 3, virtud: 'Sabiduría' },
  { id: 'heraldo-veloz', nombre: 'Heraldo Veloz', poder: 2, virtud: 'Valor' },
  { id: 'escudero-fiel', nombre: 'Escudero Fiel', poder: 1, virtud: 'Justicia' },
  { id: 'obispo-sereno', nombre: 'Obispo Sereno', poder: 6, virtud: 'Justicia' },
  { id: 'mariscal-audaz', nombre: 'Mariscal Audaz', poder: 10, virtud: 'Valor' },
  { id: 'cronista-prudente', nombre: 'Cronista Prudente', poder: 5, virtud: 'Sabiduría' },
];

export const TAMANO_MAZO = 9;
export const TAMANO_MANO = 3;
export const TOTAL_RONDAS = 3;

export type Resultado = 'jugador' | 'cpu' | 'empate';

export interface Jugador {
  nombre: string;
  mazo: Carta[];
  mano: Carta[];
  rondasGanadas: number;
}

export interface Duelo {
  jugador: Jugador;
  cpu: Jugador;
  ronda: number;
  jugadas: { jugador: Carta | null; cpu: Carta | null };
  resultadoRonda: Resultado | null;
  ganadorDuelo: Resultado | null;
}

type Azar = () => number;

export function barajar<T>(lista: readonly T[], azar: Azar = Math.random): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function crearJugador(nombre: string, azar: Azar): Jugador {
  const cartas = barajar(CARTAS, azar).slice(0, TAMANO_MAZO);
  return {
    nombre,
    mano: cartas.slice(0, TAMANO_MANO),
    mazo: cartas.slice(TAMANO_MANO),
    rondasGanadas: 0,
  };
}

export function crearDuelo(azar: Azar = Math.random): Duelo {
  return {
    jugador: crearJugador('Tú', azar),
    cpu: crearJugador('Rival', azar),
    ronda: 1,
    jugadas: { jugador: null, cpu: null },
    resultadoRonda: null,
    ganadorDuelo: null,
  };
}

export function resolverRonda(cartaJugador: Carta, cartaCpu: Carta): Resultado {
  if (cartaJugador.poder === cartaCpu.poder) return 'empate';
  return cartaJugador.poder > cartaCpu.poder ? 'jugador' : 'cpu';
}

function ganadorDelDuelo(jugador: Jugador, cpu: Jugador): Resultado {
  if (jugador.rondasGanadas === cpu.rondasGanadas) return 'empate';
  return jugador.rondasGanadas > cpu.rondasGanadas ? 'jugador' : 'cpu';
}

function sumarRonda(jugador: Jugador, resultado: Resultado, bando: 'jugador' | 'cpu'): Jugador {
  if (resultado !== bando) return jugador;
  return { ...jugador, rondasGanadas: jugador.rondasGanadas + 1 };
}

// El jugador juega una carta de su mano y la CPU juega una al azar.
// La ronda se resuelve al momento. Devuelve el mismo duelo si la jugada no es válida.
export function jugarCarta(duelo: Duelo, cartaId: string, azar: Azar = Math.random): Duelo {
  if (duelo.resultadoRonda || duelo.ganadorDuelo) return duelo;

  const cartaJugador = duelo.jugador.mano.find((c) => c.id === cartaId);
  if (!cartaJugador) return duelo;

  const indiceCpu = Math.floor(azar() * duelo.cpu.mano.length);
  const cartaCpu = duelo.cpu.mano[indiceCpu];

  const resultado = resolverRonda(cartaJugador, cartaCpu);
  const jugador: Jugador = {
    ...duelo.jugador,
    mano: duelo.jugador.mano.filter((c) => c.id !== cartaJugador.id),
  };
  const cpu: Jugador = {
    ...duelo.cpu,
    mano: duelo.cpu.mano.filter((c) => c.id !== cartaCpu.id),
  };

  const jugadorTras = sumarRonda(jugador, resultado, 'jugador');
  const cpuTras = sumarRonda(cpu, resultado, 'cpu');
  const ultimaRonda = duelo.ronda === TOTAL_RONDAS;

  return {
    ...duelo,
    jugador: jugadorTras,
    cpu: cpuTras,
    jugadas: { jugador: cartaJugador, cpu: cartaCpu },
    resultadoRonda: resultado,
    ganadorDuelo: ultimaRonda ? ganadorDelDuelo(jugadorTras, cpuTras) : null,
  };
}

function robarUna(jugador: Jugador): Jugador {
  if (jugador.mazo.length === 0) return jugador;
  return {
    ...jugador,
    mano: [...jugador.mano, jugador.mazo[0]],
    mazo: jugador.mazo.slice(1),
  };
}

// Pasa a la siguiente ronda: cada jugador roba una carta y se limpian las jugadas.
export function siguienteRonda(duelo: Duelo): Duelo {
  if (!duelo.resultadoRonda || duelo.ganadorDuelo) return duelo;

  return {
    ...duelo,
    jugador: robarUna(duelo.jugador),
    cpu: robarUna(duelo.cpu),
    ronda: duelo.ronda + 1,
    jugadas: { jugador: null, cpu: null },
    resultadoRonda: null,
  };
}
