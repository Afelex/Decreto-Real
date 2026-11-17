import React, { useEffect, useRef, useState } from 'react';

type HpSide = 'player' | 'opponent';
export type HpMeterState = 'healthy' | 'warning' | 'critical';

/** Un único cálculo para el HUD de ambos combatientes, sin alterar sus HP reales. */
export function getHpMeterState(hp: number, maxHp: number): {
  current: number; percent: number; tone: HpMeterState;
} {
  const maximum = Number.isFinite(maxHp) && maxHp > 0 ? maxHp : 1;
  const current = Number.isFinite(hp) ? Math.min(maximum, Math.max(0, hp)) : 0;
  const percent = Math.round((current / maximum) * 10000) / 100;
  const tone: HpMeterState = percent <= 20 ? 'critical' : percent <= 50 ? 'warning' : 'healthy';
  return { current, percent, tone };
}

/** Barra estilo Pokémon: relleno animado, verde→ámbar→rojo y destello blanco crítico. */
export function RoyalHpMeter({ hp, maxHp, side }: {
  hp: number; maxHp: number; side: HpSide;
}) {
  const { current, percent, tone } = getHpMeterState(hp, maxHp);
  const label = side === 'player'
    ? `Tu vida: ${current} de ${maxHp}`
    : `Vida del rival: ${current} de ${maxHp}`;
  return (
    <div
      className={`dr-royal-hp ${side === 'player' ? 'red' : 'blue'} dr-royal-hp--${tone}${current === 0 ? ' dr-royal-hp--empty' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={maxHp}
      aria-valuenow={current}
      data-hp-state={tone}
      data-hp-percent={percent}
    >
      {/* Rastro del daño: se vacía con retardo detrás del relleno real. */}
      <span className="dr-royal-hp__ghost" style={{ width: `${percent}%` }} aria-hidden="true"/>
      <span className="dr-royal-hp__fill" style={{ width: `${percent}%` }} aria-hidden="true"/>
      <span className="dr-royal-hp__label" aria-hidden="true"><small>HP: </small><b>{current}</b><small>/{maxHp}</small></span>
    </div>
  );
}

/** Cuánto dura visible la cifra flotante de daño o curación. */
export const HP_DELTA_CUE_MS = 1300;

/** Cifra «+N / −N» junto al retrato. Se deriva SOLO del cambio real de vida:
 * aparece una vez por cada cambio y nunca modifica HP, turnos ni reglas. */
export function HpDeltaCue({ hp, side }: { hp: number; side: HpSide }) {
  const previous = useRef(hp);
  const serial = useRef(0);
  const [cue, setCue] = useState<{ id: number; delta: number } | null>(null);
  useEffect(() => {
    const delta = hp - previous.current;
    previous.current = hp;
    if (!delta) return;
    const id = ++serial.current;
    setCue({ id, delta });
    const timer = window.setTimeout(() => setCue(current => current?.id === id ? null : current), HP_DELTA_CUE_MS);
    return () => window.clearTimeout(timer);
  }, [hp]);
  if (!cue) return null;
  const healing = cue.delta > 0;
  return (
    <span key={cue.id} aria-hidden="true" data-hp-delta={cue.delta}
      className={`dr-royal-hp-delta dr-royal-hp-delta--${healing ? 'heal' : 'damage'} dr-royal-hp-delta--${side}`}>
      {healing ? `+${cue.delta}` : `−${-cue.delta}`}
    </span>
  );
}
