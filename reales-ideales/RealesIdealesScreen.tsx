import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carta,
  Duelo,
  Resultado,
  TOTAL_RONDAS,
  Virtud,
  crearDuelo,
  jugarCarta,
  siguienteRonda,
} from './logic';

const COLOR_VIRTUD: Record<Virtud, string> = {
  Justicia: '#d4af37',
  Sabiduría: '#6fa8dc',
  Valor: '#e05a4f',
};

const MENSAJE_RONDA: Record<Resultado, string> = {
  jugador: 'Ganas la ronda',
  cpu: 'El rival gana la ronda',
  empate: 'Empate en la ronda',
};

const MENSAJE_DUELO: Record<Resultado, string> = {
  jugador: 'Has ganado el duelo',
  cpu: 'El rival ha ganado el duelo',
  empate: 'El duelo termina en empate',
};

const BOTON_BASE =
  'h-[44px] px-4 rounded border border-[#d4af37] bg-gradient-to-b from-[#8f1f1f] to-[#5a1313] text-white font-bold tracking-[0.12em] text-sm uppercase active:scale-95 transition-transform';

const BOTON_SECUNDARIO =
  'h-[44px] px-4 rounded border border-[#777] bg-gradient-to-b from-[#4a4a4a] to-[#2b2b2b] text-gray-300 font-bold tracking-[0.12em] text-sm uppercase active:scale-95 transition-transform';

const FONDO =
  'min-h-[100dvh] w-full bg-[radial-gradient(circle_at_center,_#2a2a2a_0%,_#000_100%)] text-gold-main font-rpg';

interface CartaViewProps {
  carta?: Carta;
  oculta?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const CartaView: React.FC<CartaViewProps> = ({ carta, oculta, onClick, disabled }) => {
  const base =
    'flex flex-col items-stretch justify-between w-[92px] h-[134px] sm:w-[108px] sm:h-[156px] rounded-md border-2 p-2 shadow-card';

  if (oculta || !carta) {
    return (
      <div
        className={`${base} items-center justify-center border-[#8b6f36] bg-[repeating-linear-gradient(45deg,#1a1c23,#1a1c23_8px,#2a2520_8px,#2a2520_16px)]`}
      >
        <span className="text-3xl text-gold-dark">?</span>
      </div>
    );
  }

  const contenido = (
    <>
      <span className="text-[11px] font-bold leading-tight text-gold-light text-left">{carta.nombre}</span>
      <span className="text-3xl font-bold text-center text-gold-main">{carta.poder}</span>
      <span
        className="text-[10px] uppercase tracking-wider text-center"
        style={{ color: COLOR_VIRTUD[carta.virtud] }}
      >
        {carta.virtud}
      </span>
    </>
  );

  if (!onClick) {
    return <div className={`${base} border-[#d4af37] bg-[#1a1c23]`}>{contenido}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Jugar ${carta.nombre}, poder ${carta.poder}`}
      className={`${base} border-[#d4af37] bg-[#1a1c23] transition-transform ${
        disabled ? 'opacity-40' : 'hover:-translate-y-1 hover:shadow-glow active:scale-95'
      }`}
    >
      {contenido}
    </button>
  );
};

const Inicio: React.FC<{ onNuevo: () => void; onVolver: () => void }> = ({ onNuevo, onVolver }) => (
  <div className={`${FONDO} flex flex-col items-center px-4 py-8 gap-6`}>
    <header className="text-center">
      <p className="text-[10px] tracking-[0.18em] uppercase text-gold-dark">Juego de cartas</p>
      <h1 className="text-4xl font-decorative text-gold-light mt-2">REALES IDEALES</h1>
    </header>

    <section className="w-full max-w-md border border-[#8b6f36] bg-[#1a1c23]/80 rounded p-4 text-sm leading-relaxed text-gray-300">
      <h2 className="text-gold-main font-bold uppercase tracking-wider mb-2">Cómo se juega</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Cada jugador tiene un mazo de 9 cartas y una mano de 3.</li>
        <li>El duelo tiene 3 rondas. En cada una juegas una carta de tu mano.</li>
        <li>Gana la ronda la carta de mayor poder. Si el poder es igual, empatan.</li>
        <li>Tras cada ronda robas una carta del mazo.</li>
        <li>Gana el duelo quien consiga más rondas.</li>
        <li>La virtud de cada carta todavía no cambia el resultado.</li>
      </ul>
    </section>

    <div className="w-full max-w-md flex flex-col gap-3">
      <button type="button" onClick={onNuevo} className={BOTON_BASE}>
        Nuevo duelo
      </button>
      <button type="button" onClick={onVolver} className={BOTON_SECUNDARIO}>
        Volver al menú
      </button>
    </div>
  </div>
);

const RealesIdealesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [duelo, setDuelo] = useState<Duelo | null>(null);

  if (!duelo) {
    return <Inicio onNuevo={() => setDuelo(crearDuelo())} onVolver={() => navigate('/')} />;
  }

  const rondaJugada = duelo.resultadoRonda !== null;
  const duelTerminado = duelo.ganadorDuelo !== null;

  return (
    <div className={`${FONDO} flex flex-col items-center px-3 py-4 gap-4`}>
      <header className="w-full max-w-md flex items-center justify-between">
        <button type="button" onClick={() => setDuelo(null)} className="text-xs uppercase tracking-wider text-gray-300">
          ← Salir
        </button>
        <span className="text-xs uppercase tracking-wider text-gold-dark">
          Ronda {duelo.ronda} de {TOTAL_RONDAS}
        </span>
      </header>

      <section className="w-full max-w-md flex items-center justify-around border border-[#8b6f36] rounded py-2">
        <span className="text-sm">
          Tú <strong className="text-gold-light text-lg">{duelo.jugador.rondasGanadas}</strong>
        </span>
        <span className="text-gold-dark">—</span>
        <span className="text-sm">
          Rival <strong className="text-gold-light text-lg">{duelo.cpu.rondasGanadas}</strong>
        </span>
      </section>

      <section className="flex flex-col items-center gap-2">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">
          Rival · mazo: {duelo.cpu.mazo.length}
        </p>
        <div className="flex gap-2">
          {duelo.cpu.mano.map((carta) => (
            <CartaView key={carta.id} oculta />
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-3 min-h-[180px] justify-center">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Rival</span>
            <CartaView carta={duelo.jugadas.cpu ?? undefined} oculta={!duelo.jugadas.cpu} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Tú</span>
            <CartaView carta={duelo.jugadas.jugador ?? undefined} oculta={!duelo.jugadas.jugador} />
          </div>
        </div>

        {rondaJugada && duelo.resultadoRonda && (
          <p className="text-lg font-bold text-gold-light text-center">{MENSAJE_RONDA[duelo.resultadoRonda]}</p>
        )}
      </section>

      <section className="flex flex-col items-center gap-2">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">
          Tu mano · mazo: {duelo.jugador.mazo.length}
        </p>
        <div className="flex gap-2">
          {duelo.jugador.mano.map((carta) => (
            <CartaView
              key={carta.id}
              carta={carta}
              disabled={rondaJugada}
              onClick={() => setDuelo(jugarCarta(duelo, carta.id))}
            />
          ))}
        </div>
      </section>

      <div className="w-full max-w-md flex flex-col gap-3 mt-2">
        {rondaJugada && !duelTerminado && (
          <button type="button" onClick={() => setDuelo(siguienteRonda(duelo))} className={BOTON_BASE}>
            Siguiente ronda
          </button>
        )}

        {duelTerminado && duelo.ganadorDuelo && (
          <>
            <p className="text-xl font-bold text-gold-light text-center">{MENSAJE_DUELO[duelo.ganadorDuelo]}</p>
            <button type="button" onClick={() => setDuelo(crearDuelo())} className={BOTON_BASE}>
              Jugar otro duelo
            </button>
            <button type="button" onClick={() => navigate('/')} className={BOTON_SECUNDARIO}>
              Volver al menú
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RealesIdealesScreen;
