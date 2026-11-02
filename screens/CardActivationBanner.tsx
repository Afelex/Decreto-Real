import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { cardActivationCopy } from '../game/cardActivationText';
import './card-activation-banner.css';

type Props = { card: CardData; isPlayer: boolean; paused: boolean };

/** Decorative media only. All game state is resolved by GameBoard after the cue. */
export const CardActivationBanner: React.FC<Props> = ({ card, isPlayer, paused }) => {
  const [failedVideo, setFailedVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copy = cardActivationCopy(card, isPlayer);
  const src = `/Decreto-Real/animaciones/banner-${isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 4;
    if (paused) video.pause();
    else {
      // jsdom and some embedded WebViews may return void instead of a Promise.
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        void playback.catch(() => setFailedVideo(true));
      }
    }
  }, [paused, src]);

  return (
    <div className={`dr-cinematic-overlay ${isPlayer ? 'player' : 'rival'}${paused ? ' paused' : ''}`}
      role="status" aria-live="polite" aria-atomic="true"
      aria-label={`${copy.kicker}: ${card.name}. ${copy.effect}`}>
      <div className="dr-cinematic-media" aria-hidden="true">
        {!failedVideo && <video ref={videoRef} autoPlay muted playsInline preload="auto"
          onLoadedMetadata={event => { event.currentTarget.playbackRate = 4; }}
          onError={() => setFailedVideo(true)}>
          <source src={src} type="video/webm" />
        </video>}
        {failedVideo && <div className="dr-cinematic-fallback" />}
      </div>
      <div className="dr-cinematic-copy" aria-hidden="true">
        <span className="dr-cinematic-kicker">{copy.kicker}</span>
        <strong className="dr-cinematic-title">{copy.title}</strong>
        <span className="dr-cinematic-effect">{copy.effect}</span>
      </div>
    </div>
  );
};
