import React from 'react';
import { createPortal } from 'react-dom';
import { syncCueVideoRate } from '../game/effectCues';
import './combat-events.css';

/** Duración exclusiva del aviso de cambio de turno en el duelo contra la IA. */
export const TURN_TRANSITION_DURATION_MS = 1500;

type Side = 'PLAYER' | 'OPPONENT';

/** Compact, persistent status ribbon: blue belongs to the rival; red to the player. */
export function TurnIndicator({ side, className = '', ...props }: { side: Side } & React.HTMLAttributes<HTMLDivElement>) {
  const player = side === 'PLAYER';
  return (
    <div {...props} className={`dr-event-indicator ${player ? 'is-player' : 'is-opponent'}${className ? ' ' + className : ''}`}
      role="status" aria-live="polite"
      aria-label={player ? 'Turno actual: tu turno' : 'Turno actual: turno del oponente'}>
      <span className="dr-event-indicator__label">{player ? 'Tu Turno' : 'Turno del Rival'}</span>
    </div>
  );
}

/** Short centered cue on changing turns; the artwork remains separate from live text. */
export function TurnAnnouncement({ variant, turn, preview = false, fullscreen = false, ribbonProps }: {
  variant: 'opening' | 'player' | 'opponent';
  turn?: number;
  /** Keep the live transition independent of the narrow, contained game table. */
  fullscreen?: boolean;
  /** Vista fija del estandarte en Studio para poder arrastrarlo. */
  preview?: boolean;
  ribbonProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const [videoFailed, setVideoFailed] = React.useState(false);
  // Android may block or stall autoplay without dispatching an error. Keep
  // the static approved ribbon visible until an actual playing frame exists.
  const [videoPlaying, setVideoPlaying] = React.useState(false);
  const opening = variant === 'opening';
  const showVideo = !opening && !preview && !videoFailed;
  const videoSrc = `${import.meta.env.BASE_URL}animaciones/banner-${variant === 'player' ? 'jugador-rojo' : 'rival-azul'}.webm`;
  const title = opening ? '¡INICIA EL COMBATE!' : variant === 'player' ? 'Tu Turno' : 'Turno del Rival';
  const subtitle = opening ? 'Prepárate para el duelo' : variant === 'player' ? 'Juega una carta' : 'El rival está actuando';
  const announcement = (
    <div className={`dr-event-turn dr-event-turn--${variant}${preview ? ' dr-event-turn--studio-preview' : ''}`} role="status"
      aria-live="polite" style={!opening && !preview ? { animationDuration: `${TURN_TRANSITION_DURATION_MS}ms` } : undefined} aria-label={`${title}. ${subtitle}${turn ? ` (turno ${turn})` : ''}`}>
      <div {...ribbonProps} className={`dr-event-turn__ribbon${showVideo ? ' dr-event-turn__ribbon--video' : ''}${videoPlaying ? ' dr-event-turn__ribbon--playing' : ''}${ribbonProps?.className ? ' ' + ribbonProps.className : ''}`}>
        {showVideo && <video className="dr-event-turn__video" autoPlay muted playsInline preload="auto"
          aria-hidden="true" onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, TURN_TRANSITION_DURATION_MS)}
          onPlaying={() => setVideoPlaying(true)}
          onWaiting={() => setVideoPlaying(false)}
          onStalled={() => setVideoPlaying(false)}
          onError={() => { setVideoPlaying(false); setVideoFailed(true); }}>
          <source src={videoSrc} type="video/webm" />
        </video>}
        <strong>{title}</strong>
        {opening && <small>{subtitle}</small>}
      </div>
    </div>
  );
  // The 430px battle frame has containment; positioning inside it cannot
  // cover a landscape viewport. Portaling is only for live handoffs.
  if (fullscreen && !preview && typeof document !== 'undefined') {
    return createPortal(
      <div className={`dr-royal-screen dr-turn-portal dr-turn-portal--${variant}`}>
        {announcement}
      </div>, document.body,
    );
  }
  return announcement;
}

/** Combo x2 y x3 comparten el mismo arte; los efectos y botones siguen siendo texto real. */
export function ComboChoicePanel({ level, onDamage, onHeal, preview = false, panelProps }: {
  level: 2 | 3;
  onDamage: () => void;
  onHeal: () => void;
  preview?:boolean;
  panelProps?:React.HTMLAttributes<HTMLDivElement>;
}) {
  const amount = level === 2 ? 1 : 3;
  return (
    <div className="dr-event-stage dr-event-stage--combo">
      <div className="dr-event-stage__veil" aria-hidden="true" />
      <div {...panelProps} className={`dr-event-choice dr-event-choice--${level}${panelProps?.className?" "+panelProps.className:""}`} role="dialog"
        aria-modal="true" aria-labelledby="dr-event-combo-title" aria-describedby="dr-event-combo-help">
        <img className="dr-event-choice__art" src={`${import.meta.env.BASE_URL}interfaz/hud-g3/combo_panel.webp`}
          alt="" aria-hidden="true" draggable={false} />
        <h2 id="dr-event-combo-title">Combo ×{level}</h2>
        <p className="dr-event-combo-sr-only" id="dr-event-combo-help">Elige el efecto de tu combo.</p>
        <div className="dr-event-choice__options">
          <button type="button" className="dr-event-ability dr-event-ability--damage"
            onClick={onDamage} disabled={preview} autoFocus={!preview}>
            <strong>Furia Real</strong>
            <small>{amount} Daño al Rival</small>
          </button>
          <button type="button" className="dr-event-ability dr-event-ability--heal" disabled={preview} onClick={onHeal}>
            <strong>Gracia Divina</strong>
            <small>Curar {amount} HP</small>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CoinTossPanel({ coinSide, isFlipping, onToss, preview = false, panelProps }: {
  coinSide: 'CARA' | 'SELLO' | null;
  isFlipping: boolean;
  onToss: () => void;
  preview?:boolean;
  panelProps?:React.HTMLAttributes<HTMLDivElement>;
}) {
  const result = coinSide === 'CARA' ? 'Empiezas tú' : coinSide === 'SELLO' ? 'Empieza el oponente' : '';
  return (
    <div className="dr-event-stage dr-event-stage--coin">
      <div className="dr-event-stage__veil" aria-hidden="true" />
      <div {...panelProps} className={"dr-event-coin-panel"+(panelProps?.className?" "+panelProps.className:"")} role="dialog" aria-modal="true"
        aria-labelledby="dr-event-coin-title">
        <h2 id="dr-event-coin-title">¿Quién comienza?</h2>
        <button type="button" className={`dr-event-coin ${isFlipping ? 'is-flipping' : ''} ${coinSide === 'SELLO' ? 'show-sello' : 'show-cara'}`}
          aria-label="Lanzar Moneda" onClick={onToss} disabled={preview || isFlipping || coinSide !== null}>
          <span className="dr-event-coin__face" aria-hidden="true">
            <img className="dr-event-coin__art dr-event-coin__art--cara"
              src={`${import.meta.env.BASE_URL}moneda/sol.webp`} alt="" draggable={false} />
            <img className="dr-event-coin__art dr-event-coin__art--sello"
              src={`${import.meta.env.BASE_URL}moneda/cruz.webp`} alt="" draggable={false} />
          </span>
        </button>
        <div className="dr-event-coin-panel__result" role="status" aria-live="polite">
          {isFlipping && !coinSide ? 'Girando…' : result || 'Toca la moneda'}
        </div>
      </div>
    </div>
  );
}
