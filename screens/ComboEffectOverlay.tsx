import React, { useEffect, useRef, useState } from 'react';
import { comboEffectCue, DECREE_EFFECT_DURATION_MS, syncCueVideoRate } from '../game/effectCues';
import './card-activation-banner.css';

type Props = {
  level: 2 | 3;
  ability: 'DAMAGE' | 'HEAL';
  paused: boolean;
};

export const ComboEffectOverlay: React.FC<Props> = ({ level, ability, paused }) => {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { file } = comboEffectCue(ability, level);
  const src = `${import.meta.env.BASE_URL}${file}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    syncCueVideoRate(video, DECREE_EFFECT_DURATION_MS);
    if (paused) video.pause();
    else {
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        void playback.catch(() => { if (!disposed) { setFailed(true); setPlaying(false); } });
      }
    }
    return () => { disposed = true; };
  }, [paused, src]);

  return (
    <div className={`dr-energy-overlay dr-energy-overlay--combo ${ability === 'HEAL' ? 'is-heal' : 'is-damage'} ${paused ? 'paused' : ''}`}
      role="status" aria-label={`Combo ×${level}: ${ability === 'DAMAGE' ? 'Ataque' : 'Curación'}`}>
      <div className="dr-energy-overlay__media" aria-hidden="true">
        {!playing && <div className="dr-energy-overlay__fallback" />}
        {!failed && <video ref={videoRef}
          className={`dr-cue-video${playing ? ' is-playing' : ''}`}
          autoPlay={!paused} muted playsInline preload="auto"
          onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, DECREE_EFFECT_DURATION_MS)}
          onPlaying={() => setPlaying(true)}
          onWaiting={() => setPlaying(false)}
          onError={() => { setFailed(true); setPlaying(false); }}>
          <source src={src} type="video/webm" />
        </video>}
      </div>
      <strong className="dr-energy-overlay__label">COMBO ×{level} · {ability === 'DAMAGE' ? 'ATAQUE' : 'CURACIÓN'}</strong>
    </div>
  );
};
