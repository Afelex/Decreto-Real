import React from 'react';

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
      <span className="dr-royal-hp__fill" style={{ width: `${percent}%` }} aria-hidden="true"/>
      <span className="dr-royal-hp__label" aria-hidden="true">HP: {current}/{maxHp}</span>
    </div>
  );
}
