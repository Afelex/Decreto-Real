import React, { useEffect, useRef, useState } from 'react';
import { DECREE_EFFECT_DURATION_MS } from '../game/effectCues';
import { preloadDecretoFX } from './DecretoFXOverlay';
import './card-activation-banner.css';

type Props = {
  level: 2 | 3;
  ability: 'DAMAGE' | 'HEAL';
  isPlayer?: boolean;
  paused: boolean;
};

/**
 * G3 combos use Claude's native Canvas FX (B05/B06), not the old WebM clips.
 * The board's pausable 1.5s clock remains the only source of truth for gameplay.
 * A lightweight CSS fallback is available if the FX engine cannot load.
 */
export const ComboEffectOverlay: React.FC<Props> = ({
  level, ability, isPlayer = true, paused,
}) => {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'failed'>('loading');
  const effectId = level === 2 ? 'B05' : 'B06';
  const healing = ability === 'HEAL';
  const detail = healing ? 'GRACIA DIVINA' : 'FURIA REAL';

  useEffect(() => {
    const host = canvasHost.current;
    setStatus('loading');
    if (!host || paused) return;
    let active = true;
    const handles: Array<{ stop: () => void }> = [];
    let actionTimer: number | undefined;
    let clear: (() => void) | undefined;

    void preloadDecretoFX().then(engine => {
      if (!active || !host.isConnected) return;
      clear = () => engine.clear(host);
      handles.push(engine.playFX(effectId, {
        container: host,
        at: { x: 0.5, y: 0.5 },
        side: isPlayer ? 'player' : 'rival',
        faction: isPlayer ? 'carmesi' : 'azul',
        palette: healing ? 'vida' : isPlayer ? 'carmesi' : 'azul',
        // El motor B05/B06 fuerza el rojo con kind=damage. Para el rival
        // usamos su paleta azul sin alterar la habilidad de Ataque.
        params: { kind: healing ? 'heal' : isPlayer ? 'damage' : null, label: 'COMBO', detail },
        duration: DECREE_EFFECT_DURATION_MS,
        intensity: level === 3 ? 1.25 : 1.08,
        layer: 'combo-energy',
        silent: true, // El juego reproduce los SFX oficiales una sola vez.
        shake: false,
      }));
      // Además del anuncio ×2/×3, la acción elegida se representa en
      // el campo durante el mismo reloj de 1.5 s (no se añade otra pausa).
      const own = { x: 0.5, y: isPlayer ? 0.76 : 0.24 };
      const foe = { x: 0.5, y: isPlayer ? 0.24 : 0.76 };
      actionTimer = window.setTimeout(() => {
        if (!active || !host.isConnected) return;
        const action = healing ? 'A04' : isPlayer ? 'A01' : 'A02';
        handles.push(engine.playFX(action, {
          container: host,
          side: isPlayer ? 'player' : 'rival',
          faction: isPlayer ? 'carmesi' : 'azul',
          palette: healing ? 'vida' : isPlayer ? 'carmesi' : 'azul',
          from: own,
          to: foe,
          at: healing ? own : foe,
          params: healing ? { amount: level === 2 ? 1 : 3 } : {},
          duration: 890,
          intensity: level === 3 ? 1.22 : 0.98,
          silent: true,
          shake: false,
          layer: 'combo-action',
        }));
      }, 390);
      setStatus('playing');
    }).catch(() => {
      if (active) setStatus('failed');
    });

    // Al pausar se limpia el Canvas. Al reanudar comienza otra vez el efecto
    // sin alterar los tiempos, el sonido ni el daño del motor de combate.
    return () => {
      active = false;
      if (actionTimer !== undefined) window.clearTimeout(actionTimer);
      handles.forEach(handle => handle.stop());
      clear?.();
    };
  }, [effectId, healing, detail, isPlayer, level, paused]);

  const showFallback = paused || status !== 'playing';
  return (
    <div className={`dr-energy-overlay dr-energy-overlay--combo ${healing ? 'is-heal' : 'is-damage'} ${paused ? 'paused' : ''}`}
      role="status" aria-label={`Combo ×${level}: ${healing ? 'Curación' : 'Ataque'}`}
      data-fx-id={effectId} data-fx-engine="canvas-g3">
      <div className="dr-energy-overlay__media" aria-hidden="true">
        <div ref={canvasHost} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        {showFallback && <div className="dr-energy-overlay__fallback" />}
      </div>
      {showFallback && (
        <strong className="dr-energy-overlay__label">
          COMBO ×{level} · {healing ? 'CURACIÓN' : 'ATAQUE'}
        </strong>
      )}
    </div>
  );
};
