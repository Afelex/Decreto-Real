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
      // El escenario del Canvas cubre todo el tablero. Los objetivos se
      // obtienen del retablo REAL, no de porcentajes en una ventana central.
      const screen = host.closest('.dr-royal-screen');
      const selfFrame = screen?.querySelector<HTMLElement>(isPlayer
        ? '.dr-royal-player-area .dr-royal-character-frame'
        : '.dr-royal-rival-area .dr-royal-character-frame');
      const injuredFrame = screen?.querySelector<HTMLElement>(isPlayer
        ? '.dr-royal-rival-area .dr-royal-character-frame'
        : '.dr-royal-player-area .dr-royal-character-frame');
      actionTimer = window.setTimeout(() => {
        if (!active || !host.isConnected) return;
        // A04: cura el retrato de quien eligió Gracia Divina.
        // B01/B02: ruptura de Claude SOBRE el retablo que recibe el golpe.
        const action = healing ? 'A04' : isPlayer ? 'B02' : 'B01';
        const recipientIsPlayer = healing ? isPlayer : !isPlayer;
        const portrait = healing ? selfFrame : injuredFrame;
        const fallback = { x: 0.5, y: recipientIsPlayer ? 0.84 : 0.16 };
        const amount = level === 2 ? 1 : 3;
        handles.push(engine.playFX(action, {
          container: host,
          side: recipientIsPlayer ? 'player' : 'rival',
          faction: recipientIsPlayer ? 'carmesi' : 'azul',
          palette: healing ? 'vida' : 'sangre',
          at: portrait || fallback,
          ...(healing ? {} : { target: portrait || undefined }),
          params: { amount },
          duration: 900,
          intensity: level === 3 ? 1.22 : 1.05,
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
      <div ref={canvasHost} className="dr-g3-combo-stage" aria-hidden="true" />
      {showFallback && <div className="dr-energy-overlay__media" aria-hidden="true">
        <div className="dr-energy-overlay__fallback" />
      </div>}
      {showFallback && (
        <strong className="dr-energy-overlay__label">
          COMBO ×{level} · {healing ? 'CURACIÓN' : 'ATAQUE'}
        </strong>
      )}
    </div>
  );
};
