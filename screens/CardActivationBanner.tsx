import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { cardActivationCopy } from '../game/cardActivationText';
import { cardEffectCue } from '../game/effectCues';
import './card-activation-banner.css';

type Props = {
  card: CardData;
  isPlayer: boolean;
  paused: boolean;
  sfxEnabled?: boolean;
  onEnded?: () => void;
};

/** The card effect is shown before applying game effects or opening the combo panel.
 * The fallback ribbon remains available if a device cannot decode the uploaded WebM. */
export const CardActivationBanner: React.FC<Props> = ({ card, isPlayer, paused, onEnded }) => {
  const [failedVideo, setFailedVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copy = cardActivationCopy(card, isPlayer);
  const cue = cardEffectCue(card.type);
  const isEnergy = Boolean(cue.file);
  const src = isEnergy
    ? `${import.meta.env.BASE_URL}${cue.file}`
    : `${import.meta.env.BASE_URL}animaciones/banner-${isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = isEnergy ? 1 : 4;
    video.muted = true; // Supplied energy clips have no soundtrack; SFX is played by GameBoard.
    if (paused) video.pause();
    else {
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        void playback.catch(() => setFailedVideo(true));
      }
    }
  }, [paused, src, isEnergy]);

  return (
    <div className={`dr-cinematic-overlay ${isPlayer ? 'player' : 'rival'}${isEnergy ? ' dr-cinematic-overlay--energy' : ''}${paused ? ' paused' : ''}`}
      role="status" aria-live="polite" aria-atomic="true"
      aria-label={`${copy.kicker}: ${card.name}. ${copy.effect}`}>
      <div className="dr-cinematic-media" aria-hidden="true">
        {!failedVideo && <video ref={videoRef} autoPlay muted playsInline preload="auto"
          onLoadedMetadata={event => { event.currentTarget.playbackRate = isEnergy ? 1 : 4; }}
          onEnded={onEnded} onError={() => setFailedVideo(true)}>
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
