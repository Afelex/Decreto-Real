import React from 'react';
import './combat-events.css';

type Side = 'PLAYER' | 'OPPONENT';

export function TurnIndicator({ side }: { side: Side }) {
  return (
    <div className={`dr-event-indicator ${side === 'PLAYER' ? 'is-player' : 'is-opponent'}`}
      role="status" aria-live="polite"
      aria-label={side === 'PLAYER' ? 'Turno actual: tu turno' : 'Turno actual: turno del oponente'}>
      <span className="dr-event-indicator__laurel" aria-hidden="true">❧</span>
      <span className="dr-event-indicator__label">{side === 'PLAYER' ? 'Tu turno' : 'Turno rival'}</span>
      <span className="dr-event-indicator__laurel is-right" aria-hidden="true">❧</span>
    </div>
  );
}

export function TurnAnnouncement({ variant, turn }: {
  variant: 'opening' | 'player' | 'opponent';
  turn?: number;
}) {
  const opening = variant === 'opening';
  const title = opening ? '¡INICIA EL COMBATE!' : variant === 'player' ? 'TU TURNO' : 'TURNO DEL OPONENTE';
  const subtitle = opening ? 'Prepárate para el duelo' : variant === 'player' ? 'Juega una carta' : 'El rival está actuando';
  return (
    <div className={`dr-event-turn dr-event-turn--${variant}`} role="status"
      aria-live="polite" aria-label={`${title}. ${subtitle}`}>
      <div className="dr-event-turn__ribbon">
        {!opening && <span className="dr-event-turn__eyebrow">TURNO {turn}</span>}
        <strong>{title}</strong>
        <small>{subtitle}</small>
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
        <h2 id="dr-event-coin-title">Ritual de Inicio</h2>
        <p>Lance de moneda</p>
        <button type="button" className={`dr-event-coin ${isFlipping ? 'is-flipping' : ''}`}
          aria-label="Lanzar Moneda" onClick={onToss} disabled={isFlipping || coinSide !== null}>
          <span className="dr-event-coin__face" aria-hidden="true">
            <span>{coinSide === 'SELLO' ? '✠' : '☀'}</span>
          </span>
        </button>
        <div className="dr-event-coin-panel__result" role="status" aria-live="polite">
          {isFlipping && !coinSide ? 'La suerte está echada…' : result || 'Toca la moneda para lanzarla'}
        </div>
      </div>
    </div>
  );
}
