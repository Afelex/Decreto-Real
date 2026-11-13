import React from 'react';
import type { BattleScenery } from '../game/battleScenery';
import './battle-scenery.css';

/** A duel with backgroundVideo displays ONLY that video.
 * Do not mount a clay poster (not even as <video poster>), vignette or crossfade
 * behind it: they were visibly flashing before the film loaded on mobile. */
export const BattleSceneryLayer: React.FC<BattleScenery> = ({ poster, video }) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [video]);

  return (
    <div className="absolute inset-0 z-0 dr-battle-scenery"
      data-scenery-mode={video ? 'video-only' : 'still'}
      aria-hidden="true">
      {video ? (
        !failed && <video key={video}
          className="dr-royal-background dr-royal-background-video"
          autoPlay loop muted playsInline preload="auto"
          controls={false} disablePictureInPicture
          onError={() => setFailed(true)}
        ><source src={video} type="video/mp4" /></video>
      ) : (
        <>
          <img src={poster} alt="" className="dr-royal-background w-full h-full object-cover opacity-100" />
          <div className="absolute inset-0 dr-royal-vignette" />
        </>
      )}
    </div>
  );
};
