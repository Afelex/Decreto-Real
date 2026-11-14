import React from 'react';
import type { CardType } from '../types';
import './last-decree-indicator.css';

const DECREES: Record<CardType, { name: string; art: string }> = {
  ATTACK: { name: 'Ataque', art: 'decreto_ataque.png' },
  DEFENSE: { name: 'Defensa', art: 'decreto_defensa.png' },
  ORDER: { name: 'Orden', art: 'decreto_orden.png' },
  IMPACT: { name: 'Impacto', art: 'decreto_impacto.png' },
  MYSTIC: { name: 'Místico', art: 'decreto_mistico.png' },
};

/** Decoration only. The latest accepted card type is still driven by combat
 * state and separately tracked for player and opponent. */
export function LastDecreeIndicator({ type, comboLevel = 1, side }: {
  type: CardType | null; comboLevel?: 1 | 2 | 3; side: 'player' | 'opponent'
}) {
  if (!type) return null;
  const decree = DECREES[type];
  return (
    <div className={`dr-last-decree-indicator dr-last-decree-indicator--${type.toLowerCase()} dr-last-decree-indicator--${side}`}
      role="status" aria-label={`Último decreto ${side === 'player' ? 'del jugador' : 'del rival'}: ${decree.name}${comboLevel > 1 ? ` ×${comboLevel}` : ''}`}>
      <span className="dr-last-decree-icon" aria-hidden="true">
        <img className="dr-g3-decree-visual"
          src={`${import.meta.env.BASE_URL}interfaz/hud-g3/${decree.art}`}
          alt="" width={20} height={20} draggable={false}/>
      </span>
      <span className="dr-last-decree-name">{decree.name}</span>
      {comboLevel > 1 && <strong className="dr-last-decree-combo" aria-hidden="true">×{comboLevel}</strong>}
    </div>
  );
}
