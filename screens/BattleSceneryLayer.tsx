import React from 'react';
import type { BattleScenery } from '../game/battleScenery';
import { STANDARD_BATTLE_VIDEO, STANDARD_BATTLE_VIDEO_POSTER } from '../game/battleScenery';
import './battle-scenery.css';

/** The battle stage mounts BEFORE the coin toss. While the H264 video is
 * downloading or decoding, display a JPG EXTRACTED FROM THAT SAME VIDEO.
 * Never flash the old clay scene or a second visual background. */
export const BattleSceneryLayer: React.FC<BattleScenery> = ({ poster, video }) => {
  const [failed, setFailed] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => { setFailed(false); setPlaying(false); }, [video]);

  const firstFrame = video === STANDARD_BATTLE_VIDEO ? STANDARD_BATTLE_VIDEO_POSTER : poster;
  return (
    <div className="absolute inset-0 z-0 dr-battle-scenery"
      data-scenery-mode={video ? 'video-only' : 'still'}
      data-video-ready={video ? (playing ? 'true' : 'false') : undefined}
      aria-hidden="true">
      {video ? (
        <>
          <img src={firstFrame} alt=""
            className="dr-battle-video-poster dr-royal-background"
            fetchPriority="high" draggable={false} />
          {!failed && <video key={video}
            className={`dr-royal-background dr-royal-background-video${playing ? ' is-playing' : ''}`}
            autoPlay loop muted playsInline preload="auto" poster={firstFrame}
            controls={false} disablePictureInPicture
            onPlaying={() => setPlaying(true)}
            onError={() => { setFailed(true); setPlaying(false); }}>
            <source src={video} type="video/mp4" />
          </video>}
        </>
      ) : (
        <>
          <img src={poster} alt="" className="dr-royal-background w-full h-full object-cover opacity-100" />
          <div className="absolute inset-0 dr-royal-vignette" />
        </>
      )}
    </div>
  );
};
