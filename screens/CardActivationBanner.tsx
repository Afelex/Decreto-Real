import React, { useEffect, useRef, useState } from 'react';
import type { CardData } from '../types';
import { cardActivationCopy } from '../game/cardActivationText';
import { bannerCueFile, cardEffectCue, DECREE_BANNER_DURATION_MS, DECREE_EFFECT_DURATION_MS, isInterruptedMediaPlay, syncCueVideoRate } from '../game/effectCues';
import { DecretoFXOverlay } from './DecretoFXOverlay';
import { resolveDecreeFX } from '../game/decreeFxMapping';
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
 * The decree ribbon and its lettering share one centered media stage.
 * The approved WebM stays mounted during brief mobile buffering. A waiting
 * event must NEVER hide the entire ribbon and caption after their first frame.
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
  const useG3 = stage === 'effect' && resolveDecreeFX(card, isPlayer) !== null;
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
    <div className={`dr-cinematic-overlay ${isPlayer ? 'player' : 'rival'}${showEnergy || useG3 ? ' dr-cinematic-overlay--effect-only' : ''}${paused ? ' paused' : ''}`}
      data-decree-stage={stage}
      role="status" aria-live="polite" aria-atomic="true"
      style={{ '--dr-cue-duration': `${showBanner ? DECREE_BANNER_DURATION_MS : DECREE_EFFECT_DURATION_MS}ms` } as React.CSSProperties}
      aria-label={showBanner ? `${copy.kicker}: ${card.name}. ${copy.effect}` : `Animación de ${card.name}`}>
      {showEnergy && energySrc && !useG3 && (
        <div className="dr-cinematic-effect-media" aria-hidden="true">
          {!energyPlaying && <div className="dr-cinematic-effect-fallback" />}
          {!failedEnergy && <video ref={energyRef}
            className={`dr-cue-video${energyPlaying ? ' is-playing' : ''}`}
            autoPlay={!paused} muted playsInline preload="auto"
            onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, DECREE_EFFECT_DURATION_MS)}
            onPlaying={() => setEnergyPlaying(true)}
            // Avoid flashing the energy fallback on transient buffer stalls.
            onError={() => { setFailedEnergy(true); setEnergyPlaying(false); }}>
            <source src={energySrc} type="video/webm" />
          </video>}
        </div>
      )}
      {useG3 && <DecretoFXOverlay card={card} isPlayer={isPlayer} paused={paused} fallbackSrc={energySrc} />}
      {showBanner && (
        <div className={`dr-decree-banner${bannerPlaying && !failedBanner ? ' is-playing' : ''}`}
          data-decree-video={failedBanner ? 'failed' : bannerPlaying ? 'playing' : 'loading'}
          aria-hidden="true">
          {!failedBanner && <video ref={bannerRef}
            className="dr-decree-banner__video"
            autoPlay={!paused} muted playsInline preload="auto"
            onLoadedMetadata={event => syncCueVideoRate(event.currentTarget, DECREE_BANNER_DURATION_MS)}
            onPlaying={() => setBannerPlaying(true)}
            // Chrome/Android may emit several waiting/playing events while decoding
            // transparent VP9 frames. Once visible, never blink the whole stage.
            // onError still removes failed media without a legacy colored strip.
            onError={() => { setFailedBanner(true); setBannerPlaying(false); }}>
            <source src={bannerSrc} type="video/webm" />
          </video>}
          <div className="dr-decree-banner__copy">
            <span className="dr-decree-banner__kicker">{copy.kicker}</span>
            <strong className="dr-decree-banner__title">{copy.title}</strong>
            <span className="dr-decree-banner__effect">{copy.effect}</span>
          </div>
        </div>
      )}
    </div>
  );
};
