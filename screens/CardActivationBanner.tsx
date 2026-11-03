import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { cardActivationCopy } from '../game/cardActivationText';
import './card-activation-banner.css';

type Props = { card: CardData; isPlayer: boolean; paused: boolean; sfxEnabled?: boolean };

/** Decorative media only. All game state is resolved by GameBoard after the cue. */
export const CardActivationBanner: React.FC<Props> = ({ card, isPlayer, paused, sfxEnabled = true }) => {
  const [failedVideo, setFailedVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isOrder = card.type === 'ORDER';
  const copy = cardActivationCopy(card, isPlayer);
  const src = isOrder ? '/Decreto-Real/animaciones/decreto-orden.webm'
    : `/Decreto-Real/animaciones/banner-${isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = isOrder ? 1 : 4;
    video.muted = !isOrder || !sfxEnabled;
    if (paused) video.pause();
    else {
      // jsdom and some embedded WebViews may return void instead of a Promise.
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        void playback.catch(() => {
          // If the browser blocks unmuted autoplay, keep the order animation visible.
          video.muted = true;
          const retry = video.play();
          if (retry && typeof retry.catch === 'function') void retry.catch(() => setFailedVideo(true));
        });
      }
    }
  }, [paused, src, isOrder, sfxEnabled]);

  return (
    <div className={`dr-cinematic-overlay ${isPlayer ? 'player' : 'rival'}${isOrder ? ' dr-cinematic-overlay--order' : ''}${paused ? ' paused' : ''}`}
      role="status" aria-live="polite" aria-atomic="true"
      aria-label={`${copy.kicker}: ${card.name}. ${copy.effect}`}>
      <div className="dr-cinematic-media" aria-hidden="true">
        {!failedVideo && <video ref={videoRef} autoPlay muted={!isOrder || !sfxEnabled} playsInline preload="auto"
          onLoadedMetadata={event => { event.currentTarget.playbackRate = isOrder ? 1 : 4; }}
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
