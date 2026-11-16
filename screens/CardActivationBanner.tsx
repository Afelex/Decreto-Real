import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { cardActivationCopy } from '../game/cardActivationText';
import { bannerCueFile, cardEffectCue, DECREE_BANNER_DURATION_MS, DECREE_EFFECT_DURATION_MS, isInterruptedMediaPlay, syncCueVideoRate } from '../game/effectCues';
import './card-activation-banner.css';

type Props = {
  card: CardData;
  isPlayer: boolean;
  paused: boolean;
  stage?: 'banner' | 'effect';
  sfxEnabled?: boolean;
};

/**
 * Each stage gets its full approved 1.5 s from GameBoard's pausable clock.
 * Video playback is decorative and cannot shorten or stall gameplay.
 * While WebM is still decoding (or cannot play), show an inexpensive fallback.
 * Stages are mounted separately, so banner and energy cannot overlap.
 */
export const CardActivationBanner: React.FC<Props> = ({
  card, isPlayer, paused, stage = 'banner',
}) => {
  const [failedBanner, setFailedBanner] = useState(false);
  const [failedEnergy, setFailedEnergy] = useState(false);
  const [bannerPlaying, setBannerPlaying] = useState(false);
  const [energyPlaying, setEnergyPlaying] = useState(false);
  const bannerRef = useRef<HTMLVideoElement>(null);
  const energyRef = useRef<HTMLVideoElement>(null);
  const copy = cardActivationCopy(card, isPlayer);
  const cue = cardEffectCue(card.type);
  const showBanner = stage === 'banner';
  const showEnergy = stage === 'effect' && Boolean(cue.file);
  const bannerSrc = `${import.meta.env.BASE_URL}${bannerCueFile(isPlayer)}`;
  const energySrc = cue.file ? `${import.meta.env.BASE_URL}${cue.file}` : null;

  useEffect(() => {
    let disposed = false;
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
          void playback.catch(error => {
            if (!disposed && !paused && !isInterruptedMediaPlay(error)) onFailure(true);
          });
        }
      }
    }
    return () => { disposed = true; };
  }, [paused, stage, bannerSrc, energySrc]);

  return (
    <div className={`dr-cinematic-overlay ${isPlayer ? 'player' : 'rival'}${showEnergy ? ' dr-cinematic-overlay--effect-only' : ''}${paused ? ' paused' : ''}`}
      data-decree-stage={stage}
      role="status" aria-live="polite" aria-atomic="true"
      style={{ '--dr-cue-duration': `${showBanner ? DECREE_BANNER_DURATION_MS : DECREE_EFFECT_DURATION_MS}ms` } as React.CSSProperties}
      aria-label={showBanner ? `${copy.kicker}: ${card.name}. ${copy.effect}` : `Animación de ${card.name}`}>
      {showEnergy && energySrc && (
        <div className="dr-cinematic-effect-media" aria-hidden="true">
          {!energyPlaying && <div className="dr-cinematic-effect-fallback" />}
          {!failedEnergy && <video ref={energyRef}
            className={`dr-cue-video${energyPlaying ? ' is-playing' : ''}`}
            autoPlay={!paused} muted playsInline preload="auto"
            onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, DECREE_EFFECT_DURATION_MS)}
            onPlaying={() => setEnergyPlaying(true)}
            onWaiting={() => setEnergyPlaying(false)}
            onError={() => { setFailedEnergy(true); setEnergyPlaying(false); }}>
            <source src={energySrc} type="video/webm" />
          </video>}
        </div>
      )}
      {showBanner && <>
        <div className="dr-cinematic-media" aria-hidden="true">
          {!bannerPlaying && <div className="dr-cinematic-fallback" />}
          {!failedBanner && <video ref={bannerRef}
            className={`dr-cue-video${bannerPlaying ? ' is-playing' : ''}`}
            autoPlay={!paused} muted playsInline preload="auto"
            onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, DECREE_BANNER_DURATION_MS)}
            onPlaying={() => setBannerPlaying(true)}
            onWaiting={() => setBannerPlaying(false)}
            onError={() => { setFailedBanner(true); setBannerPlaying(false); }}>
            <source src={bannerSrc} type="video/webm" />
          </video>}
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
