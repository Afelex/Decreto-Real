/**
 * Adaptador de los 34 efectos originales de Claude FX Studio G3.
 * Solo renderiza: el daño, las curaciones y los tiempos los controla GameBoard.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { DECREE_EFFECT_DURATION_MS } from '../game/effectCues';
import { resolveDecreeFX } from '../game/decreeFxMapping';

type FXHandle = { stop: () => void };
type FXEngine = {
  playFX: (id: string, options: Record<string, unknown>) => FXHandle;
  clear: (container?: HTMLElement) => void;
  setQuality: (quality: 'auto' | 'medium' | 'low') => void;
  defs: Map<string, unknown>;
  audio?: { synth: boolean };
};

let pending: Promise<FXEngine> | null = null;
function getEngine(): FXEngine | undefined {
  return (window as typeof window & { DecretoFX?: FXEngine }).DecretoFX;
}

/** Carga el único bundle local, una vez y con reintento después de errores de red. */
export function preloadDecretoFX(): Promise<FXEngine> {
  const existing = getEngine();
  if (existing && existing.defs?.size >= 34) return Promise.resolve(existing);
  if (!pending) {
    pending = new Promise<FXEngine>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = import.meta.env.BASE_URL + 'fx-g3/decreto-real-fx-g3.bundle.js';
      script.async = true;
      script.dataset.drfxG3 = 'true';
      script.onload = () => {
        const fx = getEngine();
        if (!fx || fx.defs?.size < 34) {
          script.remove();
          reject(new Error('FX G3 incompleto: faltan definiciones'));
          return;
        }
        if (fx.audio) fx.audio.synth = false; // Se usan los sonidos oficiales del juego.
        if (window.matchMedia?.('(pointer: coarse)').matches) fx.setQuality('medium');
        resolve(fx);
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('No se pudo cargar el motor FX G3'));
      };
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

type Props = {
  card: CardData;
  isPlayer: boolean;
  paused: boolean;
  fallbackSrc: string | null;
};

/** La capa se desmonta al terminar los 1.500 ms; pausa y limpieza no bloquean la partida. */
export const DecretoFXOverlay: React.FC<Props> = ({ card, isPlayer, paused, fallbackSrc }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'failed'>('loading');
  const id = resolveDecreeFX(card, isPlayer);

  useEffect(() => {
    const container = containerRef.current;
    if (!id || !container || paused) return;
    let active = true;
    let handle: FXHandle | null = null;
    let engine: FXEngine | null = null;
    setStatus('loading');
    void preloadDecretoFX().then(fx => {
      if (!active || !container.isConnected) return;
      engine = fx;
      const own = { x: 0.5, y: isPlayer ? 0.78 : 0.22 };
      const rival = { x: 0.5, y: isPlayer ? 0.22 : 0.78 };
      handle = fx.playFX(id, {
        container,
        side: isPlayer ? 'player' : 'rival',
        faction: isPlayer ? 'carmesi' : 'azul',
        from: own,
        to: rival,
        at: card.type === 'DEFENSE' || card.type === 'ORDER' ? own : { x: 0.5, y: 0.5 },
        duration: DECREE_EFFECT_DURATION_MS,
        silent: true,
        shake: false,
        intensity: 0.78,
        layer: 'decree-energy',
      });
      setStatus('playing');
    }).catch(() => { if (active) setStatus('failed'); });
    return () => {
      active = false;
      handle?.stop();
      engine?.clear(container);
    };
  }, [id, isPlayer, paused, card.type]);

  return (
    <div className="dr-fx-g3-host" aria-hidden="true" data-fx-id={id ?? undefined}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      {status !== 'playing' && fallbackSrc && (
        <video src={fallbackSrc} muted autoPlay={!paused} playsInline preload="auto"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
      )}
      {status !== 'playing' && !fallbackSrc && (
        <div className="dr-cinematic-effect-fallback" style={{
          position: 'absolute', inset: '20%',
          borderRadius: '50%',
          background: card.type === 'IMPACT'
            ? 'radial-gradient(circle, rgba(255,255,255,.75), rgba(142,73,222,.35) 38%, transparent 72%)'
            : 'radial-gradient(circle, rgba(255,225,146,.65), rgba(98,53,172,.28) 38%, transparent 72%)',
        }} />
      )}
    </div>
  );
};
