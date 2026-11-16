import React, { useEffect, useRef } from 'react';
import { preloadDecretoFX } from './DecretoFXOverlay';
import './fx-g3-polish.css';

type Props = { won: boolean };

/** C06/C07 cinematic over the finished duel; buttons and statistics remain functional. */
export function ResultCinematicFX({ won }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let active = true;
    let handle: { stop: () => void } | undefined;
    let clear: (() => void) | undefined;
    void preloadDecretoFX().then(fx => {
      if (!active || !host.isConnected) return;
      clear = () => fx.clear(host);
      handle = fx.playFX(won ? 'C06' : 'C07', {
        container: host,
        at: { x: 0.5, y: 0.40 },
        side: won ? 'player' : 'rival',
        params: { title: won ? 'VICTORIA' : 'DERROTA', subtitle: '' },
        duration: 3100,
        intensity: 1.05,
        silent: true, // La música oficial no debe dispararse dos veces.
        shake: false,
        layer: 'combat-result',
      });
    }).catch(() => { /* El resultado textual original siempre queda accesible. */ });
    return () => {
      active = false;
      handle?.stop();
      clear?.();
    };
  }, [won]);

  return <div ref={hostRef} data-fx-id={won ? 'C06' : 'C07'}
    className="dr-g3-result-fx" aria-hidden="true"/>;
}
