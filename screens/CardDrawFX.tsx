import React, { useEffect, useRef, useState } from 'react';
import { preloadDecretoFX } from './DecretoFXOverlay';
import './fx-g3-polish.css';

type Side = 'PLAYER' | 'OPPONENT';
type Props = {
  side: Side;
  count: number;
  cueId: number;
  paused: boolean;
  onFinish: (id: number) => void;
};

/** A10 follows the ACTUAL mazo and hand DOM nodes; never moves a real card or changes rules. */
export function CardDrawFX({ side, count, cueId, paused, onFinish }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const [playing, setPlaying] = useState(false);
  const [path, setPath] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const screen = host.closest('.dr-royal-screen');
    const player = side === 'PLAYER';
    const deck = screen?.querySelector<HTMLElement>(player
      ? '.dr-royal-player-deck .dr-royal-deck-back'
      : '.dr-royal-rival-deck .dr-royal-deck-back');
    const hand = screen?.querySelector<HTMLElement>(player
      ? '.dr-royal-player-fan'
      : '.dr-royal-rival-fan');
    const box = host.getBoundingClientRect();
    const a = deck?.getBoundingClientRect(), b = hand?.getBoundingClientRect();
    if (a && b) {
      const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
      const bx = b.left + b.width / 2, by = b.top + b.height / 2;
      setPath({ x: ax - box.left, y: ay - box.top, dx: bx - ax, dy: by - ay });
    }

    let active = true;
    let handle: { stop: () => void } | undefined;
    let clear: (() => void) | undefined;
    // Drawing is decorative: the underlying drawCards() already committed the
    // hand and deck atomically, even on slow phones or blocked Canvas APIs.
    const timeout = window.setTimeout(() => onFinishRef.current(cueId), 950);
    if (paused || !deck || !hand) return () => window.clearTimeout(timeout);
    void preloadDecretoFX().then(fx => {
      if (!active || !host.isConnected) return;
      clear = () => fx.clear(host);
      handle = fx.playFX('A10', {
        container: host,
        side: player ? 'player' : 'rival',
        faction: player ? 'carmesi' : 'azul',
        from: deck,
        to: hand,
        params: { count: Math.min(5, Math.max(1, count)) },
        duration: 820,
        intensity: 1.05,
        layer: 'draw-' + cueId,
        silent: true,
        shake: false,
      });
      setPlaying(true);
    }).catch(() => { /* La carta CSS sigue visible si no carga Canvas. */ });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      handle?.stop();
      clear?.();
    };
  }, [side, count, cueId, paused]);

  return <div ref={hostRef} className="dr-g3-draw-host" data-fx-id="A10" data-side={side}
    aria-hidden="true">
    {!playing && path && Array.from({ length: Math.min(count, 3) }, (_, i) =>
      <div key={i} className="dr-g3-draw-card" style={{
        left: path.x + i * 5,
        top: path.y - i * 5,
        '--draw-dx': path.dx + 'px',
        '--draw-dy': path.dy + 'px',
        animationDelay: i * 55 + 'ms',
        animationPlayState: paused ? 'paused' : 'running',
      } as React.CSSProperties}/>)}
  </div>;
}
