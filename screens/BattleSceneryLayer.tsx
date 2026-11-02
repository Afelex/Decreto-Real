import React from 'react';
import type { BattleScenery } from '../game/battleScenery';
import './battle-scenery.css';

/** Lightweight, non-interactive scenery. Poster stays visible until playback
 * starts, and on unsupported/blocked media or when reduced motion is preferred. */
export const BattleSceneryLayer: React.FC<BattleScenery> = ({ poster, video }) => {
  const [playing, setPlaying] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );

  React.useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!preference) return;
    const onChange = () => setReducedMotion(preference.matches);
    onChange();
    preference.addEventListener('change', onChange);
    return () => preference.removeEventListener('change', onChange);
  }, []);

  React.useEffect(() => { setPlaying(false); setFailed(false); }, [video]);

  return (
    <div className="absolute inset-0 z-0 dr-battle-scenery" aria-hidden="true">
      <img src={poster} alt="" className="dr-royal-background w-full h-full object-cover opacity-100" />
      {video && !reducedMotion && !failed && (
        <video
          key={video}
          className={`dr-royal-background dr-royal-background-video${playing ? ' is-playing' : ''}`}
          autoPlay loop muted playsInline preload="metadata"
          poster={poster}
          controls={false}
          disablePictureInPicture
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 dr-royal-vignette" />
    </div>
  );
};
