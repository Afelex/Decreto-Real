import React from 'react';
import type { CardType } from '../types';
import './last-decree-indicator.css';

const DECREES: Record<CardType, { name: string; icon: React.ReactNode }> = {
  ATTACK: { name: 'Ataque', icon: <>
    <path d="m15 4 5-2-2 5-9 9-3-3z" /><path d="m4 14 6 6M4 20l4-4" />
  </> },
  DEFENSE: { name: 'Defensa', icon: <>
    <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </> },
  ORDER: { name: 'Orden', icon: <>
    <path d="M12 3v17M7 21h10M4 7h16M7 7l-3 6h6zM17 7l-3 6h6z" />
  </> },
  IMPACT: { name: 'Impacto', icon: <>
    <path d="m12 2 1.7 5.2L19 9l-5.3 1.8L12 16l-1.7-5.2L5 9l5.3-1.8z" />
    <path d="m5 16 .8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8zM19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
  </> },
  MYSTIC: { name: 'Místico', icon: <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2.2 2.2M17.8 17.8 20 20M20 4l-2.2 2.2M6.2 17.8 4 20" />
  </> },
};

export function LastDecreeIndicator({ type, side }: { type: CardType | null; side: 'player' | 'opponent' }) {
  if (!type) return null;
  const decree = DECREES[type];
  return (
    <div className={`dr-last-decree-indicator dr-last-decree-indicator--${type.toLowerCase()} dr-last-decree-indicator--${side}`}
      role="status" aria-label={`Último decreto ${side === 'player' ? 'del jugador' : 'del rival'}: ${decree.name}`}>
      <span className="dr-last-decree-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {decree.icon}
        </svg>
      </span>
      <span className="dr-last-decree-name">{decree.name}</span>
    </div>
  );
}
