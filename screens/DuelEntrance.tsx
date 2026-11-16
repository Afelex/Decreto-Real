import React from 'react';
import { G3_UI_ASSETS } from '../game/g3UiAssets';
import './duel-entrance.css';

type EntranceStage = 'gate' | 'rivals' | 'field';

type DuelEntranceProps = {
  playerPortrait: string;
  rivalPortrait: string;
  onFinish: () => void;
};

/**
 * Solo para la entrada desde «Jugar con la IA».
 * El escenario real y el motor de combate ya están montados debajo:
 * esta ceremonia no reparte cartas, modifica turnos ni lanza la moneda.
 */
export const DuelEntrance: React.FC<DuelEntranceProps> = ({
  playerPortrait, rivalPortrait, onFinish,
}) => {
  const [stage, setStage] = React.useState<EntranceStage>('gate');
  const [gateLoaded, setGateLoaded] = React.useState({ left: false, right: false });
  const gatesReady = gateLoaded.left && gateLoaded.right;
  const finishRef = React.useRef(onFinish);
  finishRef.current = onFinish;

  React.useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finishRef.current();
      return;
    }
    const timers = [
      window.setTimeout(() => setStage('rivals'), 1050),
      window.setTimeout(() => setStage('field'), 2450),
      window.setTimeout(() => finishRef.current(), 3550),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="dr-duel-entrance" data-testid="duel-entrance"
      data-stage={stage} role="dialog" aria-modal="true"
      aria-label="Presentación del duelo contra la IA">
      <div className="dr-duel-entrance__shade" aria-hidden="true" />
      <div className={`dr-duel-entrance__gate dr-duel-entrance__gate--left ${gatesReady ? 'has-g3-art' : ''}`} aria-hidden="true">
        <img className="dr-duel-entrance__gate-image" src={G3_UI_ASSETS.gateLeft} alt="" draggable={false}
          onLoad={() => setGateLoaded(state => ({ ...state, left: true }))}
          onError={() => setGateLoaded(state => ({ ...state, left: false }))}/>
      </div>
      <div className={`dr-duel-entrance__gate dr-duel-entrance__gate--right ${gatesReady ? 'has-g3-art' : ''}`} aria-hidden="true">
        <img className="dr-duel-entrance__gate-image" src={G3_UI_ASSETS.gateRight} alt="" draggable={false}
          onLoad={() => setGateLoaded(state => ({ ...state, right: true }))}
          onError={() => setGateLoaded(state => ({ ...state, right: false }))}/>
      </div>

      <div className="dr-duel-entrance__welcome" aria-live="polite">
        <span>LOS REINOS DEL PERÚ</span>
        <h2>EL DUELO TE ESPERA</h2>
        <small>Las puertas del campo se abren</small>
      </div>

      <section className="dr-duel-entrance__rivals" aria-label="Combatientes">
        <figure className="dr-duel-entrance__fighter dr-duel-entrance__fighter--player">
          <div className="dr-duel-entrance__portrait-wrap">
            <img className="dr-duel-entrance__portrait" src={playerPortrait} alt="" draggable={false} />
            <img className="dr-duel-entrance__portrait-ornament" src={G3_UI_ASSETS.playerFrame} alt="" aria-hidden="true" draggable={false}
              onError={event => { event.currentTarget.style.display = 'none'; }}/>
          </div>
          <figcaption>XERVIAS</figcaption>
        </figure>
        <div className="dr-duel-entrance__versus" aria-hidden="true">VS</div>
        <figure className="dr-duel-entrance__fighter dr-duel-entrance__fighter--rival">
          <div className="dr-duel-entrance__portrait-wrap">
            <img className="dr-duel-entrance__portrait" src={rivalPortrait} alt="" draggable={false} />
            <img className="dr-duel-entrance__portrait-ornament" src={G3_UI_ASSETS.rivalFrame} alt="" aria-hidden="true" draggable={false}
              onError={event => { event.currentTarget.style.display = 'none'; }}/>
          </div>
          <figcaption>RIVAL IA</figcaption>
        </figure>
        <h2>QUE COMIENCE EL DUELO</h2>
      </section>

      <div className="dr-duel-entrance__ready" role="status" aria-live="polite">
        <span>EL CAMPO ESTÁ LISTO</span>
        <strong>EL DESTINO DECIDE QUIÉN COMIENZA</strong>
      </div>

      <button type="button" className="dr-duel-entrance__skip"
        onClick={() => finishRef.current()} autoFocus>
        Omitir introducción
      </button>
    </div>
  );
};
