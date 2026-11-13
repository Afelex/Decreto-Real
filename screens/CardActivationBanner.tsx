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

/** Every accepted decree displays the original transparent red/blue video.
 * Attack, Defense and Order can additionally layer their approved energy clip.
 * Visual overlays never alter the game engine; the parent pausable cue clock
 * guarantees enough time to see the banner before applying a card's effects. */
export const CardActivationBanner: React.FC<Props> = ({ card, isPlayer, paused }) => {
  const [failedBanner, setFailedBanner] = useState(false);
  const [failedEnergy, setFailedEnergy] = useState(false);
  const bannerRef = useRef<HTMLVideoElement>(null);
  const energyRef = useRef<HTMLVideoElement>(null);
  const copy = cardActivationCopy(card, isPlayer);
  const cue = cardEffectCue(card.type);
  const isEnergy = Boolean(cue.file);
  const bannerSrc = `${import.meta.env.BASE_URL}animaciones/banner-${isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`;
  const energySrc = cue.file ? `${import.meta.env.BASE_URL}${cue.file}` : null;

  useEffect(() => {
    for (const [video, rate, onFailure] of [
      [bannerRef.current, 4, setFailedBanner],
      [energyRef.current, 1, setFailedEnergy],
    ] as const) {
      if (!video) continue;
      video.playbackRate = rate;
      video.muted = true;
      if (paused) video.pause();
      else {
        const playback = video.play();
        if (playback && typeof playback.catch === 'function') {
          void playback.catch(() => onFailure(true));
        }
      }
    }
  }, [paused, bannerSrc, energySrc]);

  return (
    <div className={`dr-cinematic-overlay ${isPlayer ? 'player' : 'rival'}${isEnergy ? ' dr-cinematic-overlay--energy' : ''}${paused ? ' paused' : ''}`}
      role="status" aria-live="polite" aria-atomic="true"
      aria-label={`${copy.kicker}: ${card.name}. ${copy.effect}`}>
      {isEnergy && energySrc && !failedEnergy && (
        <div className="dr-cinematic-effect-media" aria-hidden="true">
          <video ref={energyRef} autoPlay muted playsInline preload="auto"
            onError={() => setFailedEnergy(true)}>
            <source src={energySrc} type="video/webm" />
          </video>
        </div>
      )}
      <div className="dr-cinematic-media" aria-hidden="true">
        {!failedBanner ? <video ref={bannerRef} autoPlay muted loop playsInline preload="auto"
          onLoadedMetadata={event => { event.currentTarget.playbackRate = 4; }}
          onError={() => setFailedBanner(true)}>
          <source src={bannerSrc} type="video/webm" />
        </video> : <div className="dr-cinematic-fallback" />}
      </div>
      <div className="dr-cinematic-copy" aria-hidden="true">
        <span className="dr-cinematic-kicker">{copy.kicker}</span>
        <strong className="dr-cinematic-title">{copy.title}</strong>
        <span className="dr-cinematic-effect">{copy.effect}</span>
      </div>
    </div>
  );
};
