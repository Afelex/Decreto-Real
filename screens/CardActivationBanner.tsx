import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { cardActivationCopy } from '../game/cardActivationText';
import { cardEffectCue, DECREE_BANNER_DURATION_MS, DECREE_EFFECT_DURATION_MS, syncCueVideoRate } from '../game/effectCues';
import './card-activation-banner.css';

type Props = {
  card: CardData;
  isPlayer: boolean;
  paused: boolean;
  stage?: 'banner' | 'effect';
  sfxEnabled?: boolean;
  onEnded?: () => void;
};

/** The decree ribbon and its energy effect are strictly SEQUENTIAL.
 * Stage "banner": a red/blue transparent WebM + live decree caption.
 * Stage "effect": only the associated Attack/Defense/Order energy WebM.
 * GameBoard owns the two pausable clocks and applies the card once after both.
 */
export const CardActivationBanner: React.FC<Props> = ({
  card, isPlayer, paused, stage = 'banner', onEnded,
}) => {
  const [failedBanner, setFailedBanner] = useState(false);
  const [failedEnergy, setFailedEnergy] = useState(false);
  const bannerRef = useRef<HTMLVideoElement>(null);
  const energyRef = useRef<HTMLVideoElement>(null);
  const copy = cardActivationCopy(card, isPlayer);
  const cue = cardEffectCue(card.type);
  const showBanner = stage === 'banner';
  const showEnergy = stage === 'effect' && Boolean(cue.file);
  const bannerSrc = `${import.meta.env.BASE_URL}animaciones/banner-${isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`;
  const energySrc = cue.file ? `${import.meta.env.BASE_URL}${cue.file}` : null;

  useEffect(() => {
    const videos: Array<[HTMLVideoElement | null, number, (bad: boolean) => void]> = [
      [bannerRef.current, DECREE_BANNER_DURATION_MS, setFailedBanner],
      [energyRef.current, DECREE_EFFECT_DURATION_MS, setFailedEnergy],
    ];
    for (const [video, durationMs, onFailure] of videos) {
      if (!video) continue;
      syncCueVideoRate(video, durationMs);
      video.muted = true;
      if (paused) video.pause();
      else {
        const playback = video.play();
        if (playback && typeof playback.catch === 'function') {
          void playback.catch(() => onFailure(true));
        }
      }
    }
  }, [paused, stage, bannerSrc, energySrc]);

  return (
    <div className={`dr-cinematic-overlay ${isPlayer ? 'player' : 'rival'}${showEnergy ? ' dr-cinematic-overlay--effect-only' : ''}${paused ? ' paused' : ''}`}
      data-decree-stage={stage}
      role="status" aria-live="polite" aria-atomic="true"
      style={{ '--dr-cue-duration': `${showBanner ? DECREE_BANNER_DURATION_MS : DECREE_EFFECT_DURATION_MS}ms` } as React.CSSProperties}
      aria-label={showBanner ? `${copy.kicker}: ${card.name}. ${copy.effect}` : `Animación de ${card.name}`}>
      {showEnergy && energySrc && (
        <div className="dr-cinematic-effect-media" aria-hidden="true">
          {!failedEnergy ? <video ref={energyRef} autoPlay muted loop playsInline preload="auto"
            onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, DECREE_EFFECT_DURATION_MS)}
            onEnded={onEnded} onError={() => setFailedEnergy(true)}>
            <source src={energySrc} type="video/webm" />
          </video> : <div className="dr-cinematic-effect-fallback" />}
        </div>
      )}
      {showBanner && <>
        <div className="dr-cinematic-media" aria-hidden="true">
          {!failedBanner ? <video ref={bannerRef} autoPlay muted loop playsInline preload="auto"
            onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, DECREE_BANNER_DURATION_MS)}
            onError={() => setFailedBanner(true)}>
            <source src={bannerSrc} type="video/webm" />
          </video> : <div className="dr-cinematic-fallback" />}
        </div>
        <div className="dr-cinematic-copy" aria-hidden="true">
          <span className="dr-cinematic-kicker">{copy.kicker}</span>
          <strong className="dr-cinematic-title">{copy.title}</strong>
          <span className="dr-cinematic-effect">{copy.effect}</span>
        </div>
      </>}
    </div>
  );
};
