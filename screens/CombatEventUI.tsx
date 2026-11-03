import React from 'react';
import './combat-events.css';

type Side = 'PLAYER' | 'OPPONENT';

/** Compact, persistent status ribbon: blue belongs to the rival; red to the player. */
export function TurnIndicator({ side }: { side: Side }) {
  const player = side === 'PLAYER';
  return (
    <div className={`dr-event-indicator ${player ? 'is-player' : 'is-opponent'}`}
      role="status" aria-live="polite"
      aria-label={player ? 'Turno actual: tu turno' : 'Turno actual: turno del oponente'}>
      <span className="dr-event-indicator__label">{player ? 'Tu Turno' : 'Turno del Rival'}</span>
    </div>
  );
}

/** Short centered cue on changing turns; the artwork remains separate from live text. */
export function TurnAnnouncement({ variant, turn }: {
  variant: 'opening' | 'player' | 'opponent';
  turn?: number;
}) {
  const opening = variant === 'opening';
  const title = opening ? '¡INICIA EL COMBATE!' : variant === 'player' ? 'Tu Turno' : 'Turno del Rival';
  const subtitle = opening ? 'Prepárate para el duelo' : variant === 'player' ? 'Juega una carta' : 'El rival está actuando';
  return (
    <div className={`dr-event-turn dr-event-turn--${variant}`} role="status"
      aria-live="polite" aria-label={`${title}. ${subtitle}${turn ? ` (turno ${turn})` : ''}`}>
      <div className="dr-event-turn__ribbon">
        <strong>{title}</strong>
        {opening && <small>{subtitle}</small>}
      </div>
    </div>
  );
}

export function ComboChoicePanel({ level, onDamage, onHeal }: {
  level: 2 | 3;
  onDamage: () => void;
  onHeal: () => void;
}) {
  const amount = level === 2 ? 1 : 3;
  return (
    <div className="dr-event-stage dr-event-stage--combo">
      <div className="dr-event-stage__veil" aria-hidden="true" />
      <div className={`dr-event-choice dr-event-choice--${level}`} role="dialog"
        aria-modal="true" aria-labelledby="dr-event-combo-title" aria-describedby="dr-event-combo-help">
        <h2 id="dr-event-combo-title">Combo ×{level}</h2>
        <p id="dr-event-combo-help">Elige el efecto de tu combo.</p>
        <div className="dr-event-choice__options">
          <button type="button" className="dr-event-ability dr-event-ability--damage"
            onClick={onDamage} autoFocus>
            <span className="dr-event-ability__icon material-icons" aria-hidden="true">bolt</span>
            <strong>Furia Real</strong>
            <small>{amount} Daño al Rival</small>
          </button>
          <button type="button" className="dr-event-ability dr-event-ability--heal" onClick={onHeal}>
            <span className="dr-event-ability__icon material-icons" aria-hidden="true">health_and_safety</span>
            <strong>Gracia Divina</strong>
            <small>Curar {amount} HP</small>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CoinTossPanel({ coinSide, isFlipping, onToss }: {
  coinSide: 'CARA' | 'SELLO' | null;
  isFlipping: boolean;
  onToss: () => void;
}) {
  const result = coinSide === 'CARA' ? 'Empiezas tú' : coinSide === 'SELLO' ? 'Empieza el oponente' : '';
  return (
    <div className="dr-event-stage dr-event-stage--coin">
      <div className="dr-event-stage__veil" aria-hidden="true" />
      <div className="dr-event-coin-panel" role="dialog" aria-modal="true"
        aria-labelledby="dr-event-coin-title">
        <h2 id="dr-event-coin-title">¿Quién comienza?</h2>
        <button type="button" className={`dr-event-coin ${isFlipping ? 'is-flipping' : ''} ${coinSide === 'SELLO' ? 'show-sello' : 'show-cara'}`}
          aria-label="Lanzar moneda para decidir quién comienza" onClick={onToss} disabled={isFlipping || coinSide !== null}>
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
