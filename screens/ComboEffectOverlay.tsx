import React, { useEffect, useRef, useState } from 'react';
import { comboEffectCue } from '../game/effectCues';
import './card-activation-banner.css';

export function ComboEffectOverlay({ level, ability, paused, onEnded }: {
  level: 2 | 3;
  ability: 'DAMAGE' | 'HEAL';
  paused: boolean;
  onEnded: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { file } = comboEffectCue(ability, level);
  const src = `${import.meta.env.BASE_URL}${file}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) video.pause();
    else {
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        void playback.catch(() => setFailed(true));
      }
    }
  }, [paused, src]);

  return (
    <div className={`dr-energy-overlay dr-energy-overlay--combo ${ability === 'HEAL' ? 'is-heal' : 'is-damage'}`}
      role="status" aria-label={`Combo ×${level}: ${ability === 'DAMAGE' ? 'Ataque' : 'Curación'}`}>
      <div className="dr-energy-overlay__media" aria-hidden="true">
        {!failed && <video ref={videoRef} autoPlay muted playsInline preload="auto"
          onEnded={onEnded} onError={() => setFailed(true)}>
          <source src={src} type="video/webm" />
        </video>}
        {failed && <div className="dr-energy-overlay__fallback" />}
      </div>
      <strong className="dr-energy-overlay__label">COMBO ×{level} · {ability === 'DAMAGE' ? 'ATAQUE' : 'CURACIÓN'}</strong>
    </div>
  );
}
